// src/features/orders/components/OrderDetailView.tsx — Detalle de un pedido.
// Solo presentación: el folio, las etiquetas y los formatos vienen de orderFormat.
// Lo usan la confirmación (tras pagar) y, en la HU #15, el historial.
// Con `onReviewProduct` y un pedido entregado, cada producto muestra "Reseñar" (HU #19); no consulta
// can-review: eso lo verifica el formulario al abrirse.
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import OrderStatusBadge from "@/features/orders/components/OrderStatusBadge";
import {
  formatOrderDate,
  formatOrderFolio,
  isOrderReviewable,
  orderTotal,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/features/orders/orderFormat";
import type { OrderDetail } from "@/features/orders/types";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";
import { formatPrice } from "@/shared/utils/format";

type Props = {
  order: OrderDetail;
  onOpenProduct: (productId: number) => void;
  /** Si se pasa, los productos de un pedido entregado muestran el botón "Reseñar". */
  onReviewProduct?: (productId: number, productName: string) => void;
};

const money = (value: unknown) => {
  const n = orderTotal(value);
  return n === null ? "—" : formatPrice(n);
};

export default function OrderDetailView({ order, onOpenProduct, onReviewProduct }: Props) {
  const c = useColors();
  const folio = formatOrderFolio(order.id_pedido);
  const a = order.direccion;
  const canReview = onReviewProduct !== undefined && isOrderReviewable(order.estado);

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.label, { color: c.textMuted }]}>FOLIO</Text>
        <Text
          style={[styles.folio, { color: c.text }]}
          accessibilityLabel={`Folio ${folio}`}
          selectable
        >
          {folio}
        </Text>
        <View style={styles.row}>
          <OrderStatusBadge estado={order.estado} />
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{formatOrderDate(order.fecha_pedido)}</Text>
        </View>
      </View>

      <Text style={[styles.section, { color: c.textMuted }]}>PRODUCTOS</Text>
      <View style={[styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border }]}>
        {order.items.length === 0 ? (
          <Text style={{ color: c.textMuted, fontSize: 13 }}>Sin productos.</Text>
        ) : (
          order.items.map((item, i) => {
            const img = item.productos.producto_imagenes?.[0]?.url_imagen;
            return (
              <View key={item.id_pedido_detalle}>
                <Pressable
                  onPress={() => onOpenProduct(item.productos.id_producto)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.productos.nombre}, ${item.cantidad} ${
                    item.cantidad === 1 ? "pieza" : "piezas"
                  }, ver producto`}
                  style={[styles.item, i > 0 && { borderTopColor: c.divider, borderTopWidth: StyleSheet.hairlineWidth }]}
                >
                  <View style={[styles.thumb, { backgroundColor: c.divider }]}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="contain" />
                    ) : null}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: c.text }]} numberOfLines={2}>
                      {item.productos.nombre}
                    </Text>
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>
                      {item.cantidad} × {money(item.precio_unitario)}
                    </Text>
                  </View>
                  <Text style={{ color: c.text, fontWeight: "700" }}>{money(item.subtotal)}</Text>
                </Pressable>
                {canReview ? (
                  <Pressable
                    onPress={() => onReviewProduct?.(item.productos.id_producto, item.productos.nombre)}
                    accessibilityRole="button"
                    accessibilityLabel={`Reseñar ${item.productos.nombre}`}
                    style={[styles.review, { borderColor: c.brandPrimary }]}
                  >
                    <Text style={[styles.reviewText, { color: c.brandPrimary }]}>Reseñar</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}
        <View style={[styles.totalRow, { borderTopColor: c.divider }]}>
          <Text style={{ color: c.textMuted, fontSize: 14 }}>Total</Text>
          <Text
            style={[styles.total, { color: c.brandDeep }]}
            accessibilityLabel={`Total ${money(order.total)}`}
          >
            {money(order.total)}
          </Text>
        </View>
      </View>

      <Text style={[styles.section, { color: c.textMuted }]}>ENVÍO</Text>
      <View style={[styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border }]}>
        {a ? (
          <>
            <Text style={[styles.value, { color: c.text }]}>{a.calle}</Text>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>
              {a.colonia}, {a.ciudad}, {a.estado}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>C.P. {a.codigo_postal}</Text>
            {a.referencias ? (
              <Text style={{ color: c.textMuted, fontSize: 13 }}>Referencias: {a.referencias}</Text>
            ) : null}
          </>
        ) : (
          <Text style={{ color: c.textMuted, fontSize: 13 }}>Dirección no disponible.</Text>
        )}
      </View>

      <Text style={[styles.section, { color: c.textMuted }]}>PAGO</Text>
      <View style={[styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.payRow}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>Método</Text>
          <Text style={[styles.value, { color: c.text }]}>{paymentMethodLabel(order.pago?.metodo_pago)}</Text>
        </View>
        <View style={styles.payRow}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>Estado del pago</Text>
          <Text style={[styles.value, { color: c.text }]}>{paymentStatusLabel(order.pago?.estado_pago)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.xs },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  section: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: spacing.md },
  folio: { fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  thumb: { width: 52, height: 52, borderRadius: radius.md, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  thumbImg: { width: "100%", height: "100%" },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: "600" },
  review: {
    alignSelf: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  reviewText: { fontSize: 13, fontWeight: "700" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  total: { fontSize: 22, fontWeight: "800" },
  value: { fontSize: 14, fontWeight: "600" },
  payRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
});
