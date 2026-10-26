// src/features/chatbot/repositories/chatbotRepository.ts — Acceso a /chatbot.
// Público: no exige sesión (si hay JWT, el interceptor lo manda igual). Única
// capa que conoce la ruta y la forma de la respuesta { success, data: { message, escalate } }.
import api from "@/shared/api/client";
import type { ChatbotReply } from "@/features/chatbot/types";

/** El bot puede encadenar consultas a la base antes de responder: necesita más que el timeout general. */
export const CHATBOT_TIMEOUT_MS = 30000;

export const CHATBOT_FALLBACK_REPLY = "No pude responder en este momento. ¿Puedes intentarlo de nuevo?";

export const chatbotRepository = {
  /** Envía un mensaje dentro de la sesión `sessionId` (UUID) y devuelve la respuesta del bot. */
  sendMessage: (sessionId: string, mensaje: string, nombreUsuario?: string): Promise<ChatbotReply> =>
    api
      .post(
        "/chatbot/message",
        { sessionId, mensaje, ...(nombreUsuario ? { nombreUsuario } : {}) },
        { timeout: CHATBOT_TIMEOUT_MS },
      )
      .then((r) => {
        const message = r.data?.data?.message;
        return {
          message: typeof message === "string" && message.trim() ? message : CHATBOT_FALLBACK_REPLY,
          escalate: r.data?.data?.escalate === true,
        };
      }),
};
