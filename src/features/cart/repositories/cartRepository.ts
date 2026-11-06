// src/features/cart/repositories/cartRepository.ts — Acceso a /cart.
// Todas las rutas exigen sesión (Bearer, lo agrega el interceptor del cliente).
// El carrito vive en el servidor y se indexa por producto, no por variante.
// El backend pagina por cursor: { success, data, meta: { nextCursor, hasMore, total, totalPrice } }.
import type { AxiosInstance } from "axios";

import { MAX_CART_LINES } from "@/features/cart/cartSelectors";
import { ApiClient } from "@/shared/api/client";
import type { CartItem, CartPage, CartResult } from "@/features/cart/types";

/** Máximo que acepta el backend por página (1 a 50). */
export const CART_PAGE_SIZE = 50;

const status = (error: unknown) => (error as { response?: { status?: number } } | null)?.response?.status;

/** Contrato: qué operaciones existen sobre el carrito, no cómo se hacen. */
export interface CartRepository {
  /** Una página del carrito, de la línea más reciente a la más antigua. */
  getPage(cursor?: number, limit?: number): Promise<CartPage>;
  /** Sigue el cursor hasta agotar las líneas o llegar a `max`. */
  getAll(max?: number): Promise<CartResult>;
  /**
   * Agrega 1 unidad (o suma 1 si ya estaba). El backend no recibe variante ni
   * cantidad. Un 409 significa que ya hay 99: se deja pasar para explicarlo.
   */
  add(productId: number): Promise<void>;
  /** Fija la cantidad (1 a 99; 0 elimina la línea). */
  setQuantity(productId: number, cantidad: number): Promise<void>;
  /** Quita la línea. El 404 (ya no estaba) cuenta como éxito. */
  remove(productId: number): Promise<void>;
}

/** Implementación sobre la API REST. Funciones flecha: se pueden pasar sin perder `this`. */
export class HttpCartRepository implements CartRepository {
  constructor(private readonly http: AxiosInstance) {}

  getPage = (cursor?: number, limit: number = CART_PAGE_SIZE): Promise<CartPage> =>
    this.http.get("/cart", { params: { limit, cursor } }).then((r) => {
      const totalPrice = Number(r.data?.meta?.totalPrice);
      return {
        data: Array.isArray(r.data?.data) ? (r.data.data as CartItem[]) : [],
        nextCursor: r.data?.meta?.nextCursor ?? null,
        hasMore: r.data?.meta?.hasMore === true,
        total: Number(r.data?.meta?.total) || 0,
        totalPrice: Number.isFinite(totalPrice) ? totalPrice.toFixed(2) : "0.00",
      };
    });

  getAll = async (max: number = MAX_CART_LINES): Promise<CartResult> => {
    const items: CartItem[] = [];
    let cursor: number | undefined;
    let total = 0;
    let totalPrice = "0.00";
    let hasMore = true;

    while (hasMore && items.length < max) {
      const page = await this.getPage(cursor, Math.min(CART_PAGE_SIZE, max - items.length));
      items.push(...page.data);
      total = page.total;
      totalPrice = page.totalPrice;
      cursor = page.nextCursor ?? undefined;
      // Sin cursor o sin datos no hay forma de avanzar: se corta en vez de repetir.
      hasMore = page.hasMore && page.nextCursor !== null && page.data.length > 0;
    }

    const seen = new Set<number>();
    const unique = items.filter((i) => {
      const id = i.productos.id_producto;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return { items: unique, total, totalPrice, truncated: hasMore };
  };

  add = (productId: number): Promise<void> =>
    this.http.post(`/cart/items/${productId}`).then(() => undefined);

  setQuantity = (productId: number, cantidad: number): Promise<void> =>
    this.http.patch(`/cart/items/${productId}`, { cantidad }).then(() => undefined);

  remove = (productId: number): Promise<void> =>
    this.http.delete(`/cart/items/${productId}`).then(
      () => undefined,
      (error) => {
        if (status(error) === 404) return undefined;
        throw error;
      },
    );
}

export const cartRepository: CartRepository = new HttpCartRepository(ApiClient.getInstance().http);
