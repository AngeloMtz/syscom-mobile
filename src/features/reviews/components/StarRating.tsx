// src/features/reviews/components/StarRating.tsx — Cinco estrellas (llenas, medias o vacías).
// Solo presentación: los íconos salen de starIcons y el lector de pantalla oye "N de 5 estrellas".
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ratingLabel, starIcons } from "@/features/reviews/reviewSelectors";
import { useColors } from "@/shared/theme/useColors";

type Props = {
  value: number;
  size?: number;
};

export default function StarRating({ value, size = 16 }: Props) {
  const c = useColors();

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={ratingLabel(value)}
    >
      {starIcons(value).map((name, i) => (
        <Ionicons key={i} name={name} size={size} color={c.star} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
});
