// src/features/auth/hooks/usePasswordRecovery.ts — Los tres pasos de la
// recuperación de contraseña. Ninguno crea sesión: al terminar se vuelve al login.
import { useMutation } from "@tanstack/react-query";

import { authRepository } from "@/features/auth/repositories/authRepository";

/** Paso 1: pide el código de recuperación al correo. */
export const useForgotPassword = () =>
  useMutation({
    mutationFn: (correo: string) => authRepository.forgotPassword(correo, "code"),
    retry: 0,
  });

/** Paso 2: valida el código recibido. */
export const useVerifyRecovery = () =>
  useMutation({
    mutationFn: ({ correo, code }: { correo: string; code: string }) =>
      authRepository.verifyRecovery(correo, code),
    retry: 0,
  });

/** Paso 3: fija la contraseña nueva. */
export const useResetPassword = () =>
  useMutation({
    mutationFn: (params: {
      correo: string;
      code: string;
      newPassword: string;
      confirmPassword: string;
    }) => authRepository.resetPassword(params),
    retry: 0,
  });
