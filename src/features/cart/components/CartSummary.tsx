// src/features/cart/components/CartSummary.tsx — Total y botón de pago.
// El total es `meta.totalPrice` del backend (con ajuste optimista mientras se
// edita). El pago llega en la HU #13: `onCheckout` es opcional y, sin él, el
// botón queda deshabilitado y lo dice con honestidad. `canCheckout` (selector)
// ya decide si habría que bloquearlo por líneas agotadas, por encima del stock
// o sin dirección de envío (HU #12).
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, Pressable } from "react-native";

import { formatPrice } from "@/shared/utils/format";
import { spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  total: number;
  units: number;
  /** Resultado de canProceedToPayment: sin líneas bloqueantes, con líneas y con dirección. */
  canCheckout: boolean;
  /** Líneas agotadas, no disponibles o por encima del stock. */
  blockingCount: number;
  /** Estado de la dirección de envío elegida. */
  addressState: "loading" | "error" | "ready";
  /** Línea de la dirección elegida; null si no hay ninguna guardada. */
  addressLine: string | null;
  /** Cambiar la dirección (o agregar la primera, o reintentar si falló la carga). */
  onChangeAddress: () => void;
  /** Se pasa cuando exista el flujo de pago (HU #13). */
  onCheckout?: () => void;
};

export default function CartSummary({
  total,
  units,
  canCheckout,
  blockingCount,
  addressState,
  addressLine,
  onChangeAddress,
  onCheckout,
}: Props) {
  const c = useColors();
  const enabled = canCheckout && !!onCheckout;

  const hasAddress = addressState === "ready" && addressLine !== null;

  const addressText =
    addressState === "loading"
      ? "Cargando dirección…"
      : addressState === "error"
        ? "No pudimos cargar tus direcciones"
        : (addressLine ?? "Agrega una dirección de envío");
  const addressAction =
    addressState === "error" ? "Reintentar" : hasAddress ? "Cambiar" : "Agregar";
  const addressActionLabel =
    addressState === "error"
      ? "Reintentar cargar las direcciones"
      : hasAddress
        ? "Cambiar dirección de envío"
        : "Agregar dirección de envío";

  const note =
    blockingCount > 0
      ? `Quita o ajusta ${blockingCount} ${blockingCount === 1 ? "producto" : "productos"} para continuar.`
      : addressState === "ready" && !hasAddress
        ? "Agrega una dirección de envío para continuar."
        : !onCheckout
          ? "El pago estará disponible próximamente."
          : null;

  return (
    <View style={[styles.wrap, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={20} color={c.textMuted} />
        <View style={styles.addressText}>
          <Text style={[styles.addressLabel, { color: c.textMuted }]}>Enviar a</Text>
          <Text
            style={[styles.addressValue, { color: addressState === "error" ? c.danger : c.text }]}
            numberOfLines={2}
          >
            {addressText}
          </Text>
        </View>
        {addressState !== "loading" ? (
          <Pressable
            onPress={onChangeAddress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={addressActionLabel}
          >
            <Text style={{ color: c.brandPrimary, fontWeight: "700", fontSize: 13 }}>{addressAction}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: c.textMuted }]}>
          Total ({units} {units === 1 ? "artículo" : "artículos"})
        </Text>
        <Text style={[styles.total, { color: c.brandDeep }]} accessibilityLabel={`Total ${formatPrice(total)}`}>
          {formatPrice(total)}
        </Text>
      </View>

      {note ? (
        <Text style={[styles.note, { color: blockingCount > 0 ? c.danger : c.textMuted }]} accessibilityLiveRegion="polite">
          {note}
        </Text>
      ) : null}

      <Pressable
        onPress={enabled ? onCheckout : undefined}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel="Continuar con el pago"
        accessibilityState={{ disabled: !enabled }}
        style={[styles.button, { backgroundColor: enabled ? c.brandPrimary : c.border }]}
      >
        <Text style={[styles.buttonText, !enabled && { color: c.textMuted }]}>Continuar con el pago</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  addressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  addressText: { flex: 1 },
  addressLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  addressValue: { fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  label: { fontSize: 13 },
  total: { fontSize: 22, fontWeight: "800" },
  note: { fontSize: 12, fontWeight: "600" },
  button: { paddingVertical: spacing.md, borderRadius: 999, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
