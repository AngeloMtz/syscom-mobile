// src/features/profile/repositories/profileRepository.ts — Acceso a /profile.
// Todas las rutas van protegidas por el JWT que inyecta el client Singleton.
import api from "@/shared/api/client";
import type { Profile, UpdateProfileDTO } from "@/features/profile/types";

export const profileRepository = {
  /** Perfil completo del usuario autenticado (incluye teléfono y foto). */
  get: (): Promise<Profile> => api.get("/profile").then((r) => r.data.data),

  /** Actualiza los datos personales. El correo no es editable en el backend. */
  update: (payload: UpdateProfileDTO): Promise<Profile> =>
    api.put("/profile", payload).then((r) => r.data.data),
};
