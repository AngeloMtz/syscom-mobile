// src/features/catalog/hooks/useBrands.ts
import { useQuery } from "@tanstack/react-query";

import { brandRepository } from "@/features/catalog/repositories/brandRepository";

/** Marcas para el home. Casi no cambian: una hora sin volver a pedirlas. */
export const useBrands = () =>
  useQuery({
    queryKey: ["brands"],
    queryFn: brandRepository.getAll,
    staleTime: 60 * 60 * 1000,
  });
