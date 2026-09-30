// src/features/auth/hooks/useConfirm2FA.ts
import { useMutation } from "@tanstack/react-query";

import { authRepository } from "@/features/auth/repositories/authRepository";
import { useAuthStore } from "@/shared/store/authStore";

/** Segundo paso del login con 2FA: aquí nace la sesión de las cuentas con 2FA. */
export const useConfirm2FA = () => {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: ({ correo, code }: { correo: string; code: string }) =>
      authRepository.confirm2FA(correo, code),
    retry: 0,
    onSuccess: async ({ user, token }) => {
      await setSession(user, token);
    },
  });
};
