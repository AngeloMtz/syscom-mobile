// src/features/profile/components/DashboardOption.tsx — Fila del panel del
// cliente. Las secciones que llegan en otros issues se muestran atenuadas y se
// anuncian como deshabilitadas al lector de pantalla.
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description?: string;
  onPress?: () => void;
  disabled?: boolean;
};

export default function DashboardOption({
  icon,
  label,
  description,
  onPress,
  disabled,
}: Props) {
  const c = useColors();
  const inactivo = disabled || !onPress;

  return (
    <Pressable
      onPress={inactivo ? undefined : onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={
        inactivo ? "Esta sección estará disponible próximamente" : description
      }
      accessibilityState={{ disabled: inactivo }}
      style={({ pressed }) => [
        styles.fila,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          opacity: inactivo ? 0.55 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.iconoCaja, { backgroundColor: c.brandPrimary + "18" }]}>
        <Ionicons name={icon} size={20} color={inactivo ? c.textMuted : c.brandPrimary} />
      </View>

      <View style={styles.textos}>
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        {inactivo ? (
          <Text style={[styles.proximamente, { color: c.textMuted }]}>Próximamente</Text>
        ) : description ? (
          <Text style={[styles.descripcion, { color: c.textMuted }]}>{description}</Text>
        ) : null}
      </View>

      {!inactivo && <Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    // 56 px de alto mínimo: área táctil cómoda y consistente entre filas.
    minHeight: 56,
  },
  iconoCaja: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: "700" },
  descripcion: { fontSize: 12 },
  proximamente: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
});
