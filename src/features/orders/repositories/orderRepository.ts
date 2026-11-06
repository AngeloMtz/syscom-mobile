// src/features/orders/repositories/orderRepository.ts — Acceso a /orders.
// Exige sesión y rol usuario (Bearer, lo agrega el interceptor). El backend
// filtra por id_pedido Y id_usuario: un pedido ajeno responde 404.
// Forma tomada del código del backend; sin verificar con una respuesta viva.
import type { AxiosInstance } from "axios";

import { ApiClient } from "@/shared/api/client";
import type { OrderDetail, OrderSummary, OrdersPage } from "@/features/orders/types";

/** Pedidos por página (el backend acepta de 1 a 50; por defecto 10). */
export const ORDERS_PAGE_SIZE = 10;

const status = (error: unknown) => (error as { response?: { status?: number } } | null)?.response?.status;

/** Contrato: qué operaciones existen sobre los pedidos, no cómo se hacen. */
export interface OrderRepository {
  /**
   * Una página del historial, del pedido más reciente al más antiguo. El backend
   * pagina por número de página: { data, meta: { total, page, limit, totalPages } }.
   */
  getPage(page?: number, limit?: number): Promise<OrdersPage>;
  /** Detalle de un pedido del usuario, o null si no existe o no es suyo (404). */
  getById(id: number): Promise<OrderDetail | null>;
}

/** Implementación sobre la API REST. Funciones flecha: se pueden pasar sin perder `this`. */
export class HttpOrderRepository implements OrderRepository {
  constructor(private readonly http: AxiosInstance) {}

  getPage = (page = 1, limit: number = ORDERS_PAGE_SIZE): Promise<OrdersPage> =>
    this.http.get("/orders", { params: { page, limit } }).then((r) => {
      const meta = r.data?.meta;
      const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
      return {
        data: Array.isArray(r.data?.data)
          ? (r.data.data as OrderSummary[]).filter((o) => typeof o?.id_pedido === "number")
          : [],
        total: num(meta?.total, 0),
        page: num(meta?.page, page),
        limit: num(meta?.limit, limit),
        totalPages: num(meta?.totalPages, 0),
      };
    });

  getById = (id: number): Promise<OrderDetail | null> =>
    this.http.get(`/orders/${id}`).then(
      (r) => {
        const d = r.data?.data;
        if (typeof d?.id_pedido !== "number") throw new Error("La respuesta no incluye el pedido");
        return {
          id_pedido: d.id_pedido,
          id_usuario: typeof d.id_usuario === "number" ? d.id_usuario : 0,
          estado: String(d.estado ?? ""),
          total: d.total ?? "0",
          fecha_pedido: typeof d.fecha_pedido === "string" ? d.fecha_pedido : null,
          direccion: d.direccion ?? null,
          items: Array.isArray(d.items) ? d.items : [],
          pago: d.pago ?? null,
        } as OrderDetail;
      },
      (error) => {
        if (status(error) === 404) return null;
        throw error;
      },
    );
}

export const orderRepository: OrderRepository = new HttpOrderRepository(ApiClient.getInstance().http);
