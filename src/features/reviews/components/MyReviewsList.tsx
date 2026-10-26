// src/features/reviews/components/MyReviewsList.tsx — Lista de "Mis reseñas" con sus estados.
// Solo presentación: la consulta viene de useMyReviews (solo reseñas de producto, con su estado). Maneja
// carga, error con reintento, vacío y lista con "jalar para actualizar". Si falla una recarga pero ya hay
// datos, se conserva la lista.
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import MyReviewCard from "@/features/reviews/components/MyReviewCard";
import { useMyReviews } from "@/features/reviews/hooks/useMyReviews";
import { reviewsCountLabel } from "@/features/reviews/reviewSelectors";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { spacing, useColors } from "@/shared/theme/useColors";

export default function MyReviewsList() {
  const c = useColors();
  const { data, isLoading, isError, error, refetch, isRefetching } = useMyReviews();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando tus reseñas…</Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>No pudimos cargar tus reseñas</Text>
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

  const reviews = data?.reviews ?? [];

  return (
    <FlatList
      data={reviews}
      keyExtractor={(r) => String(r.id_resena)}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: c.background }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      renderItem={({ item }) => <MyReviewCard review={item} />}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={
        reviews.length > 0 ? (
          <Text style={[styles.count, { color: c.textMuted }]}>{reviewsCountLabel(data?.total)}</Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="star-outline" size={44} color={c.textMuted} />
          <Text style={[styles.titleText, { color: c.text }]}>Aún no has escrito reseñas</Text>
          <Text style={[styles.hint, { color: c.textMuted }]}>
            Cuando recibas un pedido, podrás reseñar sus productos desde su detalle.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  list: { padding: spacing.lg, flexGrow: 1 },
  count: { fontSize: 12, marginBottom: spacing.md },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700" },
});
