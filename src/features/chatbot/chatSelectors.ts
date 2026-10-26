// src/features/chatbot/chatSelectors.ts — Reglas y textos del chat. Funciones puras.

export const CHAT_ROUTE = "/chatbot" as const;

export const CHAT_GREETING =
  "¡Hola! Soy el asistente virtual de SySCOM. Puedo ayudarte con productos, servicios, horarios y políticas.";

/** Preguntas de arranque: al tocar una se envía como mensaje. */
export const CHAT_SUGGESTIONS = [
  "¿Qué laptops tienen?",
  "¿Cuál es su horario de atención?",
  "¿Qué servicios técnicos ofrecen?",
] as const;

/** Pantallas (pestañas) donde el botón flotante taparía algo importante: el pago del carrito. */
const FAB_HIDDEN_ON = ["/cart"];

export function shouldShowChatFab(pathname: string): boolean {
  return !FAB_HIDDEN_ON.includes(pathname);
}

export type ChatSegment = { text: string; bold: boolean };

/**
 * El bot responde con markdown ("**Lunes:** 09:00", "- item"). Se muestran las
 * negritas y las viñetas; el resto del markdown no se interpreta.
 */
export function parseChatText(raw: string): ChatSegment[] {
  const text = raw.replace(/^[-*] /gm, "• ");
  const segments: ChatSegment[] = [];
  const bold = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = bold.exec(text)) !== null) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index), bold: false });
    segments.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), bold: false });
  return segments;
}
