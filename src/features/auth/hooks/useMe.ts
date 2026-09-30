// src/features/auth/hooks/useMe.ts
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { authRepository } from "@/features/auth/repositories/authRepository";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * Recupera el usuario de la sesión activa. Resuelve el hueco que deja hydrate():
 * tras reiniciar la app hay token pero `user` es null, porque el objeto no se
 * persiste. Depende de GET /auth/me, que el backend aún no expone.
 */
export const useMe = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ["me"],
    queryFn: authRepository.getMe,
    enabled: isAuthenticated,
    retry: 0,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  return query;
};
