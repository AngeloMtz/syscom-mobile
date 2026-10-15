// src/shared/ui/ScreenState.tsx — Estados de carga, error y vacío de una sección.
// Las pantallas le pasan los flags del hook; el contenido solo se pinta con datos.
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  loading?: boolean;
  error?: boolean;
  /** Mensaje del error (ej. apiErrorMessage); si falta se usa uno genérico. */
  errorText?: string;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  /** Alto mínimo del estado: secciones de un scroll usan menos que una pantalla. */
  minHeight?: number;
  children?: ReactNode;
};

export default function ScreenState({
  loading,
  error,
  errorText,
  empty,
  emptyText = "Sin resultados",
  onRetry,
  minHeight = 220,
  children,
}: Props) {
  const c = useColors();

  if (loading) {
    return (
      <View style={[styles.center, { minHeight }]}>
        <ActivityIndicator size="large" color={c.brandPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { minHeight }]} accessibilityLiveRegion="polite">
        <Ionicons name="cloud-offline-outline" size={40} color={c.textMuted} />
        <Text style={[styles.text, { color: c.textMuted }]}>
          {errorText ?? "No se pudo cargar la información."}
        </Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
            style={({ pressed }) => [
              styles.retry,
              { backgroundColor: c.brandPrimary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={[styles.center, { minHeight }]}>
        <Text style={[styles.text, { color: c.textMuted }]}>{emptyText}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  text: { textAlign: "center", marginVertical: spacing.md, fontSize: 14 },
  retry: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
