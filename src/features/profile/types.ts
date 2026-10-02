// src/features/profile/types.ts
// Shape real de GET /profile (syscom-backend/src/modules/profile/profile.service.ts).
import type { UserRole } from "@/features/auth/types";

export interface Profile {
  id_usuario: number;
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  correo: string;
  telefono: string | null;
  email_verified: boolean;
  fecha_registro: string | null;
  foto_perfil: string | null;
  rol: UserRole | string;
  two_factor_enabled: boolean;
}

/** Campos que acepta PUT /profile. El correo no se puede modificar. */
export interface UpdateProfileDTO {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  telefono: string;
}
