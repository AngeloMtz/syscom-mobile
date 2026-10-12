import {
  initialPaymentState,
  isBusy,
  isCartLocked,
  paymentReducer,
  type PaymentState,
} from "@/features/payments/paymentReducer";

const run = (state: PaymentState, ...actions: Parameters<typeof paymentReducer>[1][]) =>
  actions.reduce(paymentReducer, state);

describe("estado inicial", () => {
  it("empieza en reposo", () => {
    expect(initialPaymentState()).toEqual({
      phase: "idle",
      paymentIntentId: null,
      orderId: null,
      message: null,
    });
  });
  it("con un pago pendiente en memoria arranca en pendiente", () => {
    const state = initialPaymentState("pi_123");
    expect(state.phase).toBe("pending");
    expect(state.paymentIntentId).toBe("pi_123");
  });
});

describe("camino feliz", () => {
  it("idle → creating → preparing → sheet → verifying → paid", () => {
    let s = initialPaymentState();
    s = run(s, { type: "START" });
    expect(s.phase).toBe("creating");
    s = run(s, { type: "INTENT_CREATED", paymentIntentId: "pi_1" });
    expect(s).toMatchObject({ phase: "preparing", paymentIntentId: "pi_1" });
    s = run(s, { type: "SHEET_OPENED" });
    expect(s.phase).toBe("sheet");
    s = run(s, { type: "VERIFY" });
    expect(s.phase).toBe("verifying");
    s = run(s, { type: "ORDER_FOUND", orderId: 42 });
    expect(s).toMatchObject({ phase: "paid", orderId: 42, paymentIntentId: "pi_1" });
  });
});

describe("pendiente y verificación", () => {
  const verificando = () =>
    run(
      initialPaymentState(),
      { type: "START" },
      { type: "INTENT_CREATED", paymentIntentId: "pi_1" },
      { type: "SHEET_OPENED" },
      { type: "VERIFY" },
    );

  it("al agotar los intentos queda pendiente, con el mismo PaymentIntent", () => {
    const s = run(verificando(), { type: "POLL_EXHAUSTED" });
    expect(s).toMatchObject({ phase: "pending", paymentIntentId: "pi_1" });
    expect(s.message).toBe("Pago recibido, estamos confirmando tu pedido.");
  });

  it("desde pendiente se puede verificar de nuevo y encontrar el pedido", () => {
    let s = run(verificando(), { type: "POLL_EXHAUSTED" });
    s = run(s, { type: "VERIFY" });
    expect(s.phase).toBe("verifying");
    s = run(s, { type: "ORDER_FOUND", orderId: 7 });
    expect(s).toMatchObject({ phase: "paid", orderId: 7 });
  });

  it("desde un arranque pendiente también se verifica de nuevo", () => {
    const s = run(initialPaymentState("pi_9"), { type: "VERIFY" });
    expect(s).toMatchObject({ phase: "verifying", paymentIntentId: "pi_9" });
  });
});

describe("cancelar y fallar", () => {
  it("cancelar la hoja deja el estado cancelado con su mensaje", () => {
    const s = run(
      initialPaymentState(),
      { type: "START" },
      { type: "INTENT_CREATED", paymentIntentId: "pi_1" },
      { type: "SHEET_OPENED" },
      { type: "CANCELED", message: "Pago cancelado. No se te cobró." },
    );
    expect(s).toMatchObject({ phase: "canceled", message: "Pago cancelado. No se te cobró." });
  });

  it("un fallo del checkout deja el estado fallido", () => {
    const s = run(initialPaymentState(), { type: "START" }, { type: "FAILED", message: "Tu carrito está vacío." });
    expect(s).toMatchObject({ phase: "failed", message: "Tu carrito está vacío." });
  });

  it("después de fallar o cancelar se puede empezar de nuevo (nuevo intento)", () => {
    const failed = run(initialPaymentState(), { type: "START" }, { type: "FAILED", message: "x" });
    const again = run(failed, { type: "START" });
    expect(again).toMatchObject({ phase: "creating", message: null, paymentIntentId: null, orderId: null });
  });
});

describe("protecciones", () => {
  it("START se ignora mientras hay un pago en curso (doble toque)", () => {
    const creating = run(initialPaymentState(), { type: "START" });
    expect(run(creating, { type: "START" })).toBe(creating);
  });
  it("START se ignora si el pago está pendiente o pagado: nunca se crea otro PaymentIntent", () => {
    const pending = initialPaymentState("pi_1");
    expect(run(pending, { type: "START" })).toBe(pending);
    const paid = run(pending, { type: "VERIFY" }, { type: "ORDER_FOUND", orderId: 1 });
    expect(run(paid, { type: "START" })).toBe(paid);
  });
  it("RESET vuelve al reposo desde fallido, cancelado o pagado", () => {
    const failed = run(initialPaymentState(), { type: "START" }, { type: "FAILED", message: "x" });
    expect(run(failed, { type: "RESET" }).phase).toBe("idle");
  });
  it("RESET no interrumpe un pago en curso ni uno pendiente", () => {
    const creating = run(initialPaymentState(), { type: "START" });
    expect(run(creating, { type: "RESET" })).toBe(creating);
    const pending = initialPaymentState("pi_1");
    expect(run(pending, { type: "RESET" })).toBe(pending);
  });
});

describe("isBusy / isCartLocked", () => {
  it("ocupado en creating, preparing, sheet y verifying", () => {
    const base = initialPaymentState();
    for (const phase of ["creating", "preparing", "sheet", "verifying"] as const) {
      expect(isBusy({ ...base, phase })).toBe(true);
    }
    for (const phase of ["idle", "pending", "paid", "failed", "canceled"] as const) {
      expect(isBusy({ ...base, phase })).toBe(false);
    }
  });
  it("el carrito se bloquea mientras se paga y mientras se confirma el pedido", () => {
    const base = initialPaymentState();
    for (const phase of ["creating", "preparing", "sheet", "verifying", "pending"] as const) {
      expect(isCartLocked({ ...base, phase })).toBe(true);
    }
    for (const phase of ["idle", "paid", "failed", "canceled"] as const) {
      expect(isCartLocked({ ...base, phase })).toBe(false);
    }
  });
});
