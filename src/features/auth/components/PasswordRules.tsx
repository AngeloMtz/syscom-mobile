// src/features/auth/components/PasswordRules.tsx — Requisitos de contraseña
// en vivo. Las reglas viven en features/auth/validation.ts; aquí solo se
// pintan, en dos columnas para no empujar el formulario.
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { PASSWORD_RULES } from "@/features/auth/validation";
import { spacing, useColors } from "@/shared/theme/useColors";

const NIVELES = ["Muy débil", "Débil", "Regular", "Fuerte", "Muy fuerte"];

export default function PasswordRules({ password }: { password: string }) {
  const c = useColors();
  const cumplidas = PASSWORD_RULES.filter((r) => r.test(password)).length;

  if (!password) return null;

  const nivel = Math.max(0, cumplidas - 1);
  const colorNivel =
    cumplidas <= 2
      ? c.danger
      : cumplidas === 3
        ? c.warning
        : cumplidas === 4
          ? c.brandSecondary
          : c.success;

  return (
    <View style={{ marginBottom: spacing.md, marginTop: -4 }}>
      <View style={styles.barRow}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.barSegment,
              { backgroundColor: i < cumplidas ? colorNivel : c.divider },
            ]}
          />
        ))}
        <Text style={{ color: colorNivel, fontSize: 11, fontWeight: "800", minWidth: 62 }}>
          {NIVELES[nivel]}
        </Text>
      </View>

      <View style={styles.grid}>
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password);
          return (
            <View key={r.label} style={styles.rule}>
              <Ionicons
                name={ok ? "checkmark-circle" : "ellipse-outline"}
                size={13}
                color={ok ? c.success : c.textMuted}
              />
              <Text style={{ color: ok ? c.text : c.textMuted, fontSize: 11.5, flexShrink: 1 }}>
                {r.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm },
  barSegment: { flex: 1, height: 4, borderRadius: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 4 },
  rule: { flexDirection: "row", alignItems: "center", gap: 5, width: "50%", paddingRight: 4 },
});
