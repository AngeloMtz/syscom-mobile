// src/features/payments/repositories/paymentRepository.ts — Acceso a /payments.
// Exige sesión (Bearer, lo agrega el interceptor). Forma tomada del código del
// backend; sin verificar con una respuesta viva. El pedido NO lo crea la app:
// lo crea el webhook de Stripe cuando el pago termina.
import api from "@/shared/api/client";
import type { CheckoutIntent, OrderStatus } from "@/features/payments/types";

export const paymentRepository = {
  /**
   * Crea un PaymentIntent desde el carrito del servidor (valida dirección,
   * stock y disponibilidad). Cada llamada crea uno nuevo: no se reintenta sola.
   */
  createCheckout: (idDireccion: number): Promise<CheckoutIntent> =>
    api.post("/payments/checkout", { id_direccion: idDireccion }).then((r) => {
      const d = r.data?.data;
      if (typeof d?.clientSecret !== "string" || typeof d?.paymentIntentId !== "string") {
        throw new Error("La respuesta no incluye el pago");
      }
      return { clientSecret: d.clientSecret, paymentIntentId: d.paymentIntentId };
    }),

  /** El pedido del PaymentIntent, o null mientras el webhook no lo haya creado. */
  getOrderStatus: (paymentIntentId: string): Promise<OrderStatus | null> =>
    api.get(`/payments/order-status/${encodeURIComponent(paymentIntentId)}`).then((r) => {
      const d = r.data?.data;
      return typeof d?.id_pedido === "number"
        ? { id_pedido: d.id_pedido, estado: String(d.estado ?? "") }
        : null;
    }),
};
