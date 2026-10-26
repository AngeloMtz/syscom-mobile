// src/features/chatbot/components/ChatBubble.tsx — Un mensaje del chat.
// El del usuario va a la derecha; el del asistente, a la izquierda (con negritas
// y viñetas del markdown del bot). Si el envío falló, ofrece reintentar.
import { Pressable, StyleSheet, Text, View } from "react-native";

import { parseChatText } from "@/features/chatbot/chatSelectors";
import type { ChatMessage } from "@/features/chatbot/types";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  message: ChatMessage;
  /** Reintentar un envío fallido; sin esto no se ofrece el reintento. */
  onRetry?: () => void;
  /** Texto tal cual, sin interpretar markdown (mensajes de personas). */
  plain?: boolean;
  /** Quién habla, para lectores de pantalla; por defecto "Tú" o "Asistente". */
  label?: string;
};

export default function ChatBubble({ message, onRetry, plain = false, label }: Props) {
  const c = useColors();
  const isUser = message.role === "user";
  const segments = isUser || plain ? [{ text: message.content, bold: false }] : parseChatText(message.content);
  const text = segments.map((s) => s.text).join("");

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
      <View
        accessible
        accessibilityLabel={`${label ?? (isUser ? "Tú" : "Asistente")}: ${text}`}
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: c.brandPrimary }
            : { backgroundColor: c.card, borderColor: c.border, borderWidth: 1 },
        ]}
      >
        <Text style={{ color: isUser ? "#fff" : c.text, fontSize: 15, lineHeight: 21 }}>
          {segments.map((s, i) => (
            <Text key={i} style={s.bold ? styles.bold : undefined}>
              {s.text}
            </Text>
          ))}
        </Text>
      </View>
      {message.failed && onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Reintentar envío" hitSlop={8}>
          <Text style={{ color: c.danger, fontSize: 12, fontWeight: "700", marginTop: spacing.xs }}>
            No se envió. Toca para reintentar
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { maxWidth: "85%" },
  rowUser: { alignSelf: "flex-end", alignItems: "flex-end" },
  rowBot: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  bold: { fontWeight: "800" },
});
