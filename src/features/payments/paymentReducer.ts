// src/features/payments/paymentReducer.ts — Máquina de estados del pago.
// idle → creating → preparing → sheet → verifying → paid | pending
// Cualquier fase en curso puede terminar en failed o canceled. Un pago pagado,
// pendiente o en curso NUNCA vuelve a crear un PaymentIntent (START se ignora).

export type PaymentPhase =
  | "idle"
  | "creating"
  | "preparing"
  | "sheet"
  | "verifying"
  | "pending"
  | "paid"
  | "failed"
  | "canceled";

export interface PaymentState {
  phase: PaymentPhase;
  paymentIntentId: string | null;
  orderId: number | null;
  message: string | null;
}

export type PaymentAction =
  | { type: "START" }
  | { type: "INTENT_CREATED"; paymentIntentId: string }
  | { type: "SHEET_OPENED" }
  | { type: "VERIFY" }
  | { type: "ORDER_FOUND"; orderId: number }
  | { type: "POLL_EXHAUSTED" }
  | { type: "FAILED"; message: string }
  | { type: "CANCELED"; message: string }
  | { type: "RESET" };

export const PENDING_MESSAGE = "Pago recibido, estamos confirmando tu pedido.";

const BUSY: PaymentPhase[] = ["creating", "preparing", "sheet", "verifying"];

/** Con `pendingPaymentIntentId` (pago ya hecho, pedido sin confirmar) arranca en pendiente. */
export function initialPaymentState(pendingPaymentIntentId?: string | null): PaymentState {
  if (pendingPaymentIntentId) {
    return { phase: "pending", paymentIntentId: pendingPaymentIntentId, orderId: null, message: PENDING_MESSAGE };
  }
  return { phase: "idle", paymentIntentId: null, orderId: null, message: null };
}

/** Hay una operación en curso: no se admite otro toque ni salir de la pantalla. */
export function isBusy(state: PaymentState): boolean {
  return BUSY.includes(state.phase);
}

/** El carrito no se edita mientras se paga ni mientras se confirma el pedido. */
export function isCartLocked(state: PaymentState): boolean {
  return isBusy(state) || state.phase === "pending";
}

export function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case "START":
      if (state.phase === "idle" || state.phase === "failed" || state.phase === "canceled") {
        return { phase: "creating", paymentIntentId: null, orderId: null, message: null };
      }
      return state;

    case "INTENT_CREATED":
      return state.phase === "creating"
        ? { ...state, phase: "preparing", paymentIntentId: action.paymentIntentId }
        : state;

    case "SHEET_OPENED":
      return state.phase === "preparing" ? { ...state, phase: "sheet" } : state;

    case "VERIFY":
      return state.phase === "preparing" ||
        state.phase === "sheet" ||
        state.phase === "pending" ||
        state.phase === "verifying"
        ? { ...state, phase: "verifying", message: null }
        : state;

    case "ORDER_FOUND":
      return state.phase === "verifying"
        ? { ...state, phase: "paid", orderId: action.orderId, message: null }
        : state;

    case "POLL_EXHAUSTED":
      return state.phase === "verifying" ? { ...state, phase: "pending", message: PENDING_MESSAGE } : state;

    case "FAILED":
      return isBusy(state) ? { ...state, phase: "failed", message: action.message } : state;

    case "CANCELED":
      return isBusy(state) ? { ...state, phase: "canceled", message: action.message } : state;

    case "RESET":
      return state.phase === "failed" || state.phase === "canceled" || state.phase === "paid"
        ? initialPaymentState()
        : state;
  }
}
