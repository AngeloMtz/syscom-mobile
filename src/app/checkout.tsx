// src/app/checkout.tsx — Resumen y pago (HU #13, Stripe sandbox).
// Solo presentación: el flujo del pago vive en usePayment y las reglas en
// features/payments. El total es el del servidor (meta.totalPrice del carrito).
// Mientras se paga no se puede salir ni editar el carrito.
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { formatAddressLine, resolveSelectedAddress } from "@/features/addresses/addressSelectors";
import { useCheckoutStore } from "@/features/addresses/checkoutStore";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import RequireAuth from "@/features/auth/components/RequireAuth";
import { canCheckout, getCartTotal, toCartLineData } from "@/features/cart/cartSelectors";
import { useCart } from "@/features/cart/hooks/useCart";
import { usePayment } from "@/features/payments/hooks/usePayment";
import { STRIPE_PUBLISHABLE_KEY } from "@/features/payments/paymentConfig";
import { isBusy, type PaymentState } from "@/features/payments/paymentReducer";
import {
  formatPayLabel,
  isStripeConfigured,
  payBlockMessage,
  payBlockReason,
} from "@/features/payments/paymentSelectors";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import { formatPrice } from "@/shared/utils/format";

type PaymentApi = {
  state: PaymentState;
  pay: (idDireccion: number) => Promise<void>;
  recheck: () => Promise<void>;
  reset: () => void;
};

const IDLE: PaymentState = { phase: "idle", paymentIntentId: null, orderId: null, message: null };
const NOOP_API: PaymentApi = {
  state: IDLE,
  pay: async () => undefined,
  recheck: async () => undefined,
  reset: () => undefined,
};

/** Con clave publicable: el SDK de Stripe está montado y se puede usar usePayment. */
function ConfiguredCheckout() {
  const payment = usePayment();
  return <CheckoutView payment={payment} stripeConfigured />;
}

function CheckoutView({ payment, stripeConfigured }: { payment: PaymentApi; stripeConfigured: boolean }) {
  const c = useColors();
  const { state, pay, recheck } = payment;

  const cart = useCart();
  const addresses = useAddresses();
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const address = resolveSelectedAddress(addresses.data, selectedAddressId);

  const busy = isBusy(state);
  const total = getCartTotal(cart.data);
  const lines = (cart.data?.items ?? []).map(toCartLineData);

  // El botón "atrás" de Android no sale de la pantalla mientras se paga.
  useEffect(() => {
    if (!busy) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [busy]);

  const reason = payBlockReason({
    stripeConfigured,
    cartReady: canCheckout(cart.data),
    hasAddress: address !== null,
    total,
  });

  const title = (
    <Stack.Screen
      options={{ title: "Resumen y pago", gestureEnabled: !busy, headerBackVisible: !busy }}
    />
  );

  if (cart.isLoading || addresses.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
      </View>
    );
  }

  if (state.phase === "paid") {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="checkmark-circle" size={64} color={c.brandPrimary} />
        <Text style={[styles.titleText, { color: c.text }]}>¡Pago exitoso!</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>
          Tu pedido #{state.orderId} fue confirmado. Te enviaremos un correo con el detalle.
        </Text>
        <Pressable
          onPress={() => router.replace("/")}
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Volver al inicio</Text>
        </Pressable>
      </View>
    );
  }

  if (state.phase === "pending") {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="time-outline" size={56} color={c.brandPrimary} />
        <Text style={[styles.titleText, { color: c.text }]} accessibilityLiveRegion="polite">
          {state.message}
        </Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>
          Puede tardar unos minutos. No vuelvas a pagar: tu pago ya se recibió. Tu carrito queda bloqueado
          hasta confirmar el pedido.
        </Text>
        <Pressable
          onPress={() => void recheck()}
          accessibilityRole="button"
          accessibilityLabel="Verificar de nuevo"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Verificar de nuevo</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Ir a mi cuenta"
          style={styles.link}
        >
          <Text style={{ color: c.brandPrimary, fontWeight: "700" }}>Ir a mi cuenta</Text>
        </Pressable>
      </View>
    );
  }

  const working = busy;
  const workingText =
    state.phase === "verifying"
      ? "Confirmando tu pedido…"
      : state.phase === "sheet"
        ? "Completa el pago en la hoja de Stripe…"
        : "Preparando tu pago…";
  const banner =
    (state.phase === "failed" || state.phase === "canceled") && state.message ? state.message : null;
  const canPress = !working && reason === null && address !== null;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {title}
      <ScrollView contentContainerStyle={styles.content}>
        {banner ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: (state.phase === "failed" ? c.danger : c.textMuted) + "14",
                borderColor: (state.phase === "failed" ? c.danger : c.textMuted) + "40",
              },
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={{ color: state.phase === "failed" ? c.danger : c.text, fontSize: 13, lineHeight: 18 }}>
              {banner}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.section, { color: c.textMuted }]}>PRODUCTOS</Text>
        {lines.map((l) => (
          <View key={l.id} style={[styles.line, { borderColor: c.divider }]}>
            <Text style={[styles.lineName, { color: c.text }]} numberOfLines={2}>
              {l.cantidad} × {l.nombre}
            </Text>
            <Text style={{ color: c.text, fontWeight: "700" }}>
              {l.subtotal !== null ? formatPrice(l.subtotal) : "—"}
            </Text>
          </View>
        ))}

        <Text style={[styles.section, { color: c.textMuted }]}>ENVIAR A</Text>
        <View style={[styles.addressRow, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="location-outline" size={20} color={c.textMuted} />
          <Text style={[styles.addressText, { color: c.text }]} numberOfLines={2}>
            {address ? formatAddressLine(address) : "Agrega una dirección de envío"}
          </Text>
          <Pressable
            onPress={() =>
              address
                ? router.push({ pathname: "/addresses", params: { select: "1" } })
                : router.push("/addresses/form")
            }
            disabled={working}
            accessibilityRole="button"
            accessibilityLabel={address ? "Cambiar dirección de envío" : "Agregar dirección de envío"}
            accessibilityState={{ disabled: working }}
            hitSlop={8}
          >
            <Text style={{ color: working ? c.textMuted : c.brandPrimary, fontWeight: "700", fontSize: 13 }}>
              {address ? "Cambiar" : "Agregar"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.totalRow}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>Total</Text>
          <Text
            style={[styles.total, { color: c.brandDeep }]}
            accessibilityLabel={`Total ${formatPrice(total)}`}
          >
            {formatPrice(total)}
          </Text>
        </View>

        {reason ? (
          <Text style={[styles.note, { color: c.danger }]} accessibilityLiveRegion="polite">
            {payBlockMessage(reason)}
          </Text>
        ) : null}
        {working ? (
          <View style={styles.workingRow} accessibilityLiveRegion="polite">
            <ActivityIndicator color={c.brandPrimary} />
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{workingText}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => {
            if (address) void pay(address.id_direccion);
          }}
          disabled={!canPress}
          accessibilityRole="button"
          accessibilityLabel={formatPayLabel(total)}
          accessibilityState={{ disabled: !canPress, busy: working }}
          style={[styles.primary, styles.payBtn, { backgroundColor: canPress ? c.brandPrimary : c.border }]}
        >
          <Text style={[styles.primaryText, !canPress && { color: c.textMuted }]}>
            {working ? "Procesando…" : formatPayLabel(total)}
          </Text>
        </Pressable>
        <Text style={[styles.sandbox, { color: c.textMuted }]}>
          Modo de pruebas: usa solo tarjetas de prueba de Stripe.
        </Text>
      </View>
    </View>
  );
}

export default function CheckoutScreen() {
  const configured = isStripeConfigured(STRIPE_PUBLISHABLE_KEY);
  return (
    <RequireAuth>
      {configured ? <ConfiguredCheckout /> : <CheckoutView payment={NOOP_API} stripeConfigured={false} />}
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  banner: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  section: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: spacing.md },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lineName: { flex: 1, fontSize: 14 },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  addressText: { flex: 1, fontSize: 14, fontWeight: "600" },
  footer: { padding: spacing.lg, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  totalRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  total: { fontSize: 24, fontWeight: "800" },
  note: { fontSize: 12, fontWeight: "600" },
  workingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  primary: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999, alignItems: "center" },
  payBtn: { marginTop: spacing.xs },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  link: { paddingVertical: spacing.md },
  sandbox: { fontSize: 11, textAlign: "center" },
});
