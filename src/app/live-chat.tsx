// src/app/live-chat.tsx — Chat en vivo con un asesor.
// Solo presentación: la conexión, la fila y los mensajes vienen de useLiveChat.
// Con sesión conecta solo; sin cuenta pide nombre y correo. Salir de la
// pantalla termina la conversación.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatComposer from "@/features/chatbot/components/ChatComposer";
import LiveGuestForm from "@/features/chatbot/components/LiveGuestForm";
import LiveMessageBubble from "@/features/chatbot/components/LiveMessageBubble";
import { useLiveChat } from "@/features/chatbot/hooks/useLiveChat";
import {
  closedCopy,
  formatBusinessHours,
  queueText,
  unavailableCopy,
} from "@/features/chatbot/liveChat/liveChatSelectors";
import type { LiveMessage } from "@/features/chatbot/liveChat/types";
import { LIVE_MESSAGE_MAX } from "@/features/chatbot/liveChat/validation";
import { useAuthStore } from "@/shared/store/authStore";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type IconName = ComponentProps<typeof Ionicons>["name"];

function Action({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.action,
        primary ? { backgroundColor: c.brandPrimary } : { backgroundColor: c.card, borderColor: c.border, borderWidth: 1 },
      ]}
    >
      <Text style={{ color: primary ? "#fff" : c.text, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

function Panel({
  icon,
  title,
  body,
  loading = false,
  children,
}: {
  icon: IconName;
  title: string;
  body?: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  const c = useColors();
  return (
    <View style={[styles.center, { backgroundColor: c.background }]}>
      {loading ? (
        <ActivityIndicator size="large" color={c.brandPrimary} />
      ) : (
        <Ionicons name={icon} size={44} color={c.textMuted} />
      )}
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {body ? <Text style={[styles.body, { color: c.textMuted }]}>{body}</Text> : null}
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

export default function LiveChatScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { state, start, send, notifyTyping, stillHere, leave, restart } = useLiveChat();
  const listRef = useRef<FlatList<LiveMessage>>(null);
  const frameRef = useRef<View>(null);
  // Distancia del contenido al borde superior de la ventana: KeyboardAvoidingView la necesita.
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (isAuthenticated) start();
  }, [isAuthenticated, start]);

  const goBack = () => router.back();
  const goContact = () => router.push("/contact");

  if (state.status === "idle" && !isAuthenticated) {
    return (
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={styles.pad}
        keyboardShouldPersistTaps="handled"
      >
        <LiveGuestForm onSubmit={start} />
      </ScrollView>
    );
  }

  if (state.status === "idle" || state.status === "connecting") {
    return <Panel icon="chatbubbles-outline" title="Conectando con un asesor…" loading />;
  }

  if (state.status === "queued") {
    return (
      <Panel icon="time-outline" title="Estamos buscando un asesor" body={queueText(state.position)}>
        {state.notice ? <Text style={[styles.body, { color: c.textMuted }]}>{state.notice}</Text> : null}
        <Action
          label="Salir de la fila"
          onPress={() => {
            leave();
            goBack();
          }}
        />
      </Panel>
    );
  }

  if (state.status === "unavailable" && state.unavailable) {
    const copy = unavailableCopy(state.unavailable.reason);
    const rows = formatBusinessHours(state.unavailable.hours);
    return (
      <Panel icon="moon-outline" title={copy.title} body={copy.body}>
        {rows.map((r) => (
          <View key={r.day} style={styles.hoursRow}>
            <Text style={{ color: c.text, fontWeight: "600" }}>{r.day}</Text>
            <Text style={{ color: c.textMuted }}>{r.range}</Text>
          </View>
        ))}
        <Action primary label="Ver contacto" onPress={goContact} />
        <Action label="Volver al asistente" onPress={goBack} />
      </Panel>
    );
  }

  if (state.status === "closed") {
    return (
      <Panel icon="checkmark-circle-outline" title="Conversación terminada" body={closedCopy(state.closedReason)}>
        <Action primary label="Nueva conversación" onPress={restart} />
        <Action label="Volver al asistente" onPress={goBack} />
      </Panel>
    );
  }

  if (state.status === "error") {
    return (
      <Panel icon="cloud-offline-outline" title="No pudimos conectar el chat" body={state.error ?? undefined}>
        <Action primary label="Reintentar" onPress={restart} />
        <Action label="Ver contacto" onPress={goContact} />
      </Panel>
    );
  }

  return (
    <View
      ref={frameRef}
      style={{ flex: 1, backgroundColor: c.background }}
      onLayout={() => frameRef.current?.measureInWindow((_x, y) => setOffset(y))}
    >
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={offset} style={{ flex: 1 }}>
        <View style={[styles.agentBar, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="headset" size={18} color={c.brandPrimary} />
          <Text style={{ flex: 1, color: c.text, fontWeight: "700" }}>
            {state.agentName ? `Asesor: ${state.agentName}` : "Chat con un asesor"}
          </Text>
          <Pressable
            onPress={() => {
              leave();
              goBack();
            }}
            accessibilityRole="button"
            accessibilityLabel="Terminar chat"
            hitSlop={8}
          >
            <Text style={{ color: c.danger, fontWeight: "800", fontSize: 13 }}>Terminar</Text>
          </Pressable>
        </View>

        {state.notice ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.notice, { backgroundColor: c.card, borderColor: c.brandPrimary }]}
          >
            <Text style={{ flex: 1, color: c.text, fontSize: 13 }}>{state.notice}</Text>
            <Pressable onPress={stillHere} accessibilityRole="button" accessibilityLabel="Sigo aquí" hitSlop={8}>
              <Text style={{ color: c.brandPrimary, fontWeight: "800", fontSize: 13 }}>Sigo aquí</Text>
            </Pressable>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={state.messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <LiveMessageBubble message={item} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListFooterComponent={
            state.agentTyping ? (
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: spacing.sm }}>
                El asesor está escribiendo…
              </Text>
            ) : null
          }
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          style={{ flex: 1 }}
        />

        <View style={{ paddingBottom: Math.max(insets.bottom, spacing.sm), backgroundColor: c.card }}>
          <ChatComposer
            onSend={send}
            sending={false}
            maxLength={LIVE_MESSAGE_MAX}
            placeholder="Escribe a tu asesor…"
            onTyping={notifyTyping}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  body: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.md },
  action: { height: 48, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  agentBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  list: { padding: spacing.lg, flexGrow: 1 },
});
