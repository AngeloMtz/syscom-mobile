// src/features/cart/hooks/useUpdateCartItem.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyQuantityChange } from "@/features/cart/cartSelectors";
import { CART_KEY, CART_MUTATION_KEY } from "@/features/cart/hooks/useCart";
import { cartRepository } from "@/features/cart/repositories/cartRepository";
import type { CartResult } from "@/features/cart/types";

type Variables = { productId: number; cantidad: number };

/**
 * Fija la cantidad de una línea. El carrito en caché cambia al instante
 * (cantidad y total con Δcantidad × precio_unitario), se revierte si la API
 * falla y se vuelve a pedir al terminar la última edición en vuelo.
 */
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: ({ productId, cantidad }: Variables) => cartRepository.setQuantity(productId, cantidad),
    onMutate: async ({ productId, cantidad }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<CartResult>(CART_KEY);
      queryClient.setQueryData<CartResult>(CART_KEY, (current) =>
        applyQuantityChange(current, productId, cantidad),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(CART_KEY, context?.previous);
    },
    onSettled: () => {
      // Con otra edición en vuelo (esta cuenta como 1) el refetch pisaría su optimista.
      if (queryClient.isMutating({ mutationKey: CART_MUTATION_KEY }) <= 1) {
        return queryClient.invalidateQueries({ queryKey: CART_KEY });
      }
    },
  });
};
