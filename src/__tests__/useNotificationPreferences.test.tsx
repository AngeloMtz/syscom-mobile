import { useQueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import {
  PREFERENCES_KEY,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/hooks/useNotificationPreferences";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import type { NotificationPreferences } from "@/features/notifications/types";
import { useAuthStore } from "@/shared/store/authStore";

import { makeApiError } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/notifications/repositories/notificationRepository", () => ({
  notificationRepository: { getPreferences: jest.fn(), updatePreferences: jest.fn() },
}));

const repo = notificationRepository as jest.Mocked<typeof notificationRepository>;
const { wrapper } = usarQueryWrapper();

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: true, isHydrating: false });
});

describe("useNotificationPreferences", () => {
  it("con sesión pide las preferencias y las expone", async () => {
    repo.getPreferences.mockResolvedValueOnce({ email: false, push: true });
    const { result } = await renderHook(() => ({ ...useNotificationPreferences() }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(repo.getPreferences).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ email: false, push: true });
  });

  it("sin sesión no consulta al servidor", async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: false });
    const { result } = await renderHook(() => ({ ...useNotificationPreferences() }), { wrapper });

    expect(repo.getPreferences).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("ante un error de la API expone el error", async () => {
    const error = makeApiError({ status: 500, message: "Error del servidor" });
    repo.getPreferences.mockRejectedValueOnce(error);
    const { result } = await renderHook(() => ({ ...useNotificationPreferences() }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe("useUpdateNotificationPreferences", () => {
  const anteriores: NotificationPreferences = { email: true, push: true };
  const nuevas: NotificationPreferences = { email: true, push: false };

  const montar = () =>
    renderHook(() => ({ ...useUpdateNotificationPreferences(), client: useQueryClient() }), { wrapper });

  it("guarda las preferencias: llama al repository con los dos valores", async () => {
    repo.updatePreferences.mockResolvedValueOnce(undefined);
    const { result } = await montar();

    await act(async () => {
      await result.current.mutateAsync(nuevas);
    });

    expect(repo.updatePreferences.mock.calls[0][0]).toEqual(nuevas);
    expect(result.current.isSuccess).toBe(true);
  });

  it("actualización optimista: el valor nuevo está en la caché antes de que responda el servidor", async () => {
    let resolver!: () => void;
    repo.updatePreferences.mockReturnValueOnce(
      new Promise<void>((r) => {
        resolver = r;
      }),
    );
    const { result } = await montar();
    result.current.client.setQueryData(PREFERENCES_KEY, anteriores);

    await act(async () => {
      result.current.mutate(nuevas);
    });

    await waitFor(() => expect(result.current.client.getQueryData(PREFERENCES_KEY)).toEqual(nuevas));
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      resolver();
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("si el servidor rechaza, la caché vuelve al valor anterior y se expone el error", async () => {
    const error = makeApiError({ status: 400, message: "Datos inválidos" });
    repo.updatePreferences.mockRejectedValueOnce(error);
    const { result } = await montar();
    result.current.client.setQueryData(PREFERENCES_KEY, anteriores);

    await act(async () => {
      await result.current.mutateAsync(nuevas).catch(() => {});
    });

    expect(result.current.client.getQueryData(PREFERENCES_KEY)).toEqual(anteriores);
    expect(result.current.error).toBe(error);
  });
});
