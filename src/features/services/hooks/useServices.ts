// src/features/services/hooks/useServices.ts
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { serviceRepository } from "@/features/services/repositories/serviceRepository";
import type { ServiceFilters } from "@/features/services/types";

/**
 * Servicios con scroll infinito: cada página se pide con `fetchNextPage` y el
 * hook las aplana en `data` (lista) y expone el `total` del servidor. Con
 * `keepPrevious` conserva los resultados anteriores mientras llega la búsqueda
 * nueva (evita el salto a vacío al teclear).
 */
export const useInfiniteServices = (filters: ServiceFilters, keepPrevious = true) =>
  useInfiniteQuery({
    queryKey: ["services", filters],
    queryFn: ({ pageParam }) => serviceRepository.getPage(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined,
    select: (result) => ({
      data: result.pages.flatMap((p) => p.data),
      total: result.pages[0]?.pagination.total ?? 0,
    }),
    placeholderData: keepPrevious ? keepPreviousData : undefined,
    staleTime: 5 * 60 * 1000,
  });
