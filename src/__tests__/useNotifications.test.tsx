import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError, makeNotification, makeNotificationsPage } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/notifications/repositories/notificationRepository", () => ({
  notificationRepository: { getPage: jest.fn() },
}));

const repo = notificationRepository as jest.Mocked<typeof notificationRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
});

const pagina = (page: number, ids: number[], totalPages: number, total = 25) =>
  makeNotificationsPage({
    page,
    totalPages,
    total,
    data: ids.map((id) => makeNotification({ id_notificacion: id })),
  });

describe("useNotifications", () => {
  it("con sesión pide la primera página y expone la lista y el total", async () => {
    repo.getPage.mockResolvedValueOnce(pagina(1, [9, 8], 3));
    const { result } = await renderHook(() => ({ ...useNotifications() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getPage).toHaveBeenCalledTimes(1);
    expect(repo.getPage.mock.calls[0][0]).toBe(1);
    expect(result.current.data?.notifications.map((n) => n.id_notificacion)).toEqual([9, 8]);
    expect(result.current.data?.total).toBe(25);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("fetchNextPage pide la siguiente página y la concatena", async () => {
    repo.getPage.mockResolvedValueOnce(pagina(1, [9, 8], 2)).mockResolvedValueOnce(pagina(2, [7], 2));
    const { result } = await renderHook(() => ({ ...useNotifications() }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(repo.getPage.mock.calls[1][0]).toBe(2);
    expect(result.current.data?.notifications.map((n) => n.id_notificacion)).toEqual([9, 8, 7]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("con una sola página no hay siguiente", async () => {
    repo.getPage.mockResolvedValueOnce(pagina(1, [1], 1, 1));
    const { result } = await renderHook(() => ({ ...useNotifications() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it("sin sesión no consulta al servidor", async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false });
    const { result } = await renderHook(() => ({ ...useNotifications() }), { wrapper });

    expect(repo.getPage).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("ante un error de la API expone el error y no devuelve datos", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getPage.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useNotifications() }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
