// src/features/reviews/components/RatingInput.tsx — Elegir una calificación de 1 a 5 estrellas.
// Solo presentación: cada estrella es un botón con su etiqueta accesible ("Calificar con N estrellas")
// y el grupo se anuncia como "Calificación". Tocar la estrella N avisa con N.
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  /** 0 mientras no se elige. */
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string | null;
};

const STARS = [1, 2, 3, 4, 5] as const;

export default function RatingInput({ value, onChange, disabled = false, error }: Props) {
  const c = useColors();

  return (
    <View style={styles.wrap}>
      <View style={styles.row} accessible={false} accessibilityRole="radiogroup" accessibilityLabel="Calificación">
        {STARS.map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            disabled={disabled}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityLabel={`Calificar con ${n} ${n === 1 ? "estrella" : "estrellas"}`}
            accessibilityState={{ checked: n === value, disabled }}
            style={[styles.star, { opacity: disabled ? 0.5 : 1 }]}
          >
            <Ionicons name={n <= value ? "star" : "star-outline"} size={36} color={c.star} />
          </Pressable>
        ))}
      </View>
      {error ? (
        <Text style={[styles.error, { color: c.danger }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.xs },
  star: { padding: 2 },
  error: { fontSize: 12 },
});
