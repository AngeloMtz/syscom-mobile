// src/features/payments/types.ts
// Forma de /payments tomada del código del backend (payments.service.ts y
// controller.ts); sin contrastar con una respuesta real de producción.

/** POST /payments/checkout → { success, data: { clientSecret, paymentIntentId } } */
export interface CheckoutIntent {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * GET /payments/order-status/:paymentIntentId → { success, data: null | { id_pedido, estado } }.
 * `data` es null hasta que el webhook de Stripe crea el pedido.
 */
export interface OrderStatus {
  id_pedido: number;
  estado: string;
}

/** Forma del error de PaymentSheet (StripeError del SDK) que usa la app. */
export interface SheetError {
  code?: string;
  message?: string;
  localizedMessage?: string;
  declineCode?: string;
  stripeErrorCode?: string;
  type?: string;
}

export type SheetErrorKind = "canceled" | "declined" | "ambiguous" | "already_paid";
