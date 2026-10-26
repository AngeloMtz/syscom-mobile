// src/shared/ui/SectionTitle.tsx — Título de sección con acción opcional ("Ver todo").
import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  title: string;
  action?: string;
  onAction?: () => void;
};

export default function SectionTitle({ title, action, onAction }: Props) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={action}>
          <Text style={{ color: c.brandSecondary, fontWeight: "700", fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { fontSize: 18, fontWeight: "800" },
});
