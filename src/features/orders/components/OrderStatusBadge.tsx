// src/features/orders/components/OrderStatusBadge.tsx — Etiqueta de estado del pedido.
// El texto y el tono salen de orderFormat (etiquetas en español, sin acción).
import { StyleSheet, Text, View } from "react-native";

import { orderStatusLabel, orderStatusTone } from "@/features/orders/orderFormat";
import type { StatusTone } from "@/features/orders/types";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

export default function OrderStatusBadge({ estado }: { estado: string | null | undefined }) {
  const c = useColors();
  const tone: StatusTone = orderStatusTone(estado);
  const color = {
    success: c.success,
    info: c.brandPrimary,
    warning: c.warning,
    neutral: c.textMuted,
    danger: c.danger,
  }[tone];
  const label = orderStatusLabel(estado);

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
