// src/app/(tabs)/profile.tsx — Panel del cliente: pantalla de entrada del área
// de cuenta. Las opciones replican el menú del área cliente de la web; solo
// "Datos personales" está implementada, el resto llega en sus propios issues.
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import RequireAuth from "@/features/auth/components/RequireAuth";
import DashboardOption from "@/features/profile/components/DashboardOption";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import { useAuthStore } from "@/shared/store/authStore";

function ClientDashboard() {
  const c = useColors();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [saliendo, setSaliendo] = useState(false);

  const { data: perfil, isPending, isError } = useProfile();

  const nombre = perfil?.nombre ?? "";
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
      contentContainerStyle={styles.contenido}
    >
      {/* Saludo, como el panel web */}
      <View style={[styles.saludo, { backgroundColor: c.brandSecondary }]}>
        <View style={styles.saludoFila}>
          <View style={[styles.avatar, { backgroundColor: "#ffffff30" }]}>
            <Text style={styles.inicial}>{inicial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hola} accessibilityRole="header">
              {isPending ? "Hola" : `¡Hola, ${nombre}!`}
            </Text>
            <Text style={styles.bienvenida}>Bienvenido a tu panel de control</Text>
          </View>
        </View>
        {isPending ? (
          <ActivityIndicator color="#fff" style={{ marginTop: spacing.sm }} />
        ) : null}
      </View>

      {isError ? (
        <View
          style={[styles.aviso, { backgroundColor: c.danger + "14", borderColor: c.danger + "40" }]}
          accessibilityLiveRegion="polite"
        >
          <Text style={{ color: c.danger, fontSize: 13, lineHeight: 18 }}>
            No pudimos cargar tus datos. Revisa tu conexión y vuelve a entrar a esta pestaña.
          </Text>
        </View>
      ) : null}

      <Text style={[styles.seccion, { color: c.textMuted }]} accessibilityRole="header">
        MI CUENTA
      </Text>

      <DashboardOption
        icon="person-outline"
        label="Datos personales"
        description="Consulta y actualiza tu información"
        onPress={() => router.push("/profile/personal-data")}
      />
      <DashboardOption icon="lock-closed-outline" label="Cambiar contraseña" disabled />
      <DashboardOption icon="shield-checkmark-outline" label="Autenticación 2FA" disabled />
      <DashboardOption icon="location-outline" label="Mis direcciones" disabled />

      <Text style={[styles.seccion, { color: c.textMuted }]} accessibilityRole="header">
        COMPRAS
      </Text>

      <DashboardOption icon="bag-outline" label="Mis pedidos" disabled />
      <DashboardOption
        icon="heart-outline"
        label="Favoritos"
        description="Productos que guardaste"
        onPress={() => router.push("/favorites")}
      />
      <DashboardOption icon="star-outline" label="Mis reseñas" disabled />
      <DashboardOption icon="card-outline" label="Métodos de pago" disabled />
      <DashboardOption icon="document-text-outline" label="Facturación" disabled />

      <Text style={[styles.seccion, { color: c.textMuted }]} accessibilityRole="header">
        MÁS
      </Text>

      <DashboardOption icon="notifications-outline" label="Notificaciones" disabled />
      <DashboardOption icon="gift-outline" label="Aportaciones" disabled />
      <DashboardOption icon="help-circle-outline" label="Ayuda" disabled />

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
    </ScrollView>
  );
}

export default function ProfileTab() {
  return (
    <RequireAuth>
      <ClientDashboard />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  saludo: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm },
  saludoFila: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  inicial: { color: "#fff", fontSize: 22, fontWeight: "900" },
  hola: { color: "#fff", fontSize: 20, fontWeight: "900" },
  bienvenida: { color: "#ffffffe6", fontSize: 13, marginTop: 2 },
  seccion: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: 2,
  },
  aviso: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  salir: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
});
