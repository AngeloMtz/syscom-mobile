// src/features/payments/paymentSelectors.ts — Reglas del pago. Funciones puras.
import { formatPrice } from "@/shared/utils/format";

/** Espera entre consultas a order-status (igual que la web). */
export const POLL_INTERVAL_MS = 2000;
/** Consultas tras un pago correcto: unos 40 s. */
export const MAX_POLL_ATTEMPTS = 20;
/** Consultas al pulsar "Verificar de nuevo". */
export const RECHECK_ATTEMPTS = 10;
/** Consultas tras un error ambiguo de la hoja, antes de decir que falló. */
export const VERIFY_AFTER_ERROR_ATTEMPTS = 3;

/** Cargo mínimo de Stripe en MXN (documentación de Stripe, "Monedas aceptadas"). */
export const MIN_CHARGE_MXN = 10;

export function isBelowMinimum(total: number): boolean {
  return total < MIN_CHARGE_MXN;
}

/** Clave publicable de Stripe (pk_test_ o pk_live_). Una clave secreta (sk_) no vale. */
export function isStripeConfigured(key: string | undefined): boolean {
  return typeof key === "string" && /^pk_(test|live)_[A-Za-z0-9]+$/.test(key.trim());
}

export type PayBlockReason = "no_stripe" | "cart_blocked" | "no_address" | "below_minimum";

/** Por qué no se puede pagar todavía; null si se puede. */
export function payBlockReason(input: {
  stripeConfigured: boolean;
  /** canCheckout del carrito: con líneas y ninguna bloqueante. */
  cartReady: boolean;
  hasAddress: boolean;
  total: number;
}): PayBlockReason | null {
  if (!input.stripeConfigured) return "no_stripe";
  if (!input.cartReady) return "cart_blocked";
  if (!input.hasAddress) return "no_address";
  if (isBelowMinimum(input.total)) return "below_minimum";
  return null;
}

export function payBlockMessage(reason: PayBlockReason): string {
  switch (reason) {
    case "no_stripe":
      return "El pago no está configurado en esta versión de la app.";
    case "cart_blocked":
      return "Revisa tu carrito: hay productos agotados o sin disponibilidad.";
    case "no_address":
      return "Agrega una dirección de envío para continuar.";
    case "below_minimum":
      return `El monto mínimo para pagar es ${formatPrice(MIN_CHARGE_MXN)}.`;
  }
}

export function formatPayLabel(total: number): string {
  return `Pagar ${formatPrice(total)}`;
}
