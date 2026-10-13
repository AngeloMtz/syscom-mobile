// src/app/orders/index.tsx — Historial de pedidos (HU #15).
// Solo presentación: la paginación, la caché y los estados vienen de useOrders;
// el formato de cada fila, de orderFormat. Tocar un pedido abre /orders/[id].
// Sin filtro por estado y sin "Cancelar pedido" (el backend no devuelve stock ni dinero).
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import RequireAuth from "@/features/auth/components/RequireAuth";
import OrderCard from "@/features/orders/components/OrderCard";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { spacing, useColors } from "@/shared/theme/useColors";

const openOrder = (orderId: number) =>
  router.push({ pathname: "/orders/[id]", params: { id: String(orderId) } });

function OrdersList() {
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
  } = useOrders();

  const title = <Stack.Screen options={{ title: "Mis pedidos" }} />;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando tus pedidos…</Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>No pudimos cargar tus pedidos</Text>
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

  const orders = data?.orders ?? [];

  return (
    <>
      {title}
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id_pedido)}
        contentContainerStyle={styles.list}
        style={{ backgroundColor: c.background }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => <OrderCard order={item} onPress={openOrder} />}
        onRefresh={refetch}
        refreshing={isRefetching && !isFetchingNextPage}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          orders.length > 0 ? (
            <Text style={[styles.count, { color: c.textMuted }]}>
              {data?.total} {data?.total === 1 ? "pedido" : "pedidos"}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="bag-outline" size={44} color={c.textMuted} />
            <Text style={[styles.titleText, { color: c.text }]}>Aún no tienes pedidos</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>
              Cuando compres algo, aparecerá aquí con su folio y su estado.
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} color={c.brandPrimary} />
          ) : isFetchNextPageError ? (
            <Pressable
              onPress={() => fetchNextPage()}
              style={styles.footer}
              accessibilityRole="button"
              accessibilityLabel="Reintentar cargar más pedidos"
            >
              <Text style={{ color: c.brandPrimary, fontWeight: "700" }}>
                No se pudo cargar más. Toca para reintentar
              </Text>
            </Pressable>
          ) : null
        }
      />
    </>
  );
}

export default function OrdersScreen() {
  return (
    <RequireAuth>
      <OrdersList />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  list: { padding: spacing.lg, flexGrow: 1 },
  count: { fontSize: 12, marginBottom: spacing.md },
  footer: { paddingVertical: spacing.lg, alignItems: "center" },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700" },
});
