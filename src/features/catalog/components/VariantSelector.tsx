// src/features/catalog/components/VariantSelector.tsx — Selección de variante.
// Las variantes sin stock se muestran deshabilitadas y no se pueden elegir.
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatStock, isVariantAvailable } from "@/features/catalog/productDetail";
import type { ProductVariant } from "@/features/catalog/types";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  variantes: ProductVariant[];
  selectedId: number | null;
  onSelect: (variant: ProductVariant) => void;
};

export default function VariantSelector({ variantes, selectedId, onSelect }: Props) {
  const c = useColors();

  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Variantes del producto">
      {variantes.map((v) => {
        const available = isVariantAvailable(v);
        const selected = v.id === selectedId;
        return (
          <Pressable
            key={v.id}
            onPress={() => onSelect(v)}
            disabled={!available}
            accessibilityRole="radio"
            accessibilityLabel={`${v.nombre}, ${formatStock(v.stock)}`}
            accessibilityState={{ selected, disabled: !available, checked: selected }}
            style={[
              styles.chip,
              { borderColor: selected ? c.brandPrimary : c.border, backgroundColor: c.card },
              selected && { backgroundColor: c.brandPrimary },
              !available && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.name,
                { color: selected ? "#fff" : available ? c.text : c.textMuted },
                !available && styles.strike,
              ]}
            >
              {v.nombre}
            </Text>
            {!available ? <Text style={[styles.tag, { color: c.danger }]}>Agotado</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  disabled: { opacity: 0.55 },
  name: { fontSize: 14, fontWeight: "600" },
  strike: { textDecorationLine: "line-through" },
  tag: { fontSize: 11, fontWeight: "700" },
});
