// src/features/catalog/hooks/useCategories.ts
import { useQuery } from "@tanstack/react-query";

import { categoryRepository } from "@/features/catalog/repositories/categoryRepository";
import { selectRootProductCategories } from "@/features/catalog/selectors";

/** Categorías raíz de productos, con caché, loading y error de TanStack Query. */
export const useRootCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: categoryRepository.getAll,
    select: selectRootProductCategories,
    // Las categorías casi no cambian: una hora sin volver a pedirlas.
    staleTime: 60 * 60 * 1000,
  });
