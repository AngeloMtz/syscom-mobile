// src/app/chatbot.tsx — Chat con el asistente virtual.
// Solo presentación: la conversación, el envío y los errores vienen de
// useChatbot. Siempre hay una salida a una persona (barra superior); si el
// cliente la pide en el chat, el bot lo detecta y se destaca al final.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
  type HostInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CHAT_GREETING, CHAT_SUGGESTIONS } from "@/features/chatbot/chatSelectors";
import ChatBubble from "@/features/chatbot/components/ChatBubble";
import ChatComposer from "@/features/chatbot/components/ChatComposer";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";
import type { ChatMessage } from "@/features/chatbot/types";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

const GREETING: ChatMessage = { id: "greeting", role: "assistant", content: CHAT_GREETING };

export default function ChatbotScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messages, escalated, isSending, error, send, retry } = useChatbot();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const frameRef = useRef<HostInstance>(null);
  // Distancia del contenido al borde superior de la ventana (barra de estado + header):
  // KeyboardAvoidingView la necesita para calcular cuánto subir el teclado.
  const [offset, setOffset] = useState(0);

  const talkToPerson = () => router.push("/live-chat");

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <ChatBubble message={GREETING} onRetry={retry} />
      {messages.length === 0 ? (
        <View style={styles.chips}>
          {CHAT_SUGGESTIONS.map((q) => (
            <Pressable
              key={q}
              onPress={() => send(q)}
              accessibilityRole="button"
              accessibilityLabel={q}
              style={[styles.chip, { borderColor: c.brandPrimary, backgroundColor: c.card }]}
            >
              <Text style={{ color: c.brandPrimary, fontWeight: "600", fontSize: 13 }}>{q}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md }}>
      {isSending ? (
        <View style={[styles.typing, { backgroundColor: c.card, borderColor: c.border }]} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color={c.brandPrimary} />
          <Text style={{ color: c.textMuted, fontSize: 13 }}>Escribiendo…</Text>
        </View>
      ) : null}
      {escalated ? (
        <View style={[styles.escalate, { backgroundColor: c.card, borderColor: c.brandPrimary }]}>
          <Text style={{ color: c.text, fontWeight: "700" }}>Te conectamos con un asesor</Text>
          <Pressable
            onPress={talkToPerson}
            accessibilityRole="button"
            accessibilityLabel="Hablar con una persona"
            style={[styles.escalateBtn, { backgroundColor: c.brandPrimary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Hablar con una persona</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <View
      ref={frameRef}
      style={{ flex: 1, backgroundColor: c.background }}
      onLayout={() => frameRef.current?.measureInWindow((_x, y) => setOffset(y))}
    >
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={offset} style={{ flex: 1 }}>
        <Pressable
          onPress={talkToPerson}
          accessibilityRole="button"
          accessibilityLabel="Hablar con una persona"
          style={[styles.humanBar, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <Ionicons name="headset" size={18} color={c.brandPrimary} />
          <Text style={{ flex: 1, color: c.textMuted, fontSize: 13 }}>¿Prefieres hablar con una persona?</Text>
          <Text style={{ color: c.brandPrimary, fontWeight: "800", fontSize: 13 }}>Hablar con un asesor</Text>
        </Pressable>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} onRetry={retry} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          style={{ flex: 1 }}
        />

        {error ? (
          <Text accessibilityLiveRegion="polite" style={[styles.error, { color: c.danger }]}>
            {error}
          </Text>
        ) : null}

        <View style={{ paddingBottom: Math.max(insets.bottom, spacing.sm), backgroundColor: c.card }}>
          <ChatComposer onSend={send} sending={isSending} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  humanBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: spacing.lg, flexGrow: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  escalate: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
  escalateBtn: { borderRadius: radius.pill, paddingVertical: spacing.sm, alignItems: "center" },
  error: { fontSize: 12, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
});
