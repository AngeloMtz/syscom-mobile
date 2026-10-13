import type {
  OrderAddress,
  OrderDetail,
  OrderItem,
  OrderPayment,
  OrderSummary,
  OrdersPage,
} from "@/features/orders/types";

// Forma tomada del código del backend (orders.service.ts, getMyOrderDetail);
// pendiente de contrastar con una respuesta real de GET /orders/:id.

export function makeOrderAddress(over: Partial<OrderAddress> = {}): OrderAddress {
  return {
    id_direccion: 3,
    calle: "Av. Juárez 123",
    colonia: "Centro",
    ciudad: "Huejutla",
    estado: "Hidalgo",
    codigo_postal: "43000",
    referencias: null,
    ...over,
  };
}

export function makeOrderItem(over: Partial<OrderItem> = {}): OrderItem {
  return {
    id_pedido_detalle: 1,
    id_producto: 7,
    id_variante: null,
    cantidad: 2,
    precio_unitario: "250.00",
    subtotal: "500.00",
    productos: {
      id_producto: 7,
      nombre: "Mouse inalámbrico",
      slug: "mouse-inalambrico",
      sku: "MOU-001",
      producto_imagenes: [{ url_imagen: "https://example.com/mouse.jpg" }],
      marcas: { nombre: "Logitech" },
    },
    ...over,
  };
}

export function makeOrderPayment(over: Partial<OrderPayment> = {}): OrderPayment {
  return {
    id_pago: 11,
    metodo_pago: "stripe",
    estado_pago: "completado",
    referencia: "pi_123",
    fecha_pago: "2026-10-12T03:20:00.000Z",
    stripe_payment_intent_id: "pi_123",
    ...over,
  };
}

export function makeOrderDetail(over: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id_pedido: 8,
    id_usuario: 4,
    estado: "confirmado",
    total: "500.00",
    fecha_pedido: "2026-10-12T03:20:00.000Z",
    direccion: makeOrderAddress(),
    items: [makeOrderItem()],
    pago: makeOrderPayment(),
    ...over,
  };
}

/** Pedido de la lista (GET /orders): vista resumida. */
export function makeOrderSummary(over: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id_pedido: 8,
    estado: "confirmado",
    total: "500.00",
    fecha_pedido: "2026-10-12T03:20:00.000Z",
    total_items: 2,
    primer_producto: "Mouse inalámbrico",
    imagen_preview: "https://example.com/mouse.jpg",
    ...over,
  };
}

/** Página como la entrega el repository (ya sin la envoltura de la API). */
export function makeOrdersPage(over: Partial<OrdersPage> = {}): OrdersPage {
  return { data: [makeOrderSummary()], total: 1, page: 1, limit: 10, totalPages: 1, ...over };
}
