// src/features/catalog/hooks/useProductsPreview.ts
import { useQuery } from "@tanstack/react-query";

import { productRepository } from "@/features/catalog/repositories/productRepository";

/** Primeros productos del catálogo para el bloque "Nuestros productos" del home. */
export const useProductsPreview = (limit = 6) =>
  useQuery({
    queryKey: ["products", "preview", limit],
    queryFn: () => productRepository.getPage({ limit }, 1).then((r) => r.data.slice(0, limit)),
    staleTime: 5 * 60 * 1000,
  });
