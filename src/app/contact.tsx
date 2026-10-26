// src/app/contact.tsx — Contacto: medios, horarios, ubicación y boletín.
// Solo presentación: el contenido viene de useInstitutionalContent y el alta
// al boletín de useNewsletter.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useInstitutionalContent, useNewsletter } from "@/features/institutional/hooks/useInstitutional";
import { EMAIL_RE } from "@/features/auth/validation";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import FormField from "@/shared/ui/FormField";
import { SubmitButton } from "@/features/auth/components/AuthScaffold";
import { brand, cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

const FALLBACK = { telefono: "+52 771 000 0000", correo: "contacto@syscom.com" };
const DAY_LABEL: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
  viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};

export default function ContactScreen() {
  const c = useColors();
  const { data } = useInstitutionalContent();

  const telefono = (data?.telefono as string) ?? FALLBACK.telefono;
  const correo = (data?.correo as string) ?? FALLBACK.correo;
  const wa = telefono.replace(/[^\d]/g, "");
  const horarios = Array.isArray(data?.horarios) ? data!.horarios! : [];
  const direccion = data?.direccion;
  const dirText =
    typeof direccion === "string"
      ? direccion
      : direccion && typeof direccion === "object"
        ? Object.values(direccion).filter(Boolean).join(", ")
        : null;

  const medios = [
    { icon: "call", label: "Teléfono", value: telefono, onPress: () => Linking.openURL(`tel:${wa}`), color: c.brandPrimary },
    { icon: "logo-whatsapp", label: "WhatsApp", value: "Enviar mensaje", onPress: () => Linking.openURL(`https://wa.me/${wa}`), color: "#25d366" },
    { icon: "mail", label: "Correo", value: correo, onPress: () => Linking.openURL(`mailto:${correo}`), color: c.brandSecondary },
  ] as const;

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>ESTAMOS PARA AYUDARTE</Text>
        <Text style={styles.heroTitle}>Contáctanos</Text>
        <Text style={styles.heroSub}>Elige el medio de tu preferencia y con gusto te atendemos.</Text>
      </View>

      <View style={{ padding: spacing.lg }}>
        {medios.map((m) => (
          <Pressable key={m.label} onPress={m.onPress} style={[styles.row, cardShadow, { backgroundColor: c.card }]}>
            <View style={[styles.icon, { backgroundColor: m.color + "18" }]}>
              <Ionicons name={m.icon} size={22} color={m.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{m.label}</Text>
              <Text style={{ color: c.text, fontWeight: "700" }}>{m.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
          </Pressable>
        ))}

        {horarios.length > 0 ? (
          <View style={[styles.card, cardShadow, { backgroundColor: c.card }]}>
            <View style={styles.cardHead}>
              <Ionicons name="time" size={18} color={c.brandPrimary} />
              <Text style={[styles.cardTitle, { color: c.text }]}>Horario de atención</Text>
            </View>
            {horarios.map((h, i) => (
              <View key={h.dia ?? i} style={styles.hourRow}>
                <Text style={{ color: c.text, fontWeight: "600" }}>{DAY_LABEL[h.dia] ?? h.dia}</Text>
                <Text style={{ color: h.cerrado ? c.danger : c.textMuted }}>
                  {h.cerrado ? "Cerrado" : `${h.apertura ?? ""} – ${h.cierre ?? ""}`}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {dirText ? (
          <View style={[styles.card, cardShadow, { backgroundColor: c.card }]}>
            <View style={styles.cardHead}>
              <Ionicons name="location" size={18} color={c.brandPrimary} />
              <Text style={[styles.cardTitle, { color: c.text }]}>Ubicación</Text>
            </View>
            <Text style={{ color: c.textMuted, lineHeight: 20 }}>{dirText}</Text>
            <Pressable
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(dirText)}`)}
              style={styles.mapBtn}
            >
              <Ionicons name="map" size={16} color={c.brandSecondary} />
              <Text style={{ color: c.brandSecondary, fontWeight: "700" }}>Ver en el mapa</Text>
            </Pressable>
          </View>
        ) : null}

        <NewsletterCard />
      </View>
    </ScrollView>
  );
}

function NewsletterCard() {
  const c = useColors();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [done, setDone] = useState(false);
  const alta = useNewsletter();

  const emailOk = EMAIL_RE.test(correo.trim());
  const puedeEnviar = nombre.trim().length > 1 && emailOk && !alta.isPending;

  const enviar = async () => {
    if (!puedeEnviar) return;
    alta.reset();
    try {
      await alta.mutateAsync({ nombre: nombre.trim(), correo: correo.trim() });
      setDone(true);
      setNombre("");
      setCorreo("");
    } catch {
      // El mensaje queda en alta.error.
    }
  };

  return (
    <View style={[styles.card, cardShadow, { backgroundColor: c.card }]}>
      <View style={styles.cardHead}>
        <Ionicons name="mail-open" size={18} color={c.brandPrimary} />
        <Text style={[styles.cardTitle, { color: c.text }]}>Boletín</Text>
      </View>
      {done ? (
        <Text style={{ color: c.success, fontSize: 13 }} accessibilityLiveRegion="polite">
          ¡Listo! Te suscribiste al boletín.
        </Text>
      ) : (
        <>
          <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: spacing.md }}>
            Recibe novedades y promociones.
          </Text>
          <FormField label="Nombre" icon="person-outline" placeholder="Tu nombre" value={nombre} onChangeText={setNombre} editable={!alta.isPending} />
          <FormField
            label="Correo"
            icon="mail-outline"
            placeholder="tucorreo@ejemplo.com"
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!alta.isPending}
          />
          {alta.isError ? (
            <Text style={{ color: c.danger, fontSize: 12, marginBottom: spacing.sm }}>
              {apiErrorMessage(alta.error, "No se pudo completar la suscripción.")}
            </Text>
          ) : null}
          <SubmitButton label="Suscribirme" onPress={enviar} loading={alta.isPending} disabled={!puedeEnviar} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: brand.deep, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  heroKicker: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 4 },
  heroSub: { color: "#cfe3ff", fontSize: 14, marginTop: 8, lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.md },
  icon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  hourRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  mapBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
});
