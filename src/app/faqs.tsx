// src/app/faqs.tsx — Preguntas frecuentes (acordeón).
// Solo presentación: los datos y estados vienen de useFaqs.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useFaqs } from "@/features/institutional/hooks/useInstitutional";
import ScreenState from "@/shared/ui/ScreenState";
import { brand, cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";

export default function FaqsScreen() {
  const c = useColors();
  const { data, isLoading, isError, refetch } = useFaqs();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenState
        loading={isLoading}
        error={isError}
        empty={!isLoading && (data?.length ?? 0) === 0}
        emptyText="No hay preguntas frecuentes"
        onRetry={refetch}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="help-buoy" size={28} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Preguntas frecuentes</Text>
            <Text style={styles.heroSub}>Resolvemos las dudas más comunes.</Text>
          </View>

          <View style={{ padding: spacing.lg }}>
            {(data ?? []).map((f, i) => {
              const isOpen = open === i;
              return (
                <Pressable
                  key={f.id_faq ?? i}
                  onPress={() => setOpen(isOpen ? null : i)}
                  accessibilityRole="button"
                  style={[
                    styles.card,
                    cardShadow,
                    { backgroundColor: c.card, borderColor: isOpen ? c.brandPrimary : "transparent", borderWidth: 1 },
                  ]}
                >
                  <View style={styles.qRow}>
                    <View style={[styles.qBadge, { backgroundColor: isOpen ? c.brandPrimary : c.brandPrimary + "14" }]}>
                      <Text style={{ color: isOpen ? "#fff" : c.brandPrimary, fontWeight: "800", fontSize: 13 }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={[styles.q, { color: c.text }]}>{f.pregunta}</Text>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={c.brandPrimary} />
                  </View>
                  {isOpen ? (
                    <Text style={[styles.answer, { color: c.textMuted, borderTopColor: c.divider }]}>
                      {f.respuesta}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ScreenState>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: brand.deep, alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  heroIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  heroSub: { color: "#cfe3ff", fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 19 },
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  qRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  qBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  q: { flex: 1, fontSize: 15, fontWeight: "700" },
  answer: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, lineHeight: 21 },
});
