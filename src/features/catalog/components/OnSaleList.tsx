// src/features/catalog/components/OnSaleList.tsx — Lista completa de promociones ("Ver todas").
// Solo presentación: los flags y datos llegan del hook; aquí se pintan los estados
// de carga, error con "Reintentar", vacío y la cuadrícula de dos columnas.
import { FlatList, StyleSheet, Text } from "react-native";

import ProductCard from "@/features/catalog/components/ProductCard";
import type { ProductListItem } from "@/features/catalog/types";
import ScreenState from "@/shared/ui/ScreenState";
import { spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  products: ProductListItem[];
  isLoading: boolean;
  isError: boolean;
  errorText?: string;
  isRefetching: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  onOpenProduct: (product: ProductListItem) => void;
};

export default function OnSaleList({
  products,
  isLoading,
  isError,
  errorText,
  isRefetching,
  onRetry,
  onRefresh,
  onOpenProduct,
}: Props) {
  const c = useColors();

  if (isLoading) return <ScreenState loading />;
  if (isError && products.length === 0) {
    return <ScreenState error errorText={errorText} onRetry={onRetry} />;
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: c.background }}
      renderItem={({ item }) => <ProductCard product={item} onPress={onOpenProduct} />}
      onRefresh={onRefresh}
      refreshing={isRefetching}
      ListHeaderComponent={
        products.length > 0 ? (
          <Text style={[styles.count, { color: c.textMuted }]}>
            {products.length} {products.length === 1 ? "oferta" : "ofertas"}
          </Text>
        ) : undefined
      }
      ListEmptyComponent={<ScreenState empty emptyText="No hay promociones por ahora" />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  count: { fontSize: 13, marginBottom: spacing.md },
});
