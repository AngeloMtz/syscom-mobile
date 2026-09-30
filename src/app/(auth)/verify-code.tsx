// src/app/(auth)/verify-code.tsx — Código de 6 dígitos.
// Cubre los tres flujos que lo piden: confirmar el registro, el segundo paso
// del login con 2FA y la recuperación de contraseña. En los dos primeros la
// sesión nace aquí; en el tercero se pasa a elegir la contraseña nueva.
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import AuthScaffold, { FormError, SubmitButton } from "@/features/auth/components/AuthScaffold";
import { useConfirm2FA } from "@/features/auth/hooks/useConfirm2FA";
import { useVerifyRecovery } from "@/features/auth/hooks/usePasswordRecovery";
import { useResendCode } from "@/features/auth/hooks/useResendCode";
import { useVerifyRegistration } from "@/features/auth/hooks/useVerifyRegistration";
import { authErrorMessage } from "@/features/auth/repositories/authRepository";
import type { CodeType } from "@/features/auth/types";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

const LARGO = 6;
const ESPERA_REENVIO = 60; // segundos

type Flujo = "registro" | "2fa" | "recuperacion";

/** Cada flujo pide su propio tipo de código al reenviar. */
const TIPO_REENVIO: Record<Flujo, CodeType> = {
  registro: "registration",
  "2fa": "2fa_login",
  recuperacion: "password_reset",
};

const TITULOS: Record<Flujo, { title: string; boton: string }> = {
  registro: { title: "Verifica tu correo", boton: "Verificar cuenta" },
  "2fa": { title: "Código de acceso", boton: "Acceder" },
  recuperacion: { title: "Código de recuperación", boton: "Continuar" },
};

export default function VerifyCodeScreen() {
  const c = useColors();
  const router = useRouter();
  const { correo = "", tipo = "registro" } = useLocalSearchParams<{
    correo?: string;
    tipo?: Flujo;
  }>();

  const flujo: Flujo = tipo === "2fa" || tipo === "recuperacion" ? tipo : "registro";
  const confirm2FA = useConfirm2FA();
  const verifyRegistration = useVerifyRegistration();
  const verifyRecovery = useVerifyRecovery();
  const resend = useResendCode();

  const activa =
    flujo === "2fa" ? confirm2FA : flujo === "recuperacion" ? verifyRecovery : verifyRegistration;
  const enviando = activa.isPending;

  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(ESPERA_REENVIO);
  const inputRef = useRef<TextInput>(null);

  // Cuenta atrás para habilitar el reenvío.
  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  const completo = codigo.length === LARGO;
  const error = activa.error ?? resend.error;

  const enviar = async (valor = codigo) => {
    if (valor.length !== LARGO || enviando) return;
    setAviso(null);
    activa.reset();
    try {
      await activa.mutateAsync({ correo: String(correo), code: valor });
      if (flujo === "recuperacion") {
        // El código quedó validado; falta elegir la contraseña nueva.
        router.replace({
          pathname: "/(auth)/reset-password",
          params: { correo: String(correo), code: valor },
        });
      }
      // En registro y 2FA la sesión ya nació en el hook: el guard redirige.
    } catch {
      setCodigo("");
    }
  };

  const reenviar = async () => {
    if (segundos > 0) return;
    resend.reset();
    try {
      await resend.mutateAsync({ correo: String(correo), type: TIPO_REENVIO[flujo] });
      setAviso("Te enviamos un código nuevo.");
      setSegundos(ESPERA_REENVIO);
    } catch {
      // El mensaje ya quedó en resend.error.
    }
  };

  // Celdas visuales: el input real es uno solo, invisible y encima, para que
  // el autorelleno del código siga funcionando.
  const celdas = useMemo(() => Array.from({ length: LARGO }, (_, i) => codigo[i] ?? ""), [codigo]);

  return (
    <AuthScaffold
      title={TITULOS[flujo].title}
      subtitle={
        correo
          ? `Escribe el código de 6 dígitos que enviamos a ${correo}`
          : "Escribe el código de 6 dígitos que te enviamos"
      }
    >
      <FormError
        message={error ? authErrorMessage(error, "El código no es válido o ya expiró.") : null}
      />

      {aviso ? (
        <View
          style={[
            styles.aviso,
            { backgroundColor: c.success + "14", borderColor: c.success + "40" },
          ]}
        >
          <Text style={{ color: c.success, fontSize: 13 }}>{aviso}</Text>
        </View>
      ) : null}

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.celdas}>
        {celdas.map((d, i) => {
          const enfocada = i === codigo.length;
          return (
            <View
              key={i}
              style={[
                styles.celda,
                {
                  borderColor: error ? c.danger : enfocada ? c.brandPrimary : c.border,
                  borderWidth: enfocada || error ? 1.5 : 1,
                  backgroundColor: c.inputBg,
                },
              ]}
            >
              <Text style={{ color: c.text, fontSize: 22, fontWeight: "800" }}>{d}</Text>
            </View>
          );
        })}

        <TextInput
          ref={inputRef}
          value={codigo}
          onChangeText={(t) => {
            const limpio = t.replace(/\D/g, "").slice(0, LARGO);
            setCodigo(limpio);
            if (limpio.length === LARGO) enviar(limpio); // envío automático
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={LARGO}
          autoFocus
          editable={!enviando}
          style={styles.inputOculto}
          caretHidden
        />
      </Pressable>

      <SubmitButton
        label={TITULOS[flujo].boton}
        onPress={() => enviar()}
        loading={enviando}
        disabled={!completo}
      />

      <View style={styles.reenvio}>
        <Text style={{ color: c.textMuted, fontSize: 13 }}>¿No te llegó?</Text>
        <Pressable onPress={reenviar} disabled={segundos > 0 || resend.isPending} hitSlop={8}>
          <Text
            style={{
              color: segundos > 0 ? c.textMuted : c.brandSecondary,
              fontWeight: "800",
              fontSize: 13,
              opacity: segundos > 0 ? 0.5 : 1,
            }}
          >
            {segundos > 0 ? `Reenviar en ${segundos}s` : "Reenviar código"}
          </Text>
        </Pressable>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  celdas: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  celda: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  // Cubre las celdas para capturar el toque y el autorelleno sin verse.
  inputOculto: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  aviso: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reenvio: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
  },
});
