// src/app/(auth)/register.tsx — Crear cuenta.
// Campos y reglas tomados del validador del backend, que es el que valida de
// verdad. Nota: la web usa nombre 4–25 y el backend 3–40; manda el backend.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import AuthScaffold, { FormError, SubmitButton } from "@/features/auth/components/AuthScaffold";
import PasswordRules from "@/features/auth/components/PasswordRules";
import { useRegister } from "@/features/auth/hooks/useRegister";
import { authErrorMessage } from "@/features/auth/repositories/authRepository";
import { passwordIsValid, validateEmail } from "@/features/auth/validation";
import { spacing, useColors } from "@/shared/theme/useColors";
import FormField from "@/shared/ui/FormField";

type Campos = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  telefono: string;
  password: string;
  confirmPassword: string;
};

const VACIO: Campos = {
  nombre: "",
  apellido_paterno: "",
  apellido_materno: "",
  correo: "",
  telefono: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterScreen() {
  const c = useColors();
  const router = useRouter();
  const register = useRegister();

  const [datos, setDatos] = useState<Campos>(VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof Campos, string>>>({});
  const [acepta, setAcepta] = useState(false);

  const enviando = register.isPending;

  // Refs para encadenar los campos con la tecla "siguiente" del teclado.
  const refPaterno = useRef<TextInput>(null);
  const refMaterno = useRef<TextInput>(null);
  const refCorreo = useRef<TextInput>(null);
  const refTelefono = useRef<TextInput>(null);
  const refPassword = useRef<TextInput>(null);
  const refConfirm = useRef<TextInput>(null);

  const set = (campo: keyof Campos) => (valor: string) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const validar = () => {
    const e: Partial<Record<keyof Campos, string>> = {};
    const nombre = datos.nombre.trim();
    const paterno = datos.apellido_paterno.trim();
    const materno = datos.apellido_materno.trim();

    if (nombre.length < 3) e.nombre = "El nombre debe tener al menos 3 caracteres";
    else if (nombre.length > 40) e.nombre = "El nombre no puede exceder 40 caracteres";

    if (paterno.length < 2) e.apellido_paterno = "Debe tener al menos 2 caracteres";
    else if (paterno.length > 100) e.apellido_paterno = "No puede exceder 100 caracteres";

    if (materno.length < 2) e.apellido_materno = "Debe tener al menos 2 caracteres";
    else if (materno.length > 100) e.apellido_materno = "No puede exceder 100 caracteres";

    e.correo = validateEmail(datos.correo.trim());

    if (!/^\d{10}$/.test(datos.telefono)) e.telefono = "Debe tener exactamente 10 dígitos";

    if (!passwordIsValid(datos.password)) e.password = "La contraseña no cumple los requisitos";

    if (datos.confirmPassword !== datos.password)
      e.confirmPassword = "Las contraseñas no coinciden";

    setErrores(e);
    return Object.values(e).every((v) => !v);
  };

  const enviar = async () => {
    if (!validar()) return;
    register.reset();
    const correo = datos.correo.trim();
    try {
      await register.mutateAsync({
        nombre: datos.nombre.trim(),
        apellido_paterno: datos.apellido_paterno.trim(),
        apellido_materno: datos.apellido_materno.trim(),
        correo,
        telefono: datos.telefono,
        password: datos.password,
        confirmPassword: datos.confirmPassword,
      });
      // El backend manda un código de 6 dígitos al correo: la cuenta no queda
      // activa hasta verificarlo.
      router.replace({ pathname: "/(auth)/verify-code", params: { correo, tipo: "registro" } });
    } catch {
      // El mensaje ya quedó en register.error.
    }
  };

  return (
    <AuthScaffold
      compact
      title="Crear cuenta"
      subtitle="Solo te tomará un minuto."
      footer={
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
          <Text style={{ color: c.textMuted, fontSize: 14 }}>¿Ya tienes cuenta?</Text>
          <Pressable onPress={() => router.replace("/(auth)/login")} hitSlop={8}>
            <Text style={{ color: c.brandSecondary, fontWeight: "800", fontSize: 14 }}>
              Inicia sesión
            </Text>
          </Pressable>
        </View>
      }
    >
      <FormError
        message={
          register.error
            ? authErrorMessage(register.error, "No se pudo crear la cuenta. Intenta de nuevo.")
            : null
        }
      />

      <Text style={[styles.grupo, { color: c.textMuted }]}>DATOS PERSONALES</Text>

      <FormField
        label="Nombre"
        icon="person-outline"
        placeholder="Juan"
        value={datos.nombre}
        onChangeText={set("nombre")}
        error={errores.nombre}
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
        onSubmitEditing={() => refPaterno.current?.focus()}
        editable={!enviando}
        maxLength={40}
      />

      <FormField
        ref={refPaterno}
        label="Apellido paterno"
        icon="person-outline"
        placeholder="García"
        value={datos.apellido_paterno}
        onChangeText={set("apellido_paterno")}
        error={errores.apellido_paterno}
        autoCapitalize="words"
        autoComplete="family-name"
        returnKeyType="next"
        onSubmitEditing={() => refMaterno.current?.focus()}
        editable={!enviando}
        maxLength={100}
      />

      <FormField
        ref={refMaterno}
        label="Apellido materno"
        icon="person-outline"
        placeholder="López"
        value={datos.apellido_materno}
        onChangeText={set("apellido_materno")}
        error={errores.apellido_materno}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => refCorreo.current?.focus()}
        editable={!enviando}
        maxLength={100}
      />

      <Text style={[styles.grupo, { color: c.textMuted }]}>CONTACTO</Text>

      <FormField
        ref={refCorreo}
        label="Correo electrónico"
        icon="mail-outline"
        placeholder="tu@email.com"
        value={datos.correo}
        onChangeText={set("correo")}
        error={errores.correo}
        hint="Te enviaremos un código para confirmar tu cuenta"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => refTelefono.current?.focus()}
        editable={!enviando}
        maxLength={150}
      />

      <FormField
        ref={refTelefono}
        label="Teléfono"
        icon="call-outline"
        prefix="+52"
        placeholder="7711234567"
        value={datos.telefono}
        // Solo dígitos: el backend exige exactamente 10 y rechaza espacios o guiones.
        onChangeText={(t) => set("telefono")(t.replace(/\D/g, ""))}
        error={errores.telefono}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        onSubmitEditing={() => refPassword.current?.focus()}
        editable={!enviando}
        maxLength={10}
      />

      <Text style={[styles.grupo, { color: c.textMuted }]}>SEGURIDAD</Text>

      <FormField
        ref={refPassword}
        label="Contraseña"
        icon="lock-closed-outline"
        placeholder="Crea una contraseña"
        value={datos.password}
        onChangeText={set("password")}
        error={errores.password}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => refConfirm.current?.focus()}
        editable={!enviando}
      />

      <PasswordRules password={datos.password} />

      <FormField
        ref={refConfirm}
        label="Confirmar contraseña"
        icon="lock-closed-outline"
        placeholder="Repite la contraseña"
        value={datos.confirmPassword}
        onChangeText={set("confirmPassword")}
        error={errores.confirmPassword}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={enviar}
        editable={!enviando}
      />

      <Pressable
        onPress={() => setAcepta((v) => !v)}
        style={styles.terminos}
        disabled={enviando}
        hitSlop={6}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: acepta ? c.brandPrimary : "transparent",
              borderColor: acepta ? c.brandPrimary : c.border,
            },
          ]}
        >
          {acepta && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={{ color: c.textMuted, flex: 1, fontSize: 13, lineHeight: 18 }}>
          Acepto los Términos y Condiciones de uso del servicio
        </Text>
      </Pressable>

      <SubmitButton
        label="Crear cuenta"
        onPress={enviar}
        loading={enviando}
        disabled={!acepta}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  grupo: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  terminos: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
});
