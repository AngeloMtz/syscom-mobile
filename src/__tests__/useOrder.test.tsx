import { renderHook, waitFor } from "@testing-library/react-native";

import { useOrder } from "@/features/orders/hooks/useOrder";
import { orderRepository } from "@/features/orders/repositories/orderRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeOrderDetail } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/orders/repositories/orderRepository", () => ({
  orderRepository: { getById: jest.fn() },
}));

const repo = orderRepository as jest.Mocked<typeof orderRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
});

describe("useOrder", () => {
  it("con sesión pide el pedido por id y lo expone", async () => {
    const pedido = makeOrderDetail({ id_pedido: 8 });
    repo.getById.mockResolvedValueOnce(pedido);
    const { result } = await renderHook(() => ({ ...useOrder("8") }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getById).toHaveBeenCalledWith(8);
    expect(result.current.data).toEqual(pedido);
    expect(result.current.notFound).toBe(false);
  });

  it("con un id inválido no consulta y marca no encontrado", async () => {
    const { result } = await renderHook(() => ({ ...useOrder("abc") }), { wrapper });

    expect(repo.getById).not.toHaveBeenCalled();
    expect(result.current.notFound).toBe(true);
  });

  it("sin sesión no hace ninguna petición", async () => {
    useAuthStore.setState({ isAuthenticated: false });
    const { result } = await renderHook(() => ({ ...useOrder("8") }), { wrapper });

    expect(repo.getById).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("marca no encontrado cuando el repository devuelve null (404)", async () => {
    repo.getById.mockResolvedValueOnce(null);
    const { result } = await renderHook(() => ({ ...useOrder("99") }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.notFound).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it("ante un error expone el error sin marcar no encontrado", async () => {
    const error = makeApiError({ status: 503, message: "Error de conexión." });
    repo.getById.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useOrder("8") }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.notFound).toBe(false);
  });
});
