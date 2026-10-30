import { ON_SALE_MAX_PAGES, ON_SALE_PAGE_SIZE, selectOnSale } from "@/features/catalog/selectors";

import { makeProduct } from "./fixtures";

const enOferta = (id: number, pct: number) =>
  makeProduct({
    id,
    precio_base: 1000,
    precio_final: 1000 - 10 * pct,
    descuento: 10 * pct,
    porcentaje_descuento: pct,
    en_promocion: true,
  });

describe("selectOnSale", () => {
  it("se queda solo con los productos en promoción", () => {
    const resultado = selectOnSale([makeProduct({ id: 1 }), enOferta(2, 10), makeProduct({ id: 3 })]);

    expect(resultado.map((p) => p.id)).toEqual([2]);
  });

  it("descarta los marcados en promoción cuyo precio final no baja del base", () => {
    const sinRebaja = makeProduct({ id: 4, en_promocion: true, precio_base: 1000, precio_final: 1000 });

    expect(selectOnSale([sinRebaja, enOferta(5, 10)]).map((p) => p.id)).toEqual([5]);
  });

  it("ordena de mayor a menor descuento y conserva el orden entre iguales", () => {
    const resultado = selectOnSale([enOferta(1, 10), enOferta(2, 30), enOferta(3, 10), enOferta(4, 20)]);

    expect(resultado.map((p) => p.id)).toEqual([2, 4, 1, 3]);
  });

  it("no modifica el arreglo recibido", () => {
    const entrada = [enOferta(1, 10), enOferta(2, 30)];

    selectOnSale(entrada);

    expect(entrada.map((p) => p.id)).toEqual([1, 2]);
  });

  it("devuelve una lista vacía si no hay promociones o la entrada está vacía", () => {
    expect(selectOnSale([makeProduct()])).toEqual([]);
    expect(selectOnSale([])).toEqual([]);
  });
});

describe("límites del recorrido", () => {
  it("recorre hasta 10 páginas de 100 productos (1000 como máximo)", () => {
    expect(ON_SALE_PAGE_SIZE).toBe(100);
    expect(ON_SALE_MAX_PAGES).toBe(10);
  });
});
