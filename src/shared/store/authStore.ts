// src/shared/store/authStore.ts — Estado de sesión (Zustand).
// Reemplaza al AuthContext del proyecto anterior. Solo estado de cliente:
// las llamadas HTTP viven en features/auth/repositories.
import { create } from "zustand";

import { clearToken, getTokenSync, restoreToken, saveToken } from "@/shared/api/secureToken";
import type { User } from "@/features/auth/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** true mientras se restaura el token guardado al abrir la app. */
  isHydrating: boolean;
  setSession: (user: User, token: string) => Promise<void>;
  /** Rellena el usuario sin tocar el token (lo usa useMe tras rehidratar). */
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrating: true,

  setSession: async (user, token) => {
    await saveToken(token);
    set({ user, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await clearToken();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    set({ isHydrating: true });
    await restoreToken();
    // El usuario no se rehidrata: recuperarlo exige HTTP (Fase 3). Aquí la
    // sesión se reconoce por la presencia del token.
    set({ isAuthenticated: !!getTokenSync(), isHydrating: false });
  },
}));
