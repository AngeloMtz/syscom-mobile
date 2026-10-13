// src/features/payments/paymentErrors.ts — Mensajes de error del pago.
// Dos orígenes: el 400 del backend al crear el pago (texto en español) y el
// error de PaymentSheet (código del SDK y declineCode de Stripe). Un 5xx puede
// traer texto interno: nunca se muestra.
import type { SheetError, SheetErrorKind } from "@/features/payments/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";

const GENERIC = "No pudimos iniciar el pago. Intenta de nuevo más tarde.";
const CONNECTION = "Error de conexión. Intenta de nuevo más tarde.";

const statusOf = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } } | null | undefined)?.response?.status;

const messageOf = (error: unknown): string | undefined => {
  const data = (error as { response?: { data?: { message?: unknown } } } | null | undefined)?.response?.data;
  return typeof data?.message === "string" ? data.message : undefined;
};

/** Mensaje para el usuario ante un error de POST /payments/checkout. */
export function checkoutErrorMessage(error: unknown): string {
  const status = statusOf(error);
  if (status === 503) return CONNECTION;
  if (typeof status === "number" && status >= 500) return GENERIC;
  if ((error as { message?: string } | null | undefined)?.message === "Network Error") {
    return apiErrorMessage(error, GENERIC);
  }

  const text = messageOf(error);
  if (!text) return GENERIC;

  if (/carrito est[aá] vac[ií]o/i.test(text)) {
    return "Tu carrito está vacío. Agrega productos para continuar.";
  }
  const stock = /Stock insuficiente para "(.+)"\. Disponible: (\d+)/.exec(text);
  if (stock) return `Solo quedan ${stock[2]} de "${stock[1]}". Ajusta tu carrito para continuar.`;

  const inactive = /El producto "(.+)" ya no est[aá] disponible/.exec(text);
  if (inactive) return `"${inactive[1]}" ya no está disponible. Quítalo de tu carrito para continuar.`;

  const variant = /Variante del producto "(.+)" no encontrada/.exec(text);
  if (variant) {
    return `Hubo un problema con "${variant[1]}". Quítalo de tu carrito y vuelve a agregarlo.`;
  }
  if (/Direcci[oó]n de env[ií]o no encontrada/i.test(text)) {
    return "Elige otra dirección de envío para continuar.";
  }
  return GENERIC;
}

const AMBIGUOUS =
  "No pudimos confirmar el pago. Si ves un cargo en tu tarjeta, tu pedido aparecerá en unos minutos.";
const DECLINED = "Tu tarjeta fue rechazada. Prueba con otra tarjeta.";

/**
 * Clasifica el error de PaymentSheet.
 * - canceled: el usuario cerró la hoja; no se cobró.
 * - declined: Stripe rechazó la tarjeta (trae declineCode); es definitivo.
 * - already_paid: el PaymentIntent ya estaba pagado; hay que verificar el pedido.
 * - ambiguous: no se sabe si el cobro ocurrió (tiempo agotado, red, fallo sin
 *   declineCode); hay que consultar order-status antes de decir que falló.
 */
export function classifyPaymentSheetError(
  error: SheetError | undefined | null,
): { kind: SheetErrorKind; message: string } {
  if (!error) return { kind: "ambiguous", message: AMBIGUOUS };

  if (error.code === "Canceled") {
    return { kind: "canceled", message: "Pago cancelado. No se te cobró." };
  }

  if (/status 'succeeded'/i.test(error.message ?? "")) {
    return { kind: "already_paid", message: "Tu pago ya fue recibido. Estamos confirmando tu pedido." };
  }

  if (error.declineCode) {
    switch (error.declineCode) {
      case "insufficient_funds":
        return {
          kind: "declined",
          message: "Tu tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.",
        };
      case "incorrect_cvc":
        return { kind: "declined", message: "El código de seguridad de la tarjeta es incorrecto." };
      case "generic_decline":
        return { kind: "declined", message: DECLINED };
      default:
        return { kind: "declined", message: error.localizedMessage || DECLINED };
    }
  }

  return { kind: "ambiguous", message: AMBIGUOUS };
}

/** Solo un rechazo explícito o una cancelación son definitivos; el resto se verifica. */
export function shouldVerifyAfterError(kind: SheetErrorKind): boolean {
  return kind === "ambiguous" || kind === "already_paid";
}
