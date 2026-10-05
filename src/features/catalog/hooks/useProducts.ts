// src/features/catalog/hooks/useProducts.ts
import { useInfiniteQuery } from "@tanstack/react-query";

import { productRepository } from "@/features/catalog/repositories/productRepository";
import type { ProductFilters } from "@/features/catalog/types";

/**
 * Productos con scroll infinito: cada página se pide con `fetchNextPage` y el
 * hook las aplana en `data` (lista) y expone el `total` del servidor.
 */
export const useInfiniteProducts = (filters: ProductFilters, enabled = true) =>
  useInfiniteQuery({
    queryKey: ["products", filters],
    queryFn: ({ pageParam }) => productRepository.getPage(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined,
    select: (result) => ({
      data: result.pages.flatMap((p) => p.data),
      total: result.pages[0]?.pagination.total ?? 0,
    }),
    enabled,
  });
