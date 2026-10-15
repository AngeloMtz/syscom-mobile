// src/features/institutional/hooks/useInstitutional.ts
import { useQuery } from "@tanstack/react-query";

import { institutionalRepository } from "@/features/institutional/repositories/institutionalRepository";

const STALE = 30 * 60 * 1000;

/** Banners del home. Datos públicos y casi estáticos: staleTime largo. */
export const useSliders = () =>
  useQuery({
    queryKey: ["institutional", "sliders"],
    queryFn: institutionalRepository.getSliders,
    staleTime: STALE,
  });

/** Contenido institucional (teléfono/correo) para el CTA de contacto. */
export const useInstitutionalContent = () =>
  useQuery({
    queryKey: ["institutional", "content"],
    queryFn: institutionalRepository.getContent,
    staleTime: STALE,
  });
