// src/app/promociones.tsx — Promociones vigentes ("Ver todas" de la sección Ofertas).
// Solo presentación: los datos y estados vienen de useOnSaleProducts.
import { router } from "expo-router";

import OnSaleList from "@/features/catalog/components/OnSaleList";
import { useOnSaleProducts } from "@/features/catalog/hooks/useOnSaleProducts";
import type { ProductListItem } from "@/features/catalog/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";

const openProduct = (product: ProductListItem) =>
  router.push({ pathname: "/product/[id]", params: { id: String(product.id) } });

export default function PromocionesScreen() {
  const { data, isLoading, isError, error, isRefetching, refetch } = useOnSaleProducts();

  return (
    <OnSaleList
      products={data ?? []}
      isLoading={isLoading}
      isError={isError}
      errorText={isError ? apiErrorMessage(error) : undefined}
      isRefetching={isRefetching}
      onRetry={() => refetch()}
      onRefresh={() => refetch()}
      onOpenProduct={openProduct}
    />
  );
}
