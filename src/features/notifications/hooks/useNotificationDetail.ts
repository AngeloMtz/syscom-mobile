// src/features/notifications/hooks/useNotificationDetail.ts
// No existe GET /notifications/:id en el backend: la notificación ya está en
// la bandeja cargada por useNotifications, así que solo se busca ahí.
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { findNotificationById } from "@/features/notifications/notificationSelectors";
import type { AppNotification } from "@/features/notifications/types";

export function useNotificationDetail(id: number): { notification?: AppNotification; isLoading: boolean } {
  const { data, isLoading } = useNotifications();
  const notification = data ? findNotificationById(data.notifications, id) : undefined;
  return { notification, isLoading };
}
