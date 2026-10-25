// src/features/reviews/hooks/useCreateReview.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reviewRepository } from "@/features/reviews/repositories/reviewRepository";
import { MY_REVIEWS_KEY, canReviewKey } from "@/features/reviews/reviewKeys";
import type { CreateReviewInput } from "@/features/reviews/types";

/**
 * Crea la reseña de un producto. Sin reintentos (un POST no debe duplicarse) y con el error 400 del
 * servidor intacto para mostrar su mensaje. Al terminar —con éxito o con error— vuelve a pedir
 * can-review de ese producto (ya no podrá reseñarlo, o quizá ya lo había hecho) y "mis reseñas".
 * No toca la lista pública: la reseña nueva queda pendiente hasta que un admin la apruebe.
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["reviews", "create"],
    mutationFn: (input: CreateReviewInput) => reviewRepository.create(input),
    retry: 0,
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({ queryKey: canReviewKey(input.idProducto) });
      queryClient.invalidateQueries({ queryKey: MY_REVIEWS_KEY });
    },
  });
};
