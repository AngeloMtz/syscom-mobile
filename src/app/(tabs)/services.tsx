// src/app/(tabs)/services.tsx — Listado de servicios (HU #116).
// Solo presentación: la paginación, la caché y los estados vienen de
// useInfiniteServices. Búsqueda por nombre, scroll infinito y pull-to-refresh.
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useInfiniteServices } from "@/features/services/hooks/useServices";
import { getServiceImageUrl, getServicePrice } from "@/features/services/selectors";
import type { ServiceListItem } from "@/features/services/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";
import { formatPrice } from "@/shared/utils/format";

const openService = (service: ServiceListItem) =>
  router.push({ pathname: "/service/[id]", params: { id: String(service.id) } });

export default function ServicesScreen() {
  const c = useColors();
  const [texto, setTexto] = useState("");
  const query = useDebouncedValue(texto, 300);

  const filters = useMemo(() => ({ search: query.trim() || undefined }), [query]);
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
  } = useInfiniteServices(filters);

  const servicios = data?.data ?? [];

  const buscador = (
    <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
      <View style={[styles.search, { backgroundColor: c.card }, cardShadow]}>
        <Ionicons name="search" size={19} color={c.textMuted} />
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Buscar servicios…"
          placeholderTextColor={c.textMuted}
          style={[styles.searchInput, { color: c.text }]}
          returnKeyType="search"
        />
        {texto.length > 0 ? (
          <Ionicons name="close-circle" size={18} color={c.textMuted} onPress={() => setTexto("")} />
        ) : null}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        {buscador}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.brandPrimary} />
          <Text style={[styles.hint, { color: c.textMuted }]}>Cargando servicios…</Text>
        </View>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        {buscador}
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
          <Text style={[styles.title, { color: c.text }]}>No pudimos cargar los servicios</Text>
          <Text style={[styles.hint, { color: c.textMuted }]}>{apiErrorMessage(error)}</Text>
          <Pressable onPress={() => refetch()} accessibilityRole="button" style={[styles.retry, { backgroundColor: c.brandPrimary }]}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <FlatList
        data={servicios}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md, flexGrow: 1 }}
        ListHeaderComponent={buscador}
        renderItem={({ item }) => <ServiceRow item={item} onPress={() => openService(item)} />}
        onRefresh={refetch}
        refreshing={isRefetching && !isFetchingNextPage}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="construct-outline" size={44} color={c.textMuted} />
            <Text style={[styles.title, { color: c.text }]}>
              {query.trim() ? `Sin resultados para "${query.trim()}"` : "No hay servicios disponibles"}
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
    </View>
  );
}

function ServiceRow({ item, onPress }: { item: ServiceListItem; onPress: () => void }) {
  const c = useColors();
  const img = getServiceImageUrl(item);
  const precio = getServicePrice(item);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.nombre}
      style={({ pressed }) => [styles.row, cardShadow, { backgroundColor: c.card, opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.thumb, { backgroundColor: c.inputBg }]}>
        {img ? (
          <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <Ionicons name="construct" size={26} color={c.brandPrimary} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={2}>
          {item.nombre}
        </Text>
        {item.duracion_estimada ? (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{item.duracion_estimada}</Text>
          </View>
        ) : null}
        {precio != null ? (
          <Text style={{ color: c.brandPrimary, fontWeight: "700", marginTop: 4 }}>
            Desde {formatPrice(precio)}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm, minHeight: 260 },
  title: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700" },
  footer: { paddingVertical: spacing.lg, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.lg },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  name: { fontSize: 15, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
});
