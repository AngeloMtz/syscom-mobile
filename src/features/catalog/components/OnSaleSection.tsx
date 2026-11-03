// src/features/catalog/components/OnSaleSection.tsx — Sección "Ofertas" del inicio.
// Solo presentación: sin promociones no pinta nada (mismo patrón que Destacados).
import { ScrollView, View } from "react-native";

import ProductCard from "@/features/catalog/components/ProductCard";
import type { ProductListItem } from "@/features/catalog/types";
import SectionTitle from "@/shared/ui/SectionTitle";
import { spacing } from "@/shared/theme/useColors";

const CARD_W = 158;

type Props = {
  products: ProductListItem[];
  onSeeAll: () => void;
  onOpenProduct: (product: ProductListItem) => void;
};

export default function OnSaleSection({ products, onSeeAll, onOpenProduct }: Props) {
  if (products.length === 0) return null;

  return (
    <View style={{ marginTop: spacing.xl }}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <SectionTitle title="Ofertas" action="Ver todas" onAction={onSeeAll} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
      >
        {products.map((p) => (
          <View key={p.id} style={{ width: CARD_W }}>
            <ProductCard product={p} onPress={onOpenProduct} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
