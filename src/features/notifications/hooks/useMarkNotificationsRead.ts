// src/features/notifications/hooks/useMarkNotificationsRead.ts
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { NOTIFICATIONS_KEY } from "@/features/notifications/hooks/useNotifications";
import { markAsReadInPages } from "@/features/notifications/notificationSelectors";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import type { NotificationsPage } from "@/features/notifications/types";

type Bandeja = InfiniteData<NotificationsPage, number>;

/** Escribe en la caché la bandeja con `id` leída (o todas si no hay `id`). */
const useMarcarEnCache = () => {
  const queryClient = useQueryClient();
  return (id?: number) =>
    queryClient.setQueryData<Bandeja>(NOTIFICATIONS_KEY, (old) =>
      old ? { ...old, pages: markAsReadInPages(old.pages, id) } : old,
    );
};

/** Marca una notificación como leída; al confirmarlo el servidor, la caché lo refleja sin recargar. */
export const useMarkNotificationRead = () => {
  const marcarEnCache = useMarcarEnCache();
  return useMutation<void, unknown, number>({
    mutationFn: notificationRepository.markRead,
    retry: 0,
    onSuccess: (_data, id) => {
      marcarEnCache(id);
    },
  });
};

/** Marca todas como leídas. */
export const useMarkAllNotificationsRead = () => {
  const marcarEnCache = useMarcarEnCache();
  return useMutation<void, unknown, void>({
    mutationFn: notificationRepository.markAllRead,
    retry: 0,
    onSuccess: () => {
      marcarEnCache();
    },
  });
};
