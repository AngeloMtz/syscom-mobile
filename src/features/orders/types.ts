// src/features/orders/types.ts
// Forma de GET /orders/:id tomada del código del backend (orders.service.ts,
// getMyOrderDetail); sin contrastar con una respuesta real. El backend NO
// devuelve los últimos 4 dígitos ni la marca de la tarjeta: solo `metodo_pago`.

export interface OrderAddress {
  id_direccion: number;
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  referencias: string | null;
}

export interface OrderItem {
  id_pedido_detalle: number;
  id_producto: number;
  /** Siempre null hoy: el carrito no guarda variante. */
  id_variante: number | null;
  cantidad: number;
  /** Prisma Decimal: número o texto. */
  precio_unitario: number | string;
  subtotal: number | string;
  productos: {
    id_producto: number;
    nombre: string;
    slug: string;
    sku: string;
    producto_imagenes: { url_imagen: string }[];
    marcas: { nombre: string } | null;
  };
}

export interface OrderPayment {
  id_pago: number;
  /** "stripe" en los pedidos creados por el webhook. */
  metodo_pago: string;
  /** "completado" en los pedidos creados por el webhook. */
  estado_pago: string;
  referencia: string | null;
  fecha_pago: string | null;
  stripe_payment_intent_id: string | null;
}

export interface OrderDetail {
  id_pedido: number;
  id_usuario: number;
  /** pendiente_pago | confirmado | en_preparacion | en_camino | entregado | cancelado */
  estado: string;
  total: number | string;
  /** ISO en UTC; puede ser null. */
  fecha_pedido: string | null;
  direccion: OrderAddress | null;
  items: OrderItem[];
  pago: OrderPayment | null;
}

export type StatusTone = "success" | "info" | "warning" | "neutral" | "danger";
