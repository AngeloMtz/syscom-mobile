// src/features/services/hooks/useServicesPreview.ts
import { useQuery } from "@tanstack/react-query";

import { serviceRepository } from "@/features/services/repositories/serviceRepository";

/** Primeros servicios para la sección "Servicios" del home. */
export const useServicesPreview = (limit = 6) =>
  useQuery({
    queryKey: ["services", "preview", limit],
    queryFn: () => serviceRepository.getPage({ limit }, 1).then((r) => r.data.slice(0, limit)),
    staleTime: 5 * 60 * 1000,
  });
