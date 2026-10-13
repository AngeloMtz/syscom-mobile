// src/features/cart/hooks/useAddToCart.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CART_KEY, CART_MUTATION_KEY } from "@/features/cart/hooks/useCart";
import { cartRepository } from "@/features/cart/repositories/cartRepository";

/**
 * Agrega 1 unidad del producto al carrito del servidor. No hay actualización
 * optimista: el carrito necesita datos del producto que solo trae el servidor.
 */
export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    // LIMITACIÓN CONOCIDA: el backend (POST /cart/items/:productId) no recibe
    // variante ni cantidad. La variante que el usuario vea seleccionada en el
    // detalle NO se envía; el stock se valida sobre el producto completo al pagar.
    mutationFn: (productId: number) => cartRepository.add(productId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });
};
