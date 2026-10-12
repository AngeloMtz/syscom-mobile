import {
  checkoutErrorMessage,
  classifyPaymentSheetError,
  shouldVerifyAfterError,
} from "@/features/payments/paymentErrors";

import { makeApiError, makeNetworkError } from "./fixtures";

const GENERICO = "No pudimos iniciar el pago. Intenta de nuevo más tarde.";

describe("checkoutErrorMessage", () => {
  it("carrito vacío", () => {
    const error = makeApiError({
      status: 400,
      message: "Tu carrito está vacío. Agrega productos antes de continuar.",
    });
    expect(checkoutErrorMessage(error)).toBe("Tu carrito está vacío. Agrega productos para continuar.");
  });

  it("stock insuficiente conserva el producto y la cantidad disponible", () => {
    const error = makeApiError({
      status: 400,
      message: 'Stock insuficiente para "Laptop HP 840". Disponible: 2.',
    });
    expect(checkoutErrorMessage(error)).toBe(
      'Solo quedan 2 de "Laptop HP 840". Ajusta tu carrito para continuar.',
    );
  });

  it("producto que ya no está disponible", () => {
    const error = makeApiError({
      status: 400,
      message: 'El producto "Mouse X" ya no está disponible.',
    });
    expect(checkoutErrorMessage(error)).toBe(
      '"Mouse X" ya no está disponible. Quítalo de tu carrito para continuar.',
    );
  });

  it("variante no encontrada", () => {
    const error = makeApiError({
      status: 400,
      message: 'Variante del producto "Teclado" no encontrada.',
    });
    expect(checkoutErrorMessage(error)).toBe(
      'Hubo un problema con "Teclado". Quítalo de tu carrito y vuelve a agregarlo.',
    );
  });

  it("dirección inválida", () => {
    const error = makeApiError({
      status: 400,
      message: "Dirección de envío no encontrada o no pertenece a tu cuenta.",
    });
    expect(checkoutErrorMessage(error)).toBe("Elige otra dirección de envío para continuar.");
  });

  it("503 del backend: error de conexión", () => {
    const error = makeApiError({ status: 503, message: "Error de conexión. Intenta de nuevo más tarde." });
    expect(checkoutErrorMessage(error)).toBe("Error de conexión. Intenta de nuevo más tarde.");
  });

  it("5xx: nunca muestra el texto del servidor", () => {
    const error = makeApiError({ status: 500, message: "STRIPE_SECRET_KEY no configurada." });
    expect(checkoutErrorMessage(error)).toBe(GENERICO);
  });

  it("un 400 con un texto que no se reconoce (por ejemplo, de Stripe en inglés) da el mensaje genérico", () => {
    const error = makeApiError({ status: 400, message: "Amount must convert to at least 50 cents." });
    expect(checkoutErrorMessage(error)).toBe(GENERICO);
  });

  it("error de red", () => {
    expect(checkoutErrorMessage(makeNetworkError())).toMatch(/Sin conexión/);
  });

  it("sin información usa el mensaje genérico", () => {
    expect(checkoutErrorMessage(undefined)).toBe(GENERICO);
  });
});

describe("classifyPaymentSheetError", () => {
  it("cancelar la hoja: no se cobró", () => {
    expect(classifyPaymentSheetError({ code: "Canceled", message: "The payment flow has been canceled" })).toEqual(
      { kind: "canceled", message: "Pago cancelado. No se te cobró." },
    );
  });

  it("fondos insuficientes", () => {
    const result = classifyPaymentSheetError({
      code: "Failed",
      message: "Your card has insufficient funds.",
      declineCode: "insufficient_funds",
    });
    expect(result).toEqual({
      kind: "declined",
      message: "Tu tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.",
    });
  });

  it("tarjeta rechazada (rechazo genérico)", () => {
    const result = classifyPaymentSheetError({
      code: "Failed",
      message: "Your card was declined.",
      declineCode: "generic_decline",
    });
    expect(result).toEqual({
      kind: "declined",
      message: "Tu tarjeta fue rechazada. Prueba con otra tarjeta.",
    });
  });

  it("código de seguridad incorrecto", () => {
    const result = classifyPaymentSheetError({
      code: "Failed",
      message: "Your card's security code is incorrect.",
      declineCode: "incorrect_cvc",
    });
    expect(result.kind).toBe("declined");
    expect(result.message).toBe("El código de seguridad de la tarjeta es incorrecto.");
  });

  it("cualquier otro declineCode se trata como rechazo", () => {
    const result = classifyPaymentSheetError({ code: "Failed", message: "x", declineCode: "another_unknown_decline" });
    expect(result).toEqual({
      kind: "declined",
      message: "Tu tarjeta fue rechazada. Prueba con otra tarjeta.",
    });
  });

  it("tiempo de espera agotado: ambiguo, hay que verificar", () => {
    const result = classifyPaymentSheetError({ code: "Timeout", message: "timeout" });
    expect(result.kind).toBe("ambiguous");
  });

  it("un fallo sin declineCode es ambiguo (puede ser red o autenticación)", () => {
    const result = classifyPaymentSheetError({ code: "Failed", message: "Something went wrong" });
    expect(result.kind).toBe("ambiguous");
    expect(result.message).toMatch(/No pudimos confirmar el pago/);
  });

  it("PaymentIntent ya pagado: se trata como pago realizado que hay que verificar", () => {
    const result = classifyPaymentSheetError({
      code: "Failed",
      message: "PaymentSheet cannot set up a PaymentIntent in status 'succeeded'.",
    });
    expect(result.kind).toBe("already_paid");
  });

  it("usa localizedMessage como texto para rechazos desconocidos solo si no hay declineCode conocido", () => {
    const result = classifyPaymentSheetError({
      code: "Failed",
      message: "boom",
      localizedMessage: "Tu tarjeta ha caducado.",
      declineCode: "unknown_decline",
    });
    expect(result.kind).toBe("declined");
    expect(result.message).toBe("Tu tarjeta ha caducado.");
  });

  it("un error sin mensaje ni código es ambiguo", () => {
    expect(classifyPaymentSheetError({}).kind).toBe("ambiguous");
  });

  it("sin error devuelve ambiguo con mensaje genérico", () => {
    expect(classifyPaymentSheetError(undefined).kind).toBe("ambiguous");
  });
});

describe("shouldVerifyAfterError", () => {
  it("verifica en ambiguo y en ya pagado", () => {
    expect(shouldVerifyAfterError("ambiguous")).toBe(true);
    expect(shouldVerifyAfterError("already_paid")).toBe(true);
  });
  it("no verifica si se canceló o si Stripe rechazó la tarjeta", () => {
    expect(shouldVerifyAfterError("canceled")).toBe(false);
    expect(shouldVerifyAfterError("declined")).toBe(false);
  });
});
