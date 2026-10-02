// src/features/profile/hooks/useUpdateProfile.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { profileRepository } from "@/features/profile/repositories/profileRepository";
import type { Profile, UpdateProfileDTO } from "@/features/profile/types";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * Guarda los datos personales. Al terminar refresca el perfil y ['me'], y
 * actualiza el usuario del store para que el resto de la app vea el cambio
 * sin esperar un refetch.
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<Profile, unknown, UpdateProfileDTO>({
    mutationFn: profileRepository.update,
    retry: 0,
    onSuccess: (perfil) => {
      queryClient.setQueryData(["profile"], perfil);
      queryClient.invalidateQueries({ queryKey: ["me"] });

      setUser({
        ...(user ?? {}),
        id_usuario: perfil.id_usuario,
        nombre: perfil.nombre,
        apellido_paterno: perfil.apellido_paterno,
        apellido_materno: perfil.apellido_materno,
        correo: perfil.correo,
        telefono: perfil.telefono,
      });
    },
  });
};
