// src/app/profile/delete-account.tsx — Eliminar la cuenta (derecho ARCO de Cancelación).
// Solo presentación: la eliminación y el cierre de sesión vienen de useDeleteAccount.
// Al terminar, RequireAuth lleva al usuario al login.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FormError } from "@/features/auth/components/AuthScaffold";
import RequireAuth from "@/features/auth/components/RequireAuth";
import { useDeleteAccount } from "@/features/profile/hooks/useDeleteAccount";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import FormField from "@/shared/ui/FormField";

const POLITICA_PRIVACIDAD_URL = "https://syscom-frontend.vercel.app/policies";
const MENSAJE_EN_CURSO = "Tienes pedidos o servicios en curso. Podrás eliminar tu cuenta cuando terminen.";

/** Mensaje a mostrar: el 409 (pedidos o servicios en curso) siempre lleva el mismo texto. */
const mensajeDeError = (error: any): string =>
  error?.response?.status === 409
    ? MENSAJE_EN_CURSO
    : apiErrorMessage(error, "No se pudo eliminar tu cuenta. Intenta de nuevo.");

const CONSECUENCIAS = [
  "Se borran tus datos personales, direcciones guardadas, favoritos, carrito, reseñas y notificaciones.",
  "Tus pedidos terminados y sus pagos se conservan como registro de venta y por obligación legal, sin tu nombre, correo ni teléfono.",
  "No podrás recuperar tu cuenta. Podrás registrarte de nuevo con el mismo correo.",
];

function DeleteAccountForm() {
  const c = useColors();
  const eliminar = useDeleteAccount();
  const [password, setPassword] = useState("");
  const [faltaPassword, setFaltaPassword] = useState(false);

  const cambiarPassword = (valor: string) => {
    setPassword(valor);
    setFaltaPassword(false);
    eliminar.reset();
  };

  const confirmar = async () => {
    try {
      await eliminar.mutateAsync(password);
      Alert.alert("Cuenta eliminada", "Tu cuenta se eliminó correctamente.");
    } catch {
      // El mensaje queda en eliminar.error.
    }
  };

  const pedirConfirmacion = () => {
    if (!password) {
      setFaltaPassword(true);
      return;
    }
    Alert.alert("¿Eliminar tu cuenta?", "Esta acción no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: confirmar },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={[styles.aviso, { backgroundColor: c.danger + "14", borderColor: c.danger + "40" }]}>
          <View style={styles.avisoTitulo}>
            <Ionicons name="warning-outline" size={20} color={c.danger} />
            <Text style={{ color: c.danger, fontSize: 15, fontWeight: "800", flex: 1 }} accessibilityRole="header">
              Esta acción no se puede deshacer
            </Text>
          </View>
          {CONSECUENCIAS.map((texto) => (
            <Text key={texto} style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>
              • {texto}
            </Text>
          ))}
          <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19 }}>
            Si tienes pedidos o servicios en curso, podrás eliminar tu cuenta cuando terminen.
          </Text>
          <Pressable
            onPress={() => Linking.openURL(POLITICA_PRIVACIDAD_URL).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel="Política de privacidad"
            hitSlop={8}
          >
            <Text style={{ color: c.brandPrimary, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" }}>
              Política de privacidad
            </Text>
          </Pressable>
        </View>

        <FormError
          message={eliminar.error ? mensajeDeError(eliminar.error) : null}
        />

        <FormField
          label="Confirma tu contraseña"
          icon="lock-closed-outline"
          placeholder="Tu contraseña"
          secure
          value={password}
          onChangeText={cambiarPassword}
          error={faltaPassword ? "Escribe tu contraseña" : null}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={pedirConfirmacion}
          editable={!eliminar.isPending}
        />

        <Pressable
          onPress={pedirConfirmacion}
          disabled={eliminar.isPending}
          accessibilityRole="button"
          accessibilityLabel="Eliminar mi cuenta"
          accessibilityState={{ disabled: eliminar.isPending, busy: eliminar.isPending }}
          style={({ pressed }) => [
            styles.boton,
            { backgroundColor: c.danger, opacity: eliminar.isPending ? 0.5 : pressed ? 0.88 : 1 },
          ]}
        >
          {eliminar.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.botonTexto}>Eliminar mi cuenta</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function DeleteAccountScreen() {
  return (
    <RequireAuth>
      <DeleteAccountForm />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  aviso: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  avisoTitulo: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  boton: { height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  botonTexto: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
