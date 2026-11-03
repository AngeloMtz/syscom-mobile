// src/features/cart/types.ts
// Forma de GET /cart tomada del código del backend (cart.service.ts); aún sin
// contrastar con una respuesta real. Es la fila de Prisma con un solo cambio:
// `precio_unitario` llega ya resuelto (promoción vigente o cupón), no es el
// valor guardado. El ítem NO trae variante (el backend no la guarda).

export interface CartProduct {
  id_producto: number;
  nombre: string;
  slug: string;
  /** Precio sin promoción. Prisma Decimal: puede llegar como número o como texto ("7200.00"). */
  precio_base: number | string;
  estado: string;
  envio_gratis: boolean;
  marcas: { nombre: string; slug: string } | null;
  producto_imagenes: { url_imagen: string }[];
  /** Solo variantes activas; de aquí sale el stock disponible. */
  variantes_producto: { stock: number }[];
}

export interface CartItem {
  id_carrito_detalle: number;
  cantidad: number;
  /** Precio por unidad que cobra el backend, ya con promoción o cupón. Prisma Decimal: número o texto. */
  precio_unitario: number | string;
  created_at: string;
  /** Solo se llena con cupón; con una promoción automática viene null. */
  id_promocion_aplicada: number | null;
  /** Código del cupón aplicado; null si el precio es el de la promoción o el normal. */
  codigo_promo_aplicado: string | null;
  productos: CartProduct;
}

/** Una página tal como la entrega el repository. */
export interface CartPage {
  data: CartItem[];
  nextCursor: number | null;
  hasMore: boolean;
  /** Número de líneas en el servidor. */
  total: number;
  /** Suma de todas las líneas calculada por el backend, con dos decimales. */
  totalPrice: string;
}

/** Todo el carrito cargado, hasta MAX_CART_LINES líneas. */
export interface CartResult {
  items: CartItem[];
  total: number;
  totalPrice: string;
  /** true si había más líneas que el tope y no se cargaron todas. */
  truncated: boolean;
}

export type CartItemStatus = "ok" | "agotado" | "excede" | "no_disponible";

/** Lo que muestra una línea del carrito. */
export interface CartLineData {
  /** id del producto (las rutas del carrito se indexan por producto). */
  id: number;
  nombre: string;
  marca: string | null;
  imagenUrl: string | undefined;
  cantidad: number;
  /** null si el precio no es un número válido. */
  precioUnitario: number | null;
  subtotal: number | null;
  /** Precio por unidad sin promoción; null si la línea no tiene descuento asegurado. */
  precioOriginal: number | null;
  /** Porcentaje entero de descuento de la promoción; null si no hay descuento asegurado. */
  descuentoPorcentaje: number | null;
  /** null si el producto no tiene variantes activas (sin control de stock). */
  stock: number | null;
  maxQuantity: number;
  status: CartItemStatus;
  canIncrease: boolean;
  canDecrease: boolean;
  /** Impide pasar al pago. */
  blocking: boolean;
}
