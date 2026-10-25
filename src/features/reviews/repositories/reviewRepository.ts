// src/features/reviews/repositories/reviewRepository.ts — Acceso a /reviews.
// GET /reviews/product/:id es público y devuelve solo reseñas aprobadas:
// { success, data: { total, promedio: "4.5", distribucion, reviews } }, paginado con page/limit
// (sin `meta`: el total sirve para saber si hay más).
// can-review y crear exigen sesión (Bearer, lo agrega el interceptor del cliente). SUPUESTO,
// pendiente de verificar: su forma se leyó del código del backend, no de una respuesta real;
// por eso se leen de forma tolerante y se normalizan (ver CanReview en types.ts).
import api from "@/shared/api/client";
import type {
  CanReview,
  CreateReviewInput,
  CreateReviewResult,
  ProductReview,
  ProductReviewsPage,
  RatingDistribution,
} from "@/features/reviews/types";

/** Reseñas por página (el backend usa 5 por defecto y no pone tope a `limit`). */
export const REVIEWS_PAGE_SIZE = 5;

const toCount = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Entero positivo desde un número o un texto numérico; cualquier otra cosa es null. */
const toPositiveInt = (value: unknown): number | null => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
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
  /**
   * ¿Puede el usuario reseñar este producto? Solo con un pedido entregado y sin reseña previa.
   * Sin id de pedido no se puede crear la reseña, así que cuenta como "no puede".
   */
  canReview: (productId: number): Promise<CanReview> =>
    api.get(`/reviews/can-review/${productId}`).then((r) => {
      const data = r.data?.data;
      const idPedido = toPositiveInt(data?.id_pedido);
      const can = data?.canReview === true && idPedido !== null;
      const reason = typeof data?.reason === "string" && data.reason.trim() ? data.reason.trim() : null;
      return { canReview: can, idPedido: can ? idPedido : null, reason };
    }),

  /**
   * Crea la reseña de un producto (queda pendiente hasta que un admin la apruebe). Los 400 del
   * servidor (no comprado, duplicada, validación) llegan intactos para mostrar su `message`.
   */
  create: (input: CreateReviewInput): Promise<CreateReviewResult> =>
    api
      .post("/reviews", {
        tipo: "producto",
        id_producto: input.idProducto,
        id_pedido: input.idPedido,
        calificacion: input.calificacion,
        ...(input.titulo ? { titulo: input.titulo } : {}),
        comentario: input.comentario,
      })
      .then((r) => ({ idResena: toPositiveInt(r.data?.data?.id_resena) })),
};
