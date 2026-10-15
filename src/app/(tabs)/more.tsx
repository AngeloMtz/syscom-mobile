// src/app/(tabs)/more.tsx — Menú "Más": cuenta e información institucional.
// El perfil completo vive en /profile; la información institucional en /informacion.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useProfile } from "@/features/profile/hooks/useProfile";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import { useAuthStore } from "@/shared/store/authStore";
import MenuRow from "@/shared/ui/MenuRow";

export default function MoreScreen() {
  const c = useColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { data: perfil } = useProfile();
  const [saliendo, setSaliendo] = useState(false);

  const nombre = [perfil?.nombre, perfil?.apellido_paterno].filter(Boolean).join(" ");
  const inicial = (perfil?.nombre ?? "?").charAt(0).toUpperCase();

  const salir = async () => {
    setSaliendo(true);
    try {
      await logout();
    } finally {
      setSaliendo(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
    >
      {/* Tarjeta de cuenta */}
      <View style={[styles.cuenta, { backgroundColor: c.brandDeep }]}>
        <View style={styles.avatar}>
          {isAuthenticated ? (
            <Text style={styles.avatarText}>{inicial}</Text>
          ) : (
            <Ionicons name="person" size={20} color="#fff" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cuentaNombre} numberOfLines={1}>
            {isAuthenticated ? nombre || "Mi cuenta" : "Inicia sesión"}
          </Text>
          <Text style={styles.cuentaCorreo} numberOfLines={1}>
            {isAuthenticated ? (perfil?.correo ?? "Administra tu cuenta") : "Entra para ver tu perfil y pedidos"}
          </Text>
        </View>
      </View>

      <View style={{ height: spacing.md }} />

      {isAuthenticated ? (
        <MenuRow
          icon="person-circle-outline"
          label="Mi cuenta"
          desc="Perfil, direcciones y seguridad"
          onPress={() => router.push("/profile")}
        />
      ) : (
        <MenuRow
          icon="log-in-outline"
          label="Iniciar sesión"
          desc="Accede a tu cuenta"
          onPress={() => router.push("/(auth)/login")}
        />
      )}

      <MenuRow
        icon="business-outline"
        label="Información"
        desc="Nosotros, políticas, preguntas frecuentes y contacto"
        onPress={() => router.push("/informacion")}
      />

      {isAuthenticated ? (
        <Pressable
          onPress={salir}
          disabled={saliendo}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          accessibilityState={{ disabled: saliendo, busy: saliendo }}
          style={({ pressed }) => [
            styles.salir,
            { borderColor: c.danger, opacity: saliendo ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          {saliendo ? (
            <ActivityIndicator color={c.danger} size="small" />
          ) : (
            <Text style={{ color: c.danger, fontWeight: "800", fontSize: 15 }}>Cerrar sesión</Text>
          )}
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cuenta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  cuentaNombre: { color: "#fff", fontSize: 16, fontWeight: "800" },
  cuentaCorreo: { color: "#cfe3ff", fontSize: 12, marginTop: 2 },
  salir: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
});
