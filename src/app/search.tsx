// src/app/search.tsx — Buscador de productos: texto, rango de precios y categoría.
// Solo presentación: la validación y la construcción de filtros viven en
// features/catalog (validation, searchFilters) y la paginación en useInfiniteProducts.
// Texto y precios pasan por un debounce para no pedir a la API en cada tecla.
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ProductCard from "@/features/catalog/components/ProductCard";
import { useRootCategories } from "@/features/catalog/hooks/useCategories";
import { useInfiniteProducts } from "@/features/catalog/hooks/useProducts";
import { buildProductFilters, canSearch } from "@/features/catalog/searchFilters";
import type { ProductListItem } from "@/features/catalog/types";
import { validatePriceRange } from "@/features/catalog/validation";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import { formatPrice } from "@/shared/utils/format";

// Búsqueda ágil: más corto que el valor por defecto del hook (400 ms).
const SEARCH_DEBOUNCE_MS = 300;

const openProduct = (product: ProductListItem) =>
  router.push({ pathname: "/product/[id]", params: { id: String(product.id) } });

export default function SearchScreen() {
  const c = useColors();
  const [texto, setTexto] = useState("");
  const [minTxt, setMinTxt] = useState("");
  const [maxTxt, setMaxTxt] = useState("");
  const [categoria, setCategoria] = useState<number | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categorias } = useRootCategories();

  // Los tres campos de texto comparten el mismo retardo; la categoría es un toque y va directa.
  const typed = useMemo(() => ({ texto, minTxt, maxTxt }), [texto, minTxt, maxTxt]);
  const debounced = useDebouncedValue(typed, SEARCH_DEBOUNCE_MS);

  const filters = useMemo(
    () => buildProductFilters({ ...debounced, categoria }),
    [debounced, categoria],
  );
  const { errors } = useMemo(
    () => validatePriceRange(debounced.minTxt, debounced.maxTxt),
    [debounced.minTxt, debounced.maxTxt],
  );
  const priceError = errors.min ?? errors.max ?? errors.rango;

  // Resumen del precio aplicado, visible aunque el panel de filtros esté cerrado.
  const { precioMin, precioMax } = filters;
  const priceSummary =
    precioMin !== undefined && precioMax !== undefined
      ? `${formatPrice(precioMin)} – ${formatPrice(precioMax)}`
      : precioMin !== undefined
        ? `Desde ${formatPrice(precioMin)}`
        : precioMax !== undefined
          ? `Hasta ${formatPrice(precioMax)}`
          : undefined;
  const filtersLabel = priceError
    ? "Filtros, hay un error en el precio"
    : priceSummary
      ? `Filtros, precio aplicado: ${priceSummary}`
      : "Filtros";

  // Con un precio inválido no se consulta, aunque haya texto o categoría.
  const active = canSearch({ ...debounced, categoria });
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    isPlaceholderData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteProducts(filters, active, true);

  const clearAll = () => {
    setTexto("");
    setMinTxt("");
    setMaxTxt("");
    setCategoria(undefined);
  };
  const canClear = texto !== "" || minTxt !== "" || maxTxt !== "" || categoria !== undefined;

  const inputStyle = [styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }];

  const form = (
    <View style={[styles.form, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.topRow}>
        <View style={[styles.searchRow, styles.searchGrow, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Ionicons name="search-outline" size={20} color={c.textMuted} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscar productos"
            placeholderTextColor={c.textMuted}
            style={[styles.searchInput, { color: c.text }]}
            returnKeyType="search"
            autoCorrect={false}
            autoFocus
            accessibilityLabel="Buscar productos"
          />
          {texto !== "" ? (
            <Pressable
              onPress={() => setTexto("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Borrar texto"
            >
              <Ionicons name="close-circle" size={20} color={c.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setFiltersOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel={filtersLabel}
          accessibilityState={{ expanded: filtersOpen }}
          style={[
            styles.filterButton,
            { borderColor: filtersOpen ? c.brandPrimary : c.border, backgroundColor: c.inputBg },
          ]}
        >
          <Ionicons name="options-outline" size={20} color={filtersOpen ? c.brandPrimary : c.text} />
          <Text style={{ color: filtersOpen ? c.brandPrimary : c.text, fontSize: 13, fontWeight: "600" }}>
            Filtros
          </Text>
          {priceError || priceSummary ? (
            <View style={[styles.dot, { backgroundColor: priceError ? c.danger : c.brandPrimary }]} />
          ) : null}
        </Pressable>
      </View>

      {!filtersOpen && (priceError || priceSummary) ? (
        <Text style={[styles.summary, { color: priceError ? c.danger : c.textMuted }]}>
          {priceError ? `Precio: ${priceError}` : `Precio: ${priceSummary}`}
        </Text>
      ) : null}

      {filtersOpen ? (
        <>
          <View style={styles.priceRow}>
            <TextInput
              value={minTxt}
              onChangeText={setMinTxt}
              placeholder="Precio mín."
              placeholderTextColor={c.textMuted}
              keyboardType="decimal-pad"
              style={[...inputStyle, styles.priceInput]}
              accessibilityLabel="Precio mínimo"
            />
            <Text style={{ color: c.textMuted }}>–</Text>
            <TextInput
              value={maxTxt}
              onChangeText={setMaxTxt}
              placeholder="Precio máx."
              placeholderTextColor={c.textMuted}
              keyboardType="decimal-pad"
              style={[...inputStyle, styles.priceInput]}
              accessibilityLabel="Precio máximo"
            />
          </View>
          {priceError ? (
            <Text style={[styles.error, { color: c.danger }]} accessibilityRole="alert">
              {priceError}
            </Text>
          ) : null}
        </>
      ) : null}

      {categorias && categorias.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}
        >
          {categorias.map((cat) => {
            const selected = categoria === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoria(selected ? undefined : cat.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.chip,
                  { borderColor: selected ? c.brandPrimary : c.border },
                  selected && { backgroundColor: c.brandPrimary },
                ]}
              >
                <Text style={{ color: selected ? "#fff" : c.text, fontSize: 13, fontWeight: "600" }}>
                  {cat.nombre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {canClear ? (
        <Pressable onPress={clearAll} accessibilityRole="button" style={styles.clear}>
          <Text style={{ color: c.brandPrimary, fontWeight: "700", fontSize: 13 }}>Limpiar filtros</Text>
        </Pressable>
      ) : null}
    </View>
  );

  let body;
  if (!active) {
    body = (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={44} color={c.textMuted} />
        <Text style={[styles.title, { color: c.text }]}>Encuentra tu producto</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>
          Escribe un nombre o elige un precio o una categoría.
        </Text>
      </View>
    );
  } else if (isLoading) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Buscando productos…</Text>
      </View>
    );
  } else if (isError && !data) {
    body = (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.title, { color: c.text }]}>No pudimos buscar los productos</Text>
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
  } else {
    const productos = data?.data ?? [];
    body = (
      <View style={styles.results}>
        <FlatList
          data={productos}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
                {data?.total} {data?.total === 1 ? "resultado" : "resultados"}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={44} color={c.textMuted} />
              <Text style={[styles.title, { color: c.text }]}>Sin resultados</Text>
              <Text style={[styles.hint, { color: c.textMuted }]}>
                Prueba con otro texto o ajusta los filtros.
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
      {/* Los resultados anteriores se quedan a la vista mientras llegan los nuevos. */}
      {isPlaceholderData ? (
        <View style={[styles.updating, { backgroundColor: c.card, borderColor: c.border }]} pointerEvents="none">
          <ActivityIndicator size="small" color={c.brandPrimary} accessibilityLabel="Actualizando resultados" />
        </View>
      ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: "Buscar" }} />
      {form}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  form: { padding: spacing.lg, gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  searchGrow: { flex: 1 },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dot: { position: "absolute", top: 4, right: 6, width: 9, height: 9, borderRadius: 5 },
  summary: { fontSize: 12, fontWeight: "600" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: spacing.md },
  priceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14 },
  priceInput: { flex: 1 },
  error: { fontSize: 12, fontWeight: "600" },
  chips: { gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  clear: { alignSelf: "flex-start" },
  results: { flex: 1 },
  updating: {
    position: "absolute",
    top: spacing.sm,
    alignSelf: "center",
    padding: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  count: { fontSize: 12, marginBottom: spacing.md },
  footer: { paddingVertical: spacing.lg, alignItems: "center" },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700" },
});
