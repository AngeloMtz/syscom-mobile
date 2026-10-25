// src/features/reviews/types.ts
// Forma de GET /reviews/product/:id verificada con producción (producto 7, 2026-10-24):
// { success, data: { total, promedio: "5.0", distribucion: { "1".."5" }, reviews: [...] } }.
// El autor llega en `usuarios` (plural, relación de Prisma); el tipo del backend dice `usuario`,
// así que se aceptan las dos claves. El endpoint solo devuelve reseñas aprobadas.

export interface ReviewAuthor {
  nombre: string;
  apellido_paterno: string;
  foto_perfil: string | null;
}

export interface ProductReview {
  id_resena: number;
  /** Entero de 1 a 5 (el backend lo valida al crear). */
  calificacion: number;
  titulo: string | null;
  comentario: string;
  /** Siempre "aprobada" en este endpoint. */
  estado: string;
  /** ISO en UTC; puede ser null. */
  created_at: string | null;
  usuarios?: ReviewAuthor | null;
  usuario?: ReviewAuthor | null;
}

/** Conteo de reseñas por calificación; las claves son "1" a "5". */
export type RatingDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;

/** Una página de reseñas tal como la entrega el repository (promedio ya como número). */
export interface ProductReviewsPage {
  total: number;
  promedio: number;
  distribucion: RatingDistribution;
  reviews: ProductReview[];
  page: number;
}

/** Lo que expone useProductReviews: las páginas aplanadas. */
export interface ProductReviewsResult {
  reviews: ProductReview[];
  total: number;
  promedio: number;
  distribucion: RatingDistribution;
}

export type StarIcon = "star" | "star-half" | "star-outline";

export interface DistributionRow {
  stars: 1 | 2 | 3 | 4 | 5;
  count: number;
  /** 0 a 100, redondeado. */
  percent: number;
}
