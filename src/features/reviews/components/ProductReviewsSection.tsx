// src/features/reviews/components/ProductReviewsSection.tsx — Sección "Reseñas" del detalle de producto.
// Solo presentación: la consulta y la paginación vienen de useProductReviews. Maneja sus propios
// estados (carga, error con reintento, vacío, lista y "Ver más") para que un fallo de las reseñas
// no afecte al resto de la pantalla del producto.
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import ReviewCard from "@/features/reviews/components/ReviewCard";
import ReviewSummary from "@/features/reviews/components/ReviewSummary";
import { useProductReviews } from "@/features/reviews/hooks/useProductReviews";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  productId: number;
};

export default function ProductReviewsSection({ productId }: Props) {
  const c = useColors();
  const q = useProductReviews(productId);

  const title = (
    <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
      Reseñas
    </Text>
  );

  if (q.isLoading) {
    return (
      <View style={styles.section}>
        {title}
        <View style={styles.center}>
          <ActivityIndicator color={c.brandPrimary} />
          <Text style={[styles.hint, { color: c.textMuted }]}>Cargando reseñas…</Text>
        </View>
      </View>
    );
  }

  if (!q.data) {
    if (!q.isError) return null;
    return (
      <View style={styles.section}>
        {title}
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: c.text }]}>No pudimos cargar las reseñas</Text>
          <Text style={[styles.hint, { color: c.textMuted }]}>{apiErrorMessage(q.error)}</Text>
          <Pressable
            onPress={() => q.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Reintentar reseñas"
            style={[styles.button, { borderColor: c.brandPrimary }]}
          >
            <Text style={[styles.buttonText, { color: c.brandPrimary }]}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { reviews, total, promedio, distribucion } = q.data;

  if (total === 0 && reviews.length === 0) {
    return (
      <View style={styles.section}>
        {title}
        <Text style={[styles.hint, { color: c.textMuted }]}>Aún no hay reseñas de este producto.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {title}
      <ReviewSummary total={total} promedio={promedio} distribucion={distribucion} />
      <View style={styles.list}>
        {reviews.map((review) => (
          <ReviewCard key={review.id_resena} review={review} />
        ))}
      </View>

      {q.isFetchNextPageError ? (
        <Text style={[styles.hint, styles.centerText, { color: c.danger }]} accessibilityRole="alert">
          No pudimos cargar más reseñas.
        </Text>
      ) : null}

      {q.hasNextPage ? (
        <Pressable
          onPress={() => q.fetchNextPage()}
          disabled={q.isFetchingNextPage}
          accessibilityRole="button"
          accessibilityLabel="Ver más reseñas"
          accessibilityState={{ disabled: q.isFetchingNextPage, busy: q.isFetchingNextPage }}
          style={[styles.button, styles.more, { borderColor: c.brandPrimary }]}
        >
          <Text style={[styles.buttonText, { color: c.brandPrimary }]}>
            {q.isFetchingNextPage ? "Cargando…" : "Ver más"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginTop: spacing.md },
  title: { fontSize: 15, fontWeight: "700" },
  center: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  centerText: { textAlign: "center" },
  hint: { fontSize: 13 },
  errorTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  list: { gap: spacing.sm },
  button: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1 },
  more: { alignSelf: "center" },
  buttonText: { fontWeight: "700", fontSize: 14 },
});
