// src/features/chatbot/types.ts
// Forma real de /chatbot (syscom-backend, modules/chatbot): público, sin sesión.
// El historial vive en el cliente durante la sesión de la app.

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** El envío de este mensaje falló: se puede reintentar. */
  failed?: boolean;
}

export interface ChatbotReply {
  message: string;
  /** El cliente pidió hablar con una persona. */
  escalate: boolean;
}
