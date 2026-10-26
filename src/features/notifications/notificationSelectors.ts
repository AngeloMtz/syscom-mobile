// src/features/notifications/notificationSelectors.ts — Reglas de la bandeja.
// Funciones puras: no tocan la red ni React.
import type { AppNotification, NotificationsPage } from "@/features/notifications/types";

/**
 * Une las páginas en una lista. Si llega una notificación nueva mientras se
 * pagina, la misma puede venir en dos páginas: se conserva la primera aparición.
 * No modifica las páginas recibidas.
 */
export function flattenNotifications(pages: NotificationsPage[]): AppNotification[] {
  const seen = new Set<number>();
  const result: AppNotification[] = [];
  for (const page of pages) {
    for (const n of page.data) {
      if (seen.has(n.id_notificacion)) continue;
      seen.add(n.id_notificacion);
      result.push(n);
    }
  }
  return result;
}

/** Número de la página siguiente, o undefined si ya se cargó la última. */
export function getNextNotificationsPage(last: NotificationsPage): number | undefined {
  return last.page < last.totalPages ? last.page + 1 : undefined;
}

/**
 * Páginas con la notificación `id` marcada como leída; sin `id`, todas. Devuelve
 * páginas nuevas (no modifica las recibidas) para poder escribirlas en la caché.
 */
export function markAsReadInPages(pages: NotificationsPage[], id?: number): NotificationsPage[] {
  return pages.map((page) => ({
    ...page,
    data: page.data.map((n) => (id === undefined || n.id_notificacion === id ? { ...n, leida: true } : n)),
  }));
}

/** Cuántas de las notificaciones cargadas siguen sin leer. */
export function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.leida).length;
}

/** Busca una notificación por id entre las ya cargadas en la bandeja (sin endpoint de detalle). */
export function findNotificationById(notifications: AppNotification[], id: number): AppNotification | undefined {
  return notifications.find((n) => n.id_notificacion === id);
}

/** Texto y icono (Ionicons) de cada tipo. Un tipo desconocido se trata como aviso general. */
export function getNotificationTypeInfo(tipo: string): {
  label: string;
  icon: "cube-outline" | "megaphone-outline" | "alert-circle-outline" | "notifications-outline";
} {
  switch (tipo) {
    case "pedido":
      return { label: "Pedido", icon: "cube-outline" };
    case "campana":
      return { label: "Promoción", icon: "megaphone-outline" };
    case "stock":
      return { label: "Stock", icon: "alert-circle-outline" };
    default:
      return { label: "Aviso", icon: "notifications-outline" };
  }
}

/**
 * Hace cuánto ocurrió algo, en palabras ("ahora", "hace 5 min", "ayer"…).
 * Recibe `now` para que el resultado dependa solo de sus argumentos. Una fecha
 * inválida o futura se muestra como "ahora".
 */
export function timeAgo(dateStr: string, now: number): string {
  const time = new Date(dateStr).getTime();
  if (!Number.isFinite(time)) return "ahora";
  const mins = Math.floor((now - time) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}
