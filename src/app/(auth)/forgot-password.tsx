// src/app/(auth)/forgot-password.tsx — Paso 1 de 3 de la recuperación.
// Se usa el método "code": el flujo se completa dentro de la app. El método
// "link" existe en la API, pero abriría el navegador para terminar en la web.
import { useRouter } from "expo-router";
import { useState } from "react";

import AuthScaffold, { FormError, SubmitButton } from "@/features/auth/components/AuthScaffold";
import { useForgotPassword } from "@/features/auth/hooks/usePasswordRecovery";
import { authErrorMessage } from "@/features/auth/repositories/authRepository";
import { validateEmail } from "@/features/auth/validation";
import FormField from "@/shared/ui/FormField";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const forgot = useForgotPassword();

  const [correo, setCorreo] = useState("");
  const [errorCampo, setErrorCampo] = useState<string | undefined>();

  const enviar = async () => {
    const mail = correo.trim();
    const invalido = validateEmail(mail);
    setErrorCampo(invalido);
    if (invalido) return;

    forgot.reset();
    try {
      await forgot.mutateAsync(mail);
      router.push({
        pathname: "/(auth)/verify-code",
        params: { correo: mail, tipo: "recuperacion" },
      });
    } catch {
      // El mensaje ya quedó en forgot.error.
    }
  };

  return (
    <AuthScaffold
      compact
      title="Recuperar contraseña"
      subtitle="Te enviaremos un código de 6 dígitos para crear una contraseña nueva."
    >
      <FormError
        message={
          forgot.error
            ? authErrorMessage(forgot.error, "No se pudo enviar el código de recuperación.")
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
          if (errorCampo) setErrorCampo(undefined);
        }}
        error={errorCampo}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="go"
        onSubmitEditing={enviar}
        editable={!forgot.isPending}
        maxLength={150}
      />

      <SubmitButton label="Enviar código" onPress={enviar} loading={forgot.isPending} />
    </AuthScaffold>
  );
}
