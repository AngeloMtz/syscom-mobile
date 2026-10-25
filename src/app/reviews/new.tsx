// src/app/reviews/new.tsx — Escribir la reseña de un producto (pantalla completa).
// Recibe `?productId=` (obligatorio) y `?productName=` (opcional, solo para el texto). Exige sesión.
// Solo presentación: el flujo (verificar compra, formulario, envío y avisos) vive en WriteReview.
import { Stack, router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import RequireAuth from "@/features/auth/components/RequireAuth";
import { parseProductId } from "@/features/catalog/productDetail";
import WriteReview from "@/features/reviews/components/WriteReview";
import { spacing, useColors } from "@/shared/theme/useColors";

function NewReviewScreen() {
  const c = useColors();
  const { productId, productName } = useLocalSearchParams<{ productId?: string; productName?: string }>();
  const id = parseProductId(productId);

  const title = <Stack.Screen options={{ title: "Escribir reseña" }} />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (id === null) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Text style={[styles.titleText, { color: c.text }]}>Producto no válido</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>Abre la reseña desde el detalle de un producto.</Text>
        <Pressable
          onPress={back}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {title}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <WriteReview
          productId={id}
          productName={typeof productName === "string" && productName ? productName : undefined}
          onClose={back}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function NewReviewRoute() {
  return (
    <RequireAuth>
      <NewReviewScreen />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  primary: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  primaryText: { color: "#fff", fontWeight: "700" },
});
