// src/features/cart/components/CartSummary.tsx — Total y botón de pago.
// El total es `meta.totalPrice` del backend (con ajuste optimista mientras se
// edita). El pago llega en la HU #13: `onCheckout` es opcional y, sin él, el
// botón queda deshabilitado y lo dice con honestidad. `canCheckout` (selector)
// ya decide si habría que bloquearlo por líneas agotadas o por encima del stock.
import { StyleSheet, Text, View, Pressable } from "react-native";

import { formatPrice } from "@/shared/utils/format";
import { spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  total: number;
  units: number;
  /** Resultado de canCheckout(cart): sin líneas bloqueantes y con al menos una línea. */
  canCheckout: boolean;
  /** Líneas agotadas, no disponibles o por encima del stock. */
  blockingCount: number;
  /** Se pasa cuando exista el flujo de pago (HU #13). */
  onCheckout?: () => void;
};

export default function CartSummary({ total, units, canCheckout, blockingCount, onCheckout }: Props) {
  const c = useColors();
  const enabled = canCheckout && !!onCheckout;

  const note =
    blockingCount > 0
      ? `Quita o ajusta ${blockingCount} ${blockingCount === 1 ? "producto" : "productos"} para continuar.`
      : !onCheckout
        ? "El pago estará disponible próximamente."
        : null;

  return (
    <View style={[styles.wrap, { backgroundColor: c.card, borderColor: c.border }]}>
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
  row: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  label: { fontSize: 13 },
  total: { fontSize: 22, fontWeight: "800" },
  note: { fontSize: 12, fontWeight: "600" },
  button: { paddingVertical: spacing.md, borderRadius: 999, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
