// src/features/onboarding/components/OnboardingSlide.tsx — Una lámina.
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { Slide } from "@/features/onboarding/slides";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

export default function OnboardingSlide({
  slide,
  width,
  position,
  total,
}: {
  slide: Slide;
  width: number;
  position: number;
  total: number;
}) {
  const c = useColors();

  return (
    <View
      style={[styles.slide, { width }]}
      accessible
      accessibilityLabel={`${slide.title}. ${slide.description}. Pantalla ${position} de ${total}.`}
    >
      <View style={[styles.ilustracion, { backgroundColor: c.brandPrimary + "14" }]}>
        <Ionicons name={slide.icon} size={76} color={c.brandPrimary} />
      </View>

      <Text style={[styles.titulo, { color: c.text }]} accessibilityRole="header">
        {slide.title}
      </Text>
      <Text style={[styles.descripcion, { color: c.textMuted }]}>{slide.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  ilustracion: {
    width: 168,
    height: 168,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  descripcion: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
