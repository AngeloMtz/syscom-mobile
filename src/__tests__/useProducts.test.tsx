import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useInfiniteProducts } from "@/features/catalog/hooks/useProducts";
import { productRepository } from "@/features/catalog/repositories/productRepository";

import { makeApiError, makePaginatedProducts, makePagination, makeProduct } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/catalog/repositories/productRepository", () => ({
  productRepository: { getPage: jest.fn() },
}));

const repo = productRepository as jest.Mocked<typeof productRepository>;
const { wrapper } = usarQueryWrapper();
const filtros = { categoria: 7 };

/** Página de 2 productos dentro de un total de 3 repartido en 2 páginas. */
const pagina1 = () =>
  makePaginatedProducts({
    data: [makeProduct({ id: 1 }), makeProduct({ id: 2 })],
    pagination: makePagination({ page: 1, limit: 2, total: 3, pages: 2 }),
  });
const pagina2 = () =>
  makePaginatedProducts({
    data: [makeProduct({ id: 3 })],
    pagination: makePagination({ page: 2, limit: 2, total: 3, pages: 2 }),
  });

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useInfiniteProducts", () => {
  it("primera página: pide la página 1 con los filtros y expone productos y total", async () => {
    repo.getPage.mockResolvedValueOnce(pagina1());
    const { result } = await renderHook(() => ({ ...useInfiniteProducts(filtros) }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getPage).toHaveBeenCalledTimes(1);
    expect(repo.getPage).toHaveBeenCalledWith(filtros, 1);
    expect(result.current.data?.data.map((p) => p.id)).toEqual([1, 2]);
    expect(result.current.data?.total).toBe(3);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("siguiente página: pide la página 2 y la agrega a la lista", async () => {
    repo.getPage.mockResolvedValueOnce(pagina1()).mockResolvedValueOnce(pagina2());
    const { result } = await renderHook(() => ({ ...useInfiniteProducts(filtros) }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(repo.getPage).toHaveBeenCalledTimes(2);
    expect(repo.getPage).toHaveBeenLastCalledWith(filtros, 2);
    expect(result.current.data?.data.map((p) => p.id)).toEqual([1, 2, 3]);
    expect(result.current.data?.total).toBe(3);
  });

  it("fin de lista: sin más páginas hasNextPage es falso", async () => {
    repo.getPage.mockResolvedValueOnce(pagina1()).mockResolvedValueOnce(pagina2());
    const { result } = await renderHook(() => ({ ...useInfiniteProducts(filtros) }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it("con una sola página no hay siguiente página", async () => {
    repo.getPage.mockResolvedValueOnce(makePaginatedProducts());
    const { result } = await renderHook(() => ({ ...useInfiniteProducts(filtros) }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it("sin resultados devuelve lista vacía y total 0", async () => {
    repo.getPage.mockResolvedValueOnce(
      makePaginatedProducts({ data: [], pagination: makePagination({ total: 0, pages: 0 }) }),
    );
    const { result } = await renderHook(() => ({ ...useInfiniteProducts(filtros) }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ data: [], total: 0 });
  });

  it("con enabled en falso no consulta al servidor", async () => {
    const { result } = await renderHook(() => ({ ...useInfiniteProducts(filtros, false) }), { wrapper });

    expect(repo.getPage).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("ante un error de la API expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getPage.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useInfiniteProducts(filtros) }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
