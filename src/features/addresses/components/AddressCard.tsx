// src/features/addresses/components/AddressCard.tsx — Una dirección guardada.
// Solo presentación: tocar la tarjeta la elige para el envío; "Editar" y
// "Eliminar" son acciones aparte.
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatAddressFull } from "@/features/addresses/addressSelectors";
import type { Address } from "@/features/addresses/types";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  address: Address;
  /** Es la dirección que se usará para el envío. */
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function AddressCard({ address, selected, onSelect, onEdit, onDelete }: Props) {
  const c = useColors();

  return (
    <View
      style={[
        styles.card,
        cardShadow,
        { backgroundColor: c.card, borderColor: selected ? c.brandPrimary : c.border },
        selected && styles.cardSelected,
      ]}
    >
      <Pressable
        onPress={onSelect}
        accessibilityRole="radio"
        accessibilityLabel={`${formatAddressFull(address)}${selected ? ", dirección de envío elegida" : ""}`}
        accessibilityState={{ checked: selected, selected }}
        style={styles.body}
      >
        <Ionicons
          name={selected ? "radio-button-on" : "radio-button-off"}
          size={22}
          color={selected ? c.brandPrimary : c.textMuted}
        />
        <View style={styles.texts}>
          <Text style={[styles.street, { color: c.text }]} numberOfLines={2}>
            {address.calle}
          </Text>
          <Text style={[styles.line, { color: c.textMuted }]}>
            {address.colonia}, {address.ciudad}, {address.estado}
          </Text>
          <Text style={[styles.line, { color: c.textMuted }]}>C.P. {address.codigo_postal}</Text>
          {address.referencias ? (
            <Text style={[styles.line, { color: c.textMuted }]} numberOfLines={2}>
              Referencias: {address.referencias}
            </Text>
          ) : null}
          {selected ? (
            <Text style={[styles.badge, { color: c.brandPrimary }]}>Para el envío</Text>
          ) : null}
        </View>
      </Pressable>

      <View style={[styles.actions, { borderColor: c.divider }]}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Editar la dirección ${address.calle}`}
          style={styles.action}
        >
          <Ionicons name="create-outline" size={18} color={c.brandPrimary} />
          <Text style={{ color: c.brandPrimary, fontWeight: "700", fontSize: 13 }}>Editar</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar la dirección ${address.calle}`}
          style={styles.action}
        >
          <Ionicons name="trash-outline" size={18} color={c.danger} />
          <Text style={{ color: c.danger, fontWeight: "700", fontSize: 13 }}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  cardSelected: { borderWidth: 1.5 },
  body: { flexDirection: "row", gap: spacing.md, padding: spacing.md, alignItems: "flex-start" },
  texts: { flex: 1, gap: 2 },
  street: { fontSize: 15, fontWeight: "700" },
  line: { fontSize: 13 },
  badge: { fontSize: 12, fontWeight: "800", marginTop: spacing.xs },
  actions: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
});
