import { renderHook, waitFor } from "@testing-library/react-native";

import { useFeaturedProducts } from "@/features/catalog/hooks/useFeaturedProducts";
import { productRepository } from "@/features/catalog/repositories/productRepository";

import { makeApiError, makeProduct } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/catalog/repositories/productRepository", () => ({
  productRepository: { getFeatured: jest.fn() },
}));

const repo = productRepository as jest.Mocked<typeof productRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useFeaturedProducts", () => {
  it("pide los destacados con el límite indicado y los expone", async () => {
    const destacados = [makeProduct({ id: 1 }), makeProduct({ id: 2 })];
    repo.getFeatured.mockResolvedValueOnce(destacados);
    const { result } = await renderHook(() => useFeaturedProducts(4), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getFeatured).toHaveBeenCalledWith(4);
    expect(result.current.data).toEqual(destacados);
  });

  it("ante un error expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getFeatured.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useFeaturedProducts(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
