// src/features/orders/components/OrderCard.tsx — Una fila del historial de pedidos.
// Solo presentación: folio, fecha (hora de México), total, estado y "N productos"
// vienen de orderFormat. Tocarla abre el detalle del pedido.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import {
  formatItemCount,
  formatOrderDate,
  formatOrderFolio,
  orderStatusLabel,
  orderTotal,
} from "@/features/orders/orderFormat";
import type { OrderSummary } from "@/features/orders/types";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";
import { formatPrice } from "@/shared/utils/format";

type Props = {
  order: OrderSummary;
  onPress: (orderId: number) => void;
};

export default function OrderCard({ order, onPress }: Props) {
  const c = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const folio = formatOrderFolio(order.id_pedido);
  const date = formatOrderDate(order.fecha_pedido);
  const total = orderTotal(order.total);
  const totalText = total === null ? "—" : formatPrice(total);
  const items = formatItemCount(order.total_items);

  return (
    <Pressable
      onPress={() => onPress(order.id_pedido)}
      accessibilityRole="button"
      accessibilityLabel={`Pedido ${folio}, ${date}, ${orderStatusLabel(order.estado)}, ${items}, total ${totalText}`}
      style={({ pressed }) => [
        styles.card,
        cardShadow,
        { backgroundColor: c.card, borderColor: c.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.media, { backgroundColor: c.divider }]}>
        {order.imagen_preview && !imageFailed ? (
          <Image
            source={{ uri: order.imagen_preview }}
            style={styles.image}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Ionicons name="bag-outline" size={26} color={c.tabInactive} />
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.top}>
          <Text style={[styles.folio, { color: c.text }]}>{folio}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>{date}</Text>
        </View>
        {order.primer_producto ? (
          <Text style={[styles.product, { color: c.textMuted }]} numberOfLines={1}>
            {order.primer_producto}
          </Text>
        ) : null}
        <View style={styles.bottom}>
          <OrderStatusBadge estado={order.estado} />
          <View style={styles.right}>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{items}</Text>
            <Text style={[styles.total, { color: c.brandDeep }]}>{totalText}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.85 },
  media: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  info: { flex: 1, gap: 4 },
  top: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: spacing.sm },
  folio: { fontSize: 15, fontWeight: "800" },
  product: { fontSize: 13 },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  right: { alignItems: "flex-end" },
  total: { fontSize: 15, fontWeight: "800" },
});
