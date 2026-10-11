// src/features/favorites/components/FavoriteButton.tsx — Corazón de favoritos.
// Alterna el favorito al instante (actualización optimista en useToggleFavorite).
// Sin sesión no consulta nada: al tocarlo lleva a iniciar sesión.
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { isFavorite } from "@/features/favorites/favoriteSelectors";
import { useFavoriteIds } from "@/features/favorites/hooks/useFavorites";
import { useToggleFavorite } from "@/features/favorites/hooks/useToggleFavorite";
import type { FavoriteProduct } from "@/features/favorites/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useAuthStore } from "@/shared/store/authStore";
import { useColors } from "@/shared/theme/useColors";

type Props = {
  product: FavoriteProduct;
  style?: StyleProp<ViewStyle>;
};

export default function FavoriteButton({ product, style }: Props) {
  const c = useColors();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: ids, isLoading } = useFavoriteIds();
  const toggle = useToggleFavorite();

  const favorite = isFavorite(ids ?? [], product.id_producto);
  // Mientras llega la lista no se sabe el estado real: se evita marcar a ciegas.
  const waiting = isAuthenticated && isLoading;

  const onPress = () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    toggle.mutate(
      { product, favorite: !favorite },
      {
        onError: (error) =>
          Alert.alert("No se pudo actualizar tus favoritos", apiErrorMessage(error)),
      },
    );
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={waiting}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      accessibilityHint={isAuthenticated ? undefined : "Inicia sesión para guardar favoritos"}
      accessibilityState={{ selected: favorite, disabled: waiting }}
      style={[styles.button, { backgroundColor: c.card, borderColor: c.border, opacity: waiting ? 0.6 : 1 }, style]}
    >
      <Ionicons
        name={favorite ? "heart" : "heart-outline"}
        size={20}
        color={favorite ? c.danger : c.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
