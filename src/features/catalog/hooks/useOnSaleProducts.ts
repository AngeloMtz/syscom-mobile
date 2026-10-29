// src/features/catalog/hooks/useOnSaleProducts.ts
import { useQuery } from "@tanstack/react-query";

import { productRepository } from "@/features/catalog/repositories/productRepository";

/**
 * Productos con promoción vigente (inicio y "Ver todas"). Comparten la misma consulta,
 * así que abrir la pantalla completa reutiliza lo que ya cargó el inicio.
 */
export const useOnSaleProducts = () =>
  useQuery({
    queryKey: ["products", "on-sale"],
    queryFn: () => productRepository.getOnSale(),
    staleTime: 5 * 60 * 1000,
  });
