import { renderHook, waitFor } from "@testing-library/react-native";

import { useRootCategories } from "@/features/catalog/hooks/useCategories";
import { categoryRepository } from "@/features/catalog/repositories/categoryRepository";

import { makeApiError, makeCategory } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("@/features/catalog/repositories/categoryRepository", () => ({
  categoryRepository: { getAll: jest.fn() },
}));

const repo = categoryRepository as jest.Mocked<typeof categoryRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useRootCategories", () => {
  it("pide las categorías y conserva solo las raíz de productos", async () => {
    repo.getAll.mockResolvedValueOnce([
      makeCategory({ id: 1, nombre: "Computadoras" }),
      makeCategory({ id: 11, nombre: "Laptops", es_padre: false, id_padre: 1 }),
      makeCategory({ id: 24, nombre: "Reparación", tipo: "servicio" }),
    ]);
    const { result } = await renderHook(() => ({ ...useRootCategories() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(result.current.data?.map((c) => c.id)).toEqual([1]);
  });

  it("ante un error de la API expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getAll.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useRootCategories() }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
