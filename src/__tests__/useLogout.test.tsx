import { act, renderHook } from "@testing-library/react-native";

import { useLogout } from "@/features/auth/hooks/useLogout";
import * as pushNotifications from "@/features/notifications/pushNotifications";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import { useAuthStore } from "@/shared/store/authStore";

import { reiniciarSesion } from "./utils/authHooksSetup";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/notifications/pushNotifications", () => ({
  getExpoPushToken: jest.fn(),
}));
jest.mock("@/features/notifications/repositories/notificationRepository", () => ({
  notificationRepository: { unregisterPushToken: jest.fn() },
}));

const push = pushNotifications as jest.Mocked<typeof pushNotifications>;
const repo = notificationRepository as jest.Mocked<typeof notificationRepository>;

beforeEach(async () => {
  jest.resetAllMocks();
  await reiniciarSesion();
  useAuthStore.setState({ isAuthenticated: true });
});

describe("useLogout", () => {
  it("desregistra el token de push (antes de borrar la sesión) y cierra sesión", async () => {
    push.getExpoPushToken.mockResolvedValueOnce("ExponentPushToken[abc]");
    repo.unregisterPushToken.mockResolvedValueOnce(undefined);

    const { result } = await renderHook(() => useLogout());
    await act(async () => {
      await result.current();
    });

    expect(repo.unregisterPushToken).toHaveBeenCalledWith("ExponentPushToken[abc]");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("sin token de push en el dispositivo, no intenta desregistrar pero sí cierra sesión", async () => {
    push.getExpoPushToken.mockResolvedValueOnce(null);

    const { result } = await renderHook(() => useLogout());
    await act(async () => {
      await result.current();
    });

    expect(repo.unregisterPushToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("si falla el desregistro (sin conexión), igual cierra la sesión", async () => {
    push.getExpoPushToken.mockResolvedValueOnce("ExponentPushToken[abc]");
    repo.unregisterPushToken.mockRejectedValueOnce(new Error("network"));

    const { result } = await renderHook(() => useLogout());
    await act(async () => {
      await result.current();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
