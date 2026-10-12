// src/features/orders/hooks/useOrders.ts
import { useInfiniteQuery } from "@tanstack/react-query";

import { flattenOrders, getNextOrdersPage } from "@/features/orders/orderList";
import { orderRepository } from "@/features/orders/repositories/orderRepository";
import { useAuthStore } from "@/shared/store/authStore";

export const ORDERS_KEY = ["orders"] as const;

/**
 * Historial de pedidos con scroll infinito: cada página se pide con
 * `fetchNextPage` y el hook las aplana en `orders` (sin repetidos) y expone el
 * `total` del servidor. Sin sesión no hace ninguna petición.
 */
export const useOrders = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useInfiniteQuery({
    queryKey: ORDERS_KEY,
    queryFn: ({ pageParam }) => orderRepository.getPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: getNextOrdersPage,
    select: (result) => ({
      orders: flattenOrders(result.pages),
      total: result.pages[0]?.total ?? 0,
    }),
    enabled: isAuthenticated,
  });
};
