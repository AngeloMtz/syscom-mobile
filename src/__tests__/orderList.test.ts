import { flattenOrders, getNextOrdersPage } from "@/features/orders/orderList";

import { makeOrderSummary, makeOrdersPage } from "./fixtures";

describe("flattenOrders", () => {
  it("junta las páginas en una lista y conserva el orden", () => {
    const pages = [
      makeOrdersPage({ data: [makeOrderSummary({ id_pedido: 9 }), makeOrderSummary({ id_pedido: 8 })] }),
      makeOrdersPage({ page: 2, data: [makeOrderSummary({ id_pedido: 7 })] }),
    ];
    expect(flattenOrders(pages).map((o) => o.id_pedido)).toEqual([9, 8, 7]);
  });

  it("descarta pedidos repetidos entre páginas (un pedido nuevo corre la paginación)", () => {
    const pages = [
      makeOrdersPage({ data: [makeOrderSummary({ id_pedido: 9 }), makeOrderSummary({ id_pedido: 8 })] }),
      makeOrdersPage({
        page: 2,
        data: [makeOrderSummary({ id_pedido: 8, estado: "entregado" }), makeOrderSummary({ id_pedido: 7 })],
      }),
    ];
    const lista = flattenOrders(pages);
    expect(lista.map((o) => o.id_pedido)).toEqual([9, 8, 7]);
    expect(lista[1].estado).toBe("confirmado");
  });

  it("lista vacía sin páginas o con páginas vacías", () => {
    expect(flattenOrders([])).toEqual([]);
    expect(flattenOrders([makeOrdersPage({ data: [], total: 0, totalPages: 0 })])).toEqual([]);
  });

  it("no modifica las páginas recibidas", () => {
    const pages = [makeOrdersPage({ data: [makeOrderSummary({ id_pedido: 1 })] })];
    flattenOrders(pages);
    expect(pages[0].data).toHaveLength(1);
  });
});

describe("getNextOrdersPage", () => {
  it("pide la página siguiente mientras haya más", () => {
    expect(getNextOrdersPage(makeOrdersPage({ page: 1, totalPages: 3 }))).toBe(2);
    expect(getNextOrdersPage(makeOrdersPage({ page: 2, totalPages: 3 }))).toBe(3);
  });

  it("en la última página no hay siguiente", () => {
    expect(getNextOrdersPage(makeOrdersPage({ page: 3, totalPages: 3 }))).toBeUndefined();
  });

  it("sin páginas (lista vacía) no hay siguiente", () => {
    expect(getNextOrdersPage(makeOrdersPage({ page: 1, totalPages: 0 }))).toBeUndefined();
  });
});
