import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useOrders } from "@/features/orders/hooks/useOrders";
import { orderRepository } from "@/features/orders/repositories/orderRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeOrderSummary, makeOrdersPage } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/orders/repositories/orderRepository", () => ({
  orderRepository: { getPage: jest.fn(), getById: jest.fn() },
}));

const repo = orderRepository as jest.Mocked<typeof orderRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
});

const pagina = (page: number, ids: number[], totalPages: number, total = 25) =>
  makeOrdersPage({
    page,
    totalPages,
    total,
    data: ids.map((id) => makeOrderSummary({ id_pedido: id })),
  });

describe("useOrders", () => {
  it("con sesión pide la primera página y expone la lista y el total", async () => {
    repo.getPage.mockResolvedValueOnce(pagina(1, [9, 8], 3));
    const { result } = await renderHook(() => ({ ...useOrders() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getPage).toHaveBeenCalledTimes(1);
    expect(repo.getPage.mock.calls[0][0]).toBe(1);
    expect(result.current.data?.orders.map((o) => o.id_pedido)).toEqual([9, 8]);
    expect(result.current.data?.total).toBe(25);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("fetchNextPage pide la siguiente página y la concatena", async () => {
    repo.getPage.mockResolvedValueOnce(pagina(1, [9, 8], 2)).mockResolvedValueOnce(pagina(2, [7], 2));
    const { result } = await renderHook(() => ({ ...useOrders() }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(repo.getPage.mock.calls[1][0]).toBe(2);
    expect(result.current.data?.orders.map((o) => o.id_pedido)).toEqual([9, 8, 7]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("con una sola página no hay siguiente", async () => {
    repo.getPage.mockResolvedValueOnce(pagina(1, [1], 1, 1));
    const { result } = await renderHook(() => ({ ...useOrders() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it("sin pedidos devuelve una lista vacía", async () => {
    repo.getPage.mockResolvedValueOnce(pagina(1, [], 0, 0));
    const { result } = await renderHook(() => ({ ...useOrders() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ orders: [], total: 0 });
  });

  it("sin sesión no hace ninguna petición", async () => {
    useAuthStore.setState({ isAuthenticated: false });
    const { result } = await renderHook(() => ({ ...useOrders() }), { wrapper });

    expect(repo.getPage).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("ante un error expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión." });
    repo.getPage.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useOrders() }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it("un error al pedir la siguiente página conserva la lista ya cargada", async () => {
    repo.getPage
      .mockResolvedValueOnce(pagina(1, [9, 8], 2))
      .mockRejectedValueOnce(makeApiError({ status: 503, message: "x" }));
    const { result } = await renderHook(() => ({ ...useOrders() }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(result.current.isFetchNextPageError).toBe(true);
    expect(result.current.data?.orders.map((o) => o.id_pedido)).toEqual([9, 8]);
  });
});
