// src/features/notifications/repositories/notificationRepository.ts — Acceso a /notifications.
// Exige sesión (Bearer, lo agrega el interceptor). Única capa que conoce las
// rutas y la forma de la respuesta. Marcar como leída es PUT, igual que define
// el backend (routes.ts).
import api from "@/shared/api/client";
import type { AppNotification, NotificationPreferences, NotificationsPage } from "@/features/notifications/types";

/** Notificaciones por página (el backend acepta de 1 a 50; por defecto 20). */
export const NOTIFICATIONS_PAGE_SIZE = 20;

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

export const notificationRepository = {
  /** Una página de la bandeja, de la más reciente a la más antigua. */
  getPage: (page = 1, limit: number = NOTIFICATIONS_PAGE_SIZE): Promise<NotificationsPage> =>
    api.get("/notifications", { params: { page, limit } }).then((r) => ({
      data: Array.isArray(r.data?.data)
        ? (r.data.data as AppNotification[]).filter((n) => typeof n?.id_notificacion === "number")
        : [],
      total: num(r.data?.total, 0),
      page: num(r.data?.page, page),
      limit: num(r.data?.limit, limit),
      totalPages: num(r.data?.totalPages, 0),
    })),

  /** Marca una notificación como leída. */
  markRead: (id: number): Promise<void> => api.put(`/notifications/${id}/read`).then(() => undefined),

  /** Marca todas como leídas. */
  markAllRead: (): Promise<void> => api.put("/notifications/read-all").then(() => undefined),

  /** Preferencias de canal. Si el backend no manda nada, ambos canales activos (su valor por defecto). */
  getPreferences: (): Promise<NotificationPreferences> =>
    api.get("/notifications/preferences").then((r) => ({
      email: r.data?.data?.email !== false,
      push: r.data?.data?.push !== false,
    })),

  /** Guarda las dos preferencias juntas: el backend exige email y push en cada PUT. */
  updatePreferences: (prefs: NotificationPreferences): Promise<void> =>
    api.put("/notifications/preferences", prefs).then(() => undefined),

  /** Registra (o reactiva) el token de Expo Push de este dispositivo. */
  registerPushToken: (token: string): Promise<void> =>
    api.post("/notifications/push/expo/register", { token }).then(() => undefined),

  /** Desactiva el token de Expo Push de este dispositivo (cierre de sesión). */
  unregisterPushToken: (token: string): Promise<void> =>
    api.delete("/notifications/push/expo/unregister", { data: { token } }).then(() => undefined),
};
