import { renderHook, waitFor } from "@testing-library/react-native";

import { useProductModels } from "@/features/ar/hooks/useProductModels";
import { modelsRepository } from "@/features/ar/repositories/modelsRepository";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/ar/repositories/modelsRepository", () => ({
  modelsRepository: { getByProductId: jest.fn() },
}));

const repo = modelsRepository as jest.Mocked<typeof modelsRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useProductModels", () => {
  it("pide los modelos y los agrupa por formato", async () => {
    repo.getByProductId.mockResolvedValueOnce([
      { id: 1, url: "https://cdn.com/a.glb", formato: "glb" },
      { id: 2, url: "https://cdn.com/a.usdz", formato: "usdz" },
    ]);
    const { result } = await renderHook(() => useProductModels(42), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getByProductId).toHaveBeenCalledWith(42);
    expect(result.current.data).toEqual({ glb: "https://cdn.com/a.glb", usdz: "https://cdn.com/a.usdz" });
  });

  it("con un producto sin modelos devuelve objeto vacío", async () => {
    repo.getByProductId.mockResolvedValueOnce([]);
    const { result } = await renderHook(() => useProductModels(42), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({});
  });

  it("con productId null no consulta", async () => {
    const { result } = await renderHook(() => useProductModels(null), { wrapper });

    expect(repo.getByProductId).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("ante un error de la API expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getByProductId.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useProductModels(1), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});
