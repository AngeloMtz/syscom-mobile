// src/features/chatbot/chatStore.ts — Conversación con el chatbot (Zustand).
// Solo en memoria: cada vez que se abre la app empieza una conversación nueva
// ("historial visible durante la sesión"). El sessionId es un UUID que exige el backend.
import * as Crypto from "expo-crypto";
import { create } from "zustand";

import type { ChatMessage, ChatRole } from "@/features/chatbot/types";

interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  /** El cliente pidió hablar con una persona. */
  escalated: boolean;
  /** Devuelve el sessionId actual; si no hay, crea uno. */
  ensureSession: () => string;
  addMessage: (role: ChatRole, content: string) => ChatMessage;
  setFailed: (id: string, failed: boolean) => void;
  setEscalated: (escalated: boolean) => void;
  /** Borra la conversación (cierre de sesión: otra cuenta no debe verla). */
  reset: () => void;
}

let seq = 0;

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: null,
  messages: [],
  escalated: false,

  ensureSession: () => {
    const actual = get().sessionId;
    if (actual) return actual;
    const nuevo = Crypto.randomUUID();
    set({ sessionId: nuevo });
    return nuevo;
  },

  addMessage: (role, content) => {
    seq += 1;
    const message: ChatMessage = { id: String(seq), role, content };
    set((s) => ({ messages: [...s.messages, message] }));
    return message;
  },

  setFailed: (id, failed) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, failed } : m)) })),

  setEscalated: (escalated) => set({ escalated }),

  reset: () => set({ sessionId: null, messages: [], escalated: false }),
}));
