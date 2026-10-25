// src/features/reviews/components/ReviewSummary.tsx — Promedio y distribución de calificaciones.
// Solo presentación: los números salen de reviewSelectors. Con total 0 solo dice "Sin reseñas".
import { StyleSheet, Text, View } from "react-native";

import StarRating from "@/features/reviews/components/StarRating";
import {
  distributionRowLabel,
  distributionRows,
  formatAverage,
  reviewsCountLabel,
} from "@/features/reviews/reviewSelectors";
import type { RatingDistribution } from "@/features/reviews/types";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  total: number;
  promedio: number;
  distribucion: RatingDistribution;
};

export default function ReviewSummary({ total, promedio, distribucion }: Props) {
  const c = useColors();

  if (!(total > 0)) {
    return <Text style={[styles.empty, { color: c.textMuted }]}>{reviewsCountLabel(total)}</Text>;
  }

  return (
    <View style={styles.row}>
      <View style={styles.average}>
        <Text style={[styles.averageValue, { color: c.text }]}>{formatAverage(promedio)}</Text>
        <StarRating value={promedio} size={16} />
        <Text style={[styles.count, { color: c.textMuted }]}>{reviewsCountLabel(total)}</Text>
      </View>

      <View style={styles.bars}>
        {distributionRows(distribucion, total).map((row) => (
          <View key={row.stars} style={styles.barRow} accessible accessibilityLabel={distributionRowLabel(row)}>
            <Text style={[styles.barLabel, { color: c.textMuted }]}>{row.stars}</Text>
            <View style={[styles.track, { backgroundColor: c.divider }]}>
              <View style={[styles.fill, { width: `${row.percent}%`, backgroundColor: c.star }]} />
            </View>
            <Text style={[styles.barCount, { color: c.textMuted }]}>{row.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  average: { alignItems: "center", gap: spacing.xs },
  averageValue: { fontSize: 34, fontWeight: "800" },
  count: { fontSize: 12 },
  bars: { flex: 1, gap: 4 },
  barRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  barLabel: { width: 12, fontSize: 12, textAlign: "right" },
  track: { flex: 1, height: 8, borderRadius: radius.sm, overflow: "hidden" },
  fill: { height: 8, borderRadius: radius.sm },
  barCount: { width: 24, fontSize: 12 },
});
