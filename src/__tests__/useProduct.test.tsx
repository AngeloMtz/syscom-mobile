import { renderHook, waitFor } from "@testing-library/react-native";

import { useProduct } from "@/features/catalog/hooks/useProduct";
import { productRepository } from "@/features/catalog/repositories/productRepository";

import { makeApiError, makeNetworkError, makeProductDetail } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/catalog/repositories/productRepository", () => ({
  productRepository: { getById: jest.fn() },
}));

const repo = productRepository as jest.Mocked<typeof productRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useProduct", () => {
  it("pide el producto por id y expone el detalle", async () => {
    const detalle = makeProductDetail({ id: 5 });
    repo.getById.mockResolvedValueOnce(detalle);
    const { result } = await renderHook(() => ({ ...useProduct("5") }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getById).toHaveBeenCalledWith(5);
    expect(result.current.data).toEqual(detalle);
    expect(result.current.notFound).toBe(false);
  });

  it("con un id inválido no consulta la API y marca no encontrado", async () => {
    const { result } = await renderHook(() => ({ ...useProduct("abc") }), { wrapper });

    expect(repo.getById).not.toHaveBeenCalled();
    expect(result.current.notFound).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("marca no encontrado cuando el repository devuelve null (404)", async () => {
    repo.getById.mockResolvedValueOnce(null);
    const { result } = await renderHook(() => ({ ...useProduct("999") }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.notFound).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(repo.getById).toHaveBeenCalledTimes(1);
  });

  it("ante un error de servidor expone el error sin marcar no encontrado", async () => {
    const error = makeApiError({ status: 500, error: "Error al obtener producto" });
    repo.getById.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useProduct("1") }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.notFound).toBe(false);
  });

  it("ante un error de red expone el error sin marcar no encontrado", async () => {
    repo.getById.mockRejectedValueOnce(makeNetworkError());
    const { result } = await renderHook(() => ({ ...useProduct("1") }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.notFound).toBe(false);
  });
});
