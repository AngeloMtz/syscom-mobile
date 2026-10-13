import {
  MAX_POLL_ATTEMPTS,
  MIN_CHARGE_MXN,
  POLL_INTERVAL_MS,
  RECHECK_ATTEMPTS,
  VERIFY_AFTER_ERROR_ATTEMPTS,
  formatPayLabel,
  isBelowMinimum,
  isStripeConfigured,
  payBlockMessage,
  payBlockReason,
} from "@/features/payments/paymentSelectors";

describe("constantes de polling", () => {
  it("2 s entre intentos y 20 intentos (unos 40 s), como la web", () => {
    expect(POLL_INTERVAL_MS).toBe(2000);
    expect(MAX_POLL_ATTEMPTS).toBe(20);
  });
  it("las verificaciones extra son más cortas", () => {
    expect(RECHECK_ATTEMPTS).toBeLessThanOrEqual(MAX_POLL_ATTEMPTS);
    expect(VERIFY_AFTER_ERROR_ATTEMPTS).toBeLessThan(MAX_POLL_ATTEMPTS);
  });
});

describe("isBelowMinimum", () => {
  it("el mínimo de Stripe para MXN es 10", () => {
    expect(MIN_CHARGE_MXN).toBe(10);
  });
  it("por debajo del mínimo", () => {
    expect(isBelowMinimum(9.99)).toBe(true);
    expect(isBelowMinimum(0)).toBe(true);
  });
  it("en el mínimo o por encima", () => {
    expect(isBelowMinimum(10)).toBe(false);
    expect(isBelowMinimum(1500)).toBe(false);
  });
});

describe("isStripeConfigured", () => {
  it("acepta una clave publicable de prueba o de producción", () => {
    expect(isStripeConfigured("pk_test_abc123")).toBe(true);
    expect(isStripeConfigured("pk_live_abc123")).toBe(true);
  });
  it.each([undefined, "", "   ", "sk_test_abc", "pk_test_", "abc"])("rechaza %p", (key) => {
    expect(isStripeConfigured(key)).toBe(false);
  });
});

describe("payBlockReason / payBlockMessage", () => {
  const ok = { stripeConfigured: true, cartReady: true, hasAddress: true, total: 150 };

  it("sin motivo cuando todo está listo", () => {
    expect(payBlockReason(ok)).toBeNull();
  });
  it("Stripe sin configurar tiene prioridad", () => {
    expect(payBlockReason({ ...ok, stripeConfigured: false, hasAddress: false })).toBe("no_stripe");
  });
  it("carrito vacío o con líneas bloqueantes", () => {
    expect(payBlockReason({ ...ok, cartReady: false })).toBe("cart_blocked");
  });
  it("sin dirección de envío", () => {
    expect(payBlockReason({ ...ok, hasAddress: false })).toBe("no_address");
  });
  it("total por debajo del mínimo", () => {
    expect(payBlockReason({ ...ok, total: 5 })).toBe("below_minimum");
  });

  it("mensajes claros por motivo", () => {
    expect(payBlockMessage("no_stripe")).toBe("El pago no está configurado en esta versión de la app.");
    expect(payBlockMessage("cart_blocked")).toBe("Revisa tu carrito: hay productos agotados o sin disponibilidad.");
    expect(payBlockMessage("no_address")).toBe("Agrega una dirección de envío para continuar.");
    expect(payBlockMessage("below_minimum")).toBe("El monto mínimo para pagar es $10.00.");
  });
});

describe("formatPayLabel", () => {
  it("incluye el total en pesos", () => {
    expect(formatPayLabel(1234.5)).toBe("Pagar $1,234.50");
  });
});
