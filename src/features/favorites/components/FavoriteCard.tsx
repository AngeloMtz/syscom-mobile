// src/features/favorites/components/FavoriteCard.tsx — Tarjeta de la pantalla de favoritos.
// El endpoint de favoritos no trae stock ni promoción, así que la tarjeta solo
// muestra imagen, nombre, marca y precio base; el detalle completo está en el producto.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import FavoriteButton from "@/features/favorites/components/FavoriteButton";
import { toFavoriteCardData } from "@/features/favorites/favoriteSelectors";
import type { FavoriteItem } from "@/features/favorites/types";
import { formatPrice } from "@/shared/utils/format";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  item: FavoriteItem;
  onPress?: (productId: number) => void;
};

export default function FavoriteCard({ item, onPress }: Props) {
  const c = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const data = toFavoriteCardData(item);
  const price = data.precio !== null ? formatPrice(data.precio) : "Precio no disponible";

  return (
    <Pressable
      onPress={data.disponible && onPress ? () => onPress(data.id) : undefined}
      disabled={!data.disponible || !onPress}
      accessibilityRole="button"
      accessibilityLabel={`${data.nombre}, ${price}${data.disponible ? "" : ", no disponible"}`}
      accessibilityState={{ disabled: !data.disponible }}
      style={({ pressed }) => [
        styles.card,
        cardShadow,
        { backgroundColor: c.card, borderColor: c.border },
        !data.disponible && styles.unavailable,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.media, { backgroundColor: c.divider }]}>
        {data.imagenUrl && !imageFailed ? (
          <Image
            source={{ uri: data.imagenUrl }}
            style={styles.image}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Ionicons name="image-outline" size={40} color={c.tabInactive} />
        )}
        <FavoriteButton product={item.productos} style={styles.heart} />
      </View>

      <View style={styles.body}>
        {data.marca ? (
          <Text style={[styles.brand, { color: c.textMuted }]} numberOfLines={1}>
            {data.marca}
          </Text>
        ) : null}
        <Text style={[styles.name, { color: c.text }]} numberOfLines={2}>
          {data.nombre}
        </Text>
        <Text style={[styles.price, { color: c.brandDeep }]}>{price}</Text>
        {data.envioGratis ? (
          <Text style={[styles.tag, { color: c.brandPrimary }]}>Envío gratis</Text>
        ) : null}
        {!data.disponible ? (
          <Text style={[styles.tag, { color: c.danger }]}>No disponible</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  unavailable: { opacity: 0.65 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  media: { height: 130, alignItems: "center", justifyContent: "center", padding: spacing.sm },
  image: { width: "100%", height: "100%" },
  heart: { position: "absolute", top: spacing.sm, right: spacing.sm },
  body: { padding: spacing.md, gap: 2 },
  brand: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  name: { fontSize: 13, fontWeight: "600", minHeight: 34 },
  price: { fontSize: 16, fontWeight: "800", marginTop: spacing.xs },
  tag: { fontSize: 12, fontWeight: "700", marginTop: 2 },
});
