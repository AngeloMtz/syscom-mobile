// src/features/addresses/hooks/useDeleteAddress.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeAddress } from "@/features/addresses/addressSelectors";
import { useCheckoutStore } from "@/features/addresses/checkoutStore";
import { ADDRESS_MUTATION_KEY, ADDRESSES_KEY } from "@/features/addresses/hooks/useAddresses";
import { addressRepository } from "@/features/addresses/repositories/addressRepository";
import type { Address } from "@/features/addresses/types";

/**
 * Elimina una dirección (borrado lógico en el backend). Sale de la lista al
 * instante, vuelve si la API falla, y si era la elegida se limpia la elección
 * (el envío cae a la más reciente que quede). Limitación conocida del backend:
 * lo permite aunque haya un pedido en curso con esa dirección.
 */
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ADDRESS_MUTATION_KEY,
    mutationFn: (id: number) => addressRepository.remove(id),
    retry: 0,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ADDRESSES_KEY });
      const previous = queryClient.getQueryData<Address[]>(ADDRESSES_KEY);
      queryClient.setQueryData<Address[]>(ADDRESSES_KEY, (current) => removeAddress(current, id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(ADDRESSES_KEY, context?.previous);
    },
    onSuccess: (_data, id) => {
      const store = useCheckoutStore.getState();
      if (store.selectedAddressId === id) store.selectAddress(null);
    },
    onSettled: () => {
      // Con otra mutación en vuelo (esta cuenta como 1) el refetch pisaría su optimista.
      if (queryClient.isMutating({ mutationKey: ADDRESS_MUTATION_KEY }) <= 1) {
        return queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
      }
    },
  });
};
