// src/app/(auth)/login.tsx — Inicio de sesión.
// Campos según el validador del backend: correo (email, máx. 150) y password.
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";

import AuthScaffold, {
  Divider,
  FormError,
  SubmitButton,
} from "@/features/auth/components/AuthScaffold";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { authErrorMessage } from "@/features/auth/repositories/authRepository";
import { validateEmail } from "@/features/auth/validation";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import FormField from "@/shared/ui/FormField";

export default function LoginScreen() {
  const c = useColors();
  const router = useRouter();
  const login = useLogin();
  const passwordRef = useRef<TextInput>(null);

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState<{ correo?: string; password?: string }>({});

  const enviando = login.isPending;

  const validar = () => {
    const e: typeof errores = {};
    e.correo = validateEmail(correo.trim());
    if (!password) e.password = "La contraseña es requerida";
    setErrores(e);
    return !e.correo && !e.password;
  };

  const enviar = async () => {
    if (!validar()) return;
    login.reset();
    const result = await login.mutateAsync({ correo: correo.trim(), password }).catch(() => null);
    if (!result) return; // el error ya quedó en login.error

    if (result.requires2FA) {
      router.push({
        pathname: "/(auth)/verify-code",
        params: { correo: result.correo ?? correo.trim(), tipo: "2fa" },
      });
    }
    // Sin 2FA la sesión ya nació en el hook: el guard de (auth) redirige solo.
  };

  return (
    <AuthScaffold
      title="Hola de nuevo"
      subtitle="Inicia sesión para continuar"
      footer={
        <>
          <Divider label="o" />
          {/* Crear cuenta como acción propia, no como enlace al pie: es la otra
              mitad de lo que se puede hacer en esta pantalla. */}
          <Pressable
            onPress={() => router.replace("/(auth)/register")}
            style={({ pressed }) => [
              styles.secundario,
              { borderColor: c.brandPrimary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={{ color: c.brandPrimary, fontWeight: "800", fontSize: 15 }}>
              Crear una cuenta
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            hitSlop={8}
            style={{ alignSelf: "center", marginTop: spacing.lg }}
          >
            <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: "600" }}>
              Seguir sin iniciar sesión
            </Text>
          </Pressable>
        </>
      }
    >
      <FormError
        message={
          login.error
            ? authErrorMessage(login.error, "No se pudo iniciar sesión. Verifica tus datos.")
            : null
        }
      />

      <FormField
        label="Correo electrónico"
        icon="mail-outline"
        placeholder="tu@email.com"
        value={correo}
        onChangeText={(t) => {
          setCorreo(t);
          if (errores.correo) setErrores((e) => ({ ...e, correo: undefined }));
        }}
        error={errores.correo}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!enviando}
        maxLength={150}
      />

      <FormField
        ref={passwordRef}
        label="Contraseña"
        icon="lock-closed-outline"
        placeholder="Tu contraseña"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errores.password) setErrores((e) => ({ ...e, password: undefined }));
        }}
        error={errores.password}
        secure
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={enviar}
        editable={!enviando}
      />

      <Pressable
        onPress={() => router.push("/(auth)/forgot-password")}
        hitSlop={8}
        style={{ alignSelf: "flex-end", marginBottom: spacing.sm }}
      >
        <Text style={{ color: c.brandSecondary, fontWeight: "700", fontSize: 13 }}>
          ¿Olvidaste tu contraseña?
        </Text>
      </Pressable>

      <SubmitButton label="Iniciar sesión" onPress={enviar} loading={enviando} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  secundario: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
