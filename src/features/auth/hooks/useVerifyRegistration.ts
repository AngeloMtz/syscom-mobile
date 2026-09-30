// src/features/auth/hooks/useVerifyRegistration.ts
import { useMutation } from "@tanstack/react-query";

import { authRepository } from "@/features/auth/repositories/authRepository";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * Confirma el registro con el código del correo. El backend hace auto-login y
 * devuelve user + token, así que la sesión nace aquí: el usuario entra directo
 * sin pasar de nuevo por el login.
 */
export const useVerifyRegistration = () => {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: ({ correo, code }: { correo: string; code: string }) =>
      authRepository.verifyRegistration(correo, code),
    retry: 0,
    onSuccess: async ({ user, token }) => {
      await setSession(user, token);
    },
  });
};
