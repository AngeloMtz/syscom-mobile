// src/shared/ui/ScreenPlaceholder.tsx
// Marcador temporal para las pantallas cuyo contenido llega en su propio issue.
// Se elimina conforme cada feature se implemente.
import { StyleSheet, Text, View } from "react-native";

import { palette, spacing } from "@/shared/theme/colors";

type Props = {
  title: string;
  hint?: string;
};

export default function ScreenPlaceholder({ title, hint }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const c = palette.light;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.background,
    padding: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: c.text,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: c.textMuted,
    textAlign: "center",
  },
});
