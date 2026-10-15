import { renderHook, waitFor } from "@testing-library/react-native";

import { useProductsPreview } from "@/features/catalog/hooks/useProductsPreview";
import { productRepository } from "@/features/catalog/repositories/productRepository";

import { makeApiError, makePagination, makeProduct } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/catalog/repositories/productRepository", () => ({
  productRepository: { getPage: jest.fn() },
}));

const repo = productRepository as jest.Mocked<typeof productRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useProductsPreview", () => {
  it("pide la primera página con el límite y recorta al número pedido", async () => {
    const ocho = Array.from({ length: 8 }, (_, i) => makeProduct({ id: i + 1 }));
    repo.getPage.mockResolvedValueOnce({ data: ocho, pagination: makePagination() });
    const { result } = await renderHook(() => useProductsPreview(6), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getPage).toHaveBeenCalledWith({ limit: 6 }, 1);
    expect(result.current.data).toHaveLength(6);
    expect(result.current.data?.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("ante un error expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getPage.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useProductsPreview(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
