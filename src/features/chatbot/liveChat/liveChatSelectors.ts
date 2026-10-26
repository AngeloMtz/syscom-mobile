// src/features/chatbot/liveChat/liveChatSelectors.ts — Reglas y textos del chat en vivo. Funciones puras.
import type {
  BusinessHours,
  CloseReason,
  LiveSender,
  UnavailableReason,
} from "@/features/chatbot/liveChat/types";

/** El socket vive en el mismo host que la API, en el namespace /contact (sin el prefijo /api). */
export function getSocketUrl(apiUrl: string): string {
  return `${apiUrl.replace(/\/+$/, "").replace(/\/api$/, "")}/contact`;
}

/** Cualquier remitente que no sea cliente o asesor se trata como aviso del sistema. */
export function toLiveSender(value: string): LiveSender {
  return value === "client" || value === "agent" ? value : "system";
}

const DAYS: [keyof BusinessHours, string][] = [
  ["lunes", "Lunes"],
  ["martes", "Martes"],
  ["miercoles", "Miércoles"],
  ["jueves", "Jueves"],
  ["viernes", "Viernes"],
  ["sabado", "Sábado"],
  ["domingo", "Domingo"],
];

/** Horario de atención por día, de lunes a domingo; los días sin dato se omiten. */
export function formatBusinessHours(hours: BusinessHours | null): { day: string; range: string }[] {
  if (!hours) return [];
  return DAYS.flatMap(([key, day]) => {
    const value = hours[key];
    if (!value) return [];
    return [{ day, range: value.activo ? `${value.inicio} – ${value.fin}` : "Cerrado" }];
  });
}

export function unavailableCopy(reason: UnavailableReason): { title: string; body: string } {
  switch (reason) {
    case "closed":
      return { title: "Fuera de horario", body: "Nuestros asesores atienden en el siguiente horario." };
    case "no_agent":
      return {
        title: "No hay asesores disponibles",
        body: "Todos nuestros asesores están ocupados o desconectados en este momento. Puedes contactarnos por otro medio.",
      };
    case "blocked":
      return {
        title: "No se pudo iniciar el chat",
        body: "Por ahora no es posible chatear con un asesor. Puedes contactarnos por otro medio.",
      };
  }
}

export function closedCopy(reason: CloseReason | null): string {
  switch (reason) {
    case "agent":
      return "El asesor cerró la conversación.";
    case "client":
      return "Cerraste la conversación.";
    case "timeout":
      return "La conversación se cerró por inactividad.";
    default:
      return "La conversación terminó.";
  }
}

export function queueText(position: number | null): string {
  return position === null ? "Esperando a un asesor…" : `Eres el número ${position} en la fila.`;
}

/** Texto del aviso que manda el servidor (chat:warning). */
export function warningText(payload: { reason?: string; secondsLeft?: number; message?: string }): string {
  if (payload.reason === "inactivity") {
    return `¿Sigues ahí? La conversación se cerrará en ${payload.secondsLeft ?? 60} segundos por inactividad.`;
  }
  if (payload.reason === "agent_disconnected") {
    return payload.message ?? "El asesor se desconectó. Te estamos reasignando…";
  }
  return payload.message ?? "Aviso del servidor.";
}
