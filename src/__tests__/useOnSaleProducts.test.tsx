import { renderHook, waitFor } from "@testing-library/react-native";

import { useOnSaleProducts } from "@/features/catalog/hooks/useOnSaleProducts";
import { productRepository } from "@/features/catalog/repositories/productRepository";

import { makeApiError, makeProduct } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/catalog/repositories/productRepository", () => ({
  productRepository: { getOnSale: jest.fn() },
}));

const repo = productRepository as jest.Mocked<typeof productRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useOnSaleProducts", () => {
  it("pide las promociones vigentes y las expone", async () => {
    const ofertas = [makeProduct({ id: 1, en_promocion: true }), makeProduct({ id: 2, en_promocion: true })];
    repo.getOnSale.mockResolvedValueOnce(ofertas);
    const { result } = await renderHook(() => useOnSaleProducts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getOnSale).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(ofertas);
  });

  it("expone una lista vacía cuando no hay promociones", async () => {
    repo.getOnSale.mockResolvedValueOnce([]);
    const { result } = await renderHook(() => useOnSaleProducts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("ante un error expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getOnSale.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useOnSaleProducts(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
