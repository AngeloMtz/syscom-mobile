// src/app/catalog/brand/[brandId].tsx — Listado de productos de una marca.
// Mismo patrón que el listado por categoría, pero filtrando por `id_marca`.
// Solo presentación: paginación, caché y estados vienen de useInfiniteProducts.
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import ProductCard from "@/features/catalog/components/ProductCard";
import { useInfiniteProducts } from "@/features/catalog/hooks/useProducts";
import type { ProductListItem } from "@/features/catalog/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { spacing, useColors } from "@/shared/theme/useColors";

const openProduct = (product: ProductListItem) =>
  router.push({ pathname: "/product/[id]", params: { id: String(product.id) } });

export default function BrandProductsScreen() {
  const c = useColors();
  const { brandId, nombre } = useLocalSearchParams<{ brandId: string; nombre?: string }>();

  const filters = useMemo(() => ({ id_marca: Number(brandId) }), [brandId]);
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
  } = useInfiniteProducts(filters, Number.isFinite(filters.id_marca));

  const title = <Stack.Screen options={{ title: nombre ?? "Marca" }} />;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando productos…</Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>No pudimos cargar los productos</Text>
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

  const productos = data?.data ?? [];

  return (
    <>
      {title}
      <FlatList
        data={productos}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        style={{ backgroundColor: c.background }}
        renderItem={({ item }) => <ProductCard product={item} onPress={openProduct} />}
        onRefresh={refetch}
        refreshing={isRefetching && !isFetchingNextPage}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          productos.length > 0 ? (
            <Text style={[styles.count, { color: c.textMuted }]}>
              {data?.total} {data?.total === 1 ? "producto" : "productos"}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="cube-outline" size={44} color={c.textMuted} />
            <Text style={[styles.titleText, { color: c.text }]}>Sin productos</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>
              Esta marca aún no tiene productos disponibles.
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
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  count: { fontSize: 12, marginBottom: spacing.md },
  footer: { paddingVertical: spacing.lg, alignItems: "center" },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700" },
});
