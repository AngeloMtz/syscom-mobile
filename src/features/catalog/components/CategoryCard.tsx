// src/features/catalog/components/CategoryCard.tsx — Tarjeta de categoría.
// Imagen de la categoría; si no tiene (o falla la carga), un ícono por nombre,
// como el fallback de la web.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { Category } from "@/features/catalog/types";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** Ícono de respaldo según el nombre (mismas familias que la web). */
function iconFor(nombre: string): IconName {
  const n = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (/compu|laptop|escritorio/.test(n)) return "laptop-outline";
  if (/component|refaccion|hardware/.test(n)) return "hardware-chip-outline";
  if (/periferic|teclado|mouse|monitor/.test(n)) return "desktop-outline";
  if (/impres/.test(n)) return "print-outline";
  if (/audio|video|multimedia/.test(n)) return "headset-outline";
  if (/red|router|wifi|conectividad/.test(n)) return "wifi-outline";
  if (/segur|camara|vigilanc/.test(n)) return "videocam-outline";
  if (/energia|proteccion|bateria/.test(n)) return "battery-charging-outline";
  if (/almacen|disco|memoria/.test(n)) return "save-outline";
  if (/cable|adaptador/.test(n)) return "git-network-outline";
  return "cube-outline";
}

type Props = {
  category: Category;
  onPress: (category: Category) => void;
};

export default function CategoryCard({ category, onPress }: Props) {
  const c = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!category.imagen_url && !imageFailed;

  return (
    <Pressable
      onPress={() => onPress(category)}
      accessibilityRole="button"
      accessibilityLabel={`Categoría ${category.nombre}`}
      style={({ pressed }) => [
        styles.card,
        cardShadow,
        { backgroundColor: c.card, borderColor: c.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.media, { backgroundColor: c.brandPrimary }]}>
        {showImage ? (
          <Image
            source={{ uri: category.imagen_url as string }}
            style={styles.image}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Ionicons name={iconFor(category.nombre)} size={44} color="#fff" />
        )}
      </View>
      <Text style={[styles.name, { color: c.text }]} numberOfLines={2}>
        {category.nombre}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  media: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  image: { width: "100%", height: "100%" },
  name: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
});
