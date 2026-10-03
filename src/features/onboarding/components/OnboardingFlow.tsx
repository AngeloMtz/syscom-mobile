// src/features/onboarding/components/OnboardingFlow.tsx — Bienvenida paginada.
// Carrusel horizontal con ScrollView nativo: no hace falta una dependencia de
// carrusel para tres láminas.
import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import OnboardingSlide from "@/features/onboarding/components/OnboardingSlide";
import { SLIDES } from "@/features/onboarding/slides";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

export default function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [indice, setIndice] = useState(0);

  const ultima = indice === SLIDES.length - 1;

  const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pagina = Math.round(e.nativeEvent.contentOffset.x / width);
    if (pagina !== indice) setIndice(pagina);
  };

  const siguiente = () => {
    if (ultima) return onFinish();
    scrollRef.current?.scrollTo({ x: (indice + 1) * width, animated: true });
  };

  return (
    <View
      style={[
        styles.contenedor,
        { backgroundColor: c.background, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Omitir: disponible en todas las láminas */}
      <View style={styles.barraSuperior}>
        <Pressable
          onPress={onFinish}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Omitir la bienvenida"
          accessibilityHint="Entra directo a la aplicación"
          style={({ pressed }) => [styles.omitir, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: "700" }}>Omitir</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={alDesplazar}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: "center" }}
      >
        {SLIDES.map((slide, i) => (
          <OnboardingSlide
            key={slide.id}
            slide={slide}
            width={width}
            position={i + 1}
            total={SLIDES.length}
          />
        ))}
      </ScrollView>

      <View style={styles.pie}>
        <View
          style={styles.puntos}
          accessibilityRole="progressbar"
          accessibilityLabel={`Pantalla ${indice + 1} de ${SLIDES.length}`}
        >
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              style={[
                styles.punto,
                {
                  backgroundColor: i === indice ? c.brandPrimary : c.border,
                  width: i === indice ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={siguiente}
          accessibilityRole="button"
          accessibilityLabel={ultima ? "Comenzar" : "Siguiente"}
          style={({ pressed }) => [
            styles.boton,
            { backgroundColor: c.brandPrimary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={styles.botonTexto}>{ultima ? "Comenzar" : "Siguiente"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  barraSuperior: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  // 44 px de área táctil mínima para el enlace de omitir.
  omitir: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  pie: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
  puntos: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  punto: { height: 8, borderRadius: radius.pill },
  boton: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
