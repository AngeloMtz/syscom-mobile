// src/features/catalog/repositories/categoryRepository.ts — Acceso a /catalog/categories.
// Endpoint público: no exige sesión. Única capa que conoce la ruta y la forma
// de la respuesta ({ success, data: Category[] }).
import api from "@/shared/api/client";
import type { Category } from "@/features/catalog/types";

export const categoryRepository = {
  /** Todas las categorías activas (raíz y subcategorías) en una lista plana. */
  getAll: (): Promise<Category[]> =>
    api.get("/catalog/categories").then((r) => {
      const data = r.data?.data;
      return Array.isArray(data) ? data : [];
    }),
};
