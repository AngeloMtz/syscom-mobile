// src/features/institutional/repositories/institutionalRepository.ts
// Acceso a /institutional. Endpoints públicos. Única capa que conoce las rutas
// y la forma de la respuesta ({ success, data }).
import api from "@/shared/api/client";
import type { InstitutionalContent, Slider } from "@/features/institutional/types";

export const institutionalRepository = {
  /** Banners del home. */
  getSliders: (): Promise<Slider[]> =>
    api.get("/institutional/sliders").then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data : [];
    }),

  /** Contenido institucional (para #104: el teléfono del CTA de contacto). */
  getContent: (): Promise<InstitutionalContent | null> =>
    api.get("/institutional").then((r) => r.data?.data ?? r.data ?? null),
};
