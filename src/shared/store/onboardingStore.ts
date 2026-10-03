// src/shared/store/onboardingStore.ts — Estado del onboarding (Zustand).
// Paralelo a authStore: estado de cliente, sin HTTP. Decide si la bienvenida
// debe mostrarse al abrir la app.
import { create } from "zustand";

import { isOnboardingCompleted, setOnboardingCompleted } from "@/shared/storage/onboarding";

interface OnboardingState {
  /** true mientras se lee el flag guardado; evita parpadear la bienvenida. */
  isChecking: boolean;
  completed: boolean;
  hydrate: () => Promise<void>;
  /** Marca la bienvenida como vista y libera el arranque normal. */
  complete: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isChecking: true,
  completed: false,

  hydrate: async () => {
    set({ isChecking: true });
    const completed = await isOnboardingCompleted();
    set({ completed, isChecking: false });
  },

  complete: async () => {
    await setOnboardingCompleted();
    set({ completed: true });
  },
}));
