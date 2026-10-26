// src/app/orders/[id].tsx — Detalle de un pedido y confirmación tras pagar.
// Con `?confirmed=1` (lo manda /checkout con router.replace) es la confirmación:
// "¡Pago exitoso!", folio, productos, total, dirección y método de pago, sin
// forma de volver al pago. Sin ese parámetro es el detalle normal (HU #15).
// Solo presentación: los datos vienen de useOrder y los formatos de orderFormat.
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import RequireAuth from "@/features/auth/components/RequireAuth";
import OrderDetailView from "@/features/orders/components/OrderDetailView";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { formatOrderFolio, parseOrderId } from "@/features/orders/orderFormat";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

const goHome = () => router.replace("/");
const goOrders = () => router.replace("/orders");
const openProduct = (productId: number) =>
  router.push({ pathname: "/product/[id]", params: { id: String(productId) } });
// "Reseñar" abre el formulario; este no consulta can-review aquí, lo verifica el formulario al abrirse.
const reviewProduct = (productId: number, productName: string) =>
  router.push({ pathname: "/reviews/new", params: { productId: String(productId), productName } });

function OrderScreen() {
  const c = useColors();
  const { id, confirmed } = useLocalSearchParams<{ id: string; confirmed?: string }>();
  const confirmation = confirmed === "1";
  const orderId = parseOrderId(id);

  const { data: order, isLoading, refetch, isRefetching, notFound } = useOrder(id);

  // El botón atrás de Android en la confirmación va al inicio, no de vuelta al pago.
  useEffect(() => {
    if (!confirmation) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goHome();
      return true;
    });
    return () => sub.remove();
  }, [confirmation]);

  const title = (
    <Stack.Screen
      options={{
        title: confirmation ? "Pedido confirmado" : "Pedido",
        // gestureEnabled es solo de iOS; headerBackVisible aplica a ambas plataformas.
        gestureEnabled: !confirmation,
        headerBackVisible: !confirmation,
      }}
    />
  );

  const actions = confirmation ? (
    <View style={styles.actions}>
      <Pressable
        onPress={goHome}
        accessibilityRole="button"
        accessibilityLabel="Volver al inicio"
        style={[styles.primary, { backgroundColor: c.brandPrimary }]}
      >
        <Text style={styles.primaryText}>Volver al inicio</Text>
      </Pressable>
      <Pressable
        onPress={goOrders}
        accessibilityRole="button"
        accessibilityLabel="Ver mis pedidos"
        style={styles.link}
      >
        <Text style={{ color: c.brandPrimary, fontWeight: "700" }}>Ver mis pedidos</Text>
      </Pressable>
    </View>
  ) : null;

  const success = confirmation ? (
    <View style={styles.success} accessibilityLiveRegion="polite">
      <Ionicons name="checkmark-circle" size={64} color={c.success} />
      <Text style={[styles.titleText, { color: c.text }]}>¡Pago exitoso!</Text>
      <Text style={[styles.hint, { color: c.textMuted }]}>
        Gracias por tu compra. Te enviaremos un correo con el detalle.
      </Text>
    </View>
  ) : null;

  if (notFound) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="cube-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>Pedido no encontrado</Text>
        <Pressable
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Volver al inicio</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando tu pedido…</Text>
      </View>
    );
  }

  // Sin el detalle: en la confirmación el pago ya está hecho, así que se muestra
  // lo mínimo (folio) con "Reintentar"; fuera de ella, un error normal.
  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        {success}
        {confirmation && orderId !== null ? (
          <Text style={[styles.folio, { color: c.text }]} accessibilityLabel={`Folio ${formatOrderFolio(orderId)}`}>
            {formatOrderFolio(orderId)}
          </Text>
        ) : (
          <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        )}
        <Text style={[styles.hint, { color: c.textMuted }]}>
          {confirmation
            ? "No pudimos cargar el detalle de tu pedido, pero tu pago fue recibido."
            : "No pudimos cargar tu pedido. Intenta de nuevo."}
        </Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Reintentar</Text>
        </Pressable>
        {confirmation ? actions : null}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {title}
      <ScrollView contentContainerStyle={styles.content}>
        {success}
        <OrderDetailView
          order={order}
          onOpenProduct={openProduct}
          onReviewProduct={confirmation ? undefined : reviewProduct}
        />
        {isRefetching ? <ActivityIndicator color={c.brandPrimary} style={{ marginTop: spacing.md }} /> : null}
      </ScrollView>
      {actions ? (
        <View style={[styles.footer, { backgroundColor: c.card, borderColor: c.border }]}>{actions}</View>
      ) : null}
    </View>
  );
}

export default function OrderRoute() {
  return (
    <RequireAuth>
      <OrderScreen />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  success: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md },
  titleText: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  folio: { fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  footer: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  actions: { gap: spacing.sm, alignItems: "stretch" },
  primary: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  link: { alignItems: "center", paddingVertical: spacing.sm },
});
