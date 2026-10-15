// src/features/catalog/hooks/useFeaturedProducts.ts
import { useQuery } from "@tanstack/react-query";

import { productRepository } from "@/features/catalog/repositories/productRepository";

/** Productos destacados del home, con caché, loading y error de TanStack Query. */
export const useFeaturedProducts = (limit = 8) =>
  useQuery({
    queryKey: ["products", "featured", limit],
    queryFn: () => productRepository.getFeatured(limit),
    staleTime: 10 * 60 * 1000,
  });
