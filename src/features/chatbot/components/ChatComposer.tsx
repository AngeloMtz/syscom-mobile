// src/features/chatbot/components/ChatComposer.tsx — Caja para escribir y enviar.
// `onSend` devuelve el motivo si no se envió (o null si salió): solo entonces se
// vacía la caja, así no se pierde lo escrito.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CHAT_MESSAGE_MAX } from "@/features/chatbot/validation";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  onSend: (text: string) => string | null;
  /** Hay una respuesta en camino: no se puede enviar otro mensaje. */
  sending: boolean;
  /** Largo máximo del mensaje; el contador aparece al llegar al 80 %. */
  maxLength?: number;
  placeholder?: string;
  /** Se llama en cada cambio del texto (p. ej. para avisar que se está escribiendo). */
  onTyping?: () => void;
};

export default function ChatComposer({
  onSend,
  sending,
  maxLength = CHAT_MESSAGE_MAX,
  placeholder = "Escribe tu mensaje…",
  onTyping,
}: Props) {
  const c = useColors();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canSend = !sending && text.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    const reason = onSend(text);
    if (reason === null) {
      setText("");
      setError(null);
    } else {
      setError(reason);
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: c.card, borderColor: c.border }]}>
      {error ? <Text style={{ color: c.danger, fontSize: 12, marginBottom: spacing.xs }}>{error}</Text> : null}
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            onTyping?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          accessibilityLabel="Mensaje"
          multiline
          maxLength={maxLength}
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
        />
        <Pressable
          onPress={submit}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !canSend }}
          style={[styles.send, { backgroundColor: canSend ? c.brandPrimary : c.border }]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
      {text.length >= Math.floor(maxLength * 0.8) ? (
        <Text style={{ color: c.textMuted, fontSize: 11, alignSelf: "flex-end", marginTop: spacing.xs }}>
          {`${text.length}/${maxLength}`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
