// src/app/(tabs)/cart.tsx — Carrito de compras.
// Solo presentación: el carrito vive en el servidor (useCart) y las reglas de
// stock, cantidad y total vienen de features/cart/cartSelectors. Exige sesión
// (RequireAuth lleva a login, como Favoritos). El pago llega en la HU #13.
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import {
  canProceedToPayment,
  formatAddressLine,
  resolveSelectedAddress,
} from "@/features/addresses/addressSelectors";
import { useCheckoutStore } from "@/features/addresses/checkoutStore";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import RequireAuth from "@/features/auth/components/RequireAuth";
import { cartUnits, getCartTotal, toCartLineData } from "@/features/cart/cartSelectors";
import CartItemRow from "@/features/cart/components/CartItemRow";
import CartSummary from "@/features/cart/components/CartSummary";
import { useCart } from "@/features/cart/hooks/useCart";
import { useRemoveCartItem } from "@/features/cart/hooks/useRemoveCartItem";
import { useUpdateCartItem } from "@/features/cart/hooks/useUpdateCartItem";
import { MAX_CART_LINES } from "@/features/cart/repositories/cartRepository";
import { usePaymentStore } from "@/features/payments/paymentStore";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

const openProduct = (productId: number) =>
  router.push({ pathname: "/product/[id]", params: { id: String(productId) } });

function CartContent() {
  const c = useColors();
  const { data, isLoading, isError, error, refetch, isRefetching } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  // Mientras se paga (o se confirma el pedido) el carrito no se edita: el webhook
  // arma el pedido con el carrito del servidor en ese momento.
  const locked = usePaymentStore((s) => s.locked);

  // Dirección de envío: la elegida, o la más reciente (el backend no tiene "por defecto").
  const addresses = useAddresses();
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const address = resolveSelectedAddress(addresses.data, selectedAddressId);
  const addressState = addresses.isLoading ? "loading" : addresses.isError && !addresses.data ? "error" : "ready";
  const changeAddress = () => {
    if (addressState === "error") addresses.refetch();
    else if (address) router.push({ pathname: "/addresses", params: { select: "1" } });
    else router.push("/addresses/form");
  };

  const fail = (e: unknown) =>
    Alert.alert("No se pudo actualizar tu carrito", apiErrorMessage(e));
  const setQuantity = (productId: number, cantidad: number) => {
    if (locked) return;
    update.mutate({ productId, cantidad }, { onError: fail });
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando tu carrito…</Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>No pudimos cargar tu carrito</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>{apiErrorMessage(error)}</Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const items = data?.items ?? [];
  const lines = items.map((item) => ({ item, line: toCartLineData(item) }));
  const blockingCount = lines.filter((l) => l.line.blocking).length;

  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Ionicons name="cart-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>Tu carrito está vacío</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>
          Agrega productos desde el catálogo para verlos aquí.
        </Text>
        <Pressable
          onPress={() => router.push("/catalog")}
          accessibilityRole="button"
          accessibilityLabel="Ver catálogo"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Ver catálogo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <FlatList
        data={lines}
        keyExtractor={({ line }) => String(line.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item: { line } }) => (
          <CartItemRow
            line={line}
            onOpen={() => openProduct(line.id)}
            onIncrease={() => setQuantity(line.id, line.cantidad + 1)}
            onDecrease={() => setQuantity(line.id, line.cantidad - 1)}
            disabled={locked}
            onRemove={() => {
              if (!locked) remove.mutate(line.id, { onError: fail });
            }}
          />
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <>
            {locked ? (
              <View
                style={[styles.notice, { backgroundColor: c.card, borderColor: c.border }]}
                accessibilityRole="alert"
              >
                <Ionicons name="lock-closed-outline" size={18} color={c.textMuted} />
                <Text style={[styles.noticeText, { color: c.textMuted }]}>
                  Hay un pago en proceso. Podrás editar tu carrito cuando termine.
                </Text>
              </View>
            ) : null}
            {data?.truncated ? (
              <View
                style={[styles.notice, { backgroundColor: c.card, borderColor: c.border }]}
                accessibilityRole="alert"
              >
                <Ionicons name="information-circle-outline" size={18} color={c.textMuted} />
                <Text style={[styles.noticeText, { color: c.textMuted }]}>
                  Mostramos las {MAX_CART_LINES} líneas más recientes de {data.total}. El total incluye todas.
                </Text>
              </View>
            ) : null}
          </>
        }
      />
      <CartSummary
        total={getCartTotal(data)}
        units={cartUnits(items)}
        canCheckout={canProceedToPayment(data, address)}
        blockingCount={blockingCount}
        addressState={addressState}
        addressLine={address ? formatAddressLine(address) : null}
        onChangeAddress={changeAddress}
        onCheckout={() => router.push("/checkout")}
      />
    </View>
  );
}

export default function CartScreen() {
  return (
    <RequireAuth>
      <CartContent />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  list: { padding: spacing.lg, flexGrow: 1 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  primary: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  primaryText: { color: "#fff", fontWeight: "700" },
});
