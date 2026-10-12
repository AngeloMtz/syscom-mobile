// src/features/payments/paymentStore.ts — Estado compartido del pago (Zustand).
// Solo en memoria: no se guarda el PaymentIntent en el dispositivo. Permite que
// el carrito se bloquee a nivel de pantalla mientras se paga o se confirma el
// pedido, y que /checkout retome un pago pendiente si se sale y se vuelve.
import { create } from "zustand";

interface PaymentStoreState {
  /** El carrito no debe editarse (pago en curso o pedido sin confirmar). */
  locked: boolean;
  /** PaymentIntent ya pagado cuyo pedido aún no aparece. */
  pendingPaymentIntentId: string | null;
  setLock: (locked: boolean, pendingPaymentIntentId: string | null) => void;
}

export const usePaymentStore = create<PaymentStoreState>((set) => ({
  locked: false,
  pendingPaymentIntentId: null,
  setLock: (locked, pendingPaymentIntentId) => set({ locked, pendingPaymentIntentId }),
}));
