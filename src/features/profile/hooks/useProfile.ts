// src/features/profile/hooks/useProfile.ts
import { useQuery } from "@tanstack/react-query";

import { profileRepository } from "@/features/profile/repositories/profileRepository";
import { useAuthStore } from "@/shared/store/authStore";

/** Perfil del usuario autenticado. Solo consulta si hay sesión. */
export const useProfile = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["profile"],
    queryFn: profileRepository.get,
    enabled: isAuthenticated,
  });
};
