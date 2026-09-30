// src/features/auth/hooks/useRegister.ts
import { useMutation } from "@tanstack/react-query";

import { authRepository } from "@/features/auth/repositories/authRepository";
import type { RegisterPayload } from "@/features/auth/types";

/**
 * Crea la cuenta. No inicia sesión: el backend manda un código de 6 dígitos
 * al correo y la cuenta queda inactiva hasta verificarlo.
 */
export const useRegister = () =>
  useMutation<void, unknown, RegisterPayload>({
    mutationFn: authRepository.register,
    retry: 0,
  });
