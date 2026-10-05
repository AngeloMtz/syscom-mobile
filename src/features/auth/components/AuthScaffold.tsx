// src/features/auth/components/AuthScaffold.tsx — Estructura común de las
// pantallas de sesión. Todo va dentro del scroll (volver, título y formulario),
// así el teclado solo desplaza el contenido y ningún campo queda tapado.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius, spacing, useColors } from "@/shared/theme/useColors";

export default function AuthScaffold({
  title,
  subtitle,
  children,
  footer,
  onBack,
  /** Cabecera reducida: sin logo y con título más chico (formularios largos). */
  compact,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  compact?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const volver = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={volver}
            hitSlop={16}
            style={({ pressed }) => [styles.back, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Ionicons name="chevron-back" size={26} color={c.textMuted} />
          </Pressable>

          {!compact && (
            <Image
              source={require("../../../../assets/syscom-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          )}

          <Text style={[compact ? styles.titleCompact : styles.title, { color: c.text }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text>
          ) : null}

          <View style={{ marginTop: spacing.lg }}>{children}</View>

          {footer ? <View style={{ marginTop: spacing.xl }}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Botón de envío con carga y deshabilitado al 50%. */
export function SubmitButton({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "deep";
  style?: ViewStyle;
}) {
  const c = useColors();
  const inactivo = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.submit,
        {
          backgroundColor: variant === "deep" ? c.brandDeep : c.brandPrimary,
          opacity: inactivo ? 0.5 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.submitText}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Banner de error general del formulario (respuesta del servidor). */
export function FormError({ message }: { message?: string | null }) {
  const c = useColors();
  if (!message) return null;
  return (
    <View
      style={[styles.banner, { backgroundColor: c.danger + "14", borderColor: c.danger + "40" }]}
    >
      <Ionicons name="alert-circle" size={17} color={c.danger} />
      <Text style={{ color: c.danger, flex: 1, fontSize: 13, lineHeight: 18 }}>{message}</Text>
    </View>
  );
}

/** Separador con texto al centro ("o"), para partir acciones. */
export function Divider({ label }: { label?: string }) {
  const c = useColors();
  return (
    <View style={styles.divider}>
      <View style={[styles.line, { backgroundColor: c.border }]} />
      {label ? (
        <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600" }}>{label}</Text>
      ) : null}
      <View style={[styles.line, { backgroundColor: c.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: "flex-start",
    // Compensa el espacio interno del glifo para alinearlo con el título
    marginLeft: -6,
    marginBottom: spacing.md,
  },
  logo: { width: 150, height: 44, marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  titleCompact: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  submit: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  line: { flex: 1, height: 1 },
});
