// src/features/favorites/hooks/useToggleFavorite.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyFavoriteChange } from "@/features/favorites/favoriteSelectors";
import { FAVORITES_KEY } from "@/features/favorites/hooks/useFavorites";
import { favoriteRepository } from "@/features/favorites/repositories/favoriteRepository";
import type { FavoriteProduct, FavoritesResult } from "@/features/favorites/types";

type Variables = { product: FavoriteProduct; favorite: boolean };

/**
 * Agrega o quita un favorito. La lista en caché cambia al instante (actualización
 * optimista), se revierte si la API falla y siempre se vuelve a pedir al terminar.
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ product, favorite }: Variables) =>
      favorite ? favoriteRepository.add(product.id_producto) : favoriteRepository.remove(product.id_producto),
    onMutate: async ({ product, favorite }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<FavoritesResult>(FAVORITES_KEY);
      queryClient.setQueryData<FavoritesResult>(FAVORITES_KEY, (current) =>
        applyFavoriteChange(current, product, favorite),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(FAVORITES_KEY, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  });
};
