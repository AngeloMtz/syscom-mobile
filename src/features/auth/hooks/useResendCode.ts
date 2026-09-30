// src/features/auth/hooks/useResendCode.ts
import { useMutation } from "@tanstack/react-query";

import { authRepository } from "@/features/auth/repositories/authRepository";
import type { CodeType } from "@/features/auth/types";

/** Reenvía el código de 6 dígitos (registro, 2FA o recuperación). */
export const useResendCode = () =>
  useMutation({
    mutationFn: ({ correo, type }: { correo: string; type: CodeType }) =>
      authRepository.resendCode(correo, type),
    retry: 0,
  });
