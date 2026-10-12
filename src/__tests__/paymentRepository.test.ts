import { paymentRepository } from "@/features/payments/repositories/paymentRepository";

import { makeApiError } from "./fixtures";
import { crearAxiosFalso } from "./utils/axiosFake";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter, responde, ultimaPeticion } = crearAxiosFalso();

beforeEach(() => {
  adapter.mockReset();
});

describe("paymentRepository.createCheckout", () => {
  it("envía POST /payments/checkout con la dirección y devuelve el secreto y el id del PaymentIntent", async () => {
    responde({ data: { clientSecret: "pi_1_secret_abc", paymentIntentId: "pi_1" } });

    const resultado = await paymentRepository.createCheckout(5);

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "post", ruta: "/payments/checkout" });
    expect(cuerpo).toEqual({ id_direccion: 5 });
    expect(resultado).toEqual({ clientSecret: "pi_1_secret_abc", paymentIntentId: "pi_1" });
  });

  it("rechaza si la respuesta no trae el secreto o el id", async () => {
    responde({ data: { paymentIntentId: "pi_1" } });
    await expect(paymentRepository.createCheckout(5)).rejects.toThrow();

    responde({});
    await expect(paymentRepository.createCheckout(5)).rejects.toThrow();
  });

  it("rechaza con el 400 del backend (stock, carrito vacío, dirección)", async () => {
    const error = makeApiError({ status: 400, message: 'Stock insuficiente para "X". Disponible: 1.' });
    adapter.mockRejectedValueOnce(error);

    await expect(paymentRepository.createCheckout(5)).rejects.toBe(error);
  });
});

describe("paymentRepository.getOrderStatus", () => {
  it("envía GET /payments/order-status/:pi y devuelve el pedido", async () => {
    responde({ data: { id_pedido: 12, estado: "confirmado" } });

    const resultado = await paymentRepository.getOrderStatus("pi_123");

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/payments/order-status/pi_123" });
    expect(resultado).toEqual({ id_pedido: 12, estado: "confirmado" });
  });

  it("devuelve null mientras el webhook no haya creado el pedido (data: null)", async () => {
    responde({ data: null });

    expect(await paymentRepository.getOrderStatus("pi_123")).toBeNull();
  });

  it("devuelve null si la respuesta no trae un pedido válido", async () => {
    responde({});
    expect(await paymentRepository.getOrderStatus("pi_123")).toBeNull();

    responde({ data: { estado: "confirmado" } });
    expect(await paymentRepository.getOrderStatus("pi_123")).toBeNull();
  });

  it("codifica el id en la ruta", async () => {
    responde({ data: null });

    await paymentRepository.getOrderStatus("pi_1/../x");

    expect(ultimaPeticion().ruta).toBe("/payments/order-status/pi_1%2F..%2Fx");
  });

  it("rechaza con el error de la API para que el polling lo reintente", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión." });
    adapter.mockRejectedValueOnce(error);

    await expect(paymentRepository.getOrderStatus("pi_123")).rejects.toBe(error);
  });
});
