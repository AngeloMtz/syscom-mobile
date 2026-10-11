import type {
  FavoriteItem,
  FavoriteProduct,
  FavoritesPage,
  FavoritesResult,
} from "@/features/favorites/types";

// Forma tomada del código del backend (favorites.service.ts); pendiente de
// contrastar con el cuerpo de una respuesta real de GET /favorites.

export function makeFavoriteProduct(over: Partial<FavoriteProduct> = {}): FavoriteProduct {
  return {
    id_producto: 1,
    nombre: "Laptop de prueba",
    slug: "laptop-de-prueba",
    precio_base: 1000,
    estado: "activo",
    envio_gratis: false,
    marcas: { nombre: "HP", slug: "hp" },
    producto_imagenes: [{ url_imagen: "https://example.com/producto-1.jpg" }],
    ...over,
  };
}

export function makeFavoriteItem(over: Partial<FavoriteItem> = {}): FavoriteItem {
  return {
    id_favorito: 1,
    created_at: "2026-10-01T12:00:00.000Z",
    productos: makeFavoriteProduct(),
    ...over,
  };
}

/** Elemento con un producto concreto: el id del favorito sigue al del producto. */
export function makeFavoriteItemFor(
  productId: number,
  product: Partial<FavoriteProduct> = {},
): FavoriteItem {
  return makeFavoriteItem({
    id_favorito: 100 + productId,
    productos: makeFavoriteProduct({ id_producto: productId, ...product }),
  });
}

/** Página como la entrega el repository (ya sin la envoltura de la API). */
export function makeFavoritesPage(over: Partial<FavoritesPage> = {}): FavoritesPage {
  return { data: [makeFavoriteItem()], nextCursor: null, hasMore: false, total: 1, ...over };
}

export function makeFavoritesResult(over: Partial<FavoritesResult> = {}): FavoritesResult {
  return { items: [makeFavoriteItem()], total: 1, truncated: false, ...over };
}
