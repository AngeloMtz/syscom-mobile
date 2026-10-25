import { renderHook, waitFor } from "@testing-library/react-native";

import { useNotificationDetail } from "@/features/notifications/hooks/useNotificationDetail";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { makeNotification, makeNotificationsPage } from "./fixtures";
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

describe("useNotificationDetail", () => {
  it("devuelve la notificación con ese id de la bandeja ya cargada", async () => {
    repo.getPage.mockResolvedValueOnce(
      makeNotificationsPage({
        page: 1,
        totalPages: 1,
        data: [makeNotification({ id_notificacion: 7, titulo: "Pedido confirmado" }), makeNotification({ id_notificacion: 8 })],
      }),
    );

    const { result } = await renderHook(() => useNotificationDetail(7), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notification?.titulo).toBe("Pedido confirmado");
  });

  it("si el id no está en la bandeja, no devuelve notificación", async () => {
    repo.getPage.mockResolvedValueOnce(
      makeNotificationsPage({ page: 1, totalPages: 1, data: [makeNotification({ id_notificacion: 1 })] }),
    );

    const { result } = await renderHook(() => useNotificationDetail(99), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notification).toBeUndefined();
  });
});
