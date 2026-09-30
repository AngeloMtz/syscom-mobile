// src/shared/ui/FormField.tsx — Campo de formulario con etiqueta, error y foco.
// Un solo tratamiento de input para toda la app: mismo alto, radio y error.
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { radius, spacing, useColors } from "@/shared/theme/useColors";

export interface FormFieldProps extends TextInputProps {
  label: string;
  /** Mensaje bajo el campo; pinta el borde en rojo cuando existe. */
  error?: string | null;
  /** Icono de Ionicons a la izquierda. */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  /** Texto fijo antes del input (ej. "+52" en el teléfono). */
  prefix?: string;
  /** Muestra el ojo para revelar la contraseña. */
  secure?: boolean;
  /** Pista bajo el campo cuando no hay error (ej. formato esperado). */
  hint?: string;
}

const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, icon, prefix, secure, hint, editable = true, style, ...rest },
  ref,
) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const borderColor = error ? c.danger : focused ? c.brandPrimary : c.border;

  return (
    <View style={{ marginBottom: spacing.md, opacity: editable ? 1 : 0.5 }}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>

      <View
        style={[
          styles.box,
          {
            borderColor,
            backgroundColor: c.inputBg,
            // El foco engrosa el borde en lugar de usar sombra: en RN una
            // sombra de foco se ve sucia sobre fondos claros.
            borderWidth: focused || error ? 1.5 : 1,
          },
        ]}
      >
        {icon && <Ionicons name={icon} size={18} color={focused ? c.brandPrimary : c.textMuted} />}
        {prefix && (
          <Text style={{ color: c.textMuted, fontWeight: "700", fontSize: 15 }}>{prefix}</Text>
        )}

        <TextInput
          ref={ref}
          style={[styles.input, { color: c.text }, style]}
          placeholderTextColor={c.textMuted}
          editable={editable}
          secureTextEntry={secure && !visible}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />

        {secure && (
          <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10}>
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={19}
              color={c.textMuted}
            />
          </Pressable>
        )}
      </View>

      {error ? (
        <View style={styles.msgRow}>
          <Ionicons name="alert-circle" size={13} color={c.danger} />
          <Text style={{ color: c.danger, fontSize: 12, flex: 1 }}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>{hint}</Text>
      ) : null}
    </View>
  );
});

export default FormField;

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    // Alto consistente con el botón primario (48 px de área táctil)
    height: 48,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  msgRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
});
