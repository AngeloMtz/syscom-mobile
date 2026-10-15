// src/app/policies.tsx — Políticas (endpoint público por tipo).
// Solo presentación: los datos y estados vienen de usePolicies; el HTML
// enriquecido se pinta con HtmlContent.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { usePolicies } from "@/features/institutional/hooks/useInstitutional";
import HtmlContent from "@/shared/ui/HtmlContent";
import ScreenState from "@/shared/ui/ScreenState";
import { brand, cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

const ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  politicas_privacidad: "shield-checkmark",
  terminos_condiciones: "document-text",
};

export default function PoliciesScreen() {
  const c = useColors();
  const { data, isLoading, isError, refetch } = usePolicies();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenState
        loading={isLoading}
        error={isError}
        empty={!isLoading && (data?.length ?? 0) === 0}
        emptyText="No hay políticas publicadas"
        onRetry={refetch}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
          <View style={styles.banner}>
            <Ionicons name="lock-closed" size={22} color="#fff" />
            <Text style={styles.bannerText}>
              Tu confianza es importante. Consulta cómo protegemos tu información.
            </Text>
          </View>

          {(data ?? []).map((p, i) => {
            const isOpen = open === i;
            return (
              <View key={p.tipo} style={[styles.card, cardShadow, { backgroundColor: c.card }]}>
                <Pressable style={styles.head} onPress={() => setOpen(isOpen ? null : i)} accessibilityRole="button">
                  <View style={[styles.icon, { backgroundColor: c.brandPrimary + "16" }]}>
                    <Ionicons name={ICONS[p.tipo] ?? "document-text"} size={18} color={c.brandPrimary} />
                  </View>
                  <Text style={[styles.title, { color: c.text }]}>{p.titulo}</Text>
                  <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={c.textMuted} />
                </Pressable>
                {isOpen ? (
                  <View style={{ marginTop: spacing.md }}>
                    <HtmlContent html={p.contenido} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </ScreenState>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: brand.deep,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bannerText: { color: "#fff", fontSize: 13, flex: 1, lineHeight: 18 },
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 15, fontWeight: "700" },
});
