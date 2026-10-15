// src/shared/ui/MenuRow.tsx — Fila de menú con icono, texto y chevron.
// Una opción deshabilitada (o con `badge`) se atenúa y se anuncia como tal al
// lector de pantalla. La usan "Más" y otros listados de opciones.
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  desc?: string;
  /** Etiqueta corta a la derecha (ej. "Próximamente"); implica deshabilitado. */
  badge?: string;
  onPress?: () => void;
  disabled?: boolean;
};

export default function MenuRow({ icon, label, desc, badge, onPress, disabled }: Props) {
  const c = useColors();
  const inactivo = disabled || !!badge || !onPress;

  return (
    <Pressable
      onPress={inactivo ? undefined : onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={inactivo ? "Esta sección estará disponible próximamente" : desc}
      accessibilityState={{ disabled: inactivo }}
      style={({ pressed }) => [
        styles.row,
        cardShadow,
        { backgroundColor: c.card, opacity: inactivo ? 0.55 : pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: c.brandPrimary + "1A" }]}>
        <Ionicons name={icon} size={22} color={inactivo ? c.textMuted : c.brandPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        {badge ? (
          <Text style={[styles.badge, { color: c.textMuted }]}>{badge}</Text>
        ) : desc ? (
          <Text style={{ color: c.textMuted, fontSize: 12 }}>{desc}</Text>
        ) : null}
      </View>
      {!inactivo ? <Ionicons name="chevron-forward" size={20} color={c.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    minHeight: 56,
  },
  icon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15, fontWeight: "700" },
  badge: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
});
