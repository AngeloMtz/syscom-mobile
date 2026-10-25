// src/features/services/components/ServiceGallery.tsx — Galería del detalle.
// Imagen grande arriba y miniaturas debajo: tocar una miniatura cambia la
// imagen grande; tocar la grande abre el visor con zoom.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import ImageZoomModal from "@/features/services/components/ImageZoomModal";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

const { width } = Dimensions.get("window");

type Props = {
  urls: string[];
};

export default function ServiceGallery({ urls }: Props) {
  const c = useColors();
  const [indice, setIndice] = useState(0);
  const [ampliada, setAmpliada] = useState(false);

  if (urls.length === 0) {
    return (
      <View style={[styles.hero, { backgroundColor: c.card }]}>
        <Ionicons name="construct" size={64} color={c.brandPrimary} />
      </View>
    );
  }

  // Si la lista cambia (p. ej. tras recargar) el índice no debe quedar fuera.
  const actual = Math.min(indice, urls.length - 1);

  return (
    <View>
      <Pressable
        onPress={() => setAmpliada(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="Ampliar imagen"
        style={[styles.hero, { backgroundColor: c.card }]}
      >
        <Image source={{ uri: urls[actual] }} style={styles.heroImg} resizeMode="cover" accessibilityIgnoresInvertColors />
        <View style={styles.insignia}>
          <Ionicons name="expand-outline" size={16} color="#fff" />
        </View>
        {urls.length > 1 ? (
          <View style={styles.contador}>
            <Text style={styles.contadorTexto}>
              {actual + 1}/{urls.length}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {urls.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.miniaturas}
          style={{ backgroundColor: c.card }}
        >
          {urls.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              onPress={() => setIndice(i)}
              accessibilityRole="button"
              accessibilityLabel={`Ver imagen ${i + 1} de ${urls.length}`}
              accessibilityState={{ selected: i === actual }}
              style={[styles.miniatura, { borderColor: i === actual ? c.brandPrimary : "transparent" }]}
            >
              <Image source={{ uri }} style={styles.miniaturaImg} resizeMode="cover" accessibilityIgnoresInvertColors />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ImageZoomModal visible={ampliada} uri={urls[actual]} onClose={() => setAmpliada(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width, height: width * 0.6, alignItems: "center", justifyContent: "center" },
  heroImg: { width: "100%", height: "100%" },
  insignia: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  contador: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  contadorTexto: { color: "#fff", fontSize: 12, fontWeight: "700" },
  miniaturas: { gap: spacing.sm, padding: spacing.md },
  miniatura: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 2, overflow: "hidden" },
  miniaturaImg: { width: "100%", height: "100%" },
});
