// src/features/chatbot/hooks/useLiveChat.ts
// Chat en vivo con un asesor. Une el socket (liveChatGateway) con el estado
// (liveChatReducer); la pantalla solo consume este hook. Salir de la pantalla
// termina la conversación: en la fila o activa avisa al servidor, si no solo cierra.
import { useCallback, useEffect, useReducer, useRef } from "react";

import { liveChatGateway, type LiveChatConnection } from "@/features/chatbot/liveChat/liveChatGateway";
import { initialLiveChatState, liveChatReducer } from "@/features/chatbot/liveChat/liveChatReducer";
import { toLiveSender } from "@/features/chatbot/liveChat/liveChatSelectors";
import type { GuestData } from "@/features/chatbot/liveChat/types";
import { validateLiveMessage } from "@/features/chatbot/liveChat/validation";

/** El indicador "escribiendo…" del asesor se apaga solo si no llegan más avisos. */
export const AGENT_TYPING_MS = 3000;
/** Cada cuánto, como máximo, se avisa al asesor (y al servidor) que el cliente escribe. */
export const TYPING_THROTTLE_MS = 3000;

const now = () => new Date().toISOString();

export function useLiveChat() {
  const [state, dispatch] = useReducer(liveChatReducer, initialLiveChatState);
  const connection = useRef<LiveChatConnection | null>(null);
  const lastGuest = useRef<GuestData | undefined>(undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);
  const statusRef = useRef(state.status);

  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  const clearTypingTimer = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = null;
  }, []);

  const teardown = useCallback(() => {
    clearTypingTimer();
    const status = statusRef.current;
    if (status === "queued" || status === "active") connection.current?.leave();
    else connection.current?.close();
    connection.current = null;
  }, [clearTypingTimer]);

  const start = useCallback(
    (guest?: GuestData) => {
      connection.current?.close();
      lastGuest.current = guest;
      dispatch({ type: "connecting" });
      connection.current = liveChatGateway.open(
        {
          onQueued: (p) => dispatch({ type: "queued", conversationId: p.conversationId, position: p.position }),
          onPosition: (position) => dispatch({ type: "position", position }),
          onStarted: (p) =>
            dispatch({ type: "started", agentName: p.agentName, conversationId: p.conversationId, createdAt: now() }),
          onMessage: (p) =>
            dispatch({ type: "message", from: toLiveSender(p.senderType), content: p.content, createdAt: p.createdAt ?? now() }),
          onResumed: (p) => dispatch({ type: "resumed", conversationId: p.conversationId, messages: p.messages }),
          onTyping: () => {
            dispatch({ type: "typing", typing: true });
            clearTypingTimer();
            typingTimer.current = setTimeout(() => dispatch({ type: "typing", typing: false }), AGENT_TYPING_MS);
          },
          onNotice: (message) => dispatch({ type: "notice", message }),
          onUnavailable: (p) => dispatch({ type: "unavailable", reason: p.reason, hours: p.hours }),
          onClosed: (reason) => dispatch({ type: "closed", reason }),
          onError: (message) => dispatch({ type: "error", message }),
          onFailed: (message) => dispatch({ type: "failed", message }),
        },
        { guest },
      );
    },
    [clearTypingTimer],
  );

  // Cerrada, no disponible o con error: la conexión ya no sirve.
  useEffect(() => {
    if (state.status === "closed" || state.status === "unavailable" || state.status === "error") {
      connection.current?.close();
      connection.current = null;
    }
  }, [state.status]);

  useEffect(() => teardown, [teardown]);

  /** Envía el texto. Devuelve el motivo si no se pudo enviar, o null si salió. */
  const send = (raw: string): string | null => {
    if (state.status !== "active") return "Aún no estás conectado con un asesor.";
    const check = validateLiveMessage(raw);
    if (!check.ok) return check.error;
    connection.current?.sendMessage(check.text);
    dispatch({ type: "message", from: "client", content: check.text, createdAt: now() });
    return null;
  };

  /** Avisa al asesor que el cliente escribe y evita el cierre por inactividad. */
  const notifyTyping = () => {
    const t = Date.now();
    if (t - lastTypingSent.current < TYPING_THROTTLE_MS) return;
    lastTypingSent.current = t;
    connection.current?.sendTyping();
    connection.current?.ping();
  };

  /** Responde al aviso de inactividad. */
  const stillHere = () => {
    connection.current?.ping();
    dispatch({ type: "notice", message: null });
  };

  /** Termina la conversación. */
  const leave = () => {
    clearTypingTimer();
    connection.current?.leave();
    connection.current = null;
    dispatch({ type: "reset" });
  };

  /** Vuelve a conectar con los mismos datos de invitado. */
  const restart = () => start(lastGuest.current);

  return { state, start, send, notifyTyping, stillHere, leave, restart };
}
