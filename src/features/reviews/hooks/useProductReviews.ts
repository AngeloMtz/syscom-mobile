// src/features/reviews/hooks/useProductReviews.ts
import { useInfiniteQuery } from "@tanstack/react-query";

import { reviewRepository } from "@/features/reviews/repositories/reviewRepository";
import { hasMoreReviews } from "@/features/reviews/reviewSelectors";
import type { ProductReviewsResult } from "@/features/reviews/types";

export const productReviewsKey = (productId: number) => ["reviews", "product", productId] as const;

/**
 * Reseñas aprobadas de un producto, de 5 en 5: `fetchNextPage` pide la siguiente y el hook
 * aplana las páginas en `data.reviews`. `total`, `promedio` y `distribucion` salen de la
 * primera página. Con un id inválido no consulta la API; una página vacía corta la paginación
 * aunque el total sea mayor, para no pedir páginas sin fin.
 */
export const useProductReviews = (productId: number | null) => {
  const valid = typeof productId === "number" && Number.isInteger(productId) && productId > 0;

  return useInfiniteQuery({
    queryKey: productReviewsKey(valid ? productId : 0),
    queryFn: ({ pageParam }) => reviewRepository.getProductReviews(productId as number, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((sum, p) => sum + p.reviews.length, 0);
      return last.reviews.length > 0 && hasMoreReviews(loaded, last.total) ? all.length + 1 : undefined;
    },
    select: (result): ProductReviewsResult => ({
      reviews: result.pages.flatMap((p) => p.reviews),
      total: result.pages[0]?.total ?? 0,
      promedio: result.pages[0]?.promedio ?? 0,
      distribucion: result.pages[0]?.distribucion ?? { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    }),
    enabled: valid,
  });
};
