import {
  MAX_ITEM_QUANTITY,
  applyQuantityChange,
  applyRemove,
  canCheckout,
  cartTotalCents,
  cartUnits,
  centsToPriceString,
  classifyAddError,
  getItemStatus,
  getItemStock,
  lineSubtotalCents,
  maxQuantity,
  toCartLineData,
  toCents,
} from "@/features/cart/cartSelectors";

import { makeApiError, makeCartItemFor, makeCartResult, makeNetworkError } from "./fixtures";

describe("toCents", () => {
  it("convierte números y textos a centavos enteros", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents("7200.00")).toBe(720000);
    expect(toCents("0.1")).toBe(10);
    expect(toCents(0)).toBe(0);
    expect(toCents(" 15.5 ")).toBe(1550);
  });
  it("evita los errores de coma flotante", () => {
    expect(toCents(1.15)).toBe(115);
    expect(toCents(0.07)).toBe(7);
    expect(toCents("1234567.89")).toBe(123456789);
  });
  it.each([null, undefined, "", "  ", "abc", "12abc", NaN, Infinity, {}, [], -5])(
    "devuelve null para %p",
    (valor) => {
      expect(toCents(valor)).toBeNull();
    },
  );
});

describe("centsToPriceString", () => {
  it("da el texto con dos decimales", () => {
    expect(centsToPriceString(0)).toBe("0.00");
    expect(centsToPriceString(5)).toBe("0.05");
    expect(centsToPriceString(720000)).toBe("7200.00");
    expect(centsToPriceString(1999)).toBe("19.99");
  });
});

describe("lineSubtotalCents / cartTotalCents", () => {
  it("multiplica el precio del servidor por la cantidad en centavos", () => {
    const item = makeCartItemFor(1, { cantidad: 3, precio_unitario: "19.99" });
    expect(lineSubtotalCents(item)).toBe(5997);
  });
  it("devuelve null si el precio no es válido", () => {
    expect(lineSubtotalCents(makeCartItemFor(1, { precio_unitario: "n/d" }))).toBeNull();
  });
  it("suma las líneas e ignora las de precio inválido", () => {
    const items = [
      makeCartItemFor(1, { cantidad: 2, precio_unitario: "100.00" }),
      makeCartItemFor(2, { cantidad: 1, precio_unitario: 50.5 }),
      makeCartItemFor(3, { cantidad: 4, precio_unitario: "x" }),
    ];
    expect(cartTotalCents(items)).toBe(25050);
  });
  it("es 0 con lista vacía", () => {
    expect(cartTotalCents([])).toBe(0);
  });
});

describe("getItemStock / maxQuantity", () => {
  it("suma el stock de las variantes activas", () => {
    const item = makeCartItemFor(1, { producto: { variantes_producto: [{ stock: 3 }, { stock: 4 }] } });
    expect(getItemStock(item)).toBe(7);
  });
  it("trata un stock negativo o inválido como 0", () => {
    const item = makeCartItemFor(1, { producto: { variantes_producto: [{ stock: -2 }, { stock: 5 }] } });
    expect(getItemStock(item)).toBe(5);
  });
  it("es null sin variantes activas: el backend no valida stock en ese caso", () => {
    const item = makeCartItemFor(1, { producto: { variantes_producto: [] } });
    expect(getItemStock(item)).toBeNull();
    expect(maxQuantity(item)).toBe(MAX_ITEM_QUANTITY);
  });
  it("la cantidad máxima es el menor entre 99 y el stock", () => {
    expect(maxQuantity(makeCartItemFor(1, { producto: { variantes_producto: [{ stock: 5 }] } }))).toBe(5);
    expect(maxQuantity(makeCartItemFor(1, { producto: { variantes_producto: [{ stock: 500 }] } }))).toBe(99);
    expect(maxQuantity(makeCartItemFor(1, { producto: { variantes_producto: [{ stock: 0 }] } }))).toBe(0);
  });
});

describe("getItemStatus", () => {
  it("ok con producto activo y stock suficiente", () => {
    expect(getItemStatus(makeCartItemFor(1, { cantidad: 2 }))).toBe("ok");
  });
  it("ok con la cantidad igual al stock", () => {
    const item = makeCartItemFor(1, { cantidad: 10 });
    expect(getItemStatus(item)).toBe("ok");
  });
  it("agotado sin stock", () => {
    const item = makeCartItemFor(1, { producto: { variantes_producto: [{ stock: 0 }] } });
    expect(getItemStatus(item)).toBe("agotado");
  });
  it("excede cuando la cantidad supera el stock", () => {
    const item = makeCartItemFor(1, { cantidad: 4, producto: { variantes_producto: [{ stock: 3 }] } });
    expect(getItemStatus(item)).toBe("excede");
  });
  it("no disponible si el producto ya no está activo, aunque haya stock", () => {
    const item = makeCartItemFor(1, { producto: { estado: "inactivo" } });
    expect(getItemStatus(item)).toBe("no_disponible");
  });
  it("no disponible tiene prioridad sobre agotado", () => {
    const item = makeCartItemFor(1, { producto: { estado: "inactivo", variantes_producto: [{ stock: 0 }] } });
    expect(getItemStatus(item)).toBe("no_disponible");
  });
});

describe("toCartLineData", () => {
  it("arma los datos de la línea con precio y subtotal del servidor", () => {
    const item = makeCartItemFor(7, { cantidad: 2, precio_unitario: "250.00" });
    expect(toCartLineData(item)).toEqual({
      id: 7,
      nombre: "Laptop de prueba",
      marca: "HP",
      imagenUrl: "https://example.com/producto-1.jpg",
      cantidad: 2,
      precioUnitario: 250,
      subtotal: 500,
      stock: 10,
      maxQuantity: 10,
      status: "ok",
      canIncrease: true,
      canDecrease: true,
      blocking: false,
    });
  });
  it("no deja subir al llegar al máximo", () => {
    const item = makeCartItemFor(1, { cantidad: 3, producto: { variantes_producto: [{ stock: 3 }] } });
    const line = toCartLineData(item);
    expect(line.canIncrease).toBe(false);
    expect(line.canDecrease).toBe(true);
  });
  it("no deja subir de 99 aunque haya más stock", () => {
    const item = makeCartItemFor(1, { cantidad: 99, producto: { variantes_producto: [{ stock: 500 }] } });
    expect(toCartLineData(item).canIncrease).toBe(false);
  });
  it("no deja bajar de 1 (para quitar se usa Quitar)", () => {
    expect(toCartLineData(makeCartItemFor(1, { cantidad: 1 })).canDecrease).toBe(false);
  });
  it("una línea agotada o no disponible es bloqueante y no deja subir", () => {
    const agotada = toCartLineData(
      makeCartItemFor(1, { producto: { variantes_producto: [{ stock: 0 }] } }),
    );
    expect(agotada).toMatchObject({ status: "agotado", blocking: true, canIncrease: false });
    const inactiva = toCartLineData(makeCartItemFor(2, { producto: { estado: "inactivo" } }));
    expect(inactiva).toMatchObject({ status: "no_disponible", blocking: true, canIncrease: false });
  });
  it("una línea que excede el stock es bloqueante pero deja bajar", () => {
    const line = toCartLineData(
      makeCartItemFor(1, { cantidad: 5, producto: { variantes_producto: [{ stock: 2 }] } }),
    );
    expect(line).toMatchObject({ status: "excede", blocking: true, canIncrease: false, canDecrease: true });
  });
  it("tolera marca e imagen ausentes y precio inválido", () => {
    const item = makeCartItemFor(1, {
      precio_unitario: "n/d",
      producto: { marcas: null, producto_imagenes: [] },
    });
    expect(toCartLineData(item)).toMatchObject({
      marca: null,
      imagenUrl: undefined,
      precioUnitario: null,
      subtotal: null,
    });
  });
});

describe("cartUnits", () => {
  it("suma las unidades de todas las líneas", () => {
    expect(cartUnits([makeCartItemFor(1, { cantidad: 2 }), makeCartItemFor(2, { cantidad: 3 })])).toBe(5);
    expect(cartUnits([])).toBe(0);
  });
});

describe("canCheckout", () => {
  it("permite pagar con líneas disponibles", () => {
    expect(canCheckout(makeCartResult({ items: [makeCartItemFor(1), makeCartItemFor(2)] }))).toBe(true);
  });
  it("no permite pagar con el carrito vacío", () => {
    expect(canCheckout(makeCartResult({ items: [], total: 0, totalPrice: "0.00" }))).toBe(false);
  });
  it("no permite pagar si hay una línea bloqueante", () => {
    const items = [
      makeCartItemFor(1),
      makeCartItemFor(2, { producto: { variantes_producto: [{ stock: 0 }] } }),
    ];
    expect(canCheckout(makeCartResult({ items }))).toBe(false);
  });
  it("no permite pagar si una línea excede el stock", () => {
    const items = [makeCartItemFor(1, { cantidad: 9, producto: { variantes_producto: [{ stock: 2 }] } })];
    expect(canCheckout(makeCartResult({ items }))).toBe(false);
  });
  it("sin datos no permite pagar", () => {
    expect(canCheckout(undefined)).toBe(false);
  });
});

describe("applyQuantityChange", () => {
  const base = () =>
    makeCartResult({
      items: [
        makeCartItemFor(1, { cantidad: 2, precio_unitario: "100.00" }),
        makeCartItemFor(2, { cantidad: 1, precio_unitario: "50.50" }),
      ],
      total: 2,
      totalPrice: "250.50",
    });

  it("sube la cantidad y ajusta el total con Δcantidad × precio_unitario", () => {
    const result = applyQuantityChange(base(), 1, 5);
    expect(result.items[0].cantidad).toBe(5);
    expect(result.totalPrice).toBe("550.50");
    expect(result.total).toBe(2);
  });
  it("baja la cantidad y resta del total", () => {
    const result = applyQuantityChange(base(), 1, 1);
    expect(result.items[0].cantidad).toBe(1);
    expect(result.totalPrice).toBe("150.50");
  });
  it("con cantidad 0 elimina la línea y su importe", () => {
    const result = applyQuantityChange(base(), 2, 0);
    expect(result.items.map((i) => i.productos.id_producto)).toEqual([1]);
    expect(result.total).toBe(1);
    expect(result.totalPrice).toBe("200.00");
  });
  it("no pasa de 99 ni baja de 0", () => {
    expect(applyQuantityChange(base(), 1, 150).items[0].cantidad).toBe(99);
    expect(applyQuantityChange(base(), 1, -3).items).toHaveLength(1);
  });
  it("usa el total del servidor como base, no la suma local", () => {
    const actual = base();
    actual.totalPrice = "999.00"; // incluye líneas de otra página
    expect(applyQuantityChange(actual, 1, 3).totalPrice).toBe("1099.00");
  });
  it("con un precio inválido cambia la cantidad pero deja el total como estaba", () => {
    const actual = makeCartResult({
      items: [makeCartItemFor(1, { cantidad: 1, precio_unitario: "n/d" })],
      totalPrice: "80.00",
    });
    const result = applyQuantityChange(actual, 1, 4);
    expect(result.items[0].cantidad).toBe(4);
    expect(result.totalPrice).toBe("80.00");
  });
  it("el total nunca queda negativo", () => {
    const actual = makeCartResult({
      items: [makeCartItemFor(1, { cantidad: 2, precio_unitario: "100.00" })],
      totalPrice: "50.00",
    });
    expect(applyQuantityChange(actual, 1, 0).totalPrice).toBe("0.00");
  });
  it("si el producto no está en el carrito no cambia nada", () => {
    const actual = base();
    expect(applyQuantityChange(actual, 99, 3)).toBe(actual);
  });
  it("sin datos previos devuelve un carrito vacío", () => {
    expect(applyQuantityChange(undefined, 1, 2)).toEqual({
      items: [],
      total: 0,
      totalPrice: "0.00",
      truncated: false,
    });
  });
  it("no modifica el resultado recibido", () => {
    const actual = base();
    applyQuantityChange(actual, 1, 9);
    expect(actual.items[0].cantidad).toBe(2);
    expect(actual.totalPrice).toBe("250.50");
  });
});

describe("applyRemove", () => {
  it("quita la línea y su importe del total", () => {
    const actual = makeCartResult({
      items: [
        makeCartItemFor(1, { cantidad: 3, precio_unitario: "10.00" }),
        makeCartItemFor(2, { cantidad: 1, precio_unitario: "5.00" }),
      ],
      total: 2,
      totalPrice: "35.00",
    });
    const result = applyRemove(actual, 1);
    expect(result.items.map((i) => i.productos.id_producto)).toEqual([2]);
    expect(result.totalPrice).toBe("5.00");
    expect(result.total).toBe(1);
  });
});

describe("classifyAddError", () => {
  it("409: ya hay 99 unidades", () => {
    expect(classifyAddError(makeApiError({ status: 409, message: "No puedes agregar más de 99" }))).toBe("max");
  });
  it("404: el producto ya no está disponible", () => {
    expect(classifyAddError(makeApiError({ status: 404 }))).toBe("unavailable");
  });
  it("otros errores y de red", () => {
    expect(classifyAddError(makeApiError({ status: 500 }))).toBe("other");
    expect(classifyAddError(makeNetworkError())).toBe("other");
    expect(classifyAddError(undefined)).toBe("other");
  });
});
