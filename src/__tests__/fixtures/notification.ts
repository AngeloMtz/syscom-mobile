import type { AppNotification, NotificationsPage } from "@/features/notifications/types";

// Forma tomada del código del backend (notifications.service.ts, getMyNotifications);
// pendiente de contrastar con una respuesta real de GET /notifications.

export function makeNotification(over: Partial<AppNotification> = {}): AppNotification {
  return {
    id_notificacion: 1,
    titulo: "Tu pedido está en camino",
    mensaje: "El pedido #10 salió a reparto.",
    tipo: "pedido",
    leida: false,
    created_at: "2026-10-20T12:00:00.000Z",
    notificacion_historial: [{ canal: "push", enviado: true }],
    ...over,
  };
}

export function makeNotificationsPage(over: Partial<NotificationsPage> = {}): NotificationsPage {
  return {
    data: [makeNotification()],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
    ...over,
  };
}
