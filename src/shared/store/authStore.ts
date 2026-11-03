// src/shared/store/authStore.ts — Estado de sesión (Zustand).
// Reemplaza al AuthContext del proyecto anterior. Solo estado de cliente:
// las llamadas HTTP viven en features/auth/repositories.
import { create } from "zustand";

import { setSessionExpiredHandler } from "@/shared/api/client";
import { queryClient } from "@/shared/api/queryClient";
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
    // Otra cuenta podría entrar en este dispositivo: sus consultas no deben ver
    // la caché de la anterior ("me", "profile", etc.).
    queryClient.clear();
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

// Cuando el servidor dice que la sesión caducó (401, o 403 «Token inválido o expirado»), el cliente
// HTTP llama a esto: se cierra la sesión y RequireAuth saca al usuario al login. Se registra aquí
// (y no al revés) para que client.ts no importe el store.
setSessionExpiredHandler(() => useAuthStore.getState().logout());
