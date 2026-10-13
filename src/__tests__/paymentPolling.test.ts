import { pollOrderStatus } from "@/features/payments/paymentPolling";

const pedido = { id_pedido: 5, estado: "confirmado" };

/** `sleep` falso: registra las esperas sin esperar de verdad. */
const crearSleep = () => jest.fn<Promise<void>, [number]>(async () => undefined);

describe("pollOrderStatus", () => {
  it("devuelve el pedido en el primer intento sin esperar", async () => {
    const fetchStatus = jest.fn().mockResolvedValue(pedido);
    const sleep = crearSleep();

    const result = await pollOrderStatus({ fetchStatus, maxAttempts: 20, intervalMs: 2000, sleep });

    expect(result).toEqual({ status: "found", order: pedido, attempts: 1 });
    expect(sleep).not.toHaveBeenCalled();
  });

  it("espera el intervalo entre intentos hasta encontrar el pedido", async () => {
    const fetchStatus = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pedido);
    const sleep = crearSleep();

    const result = await pollOrderStatus({ fetchStatus, maxAttempts: 20, intervalMs: 2000, sleep });

    expect(result).toEqual({ status: "found", order: pedido, attempts: 3 });
    expect(fetchStatus).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[2000], [2000]]);
  });

  it("al agotar los intentos devuelve exhausted y no espera tras el último", async () => {
    const fetchStatus = jest.fn().mockResolvedValue(null);
    const sleep = crearSleep();

    const result = await pollOrderStatus({ fetchStatus, maxAttempts: 20, intervalMs: 2000, sleep });

    expect(result).toEqual({ status: "exhausted", attempts: 20 });
    expect(fetchStatus).toHaveBeenCalledTimes(20);
    expect(sleep).toHaveBeenCalledTimes(19);
  });

  it("un error de red no corta el polling ni da el pago por fallido", async () => {
    const fetchStatus = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValueOnce(pedido);

    const result = await pollOrderStatus({ fetchStatus, maxAttempts: 20, intervalMs: 2000, sleep: crearSleep() });

    expect(result).toEqual({ status: "found", order: pedido, attempts: 3 });
  });

  it("si todos los intentos fallan por red termina como exhausted, nunca como fallo", async () => {
    const fetchStatus = jest.fn().mockRejectedValue(new Error("Network Error"));

    const result = await pollOrderStatus({ fetchStatus, maxAttempts: 4, intervalMs: 10, sleep: crearSleep() });

    expect(result).toEqual({ status: "exhausted", attempts: 4 });
  });

  it("respeta un número de intentos menor", async () => {
    const fetchStatus = jest.fn().mockResolvedValue(null);

    const result = await pollOrderStatus({ fetchStatus, maxAttempts: 3, intervalMs: 10, sleep: crearSleep() });

    expect(result).toEqual({ status: "exhausted", attempts: 3 });
    expect(fetchStatus).toHaveBeenCalledTimes(3);
  });

  it("se detiene si se cancela (por ejemplo al salir de la pantalla)", async () => {
    let cancelado = false;
    const fetchStatus = jest.fn().mockImplementation(async () => {
      cancelado = true;
      return null;
    });

    const result = await pollOrderStatus({
      fetchStatus,
      maxAttempts: 20,
      intervalMs: 2000,
      sleep: crearSleep(),
      isCancelled: () => cancelado,
    });

    expect(result.status).toBe("cancelled");
    expect(fetchStatus).toHaveBeenCalledTimes(1);
  });
});
