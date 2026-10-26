// src/features/chatbot/components/ChatFab.tsx — Botón flotante que abre el chat.
// Va en el layout de pestañas, sobre la barra inferior. Se oculta donde taparía
// algo importante (ver shouldShowChatFab).
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CHAT_ROUTE, shouldShowChatFab } from "@/features/chatbot/chatSelectors";
import { cardShadow, spacing, useColors } from "@/shared/theme/useColors";

/** Alto de la barra de pestañas de React Navigation (sin el área segura inferior). */
const TAB_BAR_HEIGHT = 49;

export default function ChatFab() {
  const c = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (!shouldShowChatFab(pathname)) return null;

  return (
    <Pressable
      onPress={() => router.push(CHAT_ROUTE)}
      accessibilityRole="button"
      accessibilityLabel="Abrir asistente virtual"
      style={[styles.fab, cardShadow, { backgroundColor: c.brandDeep, bottom: TAB_BAR_HEIGHT + insets.bottom + spacing.lg }]}
    >
      <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
