// src/shared/ui/BannerCarousel.tsx — Carrusel de banners con auto-rotación y puntos.
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { radius, spacing, useColors } from "@/shared/theme/useColors";

const SLIDE_W = Dimensions.get("window").width - spacing.lg * 2;
const INTERVALO_MS = 4000;

export default function BannerCarousel({ images }: { images: string[] }) {
  const c = useColors();
  const ref = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => {
      const next = (index + 1) % images.length;
      ref.current?.scrollTo({ x: next * SLIDE_W, animated: true });
      setIndex(next);
    }, INTERVALO_MS);
    return () => clearInterval(t);
  }, [index, images.length]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SLIDE_W);
    if (i !== index) setIndex(i);
  };

  if (images.length === 0) return null;

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {images.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            style={styles.slide}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ))}
      </ScrollView>
      {images.length > 1 ? (
        <View style={styles.dots}>
          {images.map((uri, i) => (
            <View
              key={`dot-${uri}-${i}`}
              style={[
                styles.dot,
                { backgroundColor: i === index ? c.brandPrimary : c.border, width: i === index ? 18 : 6 },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { width: SLIDE_W, height: 160, borderRadius: radius.lg },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: spacing.md },
  dot: { height: 6, borderRadius: 3 },
});
