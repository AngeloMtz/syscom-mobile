// src/features/profile/hooks/useDeleteAccount.ts
import { useMutation } from "@tanstack/react-query";

import { endLocalSession } from "@/features/auth/hooks/useLogout";
import { profileRepository } from "@/features/profile/repositories/profileRepository";

/**
 * Elimina la cuenta y termina la sesión en este dispositivo. No desregistra el
 * token de push: el backend ya lo borró y esa llamada respondería 401. Sin
 * reintentos: la eliminación es irreversible y la decide el usuario.
 */
export const useDeleteAccount = () =>
  useMutation<void, unknown, string>({
    mutationFn: (password) => profileRepository.deleteAccount(password),
    retry: 0,
    onSuccess: endLocalSession,
  });
