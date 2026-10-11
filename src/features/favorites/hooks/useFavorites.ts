// src/features/favorites/hooks/useFavorites.ts
import { useQuery } from "@tanstack/react-query";

import { favoriteIds } from "@/features/favorites/favoriteSelectors";
import { favoriteRepository } from "@/features/favorites/repositories/favoriteRepository";
import { useAuthStore } from "@/shared/store/authStore";

export const FAVORITES_KEY = ["favorites"] as const;

const fetchFavorites = () => favoriteRepository.getAll();

/** Favoritos del usuario (hasta MAX_FAVORITES) con `total` y `truncated`. */
export const useFavorites = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: fetchFavorites,
    // Sin sesión el backend responde 401: ni siquiera se hace la petición.
    enabled: isAuthenticated,
  });
};

/** Solo los ids de producto, para pintar los corazones; comparte la misma consulta. */
export const useFavoriteIds = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: fetchFavorites,
    enabled: isAuthenticated,
    select: (result) => favoriteIds(result.items),
  });
};
