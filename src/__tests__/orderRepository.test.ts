import { orderRepository } from "@/features/orders/repositories/orderRepository";

import {
  makeApiError,
  makeOrderAddress,
  makeOrderDetail,
  makeOrderItem,
  makeOrderSummary,
} from "./fixtures";
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

describe("orderRepository.getById", () => {
  it("envía GET /orders/:id y devuelve el pedido", async () => {
    const pedido = makeOrderDetail({ id_pedido: 42 });
    responde({ data: pedido });

    const resultado = await orderRepository.getById(42);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/orders/42" });
    expect(resultado).toEqual(pedido);
  });

  it("devuelve null si la API responde 404 (no existe o no es del usuario)", async () => {
    adapter.mockRejectedValueOnce(makeApiError({ status: 404, message: "Pedido no encontrado." }));

    await expect(orderRepository.getById(99)).resolves.toBeNull();
  });

  it("rechaza si la respuesta no trae el pedido", async () => {
    responde({});
    await expect(orderRepository.getById(1)).rejects.toThrow();

    responde({ data: { estado: "confirmado" } });
    await expect(orderRepository.getById(1)).rejects.toThrow();
  });

  it("completa los campos opcionales ausentes (items, dirección, pago, fecha)", async () => {
    responde({ data: { id_pedido: 5, estado: "confirmado", total: "10.00" } });

    expect(await orderRepository.getById(5)).toEqual({
      id_pedido: 5,
      id_usuario: 0,
      estado: "confirmado",
      total: "10.00",
      fecha_pedido: null,
      direccion: null,
      items: [],
      pago: null,
    });
  });

  it("si faltan el estado y el total usa texto vacío y cero", async () => {
    responde({ data: { id_pedido: 6 } });

    const resultado = await orderRepository.getById(6);

    expect(resultado?.estado).toBe("");
    expect(resultado?.total).toBe("0");
  });

  it("conserva dirección, ítems y pago cuando vienen", async () => {
    const pedido = makeOrderDetail({
      direccion: makeOrderAddress({ referencias: "Junto al parque" }),
      items: [makeOrderItem({ id_pedido_detalle: 1 }), makeOrderItem({ id_pedido_detalle: 2, cantidad: 1 })],
    });
    responde({ data: pedido });

    const resultado = await orderRepository.getById(8);

    expect(resultado?.items).toHaveLength(2);
    expect(resultado?.direccion?.referencias).toBe("Junto al parque");
    expect(resultado?.pago?.metodo_pago).toBe("stripe");
  });

  it("rechaza con un error de servidor o de red para que la pantalla ofrezca reintentar", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión." });
    adapter.mockRejectedValueOnce(error);

    await expect(orderRepository.getById(1)).rejects.toBe(error);
  });
});

describe("orderRepository.getPage", () => {
  it("envía GET /orders con page y limit y devuelve la página con su meta", async () => {
    const data = [makeOrderSummary({ id_pedido: 9 }), makeOrderSummary({ id_pedido: 8 })];
    responde({ data, meta: { total: 25, page: 2, limit: 10, totalPages: 3 } });

    const resultado = await orderRepository.getPage(2, 10);

    const { metodo, ruta, params } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/orders" });
    expect(params).toEqual({ page: 2, limit: 10 });
    expect(resultado).toEqual({ data, total: 25, page: 2, limit: 10, totalPages: 3 });
  });

  it("usa la primera página y 10 por página por defecto", async () => {
    responde({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });

    await orderRepository.getPage();

    expect(ultimaPeticion().params).toEqual({ page: 1, limit: 10 });
  });

  it("devuelve una página vacía cuando no hay pedidos", async () => {
    responde({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });

    expect(await orderRepository.getPage()).toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  });

  it("si la respuesta viene incompleta devuelve lista vacía y meta en cero", async () => {
    responde({});

    expect(await orderRepository.getPage(3, 5)).toEqual({ data: [], total: 0, page: 3, limit: 5, totalPages: 0 });
  });

  it("descarta elementos sin id de pedido", async () => {
    responde({
      data: [makeOrderSummary({ id_pedido: 4 }), { estado: "confirmado" }, null],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    const resultado = await orderRepository.getPage();

    expect(resultado.data.map((o) => o.id_pedido)).toEqual([4]);
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 401, message: "No autenticado" });
    adapter.mockRejectedValueOnce(error);

    await expect(orderRepository.getPage()).rejects.toBe(error);
  });
});
