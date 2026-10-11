// src/features/favorites/types.ts
// Forma de GET /favorites tomada del código del backend (favorites.service.ts):
// es la fila de Prisma sin transformar, distinta de ProductListItem. No trae
// precio_final, promoción, variantes ni stock.

export interface FavoriteProduct {
  id_producto: number;
  nombre: string;
  slug: string;
  /** Prisma Decimal: puede llegar como número o como texto ("7200.00"). */
  precio_base: number | string;
  estado: string;
  envio_gratis: boolean;
  marcas: { nombre: string; slug: string } | null;
  producto_imagenes: { url_imagen: string }[];
}

export interface FavoriteItem {
  id_favorito: number;
  created_at: string;
  productos: FavoriteProduct;
}

/** Una página tal como la entrega el repository. */
export interface FavoritesPage {
  data: FavoriteItem[];
  nextCursor: number | null;
  hasMore: boolean;
  total: number;
}

/** Todos los favoritos cargados, hasta MAX_FAVORITES. */
export interface FavoritesResult {
  items: FavoriteItem[];
  /** Total real en el servidor (puede ser mayor que `items.length`). */
  total: number;
  /** true si había más favoritos que el tope y no se cargaron todos. */
  truncated: boolean;
}

/** Lo que muestra la tarjeta de favoritos. */
export interface FavoriteCardData {
  id: number;
  nombre: string;
  marca: string | null;
  /** null si el precio no es un número válido. */
  precio: number | null;
  imagenUrl: string | undefined;
  envioGratis: boolean;
  /** false si el producto ya no está activo en el catálogo. */
  disponible: boolean;
}
