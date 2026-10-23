// src/features/ar/hooks/useProductModels.ts
import { useQuery } from "@tanstack/react-query";

import { modelsRepository } from "@/features/ar/repositories/modelsRepository";
import { selectProductModels } from "@/features/ar/selectors";
import type { ProductModels } from "@/features/ar/types";

/**
 * Modelos 3D de un producto, ya agrupados por formato (glb/usdz) y con URLs
 * absolutas. Devuelve un objeto vacío si el producto no tiene modelos: la UI
 * no distingue "sin modelos" de "producto 404" (ambos quieren el mismo mensaje).
 */
export const useProductModels = (productId: number | null) =>
  useQuery<ProductModels>({
    queryKey: ["product", productId, "models3d"],
    queryFn: () => modelsRepository.getByProductId(productId as number).then(selectProductModels),
    enabled: productId !== null && Number.isFinite(productId),
    staleTime: 60 * 60 * 1000,
  });
