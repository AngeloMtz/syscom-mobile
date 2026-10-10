// src/features/favorites/favoriteSelectors.ts — Reglas de presentación de favoritos.
// Funciones puras: no tocan la red ni React.

import { getPrincipalImageUrl } from "@/features/catalog/selectors";
import type { ProductListItem } from "@/features/catalog/types";
import type {
  FavoriteCardData,
  FavoriteItem,
  FavoriteProduct,
  FavoritesResult,
} from "@/features/favorites/types";

/** Precio como número; acepta el Decimal serializado como texto. null si no es válido. */
export function parsePrice(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Datos de la tarjeta de favoritos a partir del elemento del backend. */
export function toFavoriteCardData(item: FavoriteItem): FavoriteCardData {
  const p = item.productos;
  return {
    id: p.id_producto,
    nombre: p.nombre,
    marca: p.marcas?.nombre ?? null,
    precio: parsePrice(p.precio_base),
    imagenUrl: p.producto_imagenes?.[0]?.url_imagen || undefined,
    envioGratis: p.envio_gratis === true,
    disponible: p.estado === "activo",
  };
}

/** Producto de un listado o del detalle en la forma que usa la lista de favoritos. */
export function toFavoriteProduct(
  p: Pick<ProductListItem, "id" | "nombre" | "slug" | "precio_base" | "estado" | "envio_gratis" | "marca" | "imagenes">,
): FavoriteProduct {
  const imagen = getPrincipalImageUrl(p);
  return {
    id_producto: p.id,
    nombre: p.nombre,
    slug: p.slug,
    precio_base: p.precio_base,
    estado: p.estado,
    envio_gratis: p.envio_gratis,
    marcas: p.marca ? { nombre: p.marca.nombre, slug: p.marca.slug } : null,
    producto_imagenes: imagen ? [{ url_imagen: imagen }] : [],
  };
}

/** Quita productos repetidos (por unión de páginas), conservando el primero. */
export function dedupeFavorites(items: FavoriteItem[]): FavoriteItem[] {
  const seen = new Set<number>();
  return items.filter((i) => {
    const id = i.productos.id_producto;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function favoriteIds(items: FavoriteItem[]): number[] {
  return items.map((i) => i.productos.id_producto);
}

export function isFavorite(ids: number[], productId: number): boolean {
  return ids.includes(productId);
}

/**
 * Resultado esperado tras agregar o quitar un favorito; se usa para pintar el
 * corazón al instante, antes de que responda el servidor. No modifica `current`.
 */
export function applyFavoriteChange(
  current: FavoritesResult | undefined,
  product: FavoriteProduct,
  favorite: boolean,
): FavoritesResult {
  const base: FavoritesResult = current ?? { items: [], total: 0, truncated: false };
  const exists = base.items.some((i) => i.productos.id_producto === product.id_producto);

  if (favorite) {
    if (exists) return base;
    const stub: FavoriteItem = {
      id_favorito: 0,
      created_at: new Date().toISOString(),
      productos: product,
    };
    return { ...base, items: [stub, ...base.items], total: base.total + 1 };
  }

  if (!exists) return base;
  return {
    ...base,
    items: base.items.filter((i) => i.productos.id_producto !== product.id_producto),
    total: Math.max(0, base.total - 1),
  };
}
