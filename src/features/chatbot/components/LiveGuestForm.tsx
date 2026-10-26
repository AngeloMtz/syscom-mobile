// src/features/chatbot/components/LiveGuestForm.tsx — Datos de quien chatea sin cuenta.
// El backend exige nombre y correo para atender a un invitado; con sesión no se muestra.
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { GuestData } from "@/features/chatbot/liveChat/types";
import { GUEST_EMAIL_MAX, GUEST_NAME_MAX, validateGuest } from "@/features/chatbot/liveChat/validation";
import FormField from "@/shared/ui/FormField";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  onSubmit: (guest: GuestData) => void;
};

export default function LiveGuestForm({ onSubmit }: Props) {
  const c = useColors();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const submit = () => {
    const check = validateGuest(name, email);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    onSubmit(check.guest);
  };

  return (
    <View>
      <Text style={[styles.title, { color: c.text }]}>Chatea con un asesor</Text>
      <Text style={[styles.hint, { color: c.textMuted }]}>
        Para atenderte necesitamos tu nombre y correo. Si tienes cuenta, inicia sesión y no te los pediremos.
      </Text>
      <FormField
        label="Nombre"
        icon="person-outline"
        value={name}
        onChangeText={setName}
        error={errors.name}
        maxLength={GUEST_NAME_MAX}
        autoCapitalize="words"
        accessibilityLabel="Nombre"
      />
      <FormField
        label="Correo electrónico"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        maxLength={GUEST_EMAIL_MAX}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Correo electrónico"
      />
      <Pressable
        onPress={submit}
        accessibilityRole="button"
        accessibilityLabel="Iniciar chat"
        style={[styles.button, { backgroundColor: c.brandPrimary }]}
      >
        <Text style={styles.buttonText}>Iniciar chat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", marginBottom: spacing.xs },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  button: { height: 48, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
