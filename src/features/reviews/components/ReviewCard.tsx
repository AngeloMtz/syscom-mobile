// src/features/reviews/components/ReviewCard.tsx — Una reseña de producto.
// Solo presentación: autor abreviado, fecha (hora de México), estrellas, título y comentario
// vienen de reviewSelectors. Sin título o sin fecha, esa parte simplemente no se muestra.
import { StyleSheet, Text, View } from "react-native";

import StarRating from "@/features/reviews/components/StarRating";
import { reviewDateLabel, reviewerName } from "@/features/reviews/reviewSelectors";
import type { ProductReview } from "@/features/reviews/types";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  review: ProductReview;
};

export default function ReviewCard({ review }: Props) {
  const c = useColors();
  const date = reviewDateLabel(review.created_at);
  const titulo = typeof review.titulo === "string" ? review.titulo.trim() : "";

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
          {reviewerName(review)}
        </Text>
        {date ? <Text style={[styles.date, { color: c.textMuted }]}>{date}</Text> : null}
      </View>
      <StarRating value={review.calificacion} size={14} />
      {titulo ? <Text style={[styles.title, { color: c.text }]}>{titulo}</Text> : null}
      <Text style={[styles.comment, { color: c.text }]}>{review.comentario}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  name: { flex: 1, fontSize: 14, fontWeight: "700" },
  date: { fontSize: 12 },
  title: { fontSize: 14, fontWeight: "700", marginTop: spacing.xs },
  comment: { fontSize: 14, lineHeight: 20 },
});
