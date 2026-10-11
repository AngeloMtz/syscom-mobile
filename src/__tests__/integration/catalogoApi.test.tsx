// Integración del catálogo: filtros → hook → repository → Axios (falso) → caché.
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useRootCategories } from "@/features/catalog/hooks/useCategories";
import { useProduct } from "@/features/catalog/hooks/useProduct";
import { useInfiniteProducts } from "@/features/catalog/hooks/useProducts";
import { buildProductFilters, canSearch } from "@/features/catalog/searchFilters";

import {
  makeApiError,
  makeCategory,
  makePagination,
  makeProduct,
  makeProductDetail,
} from "../fixtures";
import { crearAxiosFalso } from "../utils/axiosFake";
import { ok, usarClientePorPrueba } from "../utils/integracion";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const { adapter } = crearAxiosFalso();
const { wrapper } = usarClientePorPrueba();

beforeEach(() => {
  adapter.mockReset();
});

const peticiones = () =>
  adapter.mock.calls.map(([c]) => ({ metodo: c.method, ruta: c.url, params: c.params }));

describe("integración: búsqueda de productos", () => {
  it("los filtros escritos llegan como parámetros HTTP y los resultados se aplanan con su total", async () => {
    adapter.mockImplementation(async (config) =>
      ok(config, {
        data: [makeProduct({ id: 1, nombre: "HP 1" }), makeProduct({ id: 2, nombre: "HP 2" })],
        pagination: makePagination({ total: 2, pages: 1 }),
      }),
    );
    const criterio = { texto: "  hp  ", minTxt: "100", maxTxt: "9000", categoria: 11 };
    const filters = buildProductFilters(criterio);

    const { result } = await renderHook(() => useInfiniteProducts(filters, canSearch(criterio)), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(peticiones()).toHaveLength(1);
    expect(peticiones()[0]).toMatchObject({
      metodo: "get",
      ruta: "/catalog/products",
      params: { page: 1, categoria: 11, search: "hp", precioMin: 100, precioMax: 9000 },
    });
    expect(result.current.data?.data.map((p) => p.nombre)).toEqual(["HP 1", "HP 2"]);
    expect(result.current.data?.total).toBe(2);
  });

  it("la paginación pide la página siguiente con los mismos filtros y concatena", async () => {
    adapter.mockImplementation(async (config) => {
      const page = (config.params as { page: number }).page;
      return page === 1
        ? ok(config, {
            data: [makeProduct({ id: 1 }), makeProduct({ id: 2 })],
            pagination: makePagination({ page: 1, limit: 2, total: 3, pages: 2 }),
          })
        : ok(config, {
            data: [makeProduct({ id: 3 })],
            pagination: makePagination({ page: 2, limit: 2, total: 3, pages: 2 }),
          });
    });
    const filters = { categoria: 7, limit: 2 };

    const { result } = await renderHook(() => useInfiniteProducts(filters), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.data?.data).toHaveLength(2);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(result.current.data?.data.map((p) => p.id)).toEqual([1, 2, 3]);
    expect(result.current.hasNextPage).toBe(false);
    expect(peticiones().map((p) => p.params)).toMatchObject([
      { page: 1, categoria: 7, limit: 2 },
      { page: 2, categoria: 7, limit: 2 },
    ]);
  });

  it("con un rango de precios inválido no se hace ninguna petición", async () => {
    const criterio = { texto: "laptop", minTxt: "900", maxTxt: "100" };
    const filters = buildProductFilters(criterio);

    const { result } = await renderHook(() => useInfiniteProducts(filters, canSearch(criterio)), {
      wrapper,
    });

    expect(canSearch(criterio)).toBe(false);
    expect(adapter).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("un error del servidor llega al hook como error, sin datos", async () => {
    adapter.mockRejectedValue(makeApiError({ status: 500, message: "Error del servidor" }));

    const { result } = await renderHook(() => useInfiniteProducts({ categoria: 1 }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });
});

describe("integración: categorías y detalle", () => {
  it("de la lista plana de la API solo quedan las categorías raíz de productos", async () => {
    adapter.mockImplementation(async (config) =>
      ok(config, {
        data: [
          makeCategory({ id: 1, nombre: "Computadoras" }),
          makeCategory({ id: 11, nombre: "Laptops", es_padre: false, id_padre: 1 }),
          makeCategory({ id: 24, nombre: "Reparación", tipo: "servicio" }),
        ],
      }),
    );

    const { result } = await renderHook(() => useRootCategories(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(peticiones()[0]).toMatchObject({ metodo: "get", ruta: "/catalog/categories" });
    expect(result.current.data?.map((c) => c.id)).toEqual([1]);
  });

  it("el detalle de un producto existente se pide por id y se expone", async () => {
    adapter.mockImplementation(async (config) => ok(config, { data: makeProductDetail({ id: 5 }) }));

    const { result } = await renderHook(() => useProduct("5"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(peticiones()[0]).toMatchObject({ metodo: "get", ruta: "/catalog/products/5" });
    expect(result.current.data?.id).toBe(5);
    expect(result.current.notFound).toBe(false);
  });

  it("un 404 de la API llega como producto no encontrado, sin error", async () => {
    adapter.mockRejectedValue(makeApiError({ status: 404, error: "Producto no encontrado" }));

    const { result } = await renderHook(() => useProduct("999999"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.notFound).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
