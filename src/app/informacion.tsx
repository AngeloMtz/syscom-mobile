// src/app/informacion.tsx — Hub de información institucional (HU #105).
// Sección "Información" accesible desde Perfil y desde Inicio. Lista los
// apartados; cada uno abre su pantalla. Contenido público (no requiere sesión).
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

import MenuRow from "@/shared/ui/MenuRow";
import { spacing, useColors } from "@/shared/theme/useColors";

export default function InformacionScreen() {
  const c = useColors();
  const router = useRouter();

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
    >
      <MenuRow
        icon="business-outline"
        label="Quiénes somos"
        desc="Misión, visión y valores"
        onPress={() => router.push("/about")}
      />
      <MenuRow
        icon="help-circle-outline"
        label="Preguntas frecuentes"
        desc="Dudas comunes"
        onPress={() => router.push("/faqs")}
      />
      <MenuRow
        icon="document-text-outline"
        label="Políticas"
        desc="Privacidad y términos"
        onPress={() => router.push("/policies")}
      />
      <MenuRow
        icon="call-outline"
        label="Contacto"
        desc="Teléfono, correo y horario"
        onPress={() => router.push("/contact")}
      />
    </ScrollView>
  );
}
