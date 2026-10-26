// src/shared/ui/HtmlContent.tsx — Pinta el HTML enriquecido del backend.
// La lectura del HTML vive en shared/utils/html.ts; aquí solo se dibuja.
import { Linking, StyleSheet, Text, View } from "react-native";

import { brand, spacing, useColors } from "@/shared/theme/useColors";
import { parseHtmlBlocks, parseHtmlInline } from "@/shared/utils/html";

export default function HtmlContent({ html }: { html: string }) {
  const c = useColors();

  return (
    <View>
      {parseHtmlBlocks(html).map((block, i) => {
        const segments = parseHtmlInline(block.content);
        if (segments.length === 0) return <View key={i} style={{ height: spacing.sm }} />;

        const inline = segments.map((s, j) => (
          <Text
            key={j}
            style={[
              s.bold && { fontWeight: "700" },
              s.italic && { fontStyle: "italic" },
              s.href ? { color: brand.secondary, textDecorationLine: "underline" } : null,
            ]}
            onPress={s.href ? () => Linking.openURL(s.href as string).catch(() => {}) : undefined}
            accessibilityRole={s.href ? "link" : undefined}
          >
            {s.text}
          </Text>
        ));

        if (block.type === "li") {
          return (
            <View key={i} style={styles.li}>
              <Text style={[styles.bullet, { color: c.brandPrimary }]}>{"•"}</Text>
              <Text style={[styles.text, { color: c.textMuted, flex: 1 }]}>{inline}</Text>
            </View>
          );
        }
        return (
          <Text key={i} style={[styles.text, styles.paragraph, { color: c.textMuted }]}>
            {inline}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  text: { lineHeight: 22, fontSize: 14 },
  paragraph: { marginBottom: spacing.md },
  li: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xs, paddingLeft: spacing.xs },
  bullet: { fontSize: 16, lineHeight: 22, fontWeight: "900" },
});
