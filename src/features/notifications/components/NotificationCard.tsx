// src/features/notifications/components/NotificationCard.tsx — Una fila de la bandeja.
// Las no leídas se distinguen con título en negrita, borde y un punto.
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getNotificationTypeInfo, timeAgo } from "@/features/notifications/notificationSelectors";
import type { AppNotification } from "@/features/notifications/types";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  notification: AppNotification;
  /** Referencia para "hace X min" (la hora de la última carga de la lista). */
  now: number;
  onPress: (notification: AppNotification) => void;
};

export default function NotificationCard({ notification: n, now, onPress }: Props) {
  const c = useColors();
  const info = getNotificationTypeInfo(n.tipo);

  return (
    <Pressable
      onPress={() => onPress(n)}
      accessibilityRole="button"
      accessibilityLabel={`${n.leida ? "" : "Sin leer. "}${info.label}. ${n.titulo}. ${n.mensaje}`}
      style={({ pressed }) => [
        styles.fila,
        cardShadow,
        {
          backgroundColor: c.card,
          borderColor: n.leida ? c.border : c.brandPrimary + "66",
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.icono, { backgroundColor: c.brandPrimary + "18" }]}>
        <Ionicons name={info.icon} size={20} color={c.brandPrimary} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.cabecera}>
          <Text style={[styles.tipo, { color: c.textMuted }]}>{info.label.toUpperCase()}</Text>
          <Text style={{ color: c.textMuted, fontSize: 11 }}>{timeAgo(n.created_at, now)}</Text>
        </View>
        <Text style={[styles.titulo, { color: c.text, fontWeight: n.leida ? "600" : "800" }]} numberOfLines={2}>
          {n.titulo}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
          {n.mensaje}
        </Text>
      </View>

      {!n.leida ? <View style={[styles.punto, { backgroundColor: c.brandPrimary }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  icono: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  tipo: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  titulo: { fontSize: 15 },
  punto: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
});
