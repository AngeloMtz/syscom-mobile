// src/features/reviews/components/WriteReviewAction.tsx — Botón "Escribir reseña" del detalle de producto.
// Sin sesión lleva a login (mismo patrón que "Agregar al carrito"). Con sesión pregunta a can-review:
// si puede, abre el formulario; si no, muestra el motivo del servidor (sin botón). Mientras consulta o
// si la consulta falla no muestra nada: el formulario vuelve a verificar al abrirse.
import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { useCanReview } from "@/features/reviews/hooks/useCanReview";
import { useAuthStore } from "@/shared/store/authStore";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  productId: number;
  productName?: string;
};

export default function WriteReviewAction({ productId, productName }: Props) {
  const c = useColors();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const can = useCanReview(productId);

  const button = (onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Escribir reseña"
      style={[styles.button, { borderColor: c.brandPrimary }]}
    >
      <Text style={[styles.buttonText, { color: c.brandPrimary }]}>Escribir reseña</Text>
    </Pressable>
  );

  if (!isAuthenticated) return button(() => router.push("/(auth)/login"));

  if (!can.data) return null;

  if (can.data.canReview) {
    return button(() =>
      router.push({
        pathname: "/reviews/new",
        params: { productId: String(productId), ...(productName ? { productName } : {}) },
      }),
    );
  }

  return can.data.reason ? <Text style={[styles.reason, { color: c.textMuted }]}>{can.data.reason}</Text> : null;
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  buttonText: { fontWeight: "700", fontSize: 14 },
  reason: { fontSize: 13 },
});
