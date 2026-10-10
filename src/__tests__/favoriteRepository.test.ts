import {
  FAVORITES_PAGE_SIZE,
  MAX_FAVORITES,
  favoriteRepository,
} from "@/features/favorites/repositories/favoriteRepository";

import { makeApiError, makeFavoriteItemFor } from "./fixtures";
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

/** Responde una página de favoritos con ids consecutivos desde `desde`. */
function pagina(desde: number, cantidad: number, over: { hasMore: boolean; total: number }) {
  const data = Array.from({ length: cantidad }, (_, i) => makeFavoriteItemFor(desde + i));
  responde({
    data,
    meta: { nextCursor: over.hasMore ? data[data.length - 1].id_favorito : null, ...over },
  });
}

function paramsDeLlamada(n: number) {
  return (adapter.mock.calls[n][0] as { params: unknown }).params;
}

describe("constantes", () => {
  it("el tope es múltiplo del tamaño de página", () => {
    expect(FAVORITES_PAGE_SIZE).toBe(50);
    expect(MAX_FAVORITES).toBe(200);
    expect(MAX_FAVORITES % FAVORITES_PAGE_SIZE).toBe(0);
  });
});

describe("favoriteRepository.getPage", () => {
  it("envía GET /favorites con limit y cursor y devuelve la página", async () => {
    const data = [makeFavoriteItemFor(1)];
    responde({ data, meta: { nextCursor: 101, hasMore: true, total: 9 } });

    const resultado = await favoriteRepository.getPage(55, 10);

    const { metodo, ruta, params } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "get", ruta: "/favorites" });
    expect(params).toEqual({ limit: 10, cursor: 55 });
    expect(resultado).toEqual({ data, nextCursor: 101, hasMore: true, total: 9 });
  });

  it("usa el tamaño de página por defecto y sin cursor en la primera", async () => {
    responde({ data: [], meta: { nextCursor: null, hasMore: false, total: 0 } });

    await favoriteRepository.getPage();

    expect(ultimaPeticion().params).toEqual({ limit: FAVORITES_PAGE_SIZE, cursor: undefined });
  });

  it("devuelve una página vacía si la respuesta viene incompleta", async () => {
    responde({});

    expect(await favoriteRepository.getPage()).toEqual({
      data: [],
      nextCursor: null,
      hasMore: false,
      total: 0,
    });
  });
});

describe("favoriteRepository.getAll", () => {
  it("con una sola página hace una petición y no marca tope", async () => {
    pagina(1, 3, { hasMore: false, total: 3 });

    const resultado = await favoriteRepository.getAll();

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(resultado.items.map((i) => i.productos.id_producto)).toEqual([1, 2, 3]);
    expect(resultado).toMatchObject({ total: 3, truncated: false });
  });

  it("sigue el cursor entre páginas hasta que no hay más", async () => {
    pagina(1, 50, { hasMore: true, total: 70 });
    pagina(51, 20, { hasMore: false, total: 70 });

    const resultado = await favoriteRepository.getAll();

    expect(adapter).toHaveBeenCalledTimes(2);
    expect(paramsDeLlamada(0)).toEqual({ limit: 50, cursor: undefined });
    expect(paramsDeLlamada(1)).toEqual({ limit: 50, cursor: 150 });
    expect(resultado.items).toHaveLength(70);
    expect(resultado.truncated).toBe(false);
  });

  it("se detiene en el tope y marca truncado aunque haya más", async () => {
    pagina(1, 50, { hasMore: true, total: 500 });
    pagina(51, 50, { hasMore: true, total: 500 });
    pagina(101, 50, { hasMore: true, total: 500 });
    pagina(151, 50, { hasMore: true, total: 500 });

    const resultado = await favoriteRepository.getAll();

    expect(adapter).toHaveBeenCalledTimes(4);
    expect(resultado.items).toHaveLength(MAX_FAVORITES);
    expect(resultado).toMatchObject({ total: 500, truncated: true });
  });

  it("pide solo lo que falta para no pasar del tope", async () => {
    pagina(1, 30, { hasMore: true, total: 100 });
    pagina(31, 20, { hasMore: true, total: 100 });

    const resultado = await favoriteRepository.getAll(50);

    expect(paramsDeLlamada(1)).toMatchObject({ limit: 20 });
    expect(resultado.items).toHaveLength(50);
    expect(resultado.truncated).toBe(true);
  });

  it("no marca truncado si el total cabe justo en el tope", async () => {
    pagina(1, 50, { hasMore: false, total: 50 });

    const resultado = await favoriteRepository.getAll(50);

    expect(resultado.truncated).toBe(false);
  });

  it("descarta productos repetidos entre páginas", async () => {
    pagina(1, 2, { hasMore: true, total: 3 });
    responde({
      data: [makeFavoriteItemFor(2), makeFavoriteItemFor(3)],
      meta: { nextCursor: null, hasMore: false, total: 3 },
    });

    const resultado = await favoriteRepository.getAll();

    expect(resultado.items.map((i) => i.productos.id_producto)).toEqual([1, 2, 3]);
  });

  it("no entra en un ciclo si el servidor marca hasMore con una página vacía", async () => {
    responde({ data: [], meta: { nextCursor: 5, hasMore: true, total: 9 } });

    const resultado = await favoriteRepository.getAll();

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(resultado.items).toEqual([]);
  });

  it("rechaza con el error de la API", async () => {
    const error = makeApiError({ status: 401, message: "No autenticado" });
    adapter.mockRejectedValueOnce(error);

    await expect(favoriteRepository.getAll()).rejects.toBe(error);
  });
});

describe("favoriteRepository.add", () => {
  it("envía POST /favorites/:id", async () => {
    responde({ data: { id_favorito: 1 } });

    await favoriteRepository.add(42);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "post", ruta: "/favorites/42" });
  });

  it("trata el 409 (ya era favorito) como éxito", async () => {
    adapter.mockRejectedValueOnce(
      makeApiError({ status: 409, message: "El producto ya está en tus favoritos" }),
    );

    await expect(favoriteRepository.add(42)).resolves.toBeUndefined();
  });

  it("rechaza con el 404 (producto no disponible)", async () => {
    const error = makeApiError({ status: 404, message: "El producto no está disponible" });
    adapter.mockRejectedValueOnce(error);

    await expect(favoriteRepository.add(42)).rejects.toBe(error);
  });

  it("rechaza con un error de servidor", async () => {
    const error = makeApiError({ status: 500, message: "Error" });
    adapter.mockRejectedValueOnce(error);

    await expect(favoriteRepository.add(42)).rejects.toBe(error);
  });
});

describe("favoriteRepository.remove", () => {
  it("envía DELETE /favorites/:id", async () => {
    responde({ message: "Producto eliminado de favoritos" });

    await favoriteRepository.remove(42);

    const { metodo, ruta } = ultimaPeticion();
    expect({ metodo, ruta }).toEqual({ metodo: "delete", ruta: "/favorites/42" });
  });

  it("trata el 404 (ya no era favorito) como éxito", async () => {
    adapter.mockRejectedValueOnce(
      makeApiError({ status: 404, message: "El producto no está en tus favoritos" }),
    );

    await expect(favoriteRepository.remove(42)).resolves.toBeUndefined();
  });

  it("rechaza con un error de servidor", async () => {
    const error = makeApiError({ status: 500, message: "Error" });
    adapter.mockRejectedValueOnce(error);

    await expect(favoriteRepository.remove(42)).rejects.toBe(error);
  });
});
