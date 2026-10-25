import type { CanReview, ProductReview, ProductReviewsPage } from "@/features/reviews/types";

// Forma verificada con GET /reviews/product/7 en producción (2026-10-24): el autor viene en
// `usuarios` (plural) y no hay `usuario`. El backend también expone `productos` y `servicios`,
// que la app no usa en esta pantalla.

export function makeReview(over: Partial<ProductReview> = {}): ProductReview {
  return {
    id_resena: 1,
    calificacion: 5,
    titulo: "Buen producto",
    comentario: "Llegó rápido y funciona perfecto.",
    estado: "aprobada",
    created_at: "2026-06-29T18:27:30.440Z",
    usuarios: { nombre: "Angel", apellido_paterno: "Martínez", foto_perfil: null },
    ...over,
  };
}

export function makeProductReviewsPage(over: Partial<ProductReviewsPage> = {}): ProductReviewsPage {
  return {
    total: 1,
    promedio: 5,
    distribucion: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 },
    reviews: [makeReview()],
    page: 1,
    ...over,
  };
}

// SUPUESTO: la forma de GET /reviews/can-review/:id y de POST /reviews se leyó del código del
// backend (reviews.service.ts / controller.ts), sin contrastarla con una respuesta real.
// El repository la normaliza a CanReview; esto es la forma ya normalizada.
export function makeCanReview(over: Partial<CanReview> = {}): CanReview {
  return { canReview: true, idPedido: 12, reason: null, ...over };
}
