// src/features/cart/hooks/useRemoveCartItem.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyRemove } from "@/features/cart/cartSelectors";
import { CART_KEY, CART_MUTATION_KEY } from "@/features/cart/hooks/useCart";
import { cartRepository } from "@/features/cart/repositories/cartRepository";
import type { CartResult } from "@/features/cart/types";

/**
 * Quita una línea. Desaparece de la lista y de `totalPrice` al instante, se
 * revierte si la API falla y se vuelve a pedir al terminar la última mutación.
 */
export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: (productId: number) => cartRepository.remove(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<CartResult>(CART_KEY);
      queryClient.setQueryData<CartResult>(CART_KEY, (current) => applyRemove(current, productId));
      return { previous };
    },
    onError: (_error, _productId, context) => {
      queryClient.setQueryData(CART_KEY, context?.previous);
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: CART_MUTATION_KEY }) <= 1) {
        return queryClient.invalidateQueries({ queryKey: CART_KEY });
      }
    },
  });
};
