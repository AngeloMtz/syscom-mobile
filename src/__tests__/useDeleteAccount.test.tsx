import { act, renderHook } from "@testing-library/react-native";

import { useChatStore } from "@/features/chatbot/chatStore";
import * as pushNotifications from "@/features/notifications/pushNotifications";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import { useDeleteAccount } from "@/features/profile/hooks/useDeleteAccount";
import { profileRepository } from "@/features/profile/repositories/profileRepository";
import { queryClient } from "@/shared/api/queryClient";
import { getTokenSync, saveToken } from "@/shared/api/secureToken";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError } from "./fixtures";
import { reiniciarSesion } from "./utils/authHooksSetup";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "uuid-test") }));
jest.mock("@/features/profile/repositories/profileRepository", () => ({
  profileRepository: { deleteAccount: jest.fn() },
}));
jest.mock("@/features/notifications/pushNotifications", () => ({
  getExpoPushToken: jest.fn(),
}));
jest.mock("@/features/notifications/repositories/notificationRepository", () => ({
  notificationRepository: { unregisterPushToken: jest.fn() },
}));

const repo = profileRepository as jest.Mocked<typeof profileRepository>;
const push = pushNotifications as jest.Mocked<typeof pushNotifications>;
const { wrapper } = usarQueryWrapper();

beforeEach(async () => {
  jest.resetAllMocks();
  await reiniciarSesion();
  await saveToken("jwt-actual");
  useAuthStore.setState({ isAuthenticated: true });
});

describe("useDeleteAccount", () => {
  it("envía la contraseña al repository", async () => {
    repo.deleteAccount.mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("Secreta1!");
    });

    expect(repo.deleteAccount).toHaveBeenCalledTimes(1);
    expect(repo.deleteAccount).toHaveBeenCalledWith("Secreta1!");
  });

  it("al eliminar termina la sesión: token, caché del usuario y chatbot", async () => {
    repo.deleteAccount.mockResolvedValueOnce(undefined);
    queryClient.setQueryData(["profile"], { nombre: "Ana" });
    useChatStore.getState().ensureSession();
    useChatStore.getState().addMessage("user", "hola");
    const { result } = await renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("Secreta1!");
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(getTokenSync()).toBeNull();
    expect(queryClient.getQueryData(["profile"])).toBeUndefined();
    expect(useChatStore.getState()).toMatchObject({ sessionId: null, messages: [] });
  });

  it("no llama a la baja de push: el backend ya borró el token y respondería 401", async () => {
    repo.deleteAccount.mockResolvedValueOnce(undefined);
    push.getExpoPushToken.mockResolvedValue("ExponentPushToken[abc]");
    const { result } = await renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("Secreta1!");
    });

    expect(notificationRepository.unregisterPushToken).not.toHaveBeenCalled();
  });

  it.each([
    [400, "La contraseña es incorrecta"],
    [409, "Tienes pedidos o servicios en curso. Podrás eliminar tu cuenta cuando terminen."],
  ])("con un rechazo %i la sesión sigue abierta y el error queda disponible", async (status, message) => {
    const error = makeApiError({ status, message });
    repo.deleteAccount.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("mala")).rejects.toBe(error);
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(getTokenSync()).toBe("jwt-actual");
    expect(result.current.error).toBe(error);
  });

  it("no reintenta solo: una sola llamada aunque falle la red", async () => {
    repo.deleteAccount.mockRejectedValue(new Error("Network Error"));
    const { result } = await renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("x").catch(() => undefined);
    });

    expect(repo.deleteAccount).toHaveBeenCalledTimes(1);
  });
});
