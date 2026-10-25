import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";

import { NOTIFICATIONS_KEY } from "@/features/notifications/hooks/useNotifications";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/features/notifications/hooks/useMarkNotificationsRead";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import type { NotificationsPage } from "@/features/notifications/types";

import { makeApiError, makeNotification, makeNotificationsPage } from "./fixtures";
import { usarQueryWrapper } from "./utils/queryWrapper";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@/features/notifications/repositories/notificationRepository", () => ({
  notificationRepository: { markRead: jest.fn(), markAllRead: jest.fn() },
}));

const repo = notificationRepository as jest.Mocked<typeof notificationRepository>;
const { wrapper } = usarQueryWrapper();

type Bandeja = InfiniteData<NotificationsPage, number>;

/** Bandeja sembrada en la caché: la notificación 1 y la 2, ambas sin leer. */
const sembrar = (client: ReturnType<typeof useQueryClient>) =>
  client.setQueryData<Bandeja>(NOTIFICATIONS_KEY, {
    pages: [
      makeNotificationsPage({
        data: [makeNotification({ id_notificacion: 1 }), makeNotification({ id_notificacion: 2 })],
      }),
    ],
    pageParams: [1],
  });

const leidas = (client: ReturnType<typeof useQueryClient>) =>
  client
    .getQueryData<Bandeja>(NOTIFICATIONS_KEY)
    ?.pages.flatMap((p) => p.data)
    .map((n) => [n.id_notificacion, n.leida]);

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useMarkNotificationRead", () => {
  const montar = () => renderHook(() => ({ ...useMarkNotificationRead(), client: useQueryClient() }), { wrapper });

  it("llama al repository con el id y deja esa notificación leída en la caché", async () => {
    repo.markRead.mockResolvedValueOnce(undefined);
    const { result } = await montar();
    sembrar(result.current.client);

    await act(async () => {
      await result.current.mutateAsync(2);
    });

    expect(repo.markRead.mock.calls[0][0]).toBe(2);
    expect(leidas(result.current.client)).toEqual([
      [1, false],
      [2, true],
    ]);
  });

  it("si el servidor rechaza, la caché no cambia y se expone el error", async () => {
    const error = makeApiError({ status: 404, message: "Notificación no encontrada." });
    repo.markRead.mockRejectedValueOnce(error);
    const { result } = await montar();
    sembrar(result.current.client);

    await act(async () => {
      await result.current.mutateAsync(2).catch(() => {});
    });

    expect(leidas(result.current.client)).toEqual([
      [1, false],
      [2, false],
    ]);
    expect(result.current.error).toBe(error);
  });

  it("sin bandeja en la caché no falla", async () => {
    repo.markRead.mockResolvedValueOnce(undefined);
    const { result } = await montar();

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(leidas(result.current.client)).toBeUndefined();
  });
});

describe("useMarkAllNotificationsRead", () => {
  const montar = () =>
    renderHook(() => ({ ...useMarkAllNotificationsRead(), client: useQueryClient() }), { wrapper });

  it("marca todas como leídas en el servidor y en la caché", async () => {
    repo.markAllRead.mockResolvedValueOnce(undefined);
    const { result } = await montar();
    sembrar(result.current.client);

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(repo.markAllRead).toHaveBeenCalledTimes(1);
    expect(leidas(result.current.client)).toEqual([
      [1, true],
      [2, true],
    ]);
  });

  it("si el servidor rechaza, la caché no cambia", async () => {
    repo.markAllRead.mockRejectedValueOnce(makeApiError({ status: 500, message: "Error del servidor" }));
    const { result } = await montar();
    sembrar(result.current.client);

    await act(async () => {
      await result.current.mutateAsync().catch(() => {});
    });

    expect(leidas(result.current.client)).toEqual([
      [1, false],
      [2, false],
    ]);
  });
});
