import {
  CART_PAGE_SIZE,
  MAX_CART_LINES,
  cartRepository,
} from "@/features/cart/repositories/cartRepository";

import { makeApiError, makeCartItemFor } from "./fixtures";
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

/** Responde una página del carrito con productos consecutivos desde `desde`. */
function pagina(
  desde: number,
  cantidad: number,
  meta: { hasMore: boolean; total: number; totalPrice?: string },
) {
  const data = Array.from({ length: cantidad }, (_, i) => makeCartItemFor(desde + i));
  responde({
    data,
    meta: {
      nextCursor: meta.hasMore ? data[data.length - 1].id_carrito_detalle : null,
      hasMore: meta.hasMore,
      total: meta.total,
      totalPrice: meta.totalPrice ?? "1000.00",
    },
  });
}

const paramsDeLlamada = (n: number) => (adapter.mock.calls[n][0] as { params: unknown }).params;

describe("constantes", () => {
  it("el tope son líneas completas de páginas de 50", () => {
    expect(CART_PAGE_SIZE).toBe(50);
    expect(MAX_CART_LINES).toBe(100);
    expect(MAX_CART_LINES % CART_PAGE_SIZE).toBe(0);
  });
});

describe("cartRepository.getPage", () => {
  it("envía GET /cart con limit y cursor y devuelve la página con su total", async () => {
    const data = [makeCartItemFor(1)];
    responde({ data, meta: { nextCursor: 101, hasMore: true, total: 7, totalPrice: "350.50" } });

    const resultado = await cartRepository.getPage(55, 10);

    const { metodo, ruta, params } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/cart" });
    expect(params).toEqual({ limit: 10, cursor: 55 });
    expect(resultado).toEqual({ data, nextCursor: 101, hasMore: true, total: 7, totalPrice: "350.50" });
  });

  it("usa el tamaño de página por defecto y sin cursor en la primera", async () => {
    responde({ data: [], meta: { nextCursor: null, hasMore: false, total: 0, totalPrice: "0.00" } });

    await cartRepository.getPage();

    expect(ultimaPeticion().params).toEqual({ limit: CART_PAGE_SIZE, cursor: undefined });
  });

  it("acepta un totalPrice numérico y lo deja como texto con dos decimales", async () => {
    responde({ data: [], meta: { nextCursor: null, hasMore: false, total: 0, totalPrice: 12.5 } });

    expect((await cartRepository.getPage()).totalPrice).toBe("12.50");
  });

  it("devuelve un carrito vacío si la respuesta viene incompleta", async () => {
    responde({});

    expect(await cartRepository.getPage()).toEqual({
      data: [],
      nextCursor: null,
      hasMore: false,
      total: 0,
      totalPrice: "0.00",
    });
  });
});

describe("cartRepository.getAll", () => {
  it("con una sola página hace una petición y conserva el total del servidor", async () => {
    pagina(1, 3, { hasMore: false, total: 3, totalPrice: "3000.00" });

    const resultado = await cartRepository.getAll();

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(resultado.items.map((i) => i.productos.id_producto)).toEqual([1, 2, 3]);
    expect(resultado).toMatchObject({ total: 3, totalPrice: "3000.00", truncated: false });
  });

  it("sigue el cursor entre páginas hasta que no hay más", async () => {
    pagina(1, 50, { hasMore: true, total: 70, totalPrice: "9999.00" });
    pagina(51, 20, { hasMore: false, total: 70, totalPrice: "9999.00" });

    const resultado = await cartRepository.getAll();

    expect(adapter).toHaveBeenCalledTimes(2);
    expect(paramsDeLlamada(0)).toEqual({ limit: 50, cursor: undefined });
    expect(paramsDeLlamada(1)).toEqual({ limit: 50, cursor: 150 });
    expect(resultado.items).toHaveLength(70);
    expect(resultado.truncated).toBe(false);
    expect(resultado.totalPrice).toBe("9999.00");
  });

  it("se detiene en el tope de 100 líneas y marca truncado", async () => {
    pagina(1, 50, { hasMore: true, total: 130 });
    pagina(51, 50, { hasMore: true, total: 130 });

    const resultado = await cartRepository.getAll();

    expect(adapter).toHaveBeenCalledTimes(2);
    expect(resultado.items).toHaveLength(MAX_CART_LINES);
    expect(resultado).toMatchObject({ total: 130, truncated: true });
  });

  it("pide solo lo que falta para no pasar del tope", async () => {
    pagina(1, 30, { hasMore: true, total: 100 });
    pagina(31, 20, { hasMore: true, total: 100 });

    const resultado = await cartRepository.getAll(50);

    expect(paramsDeLlamada(1)).toMatchObject({ limit: 20 });
    expect(resultado.items).toHaveLength(50);
    expect(resultado.truncated).toBe(true);
  });

  it("no marca truncado si el total cabe justo en el tope", async () => {
    pagina(1, 50, { hasMore: false, total: 50 });

    expect((await cartRepository.getAll(50)).truncated).toBe(false);
  });

  it("descarta productos repetidos entre páginas", async () => {
    pagina(1, 2, { hasMore: true, total: 3 });
    responde({
      data: [makeCartItemFor(2), makeCartItemFor(3)],
      meta: { nextCursor: null, hasMore: false, total: 3, totalPrice: "1000.00" },
    });

    const resultado = await cartRepository.getAll();

    expect(resultado.items.map((i) => i.productos.id_producto)).toEqual([1, 2, 3]);
  });

  it("no entra en un ciclo si el servidor marca hasMore con una página vacía", async () => {
    responde({ data: [], meta: { nextCursor: 5, hasMore: true, total: 9, totalPrice: "0.00" } });

    const resultado = await cartRepository.getAll();

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(resultado.items).toEqual([]);
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 401, message: "No autenticado" });
    adapter.mockRejectedValueOnce(error);

    await expect(cartRepository.getAll()).rejects.toBe(error);
  });
});

describe("cartRepository.add", () => {
  it("envía POST /cart/items/:id sin cuerpo (el backend no recibe variante)", async () => {
    responde({ data: { id_carrito_detalle: 9 } });

    await cartRepository.add(42);

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "post", ruta: "/cart/items/42" });
    expect(cuerpo).toBeUndefined();
  });

  it("rechaza con el 409 (ya hay 99 unidades) para que la pantalla lo explique", async () => {
    const error = makeApiError({
      status: 409,
      message: "No puedes agregar más de 99 unidades del mismo producto",
    });
    adapter.mockRejectedValueOnce(error);

    await expect(cartRepository.add(42)).rejects.toBe(error);
  });

  it("rechaza con el 404 (producto no disponible)", async () => {
    const error = makeApiError({ status: 404, message: "El producto no está disponible" });
    adapter.mockRejectedValueOnce(error);

    await expect(cartRepository.add(42)).rejects.toBe(error);
  });
});

describe("cartRepository.setQuantity", () => {
  it("envía PATCH /cart/items/:id con la cantidad", async () => {
    responde({ message: "Cantidad actualizada correctamente" });

    await cartRepository.setQuantity(42, 3);

    const { metodo, ruta, cuerpo } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "patch", ruta: "/cart/items/42" });
    expect(cuerpo).toEqual({ cantidad: 3 });
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 404, message: "El producto no está en el carrito" });
    adapter.mockRejectedValueOnce(error);

    await expect(cartRepository.setQuantity(42, 3)).rejects.toBe(error);
  });
});

describe("cartRepository.remove", () => {
  it("envía DELETE /cart/items/:id", async () => {
    responde({ message: "Producto eliminado del carrito" });

    await cartRepository.remove(42);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "delete", ruta: "/cart/items/42" });
  });

  it("trata el 404 (ya no estaba) como éxito", async () => {
    adapter.mockRejectedValueOnce(
      makeApiError({ status: 404, message: "El producto no está en el carrito" }),
    );

    await expect(cartRepository.remove(42)).resolves.toBeUndefined();
  });

  it("rechaza con un error de servidor", async () => {
    const error = makeApiError({ status: 500, message: "Error" });
    adapter.mockRejectedValueOnce(error);

    await expect(cartRepository.remove(42)).rejects.toBe(error);
  });
});
