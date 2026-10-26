import type { CanReview, MyReview, ProductReview, ProductReviewsPage } from "@/features/reviews/types";

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

// SUPUESTO: la forma de GET /reviews/my se leyó del código del backend (getMyReviews en
// reviews.service.ts), sin contrastarla con una respuesta real. Devuelve las reseñas de TODOS los
// tipos del usuario, con `productos` o `servicios` según el tipo; `productos` no incluye el id.
export function makeMyReview(over: Partial<MyReview> = {}): MyReview {
  return {
    id_resena: 1,
    tipo: "producto",
    calificacion: 5,
    titulo: "Buen producto",
    comentario: "Llegó rápido y funciona perfecto.",
    estado: "pendiente",
    created_at: "2026-10-24T18:00:00.000Z",
    productos: {
      nombre: "Lenovo ThinkPad X1 Carbon",
      slug: "lenovo-thinkpad-x1-carbon",
      producto_imagenes: [{ url_imagen: "https://example.com/thinkpad.jpg" }],
    },
    servicios: null,
    ...over,
  };
}
