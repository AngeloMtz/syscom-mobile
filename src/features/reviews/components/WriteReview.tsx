// src/features/reviews/components/WriteReview.tsx — Flujo de "Escribir reseña" de un producto.
// Primero pregunta al servidor si el usuario puede reseñar (can-review) y de ahí toma el pedido que
// POST /reviews exige. Estados: verificando, error al verificar (con reintento), no puede (con el
// motivo del servidor), formulario y "enviada". Los 400 del servidor (no comprado, duplicada) se
// muestran con su `message`. Tras crear avisa que la reseña se publica cuando un admin la apruebe.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import ReviewForm from "@/features/reviews/components/ReviewForm";
import { useCanReview } from "@/features/reviews/hooks/useCanReview";
import { useCreateReview } from "@/features/reviews/hooks/useCreateReview";
import { buildReviewInput } from "@/features/reviews/reviewValidation";
import type { ReviewFormValues } from "@/features/reviews/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  productId: number;
  productName?: string;
  /** Cierra la pantalla (vuelve al producto). */
  onClose: () => void;
};

export default function WriteReview({ productId, productName, onClose }: Props) {
  const c = useColors();
  const can = useCanReview(productId);
  const create = useCreateReview();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const idPedido = can.data?.idPedido ?? null;

  const onSubmit = async (values: ReviewFormValues) => {
    if (idPedido === null) return;
    setServerError(null);
    try {
      await create.mutateAsync(buildReviewInput(values, productId, idPedido));
      setDone(true);
    } catch (e) {
      setServerError(apiErrorMessage(e));
    }
  };

  const closeButton = (label: string, text: string) => (
    <Pressable
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.primary, { backgroundColor: c.brandPrimary }]}
    >
      <Text style={styles.primaryText}>{text}</Text>
    </Pressable>
  );

  // Una vez enviada, esta vista manda: aunque can-review cambie a "ya reseñaste", no se reemplaza.
  if (done) {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={52} color={c.success} />
        <Text style={[styles.title, { color: c.text }]}>¡Gracias por tu reseña!</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>Se publicará cuando un administrador la apruebe.</Text>
        {closeButton("Volver al producto", "Volver al producto")}
      </View>
    );
  }

  if (can.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Verificando tu compra…</Text>
      </View>
    );
  }

  if (!can.data) {
    if (!can.isError) return null;
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.title, { color: c.text }]}>No pudimos verificar si puedes reseñar este producto</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>{apiErrorMessage(can.error)}</Text>
        <Pressable
          onPress={() => can.refetch()}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (!can.data.canReview || idPedido === null) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={44} color={c.textMuted} />
        <Text style={[styles.title, { color: c.text }]}>No puedes reseñar este producto</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>
          {can.data.reason ?? "No puedes reseñar este producto por ahora."}
        </Text>
        {closeButton("Volver", "Volver")}
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={[styles.heading, { color: c.text }]} accessibilityRole="header">
        {productName ? `Tu opinión sobre ${productName}` : "Tu opinión"}
      </Text>
      <ReviewForm submitting={create.isPending} serverError={serverError} onSubmit={onSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  form: { gap: spacing.md },
  heading: { fontSize: 17, fontWeight: "800" },
  title: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  primary: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  primaryText: { color: "#fff", fontWeight: "700" },
});
