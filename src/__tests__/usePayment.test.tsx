import { useQueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { useStripe } from "@stripe/stripe-react-native";

import { CART_KEY } from "@/features/cart/hooks/useCart";
import { usePayment } from "@/features/payments/hooks/usePayment";
import { usePaymentStore } from "@/features/payments/paymentStore";
import { paymentRepository } from "@/features/payments/repositories/paymentRepository";

import { makeApiError, makeNetworkError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-linking", () => ({
  createURL: (path: string) => `syscommobile://${path}`,
}));
jest.mock("@stripe/stripe-react-native", () => ({
  useStripe: jest.fn(),
  StripeProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock("@/features/payments/repositories/paymentRepository", () => ({
  paymentRepository: { createCheckout: jest.fn(), getOrderStatus: jest.fn() },
}));

const repo = paymentRepository as jest.Mocked<typeof paymentRepository>;
const initPaymentSheet = jest.fn();
const presentPaymentSheet = jest.fn();
const { wrapper } = usarQueryWrapper();

const INTENT = { clientSecret: "pi_1_secret_abc", paymentIntentId: "pi_1" };
const PEDIDO = { id_pedido: 9, estado: "confirmado" };

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  (useStripe as jest.Mock).mockReturnValue({ initPaymentSheet, presentPaymentSheet });
  initPaymentSheet.mockResolvedValue({});
  presentPaymentSheet.mockResolvedValue({});
  repo.createCheckout.mockResolvedValue(INTENT);
  usePaymentStore.setState({ locked: false, pendingPaymentIntentId: null });
});

afterEach(() => {
  jest.useRealTimers();
});

const montar = () =>
  renderHook(() => ({ payment: usePayment(), queryClient: useQueryClient() }), { wrapper });

/** Avanza el reloj falso dentro de act para que el polling siga. */
const avanzar = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

/** Lanza pay() y deja correr el reloj hasta que termine. */
async function pagar(result: { current: ReturnType<typeof usePayment> extends infer P ? { payment: P } : never }, id = 5, ms = 60000) {
  let promesa!: Promise<void>;
  await act(async () => {
    promesa = result.current.payment.pay(id);
  });
  await avanzar(ms);
  await act(async () => {
    await promesa;
  });
}

describe("usePayment: pago correcto", () => {
  it("crea el pago, abre la hoja, espera el pedido y queda pagado", async () => {
    repo.getOrderStatus
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(PEDIDO);
    const { result } = await montar();
    result.current.queryClient.setQueryData(CART_KEY, { items: [], total: 0, totalPrice: "0.00", truncated: false });

    await pagar(result);

    expect(repo.createCheckout).toHaveBeenCalledTimes(1);
    expect(repo.createCheckout.mock.calls[0][0]).toBe(5);
    expect(initPaymentSheet).toHaveBeenCalledWith({
      merchantDisplayName: "SYSCOM",
      paymentIntentClientSecret: "pi_1_secret_abc",
      returnURL: "syscommobile://stripe-redirect",
      allowsDelayedPaymentMethods: false,
    });
    expect(presentPaymentSheet).toHaveBeenCalledTimes(1);
    expect(repo.getOrderStatus).toHaveBeenCalledTimes(3);
    expect(repo.getOrderStatus.mock.calls[0][0]).toBe("pi_1");
    expect(result.current.payment.state).toMatchObject({ phase: "paid", orderId: 9, paymentIntentId: "pi_1" });
    // El webhook vació el carrito del servidor: la caché local ya no es válida.
    expect(result.current.queryClient.getQueryState(CART_KEY)?.isInvalidated).toBe(true);
  });

  it("el carrito se bloquea mientras se paga y se libera al terminar", async () => {
    let terminarHoja!: (v: unknown) => void;
    presentPaymentSheet.mockReturnValueOnce(new Promise((r) => (terminarHoja = r)));
    repo.getOrderStatus.mockResolvedValue(PEDIDO);
    const { result } = await montar();

    let promesa!: Promise<void>;
    await act(async () => {
      promesa = result.current.payment.pay(5);
    });
    expect(result.current.payment.state.phase).toBe("sheet");
    expect(usePaymentStore.getState().locked).toBe(true);

    await act(async () => {
      terminarHoja({});
    });
    await avanzar(5000);
    await act(async () => {
      await promesa;
    });

    expect(result.current.payment.state.phase).toBe("paid");
    expect(usePaymentStore.getState().locked).toBe(false);
  });
});

describe("usePayment: la hoja termina sin pagar", () => {
  it("cancelar: mensaje de no cobro y sin consultar el pedido", async () => {
    presentPaymentSheet.mockResolvedValueOnce({ error: { code: "Canceled", message: "canceled" } });
    const { result } = await montar();

    await pagar(result);

    expect(result.current.payment.state).toMatchObject({
      phase: "canceled",
      message: "Pago cancelado. No se te cobró.",
    });
    expect(repo.getOrderStatus).not.toHaveBeenCalled();
    expect(usePaymentStore.getState().locked).toBe(false);
  });

  it("fondos insuficientes: fallo definitivo, sin consultar el pedido", async () => {
    presentPaymentSheet.mockResolvedValueOnce({
      error: { code: "Failed", message: "x", declineCode: "insufficient_funds" },
    });
    const { result } = await montar();

    await pagar(result);

    expect(result.current.payment.state).toMatchObject({
      phase: "failed",
      message: "Tu tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.",
    });
    expect(repo.getOrderStatus).not.toHaveBeenCalled();
  });

  it("tarjeta rechazada: fallo definitivo", async () => {
    presentPaymentSheet.mockResolvedValueOnce({
      error: { code: "Failed", message: "x", declineCode: "generic_decline" },
    });
    const { result } = await montar();

    await pagar(result);

    expect(result.current.payment.state).toMatchObject({
      phase: "failed",
      message: "Tu tarjeta fue rechazada. Prueba con otra tarjeta.",
    });
  });

  it("después de fallar se puede reintentar y crea un PaymentIntent nuevo", async () => {
    presentPaymentSheet
      .mockResolvedValueOnce({ error: { code: "Failed", message: "x", declineCode: "generic_decline" } })
      .mockResolvedValueOnce({});
    repo.createCheckout
      .mockResolvedValueOnce(INTENT)
      .mockResolvedValueOnce({ clientSecret: "pi_2_secret_def", paymentIntentId: "pi_2" });
    repo.getOrderStatus.mockResolvedValue(PEDIDO);
    const { result } = await montar();

    await pagar(result);
    expect(result.current.payment.state.phase).toBe("failed");
    await pagar(result);

    expect(repo.createCheckout).toHaveBeenCalledTimes(2);
    expect(repo.getOrderStatus.mock.calls[0][0]).toBe("pi_2");
    expect(result.current.payment.state).toMatchObject({ phase: "paid", paymentIntentId: "pi_2" });
  });
});

describe("usePayment: errores ambiguos se verifican antes de decir que falló", () => {
  it("tiempo agotado en la hoja pero el pedido existe: queda pagado", async () => {
    presentPaymentSheet.mockResolvedValueOnce({ error: { code: "Timeout", message: "timeout" } });
    repo.getOrderStatus.mockResolvedValueOnce(null).mockResolvedValueOnce(PEDIDO);
    const { result } = await montar();

    await pagar(result);

    expect(result.current.payment.state).toMatchObject({ phase: "paid", orderId: 9 });
  });

  it("si tras 3 consultas no hay pedido, falla con el aviso de confirmación", async () => {
    presentPaymentSheet.mockResolvedValueOnce({ error: { code: "Failed", message: "network" } });
    repo.getOrderStatus.mockResolvedValue(null);
    const { result } = await montar();

    await pagar(result);

    expect(repo.getOrderStatus).toHaveBeenCalledTimes(3);
    expect(result.current.payment.state.phase).toBe("failed");
    expect(result.current.payment.state.message).toMatch(/No pudimos confirmar el pago/);
  });

  it("una excepción al presentar la hoja se trata como ambigua", async () => {
    presentPaymentSheet.mockRejectedValueOnce(new Error("native crash"));
    repo.getOrderStatus.mockResolvedValue(PEDIDO);
    const { result } = await montar();

    await pagar(result);

    expect(result.current.payment.state.phase).toBe("paid");
  });

  it("PaymentIntent ya pagado al preparar la hoja: verifica el pedido sin abrirla", async () => {
    initPaymentSheet.mockResolvedValueOnce({
      error: { code: "Failed", message: "PaymentSheet cannot set up a PaymentIntent in status 'succeeded'." },
    });
    repo.getOrderStatus.mockResolvedValueOnce(null).mockResolvedValueOnce(PEDIDO);
    const { result } = await montar();

    await pagar(result);

    expect(presentPaymentSheet).not.toHaveBeenCalled();
    expect(result.current.payment.state).toMatchObject({ phase: "paid", orderId: 9 });
  });

  it("un fallo al preparar la hoja no pudo cobrar: falla sin consultar el pedido", async () => {
    initPaymentSheet.mockResolvedValueOnce({ error: { code: "Failed", message: "Network request failed" } });
    const { result } = await montar();

    await pagar(result);

    expect(presentPaymentSheet).not.toHaveBeenCalled();
    expect(repo.getOrderStatus).not.toHaveBeenCalled();
    expect(result.current.payment.state).toMatchObject({
      phase: "failed",
      message: "No pudimos preparar el pago. Intenta de nuevo.",
    });
  });
});

describe("usePayment: polling", () => {
  it("un error de red al consultar el pedido se reintenta y no da el pago por fallido", async () => {
    repo.getOrderStatus
      .mockRejectedValueOnce(makeNetworkError())
      .mockRejectedValueOnce(makeApiError({ status: 503, message: "x" }))
      .mockResolvedValueOnce(PEDIDO);
    const { result } = await montar();

    await pagar(result);

    expect(result.current.payment.state.phase).toBe("paid");
    expect(repo.getOrderStatus).toHaveBeenCalledTimes(3);
  });

  it("tras 20 intentos sin pedido queda pendiente y bloquea el carrito, sin crear otro pago", async () => {
    repo.getOrderStatus.mockResolvedValue(null);
    const { result } = await montar();

    await pagar(result);

    expect(repo.getOrderStatus).toHaveBeenCalledTimes(20);
    expect(result.current.payment.state).toMatchObject({
      phase: "pending",
      message: "Pago recibido, estamos confirmando tu pedido.",
    });
    expect(usePaymentStore.getState()).toMatchObject({ locked: true, pendingPaymentIntentId: "pi_1" });
    expect(repo.createCheckout).toHaveBeenCalledTimes(1);
  });

  it("'Verificar de nuevo' vuelve a consultar el mismo PaymentIntent y nunca crea otro", async () => {
    repo.getOrderStatus.mockResolvedValue(null);
    const { result } = await montar();
    await pagar(result);
    expect(result.current.payment.state.phase).toBe("pending");

    repo.getOrderStatus.mockReset();
    repo.getOrderStatus.mockResolvedValueOnce(null).mockResolvedValueOnce(PEDIDO);
    let promesa!: Promise<void>;
    await act(async () => {
      promesa = result.current.payment.recheck();
    });
    await avanzar(10000);
    await act(async () => {
      await promesa;
    });

    expect(repo.getOrderStatus.mock.calls.every((c) => c[0] === "pi_1")).toBe(true);
    expect(repo.createCheckout).toHaveBeenCalledTimes(1);
    expect(result.current.payment.state).toMatchObject({ phase: "paid", orderId: 9 });
    expect(usePaymentStore.getState()).toMatchObject({ locked: false, pendingPaymentIntentId: null });
  });

  it("al volver a la pantalla con un pago pendiente en memoria arranca en pendiente", async () => {
    usePaymentStore.setState({ locked: true, pendingPaymentIntentId: "pi_77" });
    repo.getOrderStatus.mockResolvedValue(PEDIDO);
    const { result } = await montar();

    expect(result.current.payment.state).toMatchObject({ phase: "pending", paymentIntentId: "pi_77" });

    let promesa!: Promise<void>;
    await act(async () => {
      promesa = result.current.payment.recheck();
    });
    await avanzar(1000);
    await act(async () => {
      await promesa;
    });

    expect(repo.getOrderStatus.mock.calls[0][0]).toBe("pi_77");
    expect(result.current.payment.state.phase).toBe("paid");
  });
});

describe("usePayment: errores al crear el pago", () => {
  it("stock insuficiente: mensaje claro y la hoja no se abre", async () => {
    repo.createCheckout.mockRejectedValueOnce(
      makeApiError({ status: 400, message: 'Stock insuficiente para "Laptop". Disponible: 1.' }),
    );
    const { result } = await montar();

    await pagar(result);

    expect(initPaymentSheet).not.toHaveBeenCalled();
    expect(result.current.payment.state).toMatchObject({
      phase: "failed",
      message: 'Solo quedan 1 de "Laptop". Ajusta tu carrito para continuar.',
    });
    expect(usePaymentStore.getState().locked).toBe(false);
  });

  it("sin red al crear el pago: mensaje de conexión", async () => {
    repo.createCheckout.mockRejectedValueOnce(makeNetworkError());
    const { result } = await montar();

    await pagar(result);

    expect(result.current.payment.state.phase).toBe("failed");
    expect(result.current.payment.state.message).toMatch(/Sin conexión/);
  });

  it("un doble toque no crea dos PaymentIntents", async () => {
    repo.getOrderStatus.mockResolvedValue(PEDIDO);
    const { result } = await montar();

    await act(async () => {
      void result.current.payment.pay(5);
      void result.current.payment.pay(5);
    });
    await avanzar(5000);

    expect(repo.createCheckout).toHaveBeenCalledTimes(1);
  });
});
