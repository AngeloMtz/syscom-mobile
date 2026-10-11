// src/features/cart/types.ts
// Forma de GET /cart tomada del código del backend (cart.service.ts); aún sin
// contrastar con una respuesta real. Es la fila de Prisma sin transformar: el
// ítem NO trae variante (el backend no la guarda) y `precio_unitario` es una
// foto de `precio_base` al momento de agregar.

export interface CartProduct {
  id_producto: number;
  nombre: string;
  slug: string;
  /** Prisma Decimal: puede llegar como número o como texto ("7200.00"). */
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
  /** Precio por unidad que cobra el backend. Prisma Decimal: número o texto. */
  precio_unitario: number | string;
  created_at: string;
  id_promocion_aplicada: number | null;
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
  /** null si el producto no tiene variantes activas (sin control de stock). */
  stock: number | null;
  maxQuantity: number;
  status: CartItemStatus;
  canIncrease: boolean;
  canDecrease: boolean;
  /** Impide pasar al pago. */
  blocking: boolean;
}
