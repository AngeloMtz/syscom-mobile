// src/app/notifications/[id].tsx — Detalle de una notificación de la bandeja.
// Solo presentación: la notificación viene ya cargada desde la bandeja (sin
// endpoint de detalle en el backend), vía useNotificationDetail.
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import RequireAuth from "@/features/auth/components/RequireAuth";
import { useNotificationDetail } from "@/features/notifications/hooks/useNotificationDetail";
import { getNotificationTypeInfo } from "@/features/notifications/notificationSelectors";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

function formatFechaCompleta(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
}

function NotificationDetailScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const notifId = Number(id);
  const { notification, isLoading } = useNotificationDetail(notifId);

  const title = <Stack.Screen options={{ title: "Notificación" }} />;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="notifications-off-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>Notificación no encontrada</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>Vuelve a la bandeja para verla desde la lista.</Text>
      </View>
    );
  }

  const info = getNotificationTypeInfo(notification.tipo);

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      {title}
      <View style={[styles.icono, { backgroundColor: c.brandPrimary + "18" }]}>
        <Ionicons name={info.icon} size={28} color={c.brandPrimary} />
      </View>
      <Text style={[styles.tipo, { color: c.brandPrimary }]}>{info.label.toUpperCase()}</Text>
      <Text style={[styles.titulo, { color: c.text }]}>{notification.titulo}</Text>
      <Text style={[styles.fecha, { color: c.textMuted }]}>{formatFechaCompleta(notification.created_at)}</Text>
      <View style={[styles.cuerpo, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.mensaje, { color: c.text }]}>{notification.mensaje}</Text>
      </View>
    </ScrollView>
  );
}

export default function NotificationDetailRoute() {
  return (
    <RequireAuth>
      <NotificationDetailScreen />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  content: { padding: spacing.lg, alignItems: "center", gap: spacing.sm, flexGrow: 1 },
  icono: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  tipo: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  titulo: { fontSize: 19, fontWeight: "800", textAlign: "center" },
  fecha: { fontSize: 13 },
  cuerpo: { width: "100%", borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginTop: spacing.md },
  mensaje: { fontSize: 15, lineHeight: 22 },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
});
