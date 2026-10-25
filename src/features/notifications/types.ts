// src/features/notifications/types.ts
// Forma real de /notifications (syscom-backend, modules/notifications): la
// bandeja del cliente y sus preferencias. Es la misma API que usa la web.

/** Tipos que registra el backend: pedido, stock (solo admin) y campaña (promociones). */
export type NotificationType = "pedido" | "stock" | "campana";

export interface AppNotification {
  id_notificacion: number;
  titulo: string;
  mensaje: string;
  tipo: NotificationType | string;
  leida: boolean;
  created_at: string;
  notificacion_historial: { canal: string; enviado: boolean }[];
}

/** Una página de la bandeja. A diferencia de pedidos, los totales vienen al nivel superior. */
export interface NotificationsPage {
  data: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Qué canales quiere el usuario: correo y/o push. */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
}
