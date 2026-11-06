// src/features/profile/repositories/profileRepository.ts — Acceso a /profile.
// Todas las rutas van protegidas por el JWT que inyecta el client Singleton.
import type { AxiosInstance } from "axios";

import { ApiClient } from "@/shared/api/client";
import type { Profile, UpdateProfileDTO } from "@/features/profile/types";

/** Contrato: qué operaciones existen sobre el perfil, no cómo se hacen. */
export interface ProfileRepository {
  /** Perfil completo del usuario autenticado (incluye teléfono y foto). */
  get(): Promise<Profile>;
  /** Actualiza los datos personales. El correo no es editable en el backend. */
  update(payload: UpdateProfileDTO): Promise<Profile>;
}

/** Implementación sobre la API REST. Funciones flecha: los hooks pasan `get` y `update` sin el objeto. */
export class HttpProfileRepository implements ProfileRepository {
  constructor(private readonly http: AxiosInstance) {}

  get = (): Promise<Profile> => this.http.get("/profile").then((r) => r.data.data);

  update = (payload: UpdateProfileDTO): Promise<Profile> =>
    this.http.put("/profile", payload).then((r) => r.data.data);
}

export const profileRepository: ProfileRepository = new HttpProfileRepository(ApiClient.getInstance().http);
