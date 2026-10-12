// src/features/payments/hooks/usePayment.ts — Orquesta el pago con PaymentSheet.
//
// POST /payments/checkout → initPaymentSheet → presentPaymentSheet → consulta
// de order-status hasta que el webhook crea el pedido. Reglas:
// - Nunca se crea un segundo PaymentIntent si el pago está en curso, pendiente
//   o pagado ("Verificar de nuevo" solo vuelve a consultar el mismo).
// - Un error ambiguo se verifica contra order-status antes de decir que falló.
// - Un error de red al consultar el pedido se reintenta; no es un pago fallido.
// - Solo tarjeta: allowsDelayedPaymentMethods = false (el backend crea el
//   pedido únicamente con payment_intent.succeeded).
import { useQueryClient } from "@tanstack/react-query";
import { useStripe } from "@stripe/stripe-react-native";
import { useCallback, useEffect, useReducer, useRef } from "react";

import { CART_KEY } from "@/features/cart/hooks/useCart";
import { getReturnUrl } from "@/features/payments/paymentConfig";
import {
  checkoutErrorMessage,
  classifyPaymentSheetError,
  shouldVerifyAfterError,
} from "@/features/payments/paymentErrors";
import { pollOrderStatus, type PollOutcome } from "@/features/payments/paymentPolling";
import { initialPaymentState, isCartLocked, paymentReducer } from "@/features/payments/paymentReducer";
import {
  MAX_POLL_ATTEMPTS,
  POLL_INTERVAL_MS,
  RECHECK_ATTEMPTS,
  VERIFY_AFTER_ERROR_ATTEMPTS,
} from "@/features/payments/paymentSelectors";
import { usePaymentStore } from "@/features/payments/paymentStore";
import { paymentRepository } from "@/features/payments/repositories/paymentRepository";
import type { CheckoutIntent, SheetError } from "@/features/payments/types";

const MERCHANT_NAME = "SYSCOM";
const PREPARE_FAILED = "No pudimos preparar el pago. Intenta de nuevo.";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const usePayment = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const queryClient = useQueryClient();

  const [state, dispatch] = useReducer(paymentReducer, undefined, () =>
    initialPaymentState(usePaymentStore.getState().pendingPaymentIntentId),
  );
  const stateRef = useRef(state);
  const inFlight = useRef(false);
  const unmounted = useRef(false);

  // Refleja el estado en el store para bloquear el carrito y retomar un pendiente.
  useEffect(() => {
    stateRef.current = state;
    usePaymentStore
      .getState()
      .setLock(isCartLocked(state), state.phase === "pending" ? state.paymentIntentId : null);
  }, [state]);

  useEffect(
    () => () => {
      unmounted.current = true;
      // Al salir solo queda bloqueado un pago pendiente de confirmar.
      const s = stateRef.current;
      usePaymentStore
        .getState()
        .setLock(s.phase === "pending", s.phase === "pending" ? s.paymentIntentId : null);
    },
    [],
  );

  const verify = useCallback(
    (paymentIntentId: string, attempts: number): Promise<PollOutcome> =>
      pollOrderStatus({
        fetchStatus: () => paymentRepository.getOrderStatus(paymentIntentId),
        maxAttempts: attempts,
        intervalMs: POLL_INTERVAL_MS,
        sleep,
        isCancelled: () => unmounted.current,
      }),
    [],
  );

  const onPaid = useCallback(
    (orderId: number) => {
      dispatch({ type: "ORDER_FOUND", orderId });
      // El webhook ya vació el carrito del servidor.
      void queryClient.invalidateQueries({ queryKey: CART_KEY });
    },
    [queryClient],
  );

  /** Pago confirmado por la hoja (o ya pagado): se espera el pedido. */
  const confirmOrder = useCallback(
    async (paymentIntentId: string, attempts: number) => {
      dispatch({ type: "VERIFY" });
      const outcome = await verify(paymentIntentId, attempts);
      if (outcome.status === "found") onPaid(outcome.order.id_pedido);
      else if (outcome.status === "exhausted") dispatch({ type: "POLL_EXHAUSTED" });
    },
    [verify, onPaid],
  );

  /** Error de la hoja después de presentarla: puede que sí se haya cobrado. */
  const handleSheetError = useCallback(
    async (error: SheetError, paymentIntentId: string) => {
      const { kind, message } = classifyPaymentSheetError(error);
      if (kind === "canceled") {
        dispatch({ type: "CANCELED", message });
        return;
      }
      if (!shouldVerifyAfterError(kind)) {
        dispatch({ type: "FAILED", message });
        return;
      }

      dispatch({ type: "VERIFY" });
      const attempts = kind === "already_paid" ? MAX_POLL_ATTEMPTS : VERIFY_AFTER_ERROR_ATTEMPTS;
      const outcome = await verify(paymentIntentId, attempts);
      if (outcome.status === "found") {
        onPaid(outcome.order.id_pedido);
      } else if (outcome.status === "exhausted") {
        dispatch(kind === "already_paid" ? { type: "POLL_EXHAUSTED" } : { type: "FAILED", message });
      }
    },
    [verify, onPaid],
  );

  const pay = useCallback(
    async (idDireccion: number) => {
      const phase = stateRef.current.phase;
      if (inFlight.current || !(phase === "idle" || phase === "failed" || phase === "canceled")) return;
      inFlight.current = true;
      try {
        dispatch({ type: "START" });

        let intent: CheckoutIntent;
        try {
          intent = await paymentRepository.createCheckout(idDireccion);
        } catch (error) {
          dispatch({ type: "FAILED", message: checkoutErrorMessage(error) });
          return;
        }
        dispatch({ type: "INTENT_CREATED", paymentIntentId: intent.paymentIntentId });

        let init: { error?: SheetError };
        try {
          init = await initPaymentSheet({
            merchantDisplayName: MERCHANT_NAME,
            paymentIntentClientSecret: intent.clientSecret,
            returnURL: getReturnUrl(),
            allowsDelayedPaymentMethods: false,
          });
        } catch (e) {
          init = { error: { code: "Failed", message: (e as Error)?.message } };
        }
        if (init.error) {
          // Sin hoja presentada no pudo haber cobro, salvo que el PI ya estuviera pagado.
          if (classifyPaymentSheetError(init.error).kind === "already_paid") {
            await confirmOrder(intent.paymentIntentId, MAX_POLL_ATTEMPTS);
          } else {
            dispatch({ type: "FAILED", message: PREPARE_FAILED });
          }
          return;
        }

        dispatch({ type: "SHEET_OPENED" });
        let present: { error?: SheetError };
        try {
          present = await presentPaymentSheet();
        } catch (e) {
          present = { error: { code: "Failed", message: (e as Error)?.message } };
        }
        if (present.error) {
          await handleSheetError(present.error, intent.paymentIntentId);
          return;
        }

        await confirmOrder(intent.paymentIntentId, MAX_POLL_ATTEMPTS);
      } finally {
        inFlight.current = false;
      }
    },
    [initPaymentSheet, presentPaymentSheet, confirmOrder, handleSheetError],
  );

  /** "Verificar de nuevo": consulta el mismo PaymentIntent; nunca crea otro. */
  const recheck = useCallback(async () => {
    const s = stateRef.current;
    if (inFlight.current || s.phase !== "pending" || !s.paymentIntentId) return;
    inFlight.current = true;
    try {
      await confirmOrder(s.paymentIntentId, RECHECK_ATTEMPTS);
    } finally {
      inFlight.current = false;
    }
  }, [confirmOrder]);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, pay, recheck, reset };
};
