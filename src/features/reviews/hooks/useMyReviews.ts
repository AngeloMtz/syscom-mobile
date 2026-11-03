// src/features/reviews/hooks/useMyReviews.ts
import { useQuery } from "@tanstack/react-query";

import { reviewRepository } from "@/features/reviews/repositories/reviewRepository";
import { MY_REVIEWS_KEY } from "@/features/reviews/reviewKeys";
import { onlyProductReviews } from "@/features/reviews/reviewSelectors";
import type { MyReviewsResult } from "@/features/reviews/types";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * Reseñas del usuario ("Mis reseñas"): solo las de producto (el alcance de la app), con su estado y su
 * total. Solo con sesión: sin ella el backend responde 401 (con un token vencido, 403), así que ni se hace la petición.
 * useCreateReview invalida esta clave al terminar.
 */
export const useMyReviews = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: MY_REVIEWS_KEY,
    queryFn: () => reviewRepository.getMine(),
    select: (all): MyReviewsResult => {
      const reviews = onlyProductReviews(all);
      return { reviews, total: reviews.length };
    },
    enabled: isAuthenticated,
  });
};
