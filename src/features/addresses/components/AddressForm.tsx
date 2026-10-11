// src/features/addresses/components/AddressForm.tsx — Formulario de dirección.
// Valida con validateAddress (mismas reglas que el backend) antes de enviar y
// muestra, bajo cada campo, el error local o el que devolvió el servidor (400).
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { validateAddress } from "@/features/addresses/addressValidation";
import type { AddressErrors, AddressField, AddressInput } from "@/features/addresses/types";
import FormField from "@/shared/ui/FormField";
import { spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  initial?: AddressInput;
  submitLabel: string;
  submitting: boolean;
  /** Errores por campo que devolvió el servidor en el último intento. */
  serverErrors?: AddressErrors;
  onSubmit: (input: AddressInput) => void;
};

const EMPTY: AddressInput = {
  calle: "",
  colonia: "",
  ciudad: "",
  estado: "",
  codigo_postal: "",
  referencias: "",
};

export default function AddressForm({ initial, submitLabel, submitting, serverErrors, onSubmit }: Props) {
  const c = useColors();
  const [values, setValues] = useState<AddressInput>(initial ?? EMPTY);
  const [clientErrors, setClientErrors] = useState<AddressErrors>({});
  // Campos que se editaron desde el último error del servidor: su error ya no aplica.
  const [edited, setEdited] = useState<Partial<Record<AddressField, true>>>({});

  const refColonia = useRef<TextInput>(null);
  const refCiudad = useRef<TextInput>(null);
  const refEstado = useRef<TextInput>(null);
  const refCp = useRef<TextInput>(null);
  const refReferencias = useRef<TextInput>(null);

  const set = (field: AddressField) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setEdited((e) => ({ ...e, [field]: true }));
    if (clientErrors[field]) setClientErrors((e) => ({ ...e, [field]: undefined }));
  };

  const errorOf = (field: AddressField): string | undefined =>
    clientErrors[field] ?? (edited[field] ? undefined : serverErrors?.[field]);

  const submit = () => {
    const errors = validateAddress(values);
    setClientErrors(errors);
    setEdited({});
    if (Object.keys(errors).length > 0) return;
    onSubmit(values);
  };

  return (
    <View>
      <FormField
        label="Calle y número"
        value={values.calle}
        onChangeText={set("calle")}
        error={errorOf("calle")}
        hint="De 5 a 150 caracteres"
        icon="home-outline"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => refColonia.current?.focus()}
        editable={!submitting}
        accessibilityLabel="Calle y número"
      />
      <FormField
        ref={refColonia}
        label="Colonia"
        value={values.colonia}
        onChangeText={set("colonia")}
        error={errorOf("colonia")}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => refCiudad.current?.focus()}
        editable={!submitting}
        accessibilityLabel="Colonia"
      />
      <FormField
        ref={refCiudad}
        label="Ciudad"
        value={values.ciudad}
        onChangeText={set("ciudad")}
        error={errorOf("ciudad")}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => refEstado.current?.focus()}
        editable={!submitting}
        accessibilityLabel="Ciudad"
      />
      <FormField
        ref={refEstado}
        label="Estado"
        value={values.estado}
        onChangeText={set("estado")}
        error={errorOf("estado")}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => refCp.current?.focus()}
        editable={!submitting}
        accessibilityLabel="Estado"
      />
      <FormField
        ref={refCp}
        label="Código postal"
        value={values.codigo_postal}
        onChangeText={set("codigo_postal")}
        error={errorOf("codigo_postal")}
        hint="5 dígitos"
        keyboardType="number-pad"
        returnKeyType="next"
        onSubmitEditing={() => refReferencias.current?.focus()}
        editable={!submitting}
        accessibilityLabel="Código postal"
      />
      <FormField
        ref={refReferencias}
        label="Referencias (opcional)"
        value={values.referencias}
        onChangeText={set("referencias")}
        error={errorOf("referencias")}
        hint="Entre qué calles está, color de la casa, etc."
        multiline
        editable={!submitting}
        accessibilityLabel="Referencias"
      />

      <Pressable
        onPress={submit}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        accessibilityState={{ disabled: submitting, busy: submitting }}
        style={[styles.button, { backgroundColor: c.brandPrimary, opacity: submitting ? 0.6 : 1 }]}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: spacing.md,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
