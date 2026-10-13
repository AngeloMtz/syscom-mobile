// src/features/orders/hooks/useOrder.ts
import { useQuery } from "@tanstack/react-query";

import { parseOrderId } from "@/features/orders/orderFormat";
import { orderRepository } from "@/features/orders/repositories/orderRepository";
import { useAuthStore } from "@/shared/store/authStore";

export const ORDER_KEY = (id: number | null) => ["order", id] as const;

/**
 * Detalle de un pedido por el id de la ruta. Con un id inválido o sin sesión no
 * consulta; un 404 llega como `null` desde el repository y se expone como
 * `notFound` (no es un error: no tiene sentido reintentar).
 */
export const useOrder = (rawId: string | string[] | undefined) => {
  const id = parseOrderId(rawId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const query = useQuery({
    queryKey: ORDER_KEY(id),
    queryFn: () => orderRepository.getById(id as number),
    enabled: id !== null && isAuthenticated,
  });
  return { ...query, notFound: id === null || (query.isSuccess && query.data === null) };
};
