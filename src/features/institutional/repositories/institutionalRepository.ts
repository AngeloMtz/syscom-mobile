// src/features/institutional/repositories/institutionalRepository.ts
// Acceso a /institutional y al boletín de /contact. Endpoints públicos.
// Única capa que conoce las rutas y la forma de la respuesta.
import api from "@/shared/api/client";
import type { Faq, InstitutionalContent, Policy, Slider } from "@/features/institutional/types";

// El listado /politicas es solo-admin; en público se piden por tipo.
const PUBLIC_POLICY_TYPES: { tipo: string; titulo: string }[] = [
  { tipo: "politicas_privacidad", titulo: "Política de privacidad" },
  { tipo: "terminos_condiciones", titulo: "Términos y condiciones" },
];

export const institutionalRepository = {
  /** Contenido institucional (misión, visión, historia, valores, contacto). */
  getContent: (): Promise<InstitutionalContent | null> =>
    api.get("/institutional").then((r) => r.data?.data ?? r.data ?? null),

  /** Banners del home. */
  getSliders: (): Promise<Slider[]> =>
    api.get("/institutional/sliders").then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data : [];
    }),

  /** Preguntas frecuentes. */
  getFaqs: (): Promise<Faq[]> =>
    api.get("/institutional/faqs").then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data : [];
    }),

  /** Políticas públicas, pedidas una por tipo; se omite la que no exista. */
  getPolicies: async (): Promise<Policy[]> => {
    const resultados = await Promise.all(
      PUBLIC_POLICY_TYPES.map(({ tipo, titulo }) =>
        api.get(`/institutional/politicas/${tipo}`).then(
          (r) => {
            const data = r.data?.data ?? r.data;
            if (!data?.contenido) return null;
            return { tipo, titulo: data.titulo ?? titulo, contenido: data.contenido } as Policy;
          },
          () => null,
        ),
      ),
    );
    return resultados.filter((p): p is Policy => p !== null);
  },

  /** Suscripción al boletín (endpoint público, no requiere sesión). */
  subscribeNewsletter: (nombre: string, correo: string): Promise<void> =>
    api.post("/contact/newsletter", { nombre, correo }).then(() => undefined),
};
