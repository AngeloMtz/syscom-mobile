// src/features/addresses/hooks/useCreateAddress.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCheckoutStore } from "@/features/addresses/checkoutStore";
import { ADDRESS_MUTATION_KEY, ADDRESSES_KEY } from "@/features/addresses/hooks/useAddresses";
import { addressRepository } from "@/features/addresses/repositories/addressRepository";
import type { AddressPayload } from "@/features/addresses/types";

/**
 * Guarda una dirección nueva para compras futuras y la deja elegida para el
 * envío. El error 400 del servidor llega intacto para mostrarlo por campo.
 */
export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  const selectAddress = useCheckoutStore((s) => s.selectAddress);

  return useMutation({
    mutationKey: ADDRESS_MUTATION_KEY,
    mutationFn: (payload: AddressPayload) => addressRepository.create(payload),
    retry: 0,
    onSuccess: (created) => {
      selectAddress(created.id_direccion);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
};
