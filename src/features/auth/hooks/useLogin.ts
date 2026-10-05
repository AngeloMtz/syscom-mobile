// src/features/auth/hooks/useLogin.ts
import { useMutation } from "@tanstack/react-query";

import { authRepository } from "@/features/auth/repositories/authRepository";
import type { LoginPayload, LoginResult } from "@/features/auth/types";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * Inicia sesión. Dos desenlaces según la cuenta:
 * - sin 2FA: el backend ya devolvió user + token, así que la sesión nace aquí.
 * - con 2FA: no hay sesión todavía; `requires2FA` indica que falta el código
 *   y la pantalla debe mandar al usuario a confirmarlo con useConfirm2FA.
 */
export const useLogin = () => {
  const setSession = useAuthStore((s) => s.setSession);

  const mutation = useMutation<LoginResult, unknown, LoginPayload>({
    mutationFn: authRepository.login,
    retry: 0,
    onSuccess: async (result) => {
      if (!result.requires2FA && result.user && result.token) {
        await setSession(result.user, result.token);
      }
    },
  });

  return {
    ...mutation,
    /** true cuando el backend cortó el login pidiendo el código 2FA. */
    requires2FA: mutation.data?.requires2FA ?? false,
    /** Correo al que se envió el código, para pasárselo a useConfirm2FA. */
    correo2FA: mutation.data?.correo,
  };
};
