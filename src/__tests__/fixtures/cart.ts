import type { CartItem, CartPage, CartProduct, CartResult } from "@/features/cart/types";

// Forma tomada del código del backend (cart.service.ts); sin contrastar todavía
// con una respuesta real de GET /cart. `precio_unitario` es un Prisma Decimal y
// puede llegar como texto.

export function makeCartProduct(over: Partial<CartProduct> = {}): CartProduct {
  return {
    id_producto: 1,
    nombre: "Laptop de prueba",
    slug: "laptop-de-prueba",
    precio_base: "1000.00",
    estado: "activo",
    envio_gratis: false,
    marcas: { nombre: "HP", slug: "hp" },
    producto_imagenes: [{ url_imagen: "https://example.com/producto-1.jpg" }],
    variantes_producto: [{ stock: 10 }],
    ...over,
  };
}

export function makeCartItem(over: Partial<CartItem> = {}): CartItem {
  return {
    id_carrito_detalle: 1,
    cantidad: 1,
    precio_unitario: "1000.00",
    created_at: "2026-10-01T12:00:00.000Z",
    id_promocion_aplicada: null,
    codigo_promo_aplicado: null,
    productos: makeCartProduct(),
    ...over,
  };
}

/** Línea del carrito de un producto concreto; el id de detalle sigue al del producto. */
export function makeCartItemFor(
  productId: number,
  over: Partial<Omit<CartItem, "productos">> & { producto?: Partial<CartProduct> } = {},
): CartItem {
  const { producto, ...resto } = over;
  return makeCartItem({
    id_carrito_detalle: 100 + productId,
    productos: makeCartProduct({ id_producto: productId, ...producto }),
    ...resto,
  });
}

/** Página como la entrega el repository (ya sin la envoltura de la API). */
export function makeCartPage(over: Partial<CartPage> = {}): CartPage {
  return {
    data: [makeCartItem()],
    nextCursor: null,
    hasMore: false,
    total: 1,
    totalPrice: "1000.00",
    ...over,
  };
}

export function makeCartResult(over: Partial<CartResult> = {}): CartResult {
  return { items: [makeCartItem()], total: 1, totalPrice: "1000.00", truncated: false, ...over };
}
