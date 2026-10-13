// src/features/addresses/hooks/useUpdateAddress.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ADDRESS_MUTATION_KEY, ADDRESSES_KEY } from "@/features/addresses/hooks/useAddresses";
import { addressRepository } from "@/features/addresses/repositories/addressRepository";
import type { AddressPayload } from "@/features/addresses/types";

type Variables = { id: number; payload: AddressPayload };

/**
 * Edita una dirección. Limitación conocida del backend: permite editarla aunque
 * esté asociada a un pedido en curso, sin avisar.
 */
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ADDRESS_MUTATION_KEY,
    mutationFn: ({ id, payload }: Variables) => addressRepository.update(id, payload),
    retry: 0,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
};
