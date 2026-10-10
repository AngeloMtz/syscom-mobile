import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useFavoriteIds, useFavorites } from "@/features/favorites/hooks/useFavorites";
import { useToggleFavorite } from "@/features/favorites/hooks/useToggleFavorite";
import { favoriteRepository } from "@/features/favorites/repositories/favoriteRepository";
import { useAuthStore } from "@/shared/store/authStore";

import {
  makeApiError,
  makeFavoriteItemFor,
  makeFavoriteProduct,
  makeFavoritesResult,
} from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/favorites/repositories/favoriteRepository", () => ({
  favoriteRepository: { getAll: jest.fn(), add: jest.fn(), remove: jest.fn() },
}));

const repo = favoriteRepository as jest.Mocked<typeof favoriteRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
});

describe("useFavorites / useFavoriteIds", () => {
  it("con sesión pide los favoritos y los expone", async () => {
    const resultado = makeFavoritesResult({ items: [makeFavoriteItemFor(4), makeFavoriteItemFor(9)], total: 2 });
    repo.getAll.mockResolvedValueOnce(resultado);
    const { result } = await renderHook(() => ({ ...useFavorites() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(resultado);
  });

  it("sin sesión no hace ninguna petición", async () => {
    useAuthStore.setState({ isAuthenticated: false });
    const { result } = await renderHook(() => ({ ...useFavorites() }), { wrapper });

    expect(repo.getAll).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useFavoriteIds devuelve los ids y comparte la misma consulta", async () => {
    repo.getAll.mockResolvedValue(
      makeFavoritesResult({ items: [makeFavoriteItemFor(4), makeFavoriteItemFor(9)], total: 2 }),
    );
    const { result } = await renderHook(
      () => ({ ids: useFavoriteIds(), list: useFavorites() }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.ids.isSuccess).toBe(true));

    expect(result.current.ids.data).toEqual([4, 9]);
    expect(repo.getAll).toHaveBeenCalledTimes(1);
  });

  it("ante un error expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getAll.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useFavorites() }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});

describe("useToggleFavorite", () => {
  const producto = makeFavoriteProduct({ id_producto: 20, nombre: "Nuevo" });

  async function montar(inicial = makeFavoritesResult({ items: [makeFavoriteItemFor(1)], total: 1 })) {
    repo.getAll.mockResolvedValue(inicial);
    const hook = await renderHook(
      () => ({ lista: useFavorites(), toggle: useToggleFavorite() }),
      { wrapper },
    );
    await waitFor(() => expect(hook.result.current.lista.isSuccess).toBe(true));
    return hook;
  }

  it("agregar actualiza la lista al instante y llama a add", async () => {
    let terminar!: () => void;
    repo.add.mockReturnValueOnce(new Promise<void>((r) => (terminar = r)));
    const { result } = await montar();

    act(() => {
      result.current.toggle.mutate({ product: producto, favorite: true });
    });

    await waitFor(() =>
      expect(result.current.lista.data?.items.map((i) => i.productos.id_producto)).toEqual([20, 1]),
    );
    expect(repo.add).toHaveBeenCalledWith(20);
    expect(result.current.toggle.isPending).toBe(true);

    repo.getAll.mockResolvedValue(
      makeFavoritesResult({ items: [makeFavoriteItemFor(20), makeFavoriteItemFor(1)], total: 2 }),
    );
    await act(async () => {
      terminar();
    });
    await waitFor(() => expect(result.current.toggle.isSuccess).toBe(true));
  });

  it("quitar actualiza la lista al instante y llama a remove", async () => {
    repo.remove.mockResolvedValueOnce(undefined);
    const { result } = await montar(
      makeFavoritesResult({ items: [makeFavoriteItemFor(1), makeFavoriteItemFor(20)], total: 2 }),
    );

    repo.getAll.mockResolvedValue(makeFavoritesResult({ items: [makeFavoriteItemFor(1)], total: 1 }));
    await act(async () => {
      result.current.toggle.mutate({ product: producto, favorite: false });
    });

    await waitFor(() => expect(result.current.toggle.isSuccess).toBe(true));
    expect(repo.remove).toHaveBeenCalledWith(20);
    expect(result.current.lista.data?.items.map((i) => i.productos.id_producto)).toEqual([1]);
  });

  it("si la API falla revierte la lista y expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error" });
    repo.add.mockRejectedValueOnce(error);
    const { result } = await montar();

    await act(async () => {
      result.current.toggle.mutate({ product: producto, favorite: true });
    });

    await waitFor(() => expect(result.current.toggle.isError).toBe(true));
    expect(result.current.toggle.error).toBe(error);
    expect(result.current.lista.data?.items.map((i) => i.productos.id_producto)).toEqual([1]);
    expect(result.current.lista.data?.total).toBe(1);
  });

  it("al terminar vuelve a pedir la lista al servidor", async () => {
    repo.add.mockResolvedValueOnce(undefined);
    const { result } = await montar();
    expect(repo.getAll).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.toggle.mutate({ product: producto, favorite: true });
    });

    await waitFor(() => expect(repo.getAll).toHaveBeenCalledTimes(2));
  });
});
