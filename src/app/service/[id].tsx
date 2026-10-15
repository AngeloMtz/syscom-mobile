// src/app/service/[id].tsx — Detalle de un servicio.
// Solo presentación: la consulta y los estados vienen de useService. Las
// reseñas del servicio son otra feature y no se incluyen aquí.
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Dimensions, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useService } from "@/features/services/hooks/useService";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import ScreenState from "@/shared/ui/ScreenState";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import { formatPrice } from "@/shared/utils/format";
import { resolveAssetUrl } from "@/shared/utils/url";

const { width } = Dimensions.get("window");

export default function ServiceDetailScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: s, isLoading, isError, error, refetch, notFound } = useService(id);

  const title = <Stack.Screen options={{ title: "Servicio" }} />;

  if (notFound) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="construct-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>Servicio no encontrado</Text>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/services"))}
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {title}
      <ScreenState
        loading={isLoading}
        error={isError}
        errorText={apiErrorMessage(error)}
        onRetry={refetch}
      >
        {s ? <ServiceBody service={s} /> : null}
      </ScreenState>
    </View>
  );
}

function ServiceBody({ service: s }: { service: NonNullable<ReturnType<typeof useService>["data"]> }) {
  const c = useColors();
  const galeria = (s.imagenes ?? [])
    .map((img) => resolveAssetUrl(img.url))
    .filter((u): u is string => !!u);
  const portada = resolveAssetUrl(s.imagen_principal) ?? galeria[0];
  const precio = s.precio_final ?? s.precio_base;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={[styles.imgWrap, { backgroundColor: c.card }]}>
        {portada ? (
          <Image source={{ uri: portada }} style={styles.img} resizeMode="cover" />
        ) : (
          <Ionicons name="construct" size={64} color={c.brandPrimary} />
        )}
      </View>

      <View style={{ padding: spacing.lg }}>
        {s.categoria?.nombre ? (
          <Text style={styles.category}>{s.categoria.nombre.toUpperCase()}</Text>
        ) : null}
        <Text style={[styles.name, { color: c.text }]} accessibilityRole="header">
          {s.nombre}
        </Text>

        {precio != null ? (
          <View style={styles.priceRow}>
            <Text style={{ color: c.brandPrimary, fontWeight: "800", fontSize: 18 }}>
              Desde {formatPrice(precio)}
            </Text>
            {s.en_promocion && (s.porcentaje_descuento ?? 0) > 0 ? (
              <View style={[styles.badge, { backgroundColor: c.danger }]}>
                <Text style={styles.badgeText}>-{Math.round(s.porcentaje_descuento as number)}%</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {s.duracion_estimada || s.garantia_dias ? (
          <View style={styles.metaRow}>
            {s.duracion_estimada ? (
              <MetaCard icon="time-outline" label="Duración" value={s.duracion_estimada} />
            ) : null}
            {s.garantia_dias ? (
              <MetaCard icon="shield-checkmark-outline" label="Garantía" value={`${s.garantia_dias} días`} />
            ) : null}
          </View>
        ) : null}

        {s.descripcion ? (
          <Text style={{ color: c.textMuted, lineHeight: 22, marginTop: spacing.lg }}>{s.descripcion}</Text>
        ) : null}

        {(s.que_incluye?.length ?? 0) > 0 ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Qué incluye</Text>
            {s.que_incluye!.map((inc) => (
              <View key={inc.id} style={styles.includeRow}>
                <Ionicons name="checkmark-circle" size={17} color={c.success} />
                <Text style={{ color: c.textMuted, flex: 1, lineHeight: 20 }}>{inc.descripcion}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {(s.proceso?.length ?? 0) > 0 ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Cómo trabajamos</Text>
            {s.proceso!.map((paso, i) => (
              <View key={paso.id} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, { backgroundColor: c.brandPrimary }]}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  {i < s.proceso!.length - 1 ? (
                    <View style={[styles.stepLine, { backgroundColor: c.divider }]} />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                  <Text style={{ color: c.text, fontWeight: "700" }}>{paso.titulo}</Text>
                  {paso.descripcion ? (
                    <Text style={{ color: c.textMuted, lineHeight: 20, marginTop: 2 }}>{paso.descripcion}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {galeria.length > 1 ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Galería</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              {galeria.map((uri, i) => (
                <Image key={`${uri}-${i}`} source={{ uri }} style={styles.galleryImg} resizeMode="cover" />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {(s.videos?.length ?? 0) > 0 ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Videos</Text>
            {s.videos!.map((v) => (
              <Pressable
                key={v.id}
                onPress={() => Linking.openURL(v.url).catch(() => {})}
                style={({ pressed }) => [styles.videoRow, { borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="play-circle" size={26} color={c.brandPrimary} />
                <Text style={{ color: c.text, flex: 1, fontWeight: "600" }} numberOfLines={2}>
                  {v.titulo || "Ver video"}
                </Text>
                <Ionicons name="open-outline" size={16} color={c.textMuted} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function MetaCard({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  const c = useColors();
  return (
    <View style={[styles.metaCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name={icon} size={18} color={c.brandPrimary} />
      <View>
        <Text style={{ color: c.textMuted, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: c.text, fontWeight: "700", fontSize: 13 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  imgWrap: { width, height: width * 0.6, alignItems: "center", justifyContent: "center" },
  img: { width: "100%", height: "100%" },
  category: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: "#6b7683" },
  name: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: 8 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  metaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  metaCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: spacing.md },
  includeRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: 8 },
  stepRow: { flexDirection: "row", gap: spacing.md },
  stepLeft: { alignItems: "center", width: 26 },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepNum: { color: "#fff", fontWeight: "800", fontSize: 13 },
  stepLine: { width: 2, flex: 1, marginTop: 2 },
  galleryImg: { width: 190, height: 130, borderRadius: radius.md },
  videoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  primary: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999, marginTop: spacing.sm },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
