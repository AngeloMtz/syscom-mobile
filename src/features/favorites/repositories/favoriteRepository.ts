// src/features/favorites/repositories/favoriteRepository.ts — Acceso a /favorites.
// Todas las rutas exigen sesión (Bearer, lo agrega el interceptor del cliente).
// El backend pagina por cursor: { success, data, meta: { nextCursor, hasMore, total } }.
import api from "@/shared/api/client";
import { dedupeFavorites } from "@/features/favorites/favoriteSelectors";
import type { FavoriteItem, FavoritesPage, FavoritesResult } from "@/features/favorites/types";

/** Máximo que acepta el backend por página (1 a 50). */
export const FAVORITES_PAGE_SIZE = 50;

/**
 * Tope de favoritos que la app carga: 4 páginas de 50. El backend no tiene un
 * endpoint de solo ids, así que los corazones salen de esta lista; con más de
 * 200 la pantalla avisa y solo se ven los más recientes.
 */
export const MAX_FAVORITES = 200;

const status = (error: unknown) => (error as { response?: { status?: number } } | null)?.response?.status;

export const favoriteRepository = {
  /** Una página de favoritos, del más reciente al más antiguo. */
  getPage: (cursor?: number, limit: number = FAVORITES_PAGE_SIZE): Promise<FavoritesPage> =>
    api.get("/favorites", { params: { limit, cursor } }).then((r) => ({
      data: Array.isArray(r.data?.data) ? (r.data.data as FavoriteItem[]) : [],
      nextCursor: r.data?.meta?.nextCursor ?? null,
      hasMore: r.data?.meta?.hasMore === true,
      total: Number(r.data?.meta?.total) || 0,
    })),

  /** Sigue el cursor hasta agotar los favoritos o llegar a `max`. */
  async getAll(max: number = MAX_FAVORITES): Promise<FavoritesResult> {
    const items: FavoriteItem[] = [];
    let cursor: number | undefined;
    let total = 0;
    let hasMore = true;

    while (hasMore && items.length < max) {
      const page = await favoriteRepository.getPage(cursor, Math.min(FAVORITES_PAGE_SIZE, max - items.length));
      items.push(...page.data);
      total = page.total;
      cursor = page.nextCursor ?? undefined;
      // Sin cursor o sin datos no hay forma de avanzar: se corta en vez de repetir.
      hasMore = page.hasMore && page.nextCursor !== null && page.data.length > 0;
    }

    return { items: dedupeFavorites(items), total, truncated: hasMore };
  },

  /** Agrega un favorito. El 409 (ya lo era) cuenta como éxito: el resultado es el mismo. */
  add: (productId: number): Promise<void> =>
    api.post(`/favorites/${productId}`).then(
      () => undefined,
      (error) => {
        if (status(error) === 409) return undefined;
        throw error;
      },
    ),

  /** Quita un favorito. El 404 (ya no lo era) cuenta como éxito. */
  remove: (productId: number): Promise<void> =>
    api.delete(`/favorites/${productId}`).then(
      () => undefined,
      (error) => {
        if (status(error) === 404) return undefined;
        throw error;
      },
    ),
};
