// src/features/reviews/reviewKeys.ts — Claves de caché de las consultas de reseñas del usuario.
// La lista pública de un producto vive en hooks/useProductReviews (productReviewsKey).

export const canReviewKey = (productId: number) => ["reviews", "can-review", productId] as const;

/** Reseñas del usuario ("Mis reseñas"). */
export const MY_REVIEWS_KEY = ["reviews", "my"] as const;
