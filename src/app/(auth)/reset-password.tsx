// src/app/(auth)/reset-password.tsx — Paso 3 de 3 de la recuperación.
// Llega con el correo y el código ya validados. No inicia sesión: al terminar
// se vuelve al login, igual que en la web.
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";

import AuthScaffold, { FormError, SubmitButton } from "@/features/auth/components/AuthScaffold";
import PasswordRules from "@/features/auth/components/PasswordRules";
import { useResetPassword } from "@/features/auth/hooks/usePasswordRecovery";
import { authErrorMessage } from "@/features/auth/repositories/authRepository";
import { passwordIsValid } from "@/features/auth/validation";
import { spacing, useColors } from "@/shared/theme/useColors";
import FormField from "@/shared/ui/FormField";

export default function ResetPasswordScreen() {
  const c = useColors();
  const router = useRouter();
  const { correo = "", code = "" } = useLocalSearchParams<{ correo?: string; code?: string }>();
  const reset = useResetPassword();
  const refConfirm = useRef<TextInput>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errores, setErrores] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [listo, setListo] = useState(false);

  const enviando = reset.isPending;

  const enviar = async () => {
    const e: typeof errores = {};
    if (!passwordIsValid(newPassword)) e.newPassword = "La contraseña no cumple los requisitos";
    if (confirmPassword !== newPassword) e.confirmPassword = "Las contraseñas no coinciden";
    setErrores(e);
    if (e.newPassword || e.confirmPassword) return;

    reset.reset();
    try {
      await reset.mutateAsync({
        correo: String(correo),
        code: String(code),
        newPassword,
        confirmPassword,
      });
      setListo(true);
    } catch {
      // El mensaje ya quedó en reset.error.
    }
  };

  if (listo) {
    return (
      <AuthScaffold compact title="Contraseña actualizada">
        <View style={{ paddingVertical: spacing.md }}>
          <Text style={{ color: c.textMuted, fontSize: 14, lineHeight: 20 }}>
            Ya puedes iniciar sesión con tu contraseña nueva.
          </Text>
        </View>
        <SubmitButton
          label="Ir a iniciar sesión"
          onPress={() => router.replace("/(auth)/login")}
        />
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      compact
      title="Nueva contraseña"
      subtitle={correo ? `Para la cuenta ${correo}` : undefined}
    >
      <FormError
        message={
          reset.error
            ? authErrorMessage(reset.error, "No se pudo actualizar la contraseña.")
            : null
        }
      />

      <FormField
        label="Contraseña nueva"
        icon="lock-closed-outline"
        placeholder="Crea una contraseña"
        value={newPassword}
        onChangeText={(t) => {
          setNewPassword(t);
          if (errores.newPassword) setErrores((e) => ({ ...e, newPassword: undefined }));
        }}
        error={errores.newPassword}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => refConfirm.current?.focus()}
        editable={!enviando}
      />

      <PasswordRules password={newPassword} />

      <FormField
        ref={refConfirm}
        label="Confirmar contraseña"
        icon="lock-closed-outline"
        placeholder="Repite la contraseña"
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          if (errores.confirmPassword) setErrores((e) => ({ ...e, confirmPassword: undefined }));
        }}
        error={errores.confirmPassword}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={enviar}
        editable={!enviando}
      />

      <SubmitButton label="Guardar contraseña" onPress={enviar} loading={enviando} />
    </AuthScaffold>
  );
}
