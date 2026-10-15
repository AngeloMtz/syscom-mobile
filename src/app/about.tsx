// src/app/about.tsx — Nosotros: misión, visión, historia y valores.
// Solo presentación: el contenido y los estados vienen de useInstitutionalContent.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useInstitutionalContent } from "@/features/institutional/hooks/useInstitutional";
import ScreenState from "@/shared/ui/ScreenState";
import { brand, cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";
import { resolveAssetUrl } from "@/shared/utils/url";

const VALUE_ICONS = ["shield-checkmark", "ribbon", "people", "bulb", "trophy", "heart"] as const;

export default function AboutScreen() {
  const c = useColors();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useInstitutionalContent();

  const valores = Array.isArray(data?.valores) ? data!.valores! : [];
  const historiaImg = resolveAssetUrl(data?.imagen_historia);
  const descripcion = data?.descripcion_empresa ?? "";

  return (
    <ScreenState loading={isLoading} error={isError} onRetry={refetch}>
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>SOBRE NOSOTROS</Text>
          <Text style={styles.heroTitle}>SYSCOM</Text>
          <Text style={styles.heroSub}>
            {descripcion || "Tecnología, seguridad y servicios profesionales para tu negocio."}
          </Text>
        </View>

        <View style={{ padding: spacing.lg }}>
          {data?.mision ? (
            <IconCard icon="rocket" color={c.brandPrimary} title="Misión" body={String(data.mision)} />
          ) : null}
          {data?.vision ? (
            <IconCard icon="eye" color={c.brandSecondary} title="Visión" body={String(data.vision)} />
          ) : null}

          {data?.historia ? (
            <View style={[styles.card, cardShadow, { backgroundColor: c.card }]}>
              {historiaImg ? <Image source={{ uri: historiaImg }} style={styles.historiaImg} resizeMode="cover" /> : null}
              <View style={{ padding: spacing.lg }}>
                <View style={styles.cardHead}>
                  <Ionicons name="time" size={18} color={c.brandDeep} />
                  <Text style={[styles.cardTitle, { color: c.text }]}>Nuestra historia</Text>
                </View>
                <Text style={{ color: c.textMuted, lineHeight: 22 }}>{String(data.historia)}</Text>
              </View>
            </View>
          ) : null}

          {valores.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Nuestros valores</Text>
              <View style={styles.valueGrid}>
                {valores.map((v, i) => (
                  <View key={i} style={[styles.valueCard, cardShadow, { backgroundColor: c.card }]}>
                    <View style={[styles.valueIcon, { backgroundColor: c.brandPrimary + "14" }]}>
                      <Ionicons name={VALUE_ICONS[i % VALUE_ICONS.length]} size={22} color={c.brandPrimary} />
                    </View>
                    <Text style={[styles.valueTitle, { color: c.text }]} numberOfLines={2}>
                      {v.titulo ?? v.nombre}
                    </Text>
                    {v.descripcion ? (
                      <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
                        {v.descripcion}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.ctaCard}>
            <Ionicons name="headset" size={26} color="#fff" />
            <Text style={styles.ctaTitle}>¿Trabajamos juntos?</Text>
            <Text style={styles.ctaSub}>Conoce nuestros productos y servicios.</Text>
            <View style={styles.ctaRow}>
              <Pressable style={styles.ctaBtn} onPress={() => router.push("/(tabs)/catalog")}>
                <Text style={{ color: brand.deep, fontWeight: "800" }}>Ver catálogo</Text>
              </Pressable>
              <Pressable style={styles.ctaBtnGhost} onPress={() => router.push("/contact")}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>Contactar</Text>
              </Pressable>
            </View>
          </View>

          {!data?.mision && !data?.vision && !data?.historia && valores.length === 0 && !descripcion ? (
            <Text style={{ color: c.textMuted, marginTop: spacing.lg }}>Información no disponible por ahora.</Text>
          ) : null}
        </View>
      </ScrollView>
    </ScreenState>
  );
}

function IconCard({
  icon,
  color,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  title: string;
  body: string;
}) {
  const c = useColors();
  return (
    <View style={[styles.card, cardShadow, { backgroundColor: c.card, padding: spacing.lg }]}>
      <View style={styles.cardHead}>
        <View style={[styles.headIcon, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.cardTitle, { color: c.text }]}>{title}</Text>
      </View>
      <Text style={{ color: c.textMuted, lineHeight: 22 }}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: brand.deep, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  heroKicker: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 4 },
  heroSub: { color: "#cfe3ff", fontSize: 14, marginTop: 8, lineHeight: 20 },
  card: { borderRadius: radius.lg, marginBottom: spacing.md, overflow: "hidden" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  headIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  historiaImg: { width: "100%", height: 150 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: spacing.md, marginTop: spacing.sm },
  valueGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  valueCard: { width: "47%", flexGrow: 1, borderRadius: radius.lg, padding: spacing.md },
  valueIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  valueTitle: { fontSize: 14, fontWeight: "800" },
  ctaCard: { backgroundColor: brand.deep, borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", marginTop: spacing.sm },
  ctaTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: spacing.sm },
  ctaSub: { color: "#cfe3ff", fontSize: 13, textAlign: "center", marginTop: 4 },
  ctaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  ctaBtn: { backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.pill },
  ctaBtnGhost: { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.pill },
});
