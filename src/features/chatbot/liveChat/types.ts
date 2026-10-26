// src/features/chatbot/liveChat/types.ts
// Eventos del namespace /contact de Socket.io (syscom-backend, modules/contact):
// el chat en vivo con asesores, el mismo que usa la web.

export type LiveSender = "client" | "agent" | "system";

export type UnavailableReason = "closed" | "no_agent" | "blocked";

export type CloseReason = "agent" | "client" | "timeout";

export interface LiveMessage {
  id: string;
  from: LiveSender;
  content: string;
  createdAt: string;
}

export interface DayHours {
  inicio: string;
  fin: string;
  activo: boolean;
}

export type BusinessHours = Partial<
  Record<"lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo", DayHours>
>;

/** Mensaje tal como lo guarda el backend (se recibe al reanudar una conversación). */
export interface ServerMessage {
  id_mensaje: number;
  tipo_remitente: string;
  contenido: string;
  created_at: string;
}

export interface GuestData {
  name: string;
  email: string;
}

export type LiveStatus = "idle" | "connecting" | "queued" | "active" | "unavailable" | "closed" | "error";

export interface LiveChatState {
  status: LiveStatus;
  conversationId: number | null;
  /** Lugar en la fila mientras se espera a un asesor. */
  position: number | null;
  agentName: string | null;
  messages: LiveMessage[];
  agentTyping: boolean;
  /** Aviso no fatal: inactividad, asesor desconectado, conexión perdida, límite de mensajes. */
  notice: string | null;
  unavailable: { reason: UnavailableReason; hours: BusinessHours | null } | null;
  closedReason: CloseReason | null;
  error: string | null;
  /** Contador para dar un id distinto a cada mensaje. */
  seq: number;
}
