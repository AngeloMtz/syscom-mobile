// src/features/institutional/hooks/useInstitutional.ts
// Hooks del contenido institucional. Todos son datos públicos y casi estáticos,
// así que comparten un staleTime largo.
import { useMutation, useQuery } from "@tanstack/react-query";

import { institutionalRepository } from "@/features/institutional/repositories/institutionalRepository";

const STALE = 30 * 60 * 1000;

export const useInstitutionalContent = () =>
  useQuery({
    queryKey: ["institutional", "content"],
    queryFn: institutionalRepository.getContent,
    staleTime: STALE,
  });

export const useSliders = () =>
  useQuery({
    queryKey: ["institutional", "sliders"],
    queryFn: institutionalRepository.getSliders,
    staleTime: STALE,
  });

export const useFaqs = () =>
  useQuery({
    queryKey: ["institutional", "faqs"],
    queryFn: institutionalRepository.getFaqs,
    staleTime: STALE,
  });

export const usePolicies = () =>
  useQuery({
    queryKey: ["institutional", "policies"],
    queryFn: institutionalRepository.getPolicies,
    staleTime: STALE,
  });

/** Suscripción al boletín. El usuario decide reintentar, no se reintenta solo. */
export const useNewsletter = () =>
  useMutation({
    mutationFn: ({ nombre, correo }: { nombre: string; correo: string }) =>
      institutionalRepository.subscribeNewsletter(nombre, correo),
    retry: 0,
  });
