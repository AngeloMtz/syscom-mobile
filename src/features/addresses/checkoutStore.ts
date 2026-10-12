// src/features/addresses/checkoutStore.ts — Dirección elegida para el envío (Zustand).
// Solo en memoria: no se guarda en disco. Si la elegida ya no existe (o es de
// otra cuenta), resolveSelectedAddress cae a la más reciente; por eso no hace
// falta limpiarla al cerrar sesión. La HU #13 usará el id resuelto como
// `id_direccion` en POST /payments/checkout.
import { create } from "zustand";

interface CheckoutState {
  selectedAddressId: number | null;
  selectAddress: (id: number | null) => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  selectedAddressId: null,
  selectAddress: (id) => set({ selectedAddressId: id }),
}));
