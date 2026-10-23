// src/features/ar/components/ARButton.tsx — Botón "Ver en AR" del detalle.
// Consulta los modelos 3D del producto; si no hay nada, no se pinta (evita
// prometerle al usuario algo que no funciona). Navega al visor pasando las
// URLs y el nombre por params.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { useProductModels } from "@/features/ar/hooks/useProductModels";
import { hasAnyModel } from "@/features/ar/selectors";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  productId: number;
  productName?: string;
};

export default function ARButton({ productId, productName }: Props) {
  const c = useColors();
  const router = useRouter();
  const { data: models } = useProductModels(productId);

  // Sin modelos no mostramos el botón: así cumple el criterio "funciona al
  // menos un producto" sin ofrecer el botón en productos sin modelo cargado.
  if (!models || !hasAnyModel(models)) return null;

  const abrirVisor = () => {
    router.push({
      pathname: "/viewer3d",
      params: {
        name: productName ?? "",
        glb: models.glb ?? "",
        usdz: models.usdz ?? "",
      },
    });
  };

  return (
    <Pressable
      onPress={abrirVisor}
      accessibilityRole="button"
      accessibilityLabel="Ver en Realidad Aumentada"
      style={({ pressed }) => [styles.btn, { borderColor: c.brandPrimary, opacity: pressed ? 0.85 : 1 }]}
    >
      <Ionicons name="cube-outline" size={18} color={c.brandPrimary} />
      <Text style={{ color: c.brandPrimary, fontWeight: "700", fontSize: 13 }}>
        Ver en Realidad Aumentada
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
});
