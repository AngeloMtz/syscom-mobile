// src/features/chatbot/liveChat/liveChatReducer.ts — Estado del chat en vivo.
// Función pura: los eventos del socket se traducen a acciones (ver useLiveChat).
import { toLiveSender } from "@/features/chatbot/liveChat/liveChatSelectors";
import type {
  BusinessHours,
  CloseReason,
  LiveChatState,
  LiveMessage,
  LiveSender,
  ServerMessage,
  UnavailableReason,
} from "@/features/chatbot/liveChat/types";

export const initialLiveChatState: LiveChatState = {
  status: "idle",
  conversationId: null,
  position: null,
  agentName: null,
  messages: [],
  agentTyping: false,
  notice: null,
  unavailable: null,
  closedReason: null,
  error: null,
  seq: 0,
};

export type LiveChatAction =
  | { type: "connecting" }
  | { type: "queued"; conversationId: number; position: number }
  | { type: "position"; position: number }
  | { type: "started"; agentName: string; conversationId?: number; createdAt: string }
  | { type: "message"; from: LiveSender; content: string; createdAt: string }
  | { type: "resumed"; conversationId: number; messages: ServerMessage[] }
  | { type: "typing"; typing: boolean }
  | { type: "notice"; message: string | null }
  | { type: "unavailable"; reason: UnavailableReason; hours: BusinessHours | null }
  | { type: "closed"; reason: CloseReason }
  /** Mensaje de error del servidor: si ya hay conversación, es un aviso y el chat sigue. */
  | { type: "error"; message: string }
  /** No se pudo conectar (o se perdió la conexión para siempre): siempre es fatal. */
  | { type: "failed"; message: string }
  | { type: "reset" };

function append(state: LiveChatState, from: LiveSender, content: string, createdAt: string): LiveChatState {
  const seq = state.seq + 1;
  const message: LiveMessage = { id: String(seq), from, content, createdAt };
  return { ...state, messages: [...state.messages, message], seq };
}

export function liveChatReducer(state: LiveChatState, action: LiveChatAction): LiveChatState {
  switch (action.type) {
    case "connecting":
      return { ...initialLiveChatState, status: "connecting", seq: state.seq };

    case "queued":
      return { ...state, status: "queued", conversationId: action.conversationId, position: action.position, notice: null };

    case "position":
      return state.status === "queued" ? { ...state, position: action.position } : state;

    case "started": {
      const next: LiveChatState = {
        ...state,
        status: "active",
        conversationId: action.conversationId ?? state.conversationId,
        agentName: action.agentName,
        position: null,
        notice: null,
      };
      return append(next, "system", `${action.agentName} se unió a la conversación.`, action.createdAt);
    }

    case "message": {
      const next = append(state, action.from, action.content, action.createdAt);
      return action.from === "agent" ? { ...next, agentTyping: false } : next;
    }

    case "resumed": {
      let seq = state.seq;
      const messages = action.messages.map((m): LiveMessage => {
        seq += 1;
        return { id: String(seq), from: toLiveSender(m.tipo_remitente), content: m.contenido, createdAt: m.created_at };
      });
      return { ...state, status: "active", conversationId: action.conversationId, position: null, notice: null, messages, seq };
    }

    case "typing":
      return { ...state, agentTyping: action.typing };

    case "notice":
      return { ...state, notice: action.message };

    case "unavailable":
      return { ...state, status: "unavailable", unavailable: { reason: action.reason, hours: action.hours }, agentTyping: false };

    case "closed":
      return { ...state, status: "closed", closedReason: action.reason, conversationId: null, position: null, notice: null, agentTyping: false };

    case "error":
      return state.status === "active" || state.status === "queued"
        ? { ...state, notice: action.message }
        : { ...state, status: "error", error: action.message };

    case "failed":
      return { ...state, status: "error", error: action.message, agentTyping: false };

    case "reset":
      return { ...initialLiveChatState, seq: state.seq };
  }
}
