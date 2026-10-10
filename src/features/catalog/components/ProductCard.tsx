// src/features/catalog/components/ProductCard.tsx — Tarjeta de producto de un listado.
// Muestra imagen, nombre y precio (con promoción si aplica). La reutilizan el
// listado por categoría, la búsqueda y favoritos.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { getPrincipalImageUrl, getTotalStock } from "@/features/catalog/selectors";
import type { ProductListItem } from "@/features/catalog/types";
import FavoriteButton from "@/features/favorites/components/FavoriteButton";
import { toFavoriteProduct } from "@/features/favorites/favoriteSelectors";
import { formatPrice } from "@/shared/utils/format";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  product: ProductListItem;
  onPress?: (product: ProductListItem) => void;
};

export default function ProductCard({ product, onPress }: Props) {
  const c = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getPrincipalImageUrl(product);
  const soldOut = getTotalStock(product) <= 0;

  return (
    <Pressable
      onPress={onPress ? () => onPress(product) : undefined}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.nombre}, ${formatPrice(product.precio_final)}`}
      style={({ pressed }) => [
        styles.card,
        cardShadow,
        { backgroundColor: c.card, borderColor: c.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.media, { backgroundColor: c.divider }]}>
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Ionicons name="image-outline" size={40} color={c.tabInactive} />
        )}
        {product.en_promocion && product.porcentaje_descuento > 0 ? (
          <View style={[styles.badge, { backgroundColor: c.danger }]}>
            <Text style={styles.badgeText}>-{Math.round(product.porcentaje_descuento)}%</Text>
          </View>
        ) : null}
        <FavoriteButton product={toFavoriteProduct(product)} style={styles.heart} />
      </View>

      <View style={styles.body}>
        {product.marca ? (
          <Text style={[styles.brand, { color: c.textMuted }]} numberOfLines={1}>
            {product.marca.nombre}
          </Text>
        ) : null}
        <Text style={[styles.name, { color: c.text }]} numberOfLines={2}>
          {product.nombre}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: c.brandDeep }]}>{formatPrice(product.precio_final)}</Text>
          {product.en_promocion && product.precio_base > product.precio_final ? (
            <Text style={[styles.oldPrice, { color: c.textMuted }]}>{formatPrice(product.precio_base)}</Text>
          ) : null}
        </View>

        {soldOut ? <Text style={[styles.soldOut, { color: c.danger }]}>Agotado</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  media: { height: 130, alignItems: "center", justifyContent: "center", padding: spacing.sm },
  image: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  heart: { position: "absolute", top: spacing.sm, right: spacing.sm },
  body: { padding: spacing.md, gap: 2 },
  brand: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  name: { fontSize: 13, fontWeight: "600", minHeight: 34 },
  priceRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: spacing.sm, marginTop: spacing.xs },
  price: { fontSize: 16, fontWeight: "800" },
  oldPrice: { fontSize: 12, textDecorationLine: "line-through" },
  soldOut: { fontSize: 12, fontWeight: "700", marginTop: 2 },
});
