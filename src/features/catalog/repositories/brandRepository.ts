// src/features/catalog/repositories/brandRepository.ts — Acceso a /catalog/brands.
// Endpoint público. Única capa que conoce la ruta y la forma de la respuesta.
import api from "@/shared/api/client";
import type { Brand } from "@/features/catalog/types";

export const brandRepository = {
  /** Todas las marcas activas con su logo. */
  getAll: (): Promise<Brand[]> =>
    api.get("/catalog/brands").then((r) => {
      const data = r.data?.data;
      return Array.isArray(data) ? data : [];
    }),
};
