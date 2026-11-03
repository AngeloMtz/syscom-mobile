// src/features/reviews/hooks/useCanReview.ts
import { useQuery } from "@tanstack/react-query";

import { reviewRepository } from "@/features/reviews/repositories/reviewRepository";
import { canReviewKey } from "@/features/reviews/reviewKeys";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * ¿Puede el usuario reseñar este producto? Solo con sesión (sin ella el backend responde 401; con un token vencido, 403,
 * así que ni se hace la petición) y con un id válido. Si puede, trae el pedido que da derecho.
 */
export const useCanReview = (productId: number | null) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const valid = typeof productId === "number" && Number.isInteger(productId) && productId > 0;

  return useQuery({
    queryKey: canReviewKey(valid ? productId : 0),
    queryFn: () => reviewRepository.canReview(productId as number),
    enabled: isAuthenticated && valid,
  });
};
