import { renderHook, waitFor } from "@testing-library/react-native";

import { useBrands } from "@/features/catalog/hooks/useBrands";
import { brandRepository } from "@/features/catalog/repositories/brandRepository";
import type { Brand } from "@/features/catalog/types";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/catalog/repositories/brandRepository", () => ({
  brandRepository: { getAll: jest.fn() },
}));

const repo = brandRepository as jest.Mocked<typeof brandRepository>;
const { wrapper } = usarQueryWrapper();

const marca = (over: Partial<Brand> = {}): Brand => ({ id: 1, nombre: "Hikvision", logo_url: null, ...over });

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useBrands", () => {
  it("pide las marcas y las expone", async () => {
    const marcas = [marca({ id: 1 }), marca({ id: 2, nombre: "Dahua" })];
    repo.getAll.mockResolvedValueOnce(marcas);
    const { result } = await renderHook(() => useBrands(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(marcas);
  });

  it("ante un error expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getAll.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useBrands(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
