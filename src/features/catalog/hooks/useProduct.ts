// src/features/catalog/hooks/useProduct.ts
import { useQuery } from "@tanstack/react-query";

import { parseProductId } from "@/features/catalog/productDetail";
import { productRepository } from "@/features/catalog/repositories/productRepository";

/**
 * Detalle de un producto por el id de la ruta. Con un id inválido no consulta
 * la API; un 404 llega como `null` desde el repository y se expone como
 * `notFound` (no es un error: no tiene sentido reintentar).
 */
export const useProduct = (rawId: string | string[] | undefined) => {
  const id = parseProductId(rawId);
  const query = useQuery({
    queryKey: ["product", id],
    queryFn: () => productRepository.getById(id as number),
    enabled: id !== null,
  });
  return { ...query, notFound: id === null || (query.isSuccess && query.data === null) };
};
