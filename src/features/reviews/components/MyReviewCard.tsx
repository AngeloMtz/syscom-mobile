// src/features/reviews/components/MyReviewCard.tsx — Una reseña propia en "Mis reseñas".
// Solo presentación: producto, calificación, estado, fecha (hora de México), título y comentario vienen de
// reviewSelectors. No es tocable: GET /reviews/my no trae el id del producto, solo su nombre y su slug.
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import ReviewStatusBadge from "@/features/reviews/components/ReviewStatusBadge";
import StarRating from "@/features/reviews/components/StarRating";
import { myReviewImageUrl, myReviewProductName, reviewDateLabel } from "@/features/reviews/reviewSelectors";
import type { MyReview } from "@/features/reviews/types";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  review: MyReview;
};

export default function MyReviewCard({ review }: Props) {
  const c = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const image = myReviewImageUrl(review);
  const date = reviewDateLabel(review.created_at);
  const titulo = typeof review.titulo === "string" ? review.titulo.trim() : "";

  return (
    <View style={[styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.header}>
        <View style={[styles.thumb, { backgroundColor: c.divider }]}>
          {image && !imageFailed ? (
            <Image
              source={{ uri: image }}
              style={styles.thumbImg}
              resizeMode="contain"
              onError={() => setImageFailed(true)}
            />
          ) : null}
        </View>
        <View style={styles.info}>
          <Text style={[styles.product, { color: c.text }]} numberOfLines={2}>
            {myReviewProductName(review)}
          </Text>
          <StarRating value={review.calificacion} size={14} />
          <View style={styles.meta}>
            <ReviewStatusBadge estado={review.estado} />
            {date ? <Text style={[styles.date, { color: c.textMuted }]}>{date}</Text> : null}
          </View>
        </View>
      </View>
      {titulo ? <Text style={[styles.title, { color: c.text }]}>{titulo}</Text> : null}
      <Text style={[styles.comment, { color: c.text }]}>{review.comentario}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: "row", gap: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radius.md, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  thumbImg: { width: "100%", height: "100%" },
  info: { flex: 1, gap: spacing.xs },
  product: { fontSize: 14, fontWeight: "700" },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  date: { fontSize: 12 },
  title: { fontSize: 14, fontWeight: "700" },
  comment: { fontSize: 14, lineHeight: 20 },
});
