// src/features/reviews/reviewSelectors.ts — Funciones puras para mostrar reseñas.
// Sin red ni React: el autor, la fecha, las estrellas, el promedio y la distribución
// se calculan aquí y se prueban aparte. Toleran datos faltantes o raros del backend.
import { formatOrderDate } from "@/features/orders/orderFormat";
import type {
  DistributionRow,
  MyReview,
  ProductReview,
  RatingDistribution,
  ReviewAuthor,
  ReviewStatusTone,
  StarIcon,
} from "@/features/reviews/types";

const GENERIC_NAME = "Cliente de SYSCOM";
const STAR_ORDER = [5, 4, 3, 2, 1] as const;

/** Autor de la reseña: `usuarios` (forma real del backend) y `usuario` como respaldo. */
export function reviewAuthor(review: ProductReview): ReviewAuthor | null {
  return review.usuarios ?? review.usuario ?? null;
}

const clean = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** "Angel M.": nombre e inicial del apellido paterno, sin exponer el apellido completo. */
export function reviewerName(review: ProductReview): string {
  const author = reviewAuthor(review);
  const nombre = clean(author?.nombre);
  if (!nombre) return GENERIC_NAME;
  const initial = clean(author?.apellido_paterno).charAt(0).toUpperCase();
  return initial ? `${nombre} ${initial}.` : nombre;
}

/** Fecha en hora de México ("29 jun 2026"), o null si falta o no es válida (no se muestra). */
export function reviewDateLabel(iso: string | null | undefined): string | null {
  if (typeof iso !== "string" || iso === "" || Number.isNaN(Date.parse(iso))) return null;
  return formatOrderDate(iso);
}

/** Acota una calificación a 0–5; lo que no sea un número finito cuenta como 0. */
export function clampRating(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(0, value));
}

/** Texto accesible: "4.5 de 5 estrellas". */
export function ratingLabel(value: unknown): string {
  return `${clampRating(value)} de 5 estrellas`;
}

/** Cinco íconos de estrella, redondeando al medio punto más cercano. */
export function starIcons(value: unknown): StarIcon[] {
  const rounded = Math.round(clampRating(value) * 2) / 2;
  return [0, 1, 2, 3, 4].map((i): StarIcon => {
    if (rounded >= i + 1) return "star";
    if (rounded >= i + 0.5) return "star-half";
    return "star-outline";
  });
}

/** Promedio con un decimal ("4.5"). */
export function formatAverage(promedio: unknown): string {
  return clampRating(promedio).toFixed(1);
}

const safeCount = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

/** Filas de 5 a 1 estrellas con su conteo y porcentaje; con total 0 todos los porcentajes son 0. */
export function distributionRows(
  distribucion: Partial<RatingDistribution> | null | undefined,
  total: number,
): DistributionRow[] {
  const all = safeCount(total);
  return STAR_ORDER.map((stars) => {
    const count = safeCount(distribucion?.[String(stars) as keyof RatingDistribution]);
    const percent = all > 0 ? Math.min(100, Math.round((count / all) * 100)) : 0;
    return { stars, count, percent };
  });
}

/** Texto accesible de una fila: "5 estrellas: 2 reseñas, 50 %". */
export function distributionRowLabel(row: DistributionRow): string {
  return `${row.stars} ${row.stars === 1 ? "estrella" : "estrellas"}: ${row.count} ${
    row.count === 1 ? "reseña" : "reseñas"
  }, ${row.percent} %`;
}

/** "Sin reseñas", "1 reseña" o "N reseñas". */
export function reviewsCountLabel(total: unknown): string {
  const n = safeCount(total);
  if (n === 0) return "Sin reseñas";
  return n === 1 ? "1 reseña" : `${n} reseñas`;
}

/** Hay más reseñas por pedir mientras lo cargado sea menor que el total del servidor. */
export function hasMoreReviews(loaded: number, total: number): boolean {
  return safeCount(loaded) < safeCount(total);
}

/** El alcance de la app es solo reseñas de producto: descarta las de servicio y las generales. */
export function onlyProductReviews(reviews: MyReview[]): MyReview[] {
  return reviews.filter((r) => r.tipo === "producto");
}

const normalizeStatus = (estado: unknown): string => (typeof estado === "string" ? estado.trim().toLowerCase() : "");

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

const STATUS_TONES: Record<string, ReviewStatusTone> = {
  pendiente: "warning",
  aprobada: "success",
  rechazada: "danger",
};

/** "Pendiente", "Aprobada" o "Rechazada"; cualquier otro valor, "Estado no disponible". */
export function reviewStatusLabel(estado: string | null | undefined): string {
  return STATUS_LABELS[normalizeStatus(estado)] ?? "Estado no disponible";
}

export function reviewStatusTone(estado: string | null | undefined): ReviewStatusTone {
  return STATUS_TONES[normalizeStatus(estado)] ?? "neutral";
}

/** Nombre del producto reseñado, o un texto genérico si el servidor no lo trae. */
export function myReviewProductName(review: MyReview): string {
  return clean(review.productos?.nombre) || "Producto no disponible";
}

/** Primera imagen del producto reseñado, o null. */
export function myReviewImageUrl(review: MyReview): string | null {
  const url = review.productos?.producto_imagenes?.[0]?.url_imagen;
  return typeof url === "string" && url !== "" ? url : null;
}
