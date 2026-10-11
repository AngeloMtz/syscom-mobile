// src/app/(tabs)/catalog.tsx — Catálogo: categorías raíz en cuadrícula.
// Solo presentación: los datos, la caché y los estados vienen de useRootCategories.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import CategoryCard from "@/features/catalog/components/CategoryCard";
import { useRootCategories } from "@/features/catalog/hooks/useCategories";
import type { Category } from "@/features/catalog/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { spacing, useColors } from "@/shared/theme/useColors";

export default function CatalogScreen() {
  const c = useColors();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useRootCategories();

  const openCategory = (category: Category) =>
    router.push({
      pathname: "/catalog/[categoryId]",
      params: { categoryId: String(category.id), nombre: category.nombre },
    });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando categorías…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.title, { color: c.text }]}>No pudimos cargar las categorías</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>{apiErrorMessage(error)}</Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          style={[styles.retry, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: c.background }}
      renderItem={({ item }) => <CategoryCard category={item} onPress={openCategory} />}
      ListHeaderComponent={
        <Pressable
          onPress={() => router.push("/search")}
          accessibilityRole="search"
          accessibilityLabel="Buscar productos"
          style={[styles.search, { backgroundColor: c.inputBg, borderColor: c.border }]}
        >
          <Ionicons name="search-outline" size={20} color={c.textMuted} />
          <Text style={[styles.searchText, { color: c.textMuted }]}>Buscar productos…</Text>
        </Pressable>
      }
      onRefresh={refetch}
      refreshing={isRefetching}
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="grid-outline" size={44} color={c.textMuted} />
          <Text style={[styles.hint, { color: c.textMuted }]}>Aún no hay categorías disponibles.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  searchText: { fontSize: 14 },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700" },
});
