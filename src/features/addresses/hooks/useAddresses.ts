// src/features/addresses/hooks/useAddresses.ts
import { useQuery } from "@tanstack/react-query";

import { sortByRecent } from "@/features/addresses/addressSelectors";
import { addressRepository } from "@/features/addresses/repositories/addressRepository";
import { useAuthStore } from "@/shared/store/authStore";

export const ADDRESSES_KEY = ["addresses"] as const;

/** Clave común de las mutaciones, para saber si hay otra en vuelo. */
export const ADDRESS_MUTATION_KEY = ["addresses", "mutation"] as const;

/** Direcciones del usuario, de la más reciente a la más antigua. */
export const useAddresses = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: () => addressRepository.getAll(),
    select: sortByRecent,
    // Sin sesión el backend responde 401: ni siquiera se hace la petición.
    enabled: isAuthenticated,
  });
};
