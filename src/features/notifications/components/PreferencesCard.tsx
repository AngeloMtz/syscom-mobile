// src/features/notifications/components/PreferencesCard.tsx — Interruptores de push y correo.
// Mismas preferencias que la web. El cambio se ve al instante y, si el servidor
// lo rechaza, el interruptor vuelve a su valor anterior (lo resuelve el hook).
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, View } from "react-native";

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/hooks/useNotificationPreferences";
import type { NotificationPreferences } from "@/features/notifications/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

export default function PreferencesCard() {
  const c = useColors();
  const { data: prefs, isPending, isError } = useNotificationPreferences();
  const guardar = useUpdateNotificationPreferences();

  const cambiar = (campo: keyof NotificationPreferences) => (valor: boolean) => {
    if (!prefs) return;
    guardar.mutate({ ...prefs, [campo]: valor });
  };

  return (
    <View style={[styles.tarjeta, cardShadow, { backgroundColor: c.card }]}>
      <Text style={[styles.titulo, { color: c.text }]} accessibilityRole="header">
        ¿Cómo quieres recibir avisos?
      </Text>

      <FilaPreferencia
        icono="phone-portrait-outline"
        etiqueta="Notificaciones push"
        descripcion="Avisos de pedidos y promociones en tu celular"
        valor={prefs?.push ?? true}
        deshabilitado={!prefs || isPending}
        onChange={cambiar("push")}
      />
      <FilaPreferencia
        icono="mail-outline"
        etiqueta="Correo electrónico"
        descripcion="Los mismos avisos en tu correo"
        valor={prefs?.email ?? true}
        deshabilitado={!prefs || isPending}
        onChange={cambiar("email")}
      />

      {isError && !prefs ? (
        <Text style={[styles.aviso, { color: c.danger }]} accessibilityLiveRegion="polite">
          No pudimos cargar tus preferencias.
        </Text>
      ) : null}
      {guardar.isError ? (
        <Text style={[styles.aviso, { color: c.danger }]} accessibilityLiveRegion="polite">
          {apiErrorMessage(guardar.error, "No se pudo guardar el cambio.")}
        </Text>
      ) : null}
    </View>
  );
}

function FilaPreferencia({
  icono,
  etiqueta,
  descripcion,
  valor,
  deshabilitado,
  onChange,
}: {
  icono: React.ComponentProps<typeof Ionicons>["name"];
  etiqueta: string;
  descripcion: string;
  valor: boolean;
  deshabilitado: boolean;
  onChange: (valor: boolean) => void;
}) {
  const c = useColors();
  return (
    <View style={styles.fila}>
      <Ionicons name={icono} size={20} color={c.brandPrimary} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>{etiqueta}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>{descripcion}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        disabled={deshabilitado}
        accessibilityLabel={etiqueta}
        trackColor={{ false: c.border, true: c.brandPrimary }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  titulo: { fontSize: 15, fontWeight: "800" },
  fila: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  aviso: { fontSize: 12 },
});
