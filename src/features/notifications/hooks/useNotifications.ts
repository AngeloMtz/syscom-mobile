// src/features/notifications/hooks/useNotifications.ts
import { useInfiniteQuery } from "@tanstack/react-query";

import { flattenNotifications, getNextNotificationsPage } from "@/features/notifications/notificationSelectors";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import { useAuthStore } from "@/shared/store/authStore";

export const NOTIFICATIONS_KEY = ["notifications", "list"] as const;

/**
 * Bandeja con scroll infinito: cada página se pide con `fetchNextPage` y el hook
 * las aplana en `notifications` (sin repetidas) y expone el `total` del servidor.
 * Sin sesión no hace ninguna petición.
 */
export const useNotifications = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: ({ pageParam }) => notificationRepository.getPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: getNextNotificationsPage,
    select: (result) => ({
      notifications: flattenNotifications(result.pages),
      total: result.pages[0]?.total ?? 0,
    }),
    enabled: isAuthenticated,
  });
};
