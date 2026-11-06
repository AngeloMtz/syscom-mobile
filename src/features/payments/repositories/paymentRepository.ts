// src/features/payments/repositories/paymentRepository.ts — Acceso a /payments.
// Exige sesión (Bearer, lo agrega el interceptor). Forma tomada del código del
// backend; sin verificar con una respuesta viva. El pedido NO lo crea la app:
// lo crea el webhook de Stripe cuando el pago termina.
import type { AxiosInstance } from "axios";

import { ApiClient } from "@/shared/api/client";
import type { CheckoutIntent, OrderStatus } from "@/features/payments/types";

/** Contrato: qué operaciones existen sobre los pagos, no cómo se hacen. */
export interface PaymentRepository {
  /**
   * Crea un PaymentIntent desde el carrito del servidor (valida dirección,
   * stock y disponibilidad). Cada llamada crea uno nuevo: no se reintenta sola.
   */
  createCheckout(idDireccion: number): Promise<CheckoutIntent>;
  /** El pedido del PaymentIntent, o null mientras el webhook no lo haya creado. */
  getOrderStatus(paymentIntentId: string): Promise<OrderStatus | null>;
}

/** Implementación sobre la API REST. Funciones flecha: se pueden pasar sin perder `this`. */
export class HttpPaymentRepository implements PaymentRepository {
  constructor(private readonly http: AxiosInstance) {}

  createCheckout = (idDireccion: number): Promise<CheckoutIntent> =>
    this.http.post("/payments/checkout", { id_direccion: idDireccion }).then((r) => {
      const d = r.data?.data;
      if (typeof d?.clientSecret !== "string" || typeof d?.paymentIntentId !== "string") {
        throw new Error("La respuesta no incluye el pago");
      }
      return { clientSecret: d.clientSecret, paymentIntentId: d.paymentIntentId };
    });

  getOrderStatus = (paymentIntentId: string): Promise<OrderStatus | null> =>
    this.http.get(`/payments/order-status/${encodeURIComponent(paymentIntentId)}`).then((r) => {
      const d = r.data?.data;
      return typeof d?.id_pedido === "number"
        ? { id_pedido: d.id_pedido, estado: String(d.estado ?? "") }
        : null;
    });
}

export const paymentRepository: PaymentRepository = new HttpPaymentRepository(ApiClient.getInstance().http);
