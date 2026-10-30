// src/features/cart/components/CartItemRow.tsx — Una línea del carrito.
// Solo presentación: los límites (máximo, estado, si se puede subir o bajar)
// vienen ya calculados en CartLineData por cartSelectors.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { CartLineData } from "@/features/cart/types";
import { formatPrice } from "@/shared/utils/format";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  line: CartLineData;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onOpen?: () => void;
  /** Pago en curso: no se edita el carrito. */
  disabled?: boolean;
};

export default function CartItemRow({ line, onIncrease, onDecrease, onRemove, onOpen, disabled }: Props) {
  const c = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const price = line.precioUnitario !== null ? formatPrice(line.precioUnitario) : "Precio no disponible";
  const subtotal = line.subtotal !== null ? formatPrice(line.subtotal) : "—";
  const discountLabel =
    line.precioOriginal !== null && line.descuentoPorcentaje !== null && line.precioUnitario !== null
      ? `${line.descuentoPorcentaje} por ciento de descuento, antes ${formatPrice(line.precioOriginal)}, ahora ${formatPrice(line.precioUnitario)}`
      : null;
  const unavailable = line.status === "agotado" || line.status === "no_disponible";

  const message =
    line.status === "no_disponible"
      ? "No disponible"
      : line.status === "agotado"
        ? "Agotado"
        : line.status === "excede"
          ? `Solo hay ${line.stock} disponible${line.stock === 1 ? "" : "s"}. Baja la cantidad para continuar.`
          : line.stock !== null && line.cantidad >= line.maxQuantity
            ? `Máximo disponible: ${line.maxQuantity}`
            : null;

  return (
    <View style={[styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.top}>
        <Pressable
          onPress={onOpen}
          disabled={!onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${line.nombre}, ver producto`}
          style={[styles.media, { backgroundColor: c.divider }, unavailable && styles.dim]}
        >
          {line.imagenUrl && !imageFailed ? (
            <Image
              source={{ uri: line.imagenUrl }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setImageFailed(true)}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Ionicons name="image-outline" size={28} color={c.tabInactive} />
          )}
        </Pressable>

        <View style={styles.info}>
          {line.marca ? (
            <Text style={[styles.brand, { color: c.textMuted }]} numberOfLines={1}>
              {line.marca}
            </Text>
          ) : null}
          <Text style={[styles.name, { color: c.text }, unavailable && styles.dim]} numberOfLines={2}>
            {line.nombre}
          </Text>
          {discountLabel ? (
            <View accessible accessibilityLabel={discountLabel} style={styles.discountRow}>
              <Text style={[styles.unit, styles.original, { color: c.textMuted }]}>
                {formatPrice(line.precioOriginal!)}
              </Text>
              <Text style={[styles.unit, { color: c.textMuted }]}>{price} c/u</Text>
              <View style={[styles.badge, { backgroundColor: c.danger }]}>
                <Text style={styles.badgeText}>-{line.descuentoPorcentaje} %</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.unit, { color: c.textMuted }]}>{price} c/u</Text>
          )}
        </View>

        <Pressable
          onPress={onRemove}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${line.nombre} del carrito`}
          style={styles.remove}
        >
          <Ionicons name="trash-outline" size={20} color={c.danger} />
        </Pressable>
      </View>

      {message ? (
        <Text
          style={[styles.message, { color: line.blocking ? c.danger : c.textMuted }]}
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
      ) : null}

      <View style={styles.bottom}>
        {unavailable ? (
          <Pressable
            onPress={onRemove}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${line.nombre} del carrito`}
            style={[styles.removeBtn, { borderColor: c.danger }]}
          >
            <Text style={{ color: c.danger, fontWeight: "700", fontSize: 13 }}>Quitar</Text>
          </Pressable>
        ) : (
          <View style={styles.stepper} accessibilityRole="adjustable" accessibilityLabel={`Cantidad de ${line.nombre}`}>
            <Pressable
              onPress={onDecrease}
              disabled={disabled || !line.canDecrease}
              accessibilityRole="button"
              accessibilityLabel={`Disminuir cantidad de ${line.nombre}`}
              accessibilityState={{ disabled: disabled || !line.canDecrease }}
              style={[styles.stepBtn, { borderColor: c.border, opacity: !disabled && line.canDecrease ? 1 : 0.4 }]}
            >
              <Ionicons name="remove" size={18} color={c.text} />
            </Pressable>
            <Text
              style={[styles.qty, { color: c.text }]}
              accessibilityLabel={`Cantidad: ${line.cantidad}`}
            >
              {line.cantidad}
            </Text>
            <Pressable
              onPress={onIncrease}
              disabled={disabled || !line.canIncrease}
              accessibilityRole="button"
              accessibilityLabel={`Aumentar cantidad de ${line.nombre}`}
              accessibilityState={{ disabled: disabled || !line.canIncrease }}
              style={[styles.stepBtn, { borderColor: c.border, opacity: !disabled && line.canIncrease ? 1 : 0.4 }]}
            >
              <Ionicons name="add" size={18} color={c.text} />
            </Pressable>
          </View>
        )}

        <Text style={[styles.subtotal, { color: c.brandDeep }]} accessibilityLabel={`Subtotal ${subtotal}`}>
          {subtotal}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.sm },
  top: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  media: { width: 72, height: 72, borderRadius: radius.md, alignItems: "center", justifyContent: "center", padding: 4 },
  image: { width: "100%", height: "100%" },
  dim: { opacity: 0.55 },
  info: { flex: 1, gap: 2 },
  brand: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  name: { fontSize: 14, fontWeight: "600" },
  unit: { fontSize: 12 },
  discountRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: spacing.sm, rowGap: 2 },
  original: { textDecorationLine: "line-through" },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  remove: { padding: spacing.xs },
  message: { fontSize: 12, fontWeight: "600" },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  qty: { minWidth: 28, textAlign: "center", fontSize: 16, fontWeight: "700" },
  removeBtn: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  subtotal: { fontSize: 16, fontWeight: "800" },
});
