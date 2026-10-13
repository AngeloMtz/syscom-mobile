// src/features/payments/paymentPolling.ts — Espera del pedido tras el pago.
// El pedido lo crea el webhook de Stripe, no la app: se consulta order-status
// hasta que aparece. Un error de red o del servidor NO cuenta como pago fallido:
// el intento se pierde y se sigue intentando.
import type { OrderStatus } from "@/features/payments/types";

export type PollOutcome =
  | { status: "found"; order: OrderStatus; attempts: number }
  | { status: "exhausted"; attempts: number }
  | { status: "cancelled"; attempts: number };

export interface PollOptions {
  fetchStatus: () => Promise<OrderStatus | null>;
  maxAttempts: number;
  intervalMs: number;
  /** Espera entre intentos; se inyecta para probar sin temporizadores reales. */
  sleep: (ms: number) => Promise<void>;
  /** Devuelve true si hay que dejar de consultar (p. ej. se salió de la pantalla). */
  isCancelled?: () => boolean;
}

export async function pollOrderStatus({
  fetchStatus,
  maxAttempts,
  intervalMs,
  sleep,
  isCancelled,
}: PollOptions): Promise<PollOutcome> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    if (isCancelled?.()) return { status: "cancelled", attempts };
    attempts += 1;
    try {
      const order = await fetchStatus();
      if (order) return { status: "found", order, attempts };
    } catch {
      // Red caída o 5xx transitorio: se reintenta, no se da el pago por fallido.
    }
    if (attempts < maxAttempts) await sleep(intervalMs);
  }
  return { status: "exhausted", attempts };
}
