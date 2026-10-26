// src/features/chatbot/hooks/useChatbot.ts
// Conversación con el chatbot: el mensaje del usuario aparece al instante, la
// respuesta llega con TanStack Query. Si el envío falla, el mensaje queda
// marcado y se reintenta con `retry`. La pantalla solo consume este hook.
import { useMutation } from "@tanstack/react-query";

import { useChatStore } from "@/features/chatbot/chatStore";
import { chatbotRepository } from "@/features/chatbot/repositories/chatbotRepository";
import { validateChatMessage } from "@/features/chatbot/validation";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useAuthStore } from "@/shared/store/authStore";

type Draft = { id: string; text: string };

export function useChatbot() {
  const messages = useChatStore((s) => s.messages);
  const escalated = useChatStore((s) => s.escalated);
  const nombre = useAuthStore((s) => s.user?.nombre);

  const mutation = useMutation({
    mutationFn: ({ text }: Draft) =>
      chatbotRepository.sendMessage(useChatStore.getState().ensureSession(), text, nombre),
    onSuccess: (reply) => {
      const { addMessage, setEscalated } = useChatStore.getState();
      addMessage("assistant", reply.message);
      if (reply.escalate) setEscalated(true);
    },
    onError: (_error, { id }) => useChatStore.getState().setFailed(id, true),
  });

  /** Envía el texto. Devuelve el motivo si no se pudo enviar, o null si salió. */
  const send = (raw: string): string | null => {
    if (mutation.isPending) return "Espera la respuesta anterior.";
    const check = validateChatMessage(raw);
    if (!check.ok) return check.error;
    const message = useChatStore.getState().addMessage("user", check.text);
    mutation.mutate({ id: message.id, text: check.text });
    return null;
  };

  /** Reenvía el último mensaje que falló. */
  const retry = () => {
    if (mutation.isPending) return;
    const store = useChatStore.getState();
    const failed = [...store.messages].reverse().find((m) => m.failed);
    if (!failed) return;
    store.setFailed(failed.id, false);
    mutation.mutate({ id: failed.id, text: failed.content });
  };

  return {
    messages,
    escalated,
    isSending: mutation.isPending,
    error: mutation.isError
      ? apiErrorMessage(mutation.error, "No se pudo enviar el mensaje. Intenta de nuevo.")
      : null,
    send,
    retry,
  };
}
