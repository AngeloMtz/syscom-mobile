// src/app/favorites.tsx — Pantalla de favoritos del usuario.
// Solo presentación: la consulta viene de useFavorites (hasta MAX_FAVORITES) y
// la tarjeta de FavoriteCard. Exige sesión; se llega desde Perfil → Favoritos.
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import RequireAuth from "@/features/auth/components/RequireAuth";
import FavoriteCard from "@/features/favorites/components/FavoriteCard";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { MAX_FAVORITES } from "@/features/favorites/repositories/favoriteRepository";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

const openProduct = (productId: number) =>
  router.push({ pathname: "/product/[id]", params: { id: String(productId) } });

function FavoritesList() {
  const c = useColors();
  const { data, isLoading, isError, error, refetch, isRefetching } = useFavorites();

  const title = <Stack.Screen options={{ title: "Favoritos" }} />;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando tus favoritos…</Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>No pudimos cargar tus favoritos</Text>
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

  const items = data?.items ?? [];

  return (
    <>
      {title}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.productos.id_producto)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        style={{ backgroundColor: c.background }}
        renderItem={({ item }) => <FavoriteCard item={item} onPress={openProduct} />}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.header}>
              <Text style={[styles.count, { color: c.textMuted }]}>
                {items.length} {items.length === 1 ? "favorito" : "favoritos"}
              </Text>
              {data?.truncated ? (
                <View
                  style={[styles.notice, { backgroundColor: c.card, borderColor: c.border }]}
                  accessibilityRole="alert"
                >
                  <Ionicons name="information-circle-outline" size={18} color={c.textMuted} />
                  <Text style={[styles.noticeText, { color: c.textMuted }]}>
                    Mostramos tus {MAX_FAVORITES} favoritos más recientes de {data.total}. Quita
                    alguno para ver los anteriores.
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="heart-outline" size={44} color={c.textMuted} />
            <Text style={[styles.titleText, { color: c.text }]}>Aún no tienes favoritos</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>
              Toca el corazón de un producto para guardarlo aquí.
            </Text>
          </View>
        }
      />
    </>
  );
}

export default function FavoritesScreen() {
  return (
    <RequireAuth>
      <FavoritesList />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  header: { gap: spacing.sm, marginBottom: spacing.md },
  count: { fontSize: 12 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700" },
});
