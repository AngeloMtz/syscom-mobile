// src/features/reviews/repositories/reviewRepository.ts — Acceso a /reviews.
// GET /reviews/product/:id es público y devuelve solo reseñas aprobadas:
// { success, data: { total, promedio: "4.5", distribucion, reviews } }, paginado con page/limit
// (sin `meta`: el total sirve para saber si hay más). Crear y "puede reseñar" llegan en otro PR.
import api from "@/shared/api/client";
import type { ProductReview, ProductReviewsPage, RatingDistribution } from "@/features/reviews/types";

/** Reseñas por página (el backend usa 5 por defecto y no pone tope a `limit`). */
export const REVIEWS_PAGE_SIZE = 5;

const toCount = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const toDistribution = (raw: unknown): RatingDistribution => {
  const source = (raw ?? {}) as Record<string, unknown>;
  return {
    "1": toCount(source["1"]),
    "2": toCount(source["2"]),
    "3": toCount(source["3"]),
    "4": toCount(source["4"]),
    "5": toCount(source["5"]),
  };
};

export const reviewRepository = {
  /** Una página de reseñas del producto, de la más reciente a la más antigua. */
  getProductReviews: (
    productId: number,
    page = 1,
    limit: number = REVIEWS_PAGE_SIZE,
  ): Promise<ProductReviewsPage> =>
    api.get(`/reviews/product/${productId}`, { params: { page, limit } }).then((r) => {
      const data = r.data?.data;
      return {
        total: toCount(data?.total),
        // El backend manda el promedio como texto ("4.5").
        promedio: toCount(data?.promedio),
        distribucion: toDistribution(data?.distribucion),
        reviews: Array.isArray(data?.reviews) ? (data.reviews as ProductReview[]) : [],
        page,
      };
    }),
};
