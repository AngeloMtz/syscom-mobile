// src/features/reviews/reviewValidation.ts — Validación local del formulario de reseña.
// Espejo de createReviewSchema del backend (src/modules/reviews/validation.ts): calificación
// entera de 1 a 5, comentario de 10 a 1000 caracteres y título opcional de hasta 150. El
// backend mide el texto tal cual; aquí se recorta antes de medir y se envía ya recortado.
import type { CreateReviewInput, ReviewFormErrors, ReviewFormValues } from "@/features/reviews/types";

export const COMMENT_MIN = 10;
export const COMMENT_MAX = 1000;
export const TITLE_MAX = 150;

/** Errores por campo; sin errores devuelve `{}`. */
export function validateReview(values: ReviewFormValues): ReviewFormErrors {
  const errors: ReviewFormErrors = {};
  const { calificacion } = values;

  if (typeof calificacion !== "number" || !Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
    errors.calificacion = "Selecciona una calificación de 1 a 5 estrellas";
  }

  const comentario = values.comentario.trim();
  if (comentario.length < COMMENT_MIN) {
    errors.comentario = `El comentario debe tener al menos ${COMMENT_MIN} caracteres`;
  } else if (comentario.length > COMMENT_MAX) {
    errors.comentario = `El comentario no puede exceder ${COMMENT_MAX} caracteres`;
  }

  if (values.titulo.trim().length > TITLE_MAX) {
    errors.titulo = `El título no puede exceder ${TITLE_MAX} caracteres`;
  }

  return errors;
}

/** Entrada para el repository: texto recortado y sin la clave `titulo` si quedó vacío. */
export function buildReviewInput(values: ReviewFormValues, idProducto: number, idPedido: number): CreateReviewInput {
  const titulo = values.titulo.trim();
  return {
    idProducto,
    idPedido,
    calificacion: values.calificacion,
    ...(titulo ? { titulo } : {}),
    comentario: values.comentario.trim(),
  };
}
