// src/features/chatbot/components/LiveMessageBubble.tsx — Un mensaje del chat en vivo.
// Cliente y asesor son burbujas (texto tal cual, sin markdown); el sistema es un aviso centrado.
import { Text } from "react-native";

import ChatBubble from "@/features/chatbot/components/ChatBubble";
import type { LiveMessage } from "@/features/chatbot/liveChat/types";
import { useColors } from "@/shared/theme/useColors";

export default function LiveMessageBubble({ message }: { message: LiveMessage }) {
  const c = useColors();

  if (message.from === "system") {
    return <Text style={{ color: c.textMuted, fontSize: 12, textAlign: "center" }}>{message.content}</Text>;
  }

  return (
    <ChatBubble
      message={{ id: message.id, role: message.from === "client" ? "user" : "assistant", content: message.content }}
      plain
      label={message.from === "client" ? undefined : "Asesor"}
    />
  );
}
