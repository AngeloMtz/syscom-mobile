import type { User } from "@/features/auth/types";
import type { Profile, UpdateProfileDTO } from "@/features/profile/types";

export function makeUser(over: Partial<User> = {}): User {
  return {
    id_usuario: 1,
    nombre: "Ana",
    apellido_paterno: "Pérez",
    apellido_materno: "López",
    correo: "ana@example.com",
    telefono: "7711234567",
    foto_perfil: null,
    rol: "usuario",
    ...over,
  };
}

export function makeProfile(over: Partial<Profile> = {}): Profile {
  return {
    id_usuario: 1,
    nombre: "Ana",
    apellido_paterno: "Pérez",
    apellido_materno: "López",
    correo: "ana@example.com",
    telefono: "7711234567",
    email_verified: true,
    fecha_registro: "2026-01-01T00:00:00.000Z",
    foto_perfil: null,
    rol: "usuario",
    two_factor_enabled: false,
    ...over,
  };
}

/** Datos que acepta PUT /profile. */
export function makeUpdateProfileDTO(over: Partial<UpdateProfileDTO> = {}): UpdateProfileDTO {
  return {
    nombre: "Ana María",
    apellido_paterno: "Pérez",
    apellido_materno: "López",
    telefono: "7717654321",
    ...over,
  };
}
