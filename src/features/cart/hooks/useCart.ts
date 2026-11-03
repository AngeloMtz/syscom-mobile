// src/features/cart/hooks/useCart.ts
import { useQuery } from "@tanstack/react-query";

import { cartRepository } from "@/features/cart/repositories/cartRepository";
import { useAuthStore } from "@/shared/store/authStore";

export const CART_KEY = ["cart"] as const;

/** Clave común de las mutaciones del carrito, para saber si hay otra en vuelo. */
export const CART_MUTATION_KEY = ["cart", "mutation"] as const;

/** Carrito del usuario (hasta MAX_CART_LINES líneas) con `totalPrice` del servidor. */
export const useCart = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: CART_KEY,
    queryFn: () => cartRepository.getAll(),
    // Sin sesión el backend responde 401 (con un token vencido, 403): ni siquiera se hace la petición.
    // Si el token vence con la sesión abierta, el cliente HTTP la cierra solo (shared/api/client.ts).
    enabled: isAuthenticated,
  });
};
