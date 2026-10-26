import {
  formatItemCount,
  formatOrderDate,
  formatOrderFolio,
  isOrderReviewable,
  orderStatusLabel,
  orderStatusTone,
  orderTotal,
  parseOrderId,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/features/orders/orderFormat";

describe("formatOrderFolio", () => {
  it("rellena el id con ceros a 6 dígitos", () => {
    expect(formatOrderFolio(8)).toBe("SYS-000008");
    expect(formatOrderFolio(1234)).toBe("SYS-001234");
    expect(formatOrderFolio(999999)).toBe("SYS-999999");
  });
  it("no trunca ids de más de 6 dígitos", () => {
    expect(formatOrderFolio(1234567)).toBe("SYS-1234567");
  });
  it("sin año en el formato", () => {
    expect(formatOrderFolio(8)).not.toMatch(/20\d\d/);
  });
  it.each([0, -3, NaN, Infinity, 1.5])("con un id inválido (%p) no inventa un folio", (id) => {
    expect(formatOrderFolio(id)).toBe("SYS-------");
  });
});

describe("orderStatusLabel", () => {
  it.each([
    ["pendiente_pago", "Pendiente de pago"],
    ["confirmado", "Confirmado"],
    ["en_preparacion", "En preparación"],
    ["en_camino", "En camino"],
    ["entregado", "Entregado"],
    ["cancelado", "Cancelado"],
  ])("%s → %s", (estado, etiqueta) => {
    expect(orderStatusLabel(estado)).toBe(etiqueta);
  });
  it("un estado desconocido se muestra legible, sin guiones bajos", () => {
    expect(orderStatusLabel("en_revision")).toBe("En revision");
  });
  it("sin estado", () => {
    expect(orderStatusLabel(null)).toBe("Estado no disponible");
    expect(orderStatusLabel("")).toBe("Estado no disponible");
  });
});

describe("orderStatusTone", () => {
  it.each([
    ["pendiente_pago", "warning"],
    ["confirmado", "info"],
    ["en_preparacion", "neutral"],
    ["en_camino", "warning"],
    ["entregado", "success"],
    ["cancelado", "danger"],
    ["otro", "neutral"],
  ])("%s → %s", (estado, tono) => {
    expect(orderStatusTone(estado)).toBe(tono);
  });
});

describe("formatOrderDate (hora de México, UTC-6, sin hora del día)", () => {
  it("12 oct 2026", () => {
    expect(formatOrderDate("2026-10-12T15:00:00.000Z")).toBe("12 oct 2026");
  });
  it("usa el día de México, no el de UTC (madrugada en UTC = día anterior en México)", () => {
    expect(formatOrderDate("2026-10-12T05:59:59.000Z")).toBe("11 oct 2026");
    expect(formatOrderDate("2026-10-12T06:00:00.000Z")).toBe("12 oct 2026");
  });
  it("cambio de año en hora de México", () => {
    expect(formatOrderDate("2027-01-01T05:30:00.000Z")).toBe("31 dic 2026");
    expect(formatOrderDate("2027-01-01T06:00:00.000Z")).toBe("1 ene 2027");
  });
  it("abreviaturas de los 12 meses", () => {
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    meses.forEach((mes, i) => {
      const iso = `2026-${String(i + 1).padStart(2, "0")}-15T12:00:00.000Z`;
      expect(formatOrderDate(iso)).toBe(`15 ${mes} 2026`);
    });
  });
  it("fecha nula, vacía o inválida", () => {
    expect(formatOrderDate(null)).toBe("Fecha no disponible");
    expect(formatOrderDate(undefined)).toBe("Fecha no disponible");
    expect(formatOrderDate("")).toBe("Fecha no disponible");
    expect(formatOrderDate("no-es-fecha")).toBe("Fecha no disponible");
  });
});

describe("paymentMethodLabel / paymentStatusLabel", () => {
  it("stripe se muestra como tarjeta", () => {
    expect(paymentMethodLabel("stripe")).toBe("Tarjeta (Stripe)");
    expect(paymentMethodLabel("STRIPE")).toBe("Tarjeta (Stripe)");
  });
  it("otro método o ausente", () => {
    expect(paymentMethodLabel("oxxo")).toBe("Oxxo");
    expect(paymentMethodLabel(null)).toBe("No disponible");
  });
  it("estado del pago", () => {
    expect(paymentStatusLabel("completado")).toBe("Pagado");
    expect(paymentStatusLabel("pendiente")).toBe("Pendiente");
    expect(paymentStatusLabel("reembolso_parcial")).toBe("Reembolso parcial");
    expect(paymentStatusLabel(undefined)).toBe("No disponible");
  });
});

describe("orderTotal", () => {
  it("acepta el Decimal como texto o número", () => {
    expect(orderTotal("1500.00")).toBe(1500);
    expect(orderTotal(1500.5)).toBe(1500.5);
    expect(orderTotal("19.99")).toBe(19.99);
  });
  it("devuelve null si no es un número válido", () => {
    expect(orderTotal(null)).toBeNull();
    expect(orderTotal("abc")).toBeNull();
    expect(orderTotal(undefined)).toBeNull();
  });
});

describe("formatItemCount", () => {
  it("singular y plural", () => {
    expect(formatItemCount(1)).toBe("1 producto");
    expect(formatItemCount(3)).toBe("3 productos");
  });
  it("valores inválidos cuentan como cero", () => {
    expect(formatItemCount(0)).toBe("0 productos");
    expect(formatItemCount(-2)).toBe("0 productos");
    expect(formatItemCount(NaN)).toBe("0 productos");
  });
});

describe("parseOrderId", () => {
  it("convierte un texto numérico en entero positivo", () => {
    expect(parseOrderId("8")).toBe(8);
    expect(parseOrderId(["12", "3"])).toBe(12);
  });
  it.each([undefined, "", "abc", "0", "-3", "1.5", "12abc", " "])("devuelve null para %p", (raw) => {
    expect(parseOrderId(raw as string | undefined)).toBeNull();
  });
});

describe("isOrderReviewable", () => {
  it("solo un pedido entregado permite reseñar sus productos", () => {
    expect(isOrderReviewable("entregado")).toBe(true);
  });

  it.each(["pendiente_pago", "confirmado", "en_preparacion", "en_camino", "cancelado"])(
    "%s no permite reseñar",
    (estado) => {
      expect(isOrderReviewable(estado)).toBe(false);
    },
  );

  it("ignora mayúsculas y espacios", () => {
    expect(isOrderReviewable(" Entregado ")).toBe(true);
  });

  it("estado nulo, vacío o desconocido no permite reseñar", () => {
    expect(isOrderReviewable(null)).toBe(false);
    expect(isOrderReviewable(undefined)).toBe(false);
    expect(isOrderReviewable("")).toBe(false);
    expect(isOrderReviewable("en_revision")).toBe(false);
  });
});
