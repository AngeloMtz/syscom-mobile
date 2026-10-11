// src/features/catalog/components/ImageCarousel.tsx — Galería de imágenes del detalle.
// FlatList horizontal con paginación y puntos indicadores; sin dependencias nuevas.
// Sin imágenes (o si una falla al cargar) muestra el mismo ícono de la tarjeta.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  urls: string[];
  /** Nombre del producto, para la etiqueta de accesibilidad. */
  label: string;
  height?: number;
};

function Slide({ url, width, height, label }: { url: string; width: number; height: number; label: string }) {
  const c = useColors();
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.slide, { width, height }]}>
      {failed ? (
        <Ionicons name="image-outline" size={64} color={c.tabInactive} />
      ) : (
        <Image
          source={{ uri: url }}
          style={styles.image}
          resizeMode="contain"
          onError={() => setFailed(true)}
          accessibilityLabel={label}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

export default function ImageCarousel({ urls, label, height = 280 }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  if (urls.length === 0) {
    return (
      <View
        style={[styles.slide, { width, height, backgroundColor: c.divider }]}
        accessibilityLabel="Producto sin imágenes"
      >
        <Ionicons name="image-outline" size={64} color={c.tabInactive} />
      </View>
    );
  }

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.min(Math.max(next, 0), urls.length - 1));
  };

  return (
    <View
      style={{ backgroundColor: c.card }}
      accessible
      accessibilityLabel={`Galería de ${label}, imagen ${index + 1} de ${urls.length}`}
      accessibilityHint={urls.length > 1 ? "Desliza horizontalmente para ver más imágenes" : undefined}
    >
      <FlatList
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(url, i) => `${i}-${url}`}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={onEnd}
        renderItem={({ item, index: i }) => (
          <Slide url={item} width={width} height={height} label={`${label}, imagen ${i + 1}`} />
        )}
      />
      {urls.length > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {urls.map((url, i) => (
            <View
              key={`${i}-${url}`}
              style={[
                styles.dot,
                { backgroundColor: i === index ? c.brandPrimary : c.border },
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { alignItems: "center", justifyContent: "center", padding: spacing.lg },
  image: { width: "100%", height: "100%" },
  dots: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  dotActive: { width: 18 },
});
