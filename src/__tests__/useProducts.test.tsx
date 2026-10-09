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

describe("useInfiniteProducts · keepPrevious", () => {
  type Props = { f: { search: string }; keep?: boolean };

  /** Resultado de la segunda consulta, que se resuelve cuando la prueba lo decide. */
  const consultaPendiente = () => {
    let resolver!: (v: ReturnType<typeof pagina2>) => void;
    const promesa = new Promise<ReturnType<typeof pagina2>>((r) => {
      resolver = r;
    });
    return { promesa, resolver };
  };

  const montar = async (keep?: boolean) => {
    repo.getPage.mockResolvedValueOnce(pagina1());
    const hook = await renderHook(
      ({ f, keep: k }: Props) => ({ ...useInfiniteProducts(f, true, k) }),
      { wrapper, initialProps: { f: { search: "router" }, keep } as Props },
    );
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    return hook;
  };

  it("con keepPrevious conserva los resultados anteriores mientras llega la nueva consulta", async () => {
    const { promesa, resolver } = consultaPendiente();
    const { result, rerender } = await montar(true);
    repo.getPage.mockReturnValueOnce(promesa);

    await rerender({ f: { search: "cable" }, keep: true });

    await waitFor(() => expect(repo.getPage).toHaveBeenCalledTimes(2));
    expect(result.current.data?.data.map((p) => p.id)).toEqual([1, 2]);
    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(true);

    await act(async () => {
      resolver(pagina2());
    });
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data?.data.map((p) => p.id)).toEqual([3]);
  });

  it.each([
    ["sin indicarlo", undefined],
    ["con false", false],
  ])("%s, al cambiar los filtros no hay datos y vuelve a cargar", async (_nombre, keep) => {
    const { promesa } = consultaPendiente();
    const { result, rerender } = await montar(keep);
    repo.getPage.mockReturnValueOnce(promesa);

    await rerender({ f: { search: "cable" }, keep });

    await waitFor(() => expect(repo.getPage).toHaveBeenCalledTimes(2));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isPlaceholderData).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
});
