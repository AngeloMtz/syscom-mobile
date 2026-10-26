// src/features/chatbot/validation.ts — Reglas del mensaje antes de enviarlo.
// El backend rechaza mensajes vacíos o de más de 500 caracteres (mensajeSchema).

export const CHAT_MESSAGE_MAX = 500;

export type ChatMessageCheck = { ok: true; text: string } | { ok: false; error: string };

export function validateChatMessage(raw: string): ChatMessageCheck {
  const text = raw.trim();
  if (text.length === 0) return { ok: false, error: "Escribe un mensaje." };
  if (text.length > CHAT_MESSAGE_MAX) {
    return { ok: false, error: `El mensaje no puede pasar de ${CHAT_MESSAGE_MAX} caracteres.` };
  }
  return { ok: true, text };
}
