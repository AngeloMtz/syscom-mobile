// src/app/viewer3d.tsx — Visor 3D / RA de un producto.
// Recibe por params las URLs del modelo (?glb=...&usdz=...&name=...). El
// WebView muestra el modelo orbitable; el botón nativo "Ver en tu espacio"
// lanza la RA real: Scene Viewer en Android (vía intent) o Quick Look en iOS
// (vía expo-web-browser, único camino que lo soporta sin salir de la app).
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import ModelViewer3D from "@/features/ar/components/ModelViewer3D";
import { buildSceneViewerUrl, hasAnyModel, isARAvailable } from "@/features/ar/selectors";
import { brand, radius, spacing, useColors } from "@/shared/theme/useColors";

export default function Viewer3DScreen() {
  const c = useColors();
  const { glb, usdz, name } = useLocalSearchParams<{
    glb?: string;
    usdz?: string;
    name?: string;
  }>();

  const models = { glb: glb || undefined, usdz: usdz || undefined };
  const canAR = isARAvailable(models);
  const hasModel = hasAnyModel(models);

  const abrirRA = async () => {
    try {
      if (Platform.OS === "ios" && models.usdz) {
        // Quick Look se dispara abriendo el .usdz en el navegador integrado
        // (SFSafariViewController). El WebView común no lo soporta.
        await WebBrowser.openBrowserAsync(models.usdz);
        return;
      }
      if (Platform.OS === "android" && models.glb) {
        await Linking.openURL(buildSceneViewerUrl(models.glb, name));
      }
    } catch {
      // Silencioso: el visor 3D sigue arriba, el usuario puede intentar de nuevo.
    }
  };

  if (!hasModel) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ title: "Vista 3D" }} />
        <Ionicons name="cube-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>Sin vista 3D disponible</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>
          Este producto todavía no tiene un modelo 3D cargado.
        </Text>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f7" }}>
      <Stack.Screen options={{ title: name || "Vista 3D" }} />
      <ModelViewer3D glbUrl={models.glb} usdzUrl={models.usdz} name={name} />

      {canAR ? (
        <Pressable
          onPress={abrirRA}
          accessibilityRole="button"
          accessibilityLabel="Ver en tu espacio con realidad aumentada"
          style={({ pressed }) => [styles.arBtn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Ionicons name="scan" size={18} color="#fff" />
          <Text style={styles.arBtnText}>Ver en tu espacio</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  arBtn: {
    position: "absolute",
    alignSelf: "center",
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: brand.deep,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: radius.pill,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  arBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  primary: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999, marginTop: spacing.sm },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
