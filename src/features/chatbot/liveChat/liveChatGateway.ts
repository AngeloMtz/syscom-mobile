// src/features/chatbot/liveChat/liveChatGateway.ts — Conexión con el chat en vivo.
// Es al socket lo que un repository a la API REST: única capa que conoce la URL
// y los nombres de los eventos de /contact. Hooks y pantallas solo ven callbacks.
import { io } from "socket.io-client";

import { getSocketUrl, warningText } from "@/features/chatbot/liveChat/liveChatSelectors";
import type {
  BusinessHours,
  CloseReason,
  GuestData,
  ServerMessage,
  UnavailableReason,
} from "@/features/chatbot/liveChat/types";
import { API_URL } from "@/shared/api/client";
import { getTokenSync } from "@/shared/api/secureToken";

export interface LiveChatHandlers {
  onQueued: (p: { conversationId: number; position: number }) => void;
  onPosition: (position: number) => void;
  onStarted: (p: { agentName: string; conversationId?: number }) => void;
  onMessage: (p: { content: string; senderType: string; createdAt?: string }) => void;
  onResumed: (p: { conversationId: number; messages: ServerMessage[] }) => void;
  onTyping: () => void;
  onNotice: (message: string) => void;
  onUnavailable: (p: { reason: UnavailableReason; hours: BusinessHours | null }) => void;
  onClosed: (reason: CloseReason) => void;
  onError: (message: string) => void;
  /** Se agotaron los reintentos de conexión. */
  onFailed: (message: string) => void;
}

export interface LiveChatInit {
  /** Quien chatea sin cuenta debe dar nombre y correo; con sesión se identifica por el JWT. */
  guest?: GuestData;
  productId?: number;
}

export interface LiveChatConnection {
  sendMessage: (content: string) => void;
  sendTyping: () => void;
  /** Reinicia el temporizador de inactividad del servidor. */
  ping: () => void;
  /** El cliente termina la conversación. */
  leave: () => void;
  /** Cierra la conexión sin terminar la conversación. */
  close: () => void;
}

export const liveChatGateway = {
  open(handlers: LiveChatHandlers, init: LiveChatInit = {}): LiveChatConnection {
    const token = getTokenSync();
    const socket = io(getSocketUrl(API_URL), {
      transports: ["websocket"],
      auth: token ? { token } : {},
      reconnectionAttempts: 5,
    });

    let conversationId: number | null = null;
    let closed = false;

    // Tras cerrar, ningún evento rezagado debe llegar a la pantalla.
    const on = (event: string, fn: (payload: any) => void) =>
      socket.on(event, (payload: any) => {
        if (!closed) fn(payload);
      });

    // También corre al reconectar: con conversationId, el servidor reanuda la misma conversación.
    on("connect", () => {
      socket.emit("chat:init", {
        ...(conversationId !== null ? { existingConversationId: conversationId } : {}),
        ...(init.guest ? { guestName: init.guest.name, guestEmail: init.guest.email } : {}),
        ...(init.productId ? { productId: init.productId } : {}),
      });
    });

    on("chat:queued", (p) => {
      conversationId = p.conversationId;
      handlers.onQueued({ conversationId: p.conversationId, position: p.position });
    });
    on("chat:position", (p) => handlers.onPosition(p.position));
    on("chat:started", (p) => {
      if (typeof p.conversationId === "number") conversationId = p.conversationId;
      handlers.onStarted({ agentName: p.agentName, conversationId: p.conversationId });
    });
    on("chat:resumed", (p) => {
      conversationId = p.conversationId;
      handlers.onResumed({ conversationId: p.conversationId, messages: Array.isArray(p.messages) ? p.messages : [] });
    });
    on("chat:message", (p) => handlers.onMessage({ content: p.content, senderType: p.senderType, createdAt: p.createdAt }));
    on("chat:typing", () => handlers.onTyping());
    on("chat:warning", (p) => handlers.onNotice(warningText(p ?? {})));
    on("chat:unavailable", (p) => handlers.onUnavailable({ reason: p.reason, hours: p.hours ?? null }));
    on("chat:closed", (p) => {
      conversationId = null;
      handlers.onClosed(p.reason);
    });
    on("chat:error", (p) => handlers.onError(p?.message ?? "Ocurrió un error en el chat."));

    on("disconnect", (reason: string) => {
      if (reason !== "io client disconnect") handlers.onNotice("Conexión perdida. Reconectando…");
    });
    socket.io.on("reconnect_failed", () => {
      if (!closed) handlers.onFailed("No se pudo conectar con el chat. Revisa tu internet e intenta de nuevo.");
    });

    return {
      sendMessage: (content) => socket.emit("chat:message", { content }),
      sendTyping: () => socket.emit("chat:typing"),
      ping: () => socket.emit("chat:ping"),
      leave: () => {
        socket.emit("chat:leave");
        closed = true;
        socket.disconnect();
      },
      close: () => {
        closed = true;
        socket.disconnect();
      },
    };
  },
};
