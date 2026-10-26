// src/features/ar/repositories/modelsRepository.ts — Acceso a /catalog/products/:id/modelos-3d.
// Endpoint público. Única capa que conoce la ruta y la forma de la respuesta.
// Un producto puede tener 0, 1 o 2 modelos (glb y/o usdz).
import api from "@/shared/api/client";
import type { Product3DModel } from "@/features/ar/types";

export const modelsRepository = {
  /**
   * Modelos 3D del producto. 404 → [] (el producto no existe o no está activo:
   * la pantalla trata ambos casos como "sin modelo").
   */
  getByProductId: (productId: number): Promise<Product3DModel[]> =>
    api.get(`/catalog/products/${productId}/modelos-3d`).then(
      (r) => {
        const data = r.data?.data;
        return Array.isArray(data) ? data : [];
      },
      (error) => {
        if (error?.response?.status === 404) return [];
        throw error;
      },
    ),
};
