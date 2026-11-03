// src/app/notifications/index.tsx — Bandeja de notificaciones y preferencias.
// Solo presentación: la paginación, la caché y los estados vienen de los hooks
// de features/notifications. Tocar una notificación sin leer la marca como leída.
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import RequireAuth from "@/features/auth/components/RequireAuth";
import NotificationCard from "@/features/notifications/components/NotificationCard";
import PreferencesCard from "@/features/notifications/components/PreferencesCard";
import { useMarkAllNotificationsRead, useMarkNotificationRead } from "@/features/notifications/hooks/useMarkNotificationsRead";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { countUnread } from "@/features/notifications/notificationSelectors";
import type { AppNotification } from "@/features/notifications/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { spacing, useColors } from "@/shared/theme/useColors";

function NotificationsList() {
  const c = useColors();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    dataUpdatedAt,
  } = useNotifications();
  const marcarUna = useMarkNotificationRead();
  const marcarTodas = useMarkAllNotificationsRead();

  const title = <Stack.Screen options={{ title: "Notificaciones" }} />;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando tus notificaciones…</Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>No pudimos cargar tus notificaciones</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>{apiErrorMessage(error)}</Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          style={[styles.retry, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const notifications = data?.notifications ?? [];
  const sinLeer = countUnread(notifications);

  const abrir = (n: AppNotification) => {
    if (!n.leida) marcarUna.mutate(n.id_notificacion);
    router.push({ pathname: "/notifications/[id]", params: { id: String(n.id_notificacion) } });
  };

  const encabezado = (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <PreferencesCard />
      {notifications.length > 0 ? (
        <View style={styles.barra}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            {sinLeer === 0 ? "Todo al día" : `${sinLeer} sin leer`}
          </Text>
          {sinLeer > 0 ? (
            <Pressable
              onPress={() => marcarTodas.mutate()}
              disabled={marcarTodas.isPending}
              accessibilityRole="button"
              accessibilityLabel="Marcar todas como leídas"
              hitSlop={8}
            >
              <Text style={{ color: c.brandSecondary, fontWeight: "700", fontSize: 13 }}>
                {marcarTodas.isPending ? "Marcando…" : "Marcar todas como leídas"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      {title}
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id_notificacion)}
        contentContainerStyle={styles.list}
        style={{ backgroundColor: c.background }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => <NotificationCard notification={item} now={dataUpdatedAt} onPress={abrir} />}
        ListHeaderComponent={encabezado}
        onRefresh={refetch}
        refreshing={isRefetching && !isFetchingNextPage}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="notifications-off-outline" size={44} color={c.textMuted} />
            <Text style={[styles.titleText, { color: c.text }]}>Sin notificaciones</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>
              Aquí verás los avisos de tus pedidos y las promociones.
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} color={c.brandPrimary} />
          ) : isFetchNextPageError ? (
            <Pressable onPress={() => fetchNextPage()} style={styles.footer} accessibilityRole="button">
              <Text style={{ color: c.brandPrimary, fontWeight: "700" }}>
                No se pudo cargar más. Toca para reintentar
              </Text>
            </Pressable>
          ) : undefined
        }
      />
    </>
  );
}

export default function NotificationsScreen() {
  return (
    <RequireAuth>
      <NotificationsList />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  list: { padding: spacing.lg, flexGrow: 1 },
  barra: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  vacio: { alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  footer: { paddingVertical: spacing.lg, alignItems: "center" },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700" },
});
