import { renderHook, waitFor } from "@testing-library/react-native";

import { useRegisterPushToken } from "@/features/notifications/hooks/useRegisterPushToken";
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
  configureAndroidChannel: jest.fn(),
  ensurePushPermission: jest.fn(),
  getExpoPushToken: jest.fn(),
}));
jest.mock("@/features/notifications/repositories/notificationRepository", () => ({
  notificationRepository: { registerPushToken: jest.fn() },
}));

const push = pushNotifications as jest.Mocked<typeof pushNotifications>;
const repo = notificationRepository as jest.Mocked<typeof notificationRepository>;

beforeEach(async () => {
  jest.resetAllMocks();
  await reiniciarSesion();
});

describe("useRegisterPushToken", () => {
  it("sin sesión no hace nada", () => {
    renderHook(() => useRegisterPushToken());

    expect(push.configureAndroidChannel).not.toHaveBeenCalled();
    expect(push.ensurePushPermission).not.toHaveBeenCalled();
  });

  it("con sesión: configura el canal, pide permiso, obtiene el token y lo registra", async () => {
    push.ensurePushPermission.mockResolvedValueOnce(true);
    push.getExpoPushToken.mockResolvedValueOnce("ExponentPushToken[abc]");
    repo.registerPushToken.mockResolvedValueOnce(undefined);
    useAuthStore.setState({ isAuthenticated: true });

    renderHook(() => useRegisterPushToken());

    await waitFor(() => expect(repo.registerPushToken).toHaveBeenCalledWith("ExponentPushToken[abc]"));
    expect(push.configureAndroidChannel).toHaveBeenCalledTimes(1);
  });

  it("si el permiso es negado, no intenta obtener el token ni registrar", async () => {
    push.ensurePushPermission.mockResolvedValueOnce(false);
    useAuthStore.setState({ isAuthenticated: true });

    renderHook(() => useRegisterPushToken());

    await waitFor(() => expect(push.ensurePushPermission).toHaveBeenCalledTimes(1));
    expect(push.getExpoPushToken).not.toHaveBeenCalled();
    expect(repo.registerPushToken).not.toHaveBeenCalled();
  });

  it("si no se pudo obtener el token, no intenta registrar", async () => {
    push.ensurePushPermission.mockResolvedValueOnce(true);
    push.getExpoPushToken.mockResolvedValueOnce(null);
    useAuthStore.setState({ isAuthenticated: true });

    renderHook(() => useRegisterPushToken());

    await waitFor(() => expect(push.getExpoPushToken).toHaveBeenCalledTimes(1));
    expect(repo.registerPushToken).not.toHaveBeenCalled();
  });

  it("si falla el registro en el backend, no lanza (se reintenta en el siguiente arranque)", async () => {
    push.ensurePushPermission.mockResolvedValueOnce(true);
    push.getExpoPushToken.mockResolvedValueOnce("ExponentPushToken[abc]");
    repo.registerPushToken.mockRejectedValueOnce(new Error("network"));
    useAuthStore.setState({ isAuthenticated: true });

    expect(() => renderHook(() => useRegisterPushToken())).not.toThrow();
    await waitFor(() => expect(repo.registerPushToken).toHaveBeenCalledTimes(1));
  });
});
