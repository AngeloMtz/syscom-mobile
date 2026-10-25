// src/features/reviews/components/ReviewStatusBadge.tsx — Etiqueta de estado de una reseña.
// El texto y el tono salen de reviewSelectors: pendiente, aprobada o rechazada.
import { StyleSheet, Text, View } from "react-native";

import { reviewStatusLabel, reviewStatusTone } from "@/features/reviews/reviewSelectors";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

export default function ReviewStatusBadge({ estado }: { estado: string | null | undefined }) {
  const c = useColors();
  const color = {
    success: c.success,
    warning: c.warning,
    danger: c.danger,
    neutral: c.textMuted,
  }[reviewStatusTone(estado)];
  const label = reviewStatusLabel(estado);

  return (
    <View
      style={[styles.badge, { backgroundColor: color + "1F" }]}
      accessible
      accessibilityLabel={`Estado: ${label}`}
    >
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  text: { fontSize: 12, fontWeight: "800" },
});
