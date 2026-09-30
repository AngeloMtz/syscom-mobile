// src/app/(tabs)/profile.tsx — Evidencia de sesión activa.
// Vista mínima: los datos del usuario y el cierre de sesión. La feature
// completa de perfil llega en su propio issue.
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import RequireAuth from "@/features/auth/components/RequireAuth";
import { useMe } from "@/features/auth/hooks/useMe";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import { useAuthStore } from "@/shared/store/authStore";

function ProfileContent() {
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [saliendo, setSaliendo] = useState(false);

  // Tras reiniciar la app hay token pero no objeto user: esto lo recupera
  // cuando el backend exponga GET /auth/me.
  const me = useMe();

  const nombre = [user?.nombre, user?.apellido_paterno].filter(Boolean).join(" ");
  const inicial = (user?.nombre ?? "?").charAt(0).toUpperCase();

  const salir = async () => {
    setSaliendo(true);
    try {
      await logout();
    } finally {
      setSaliendo(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[styles.avatar, { backgroundColor: c.brandPrimary }]}>
          <Text style={styles.inicial}>{inicial}</Text>
        </View>

        {user ? (
          <>
            <Text style={[styles.nombre, { color: c.text }]}>{nombre || "Sin nombre"}</Text>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{user.correo}</Text>
          </>
        ) : me.isPending ? (
          <>
            <ActivityIndicator color={c.brandPrimary} />
            <Text style={{ color: c.textMuted, fontSize: 13, marginTop: spacing.sm }}>
              Cargando tu perfil…
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.nombre, { color: c.text }]}>Sesión activa</Text>
            <Text
              style={{
                color: c.textMuted,
                fontSize: 13,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Tus datos se cargarán cuando vuelvas a iniciar sesión.
            </Text>
          </>
        )}
      </View>

      <Pressable
        onPress={salir}
        disabled={saliendo}
        style={({ pressed }) => [
          styles.salir,
          { borderColor: c.danger, opacity: saliendo ? 0.5 : pressed ? 0.8 : 1 },
        ]}
      >
        {saliendo ? (
          <ActivityIndicator color={c.danger} size="small" />
        ) : (
          <Text style={{ color: c.danger, fontWeight: "800", fontSize: 15 }}>Cerrar sesión</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  card: {
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  inicial: { color: "#fff", fontSize: 26, fontWeight: "900" },
  nombre: { fontSize: 18, fontWeight: "800" },
  salir: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
