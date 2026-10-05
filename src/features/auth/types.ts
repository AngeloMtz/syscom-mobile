// src/features/auth/types.ts — Autenticación.
// Los campos y sus reglas salen del validador Zod del backend
// (syscom-backend/src/modules/auth/validation.ts), que es quien valida de verdad.

export type UserRole = "usuario" | "admin" | "asistente";

export interface User {
  id_usuario: number;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo: string;
  telefono?: string | null;
  foto_perfil?: string | null;
  /** El backend lo manda como string; algunos endpoints lo anidan en un objeto. */
  rol?: UserRole | { nombre: UserRole } | null;
}

export interface LoginPayload {
  correo: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  telefono: string;
  password: string;
  confirmPassword: string;
}

/** El login puede cortarse pidiendo el código 2FA en vez de iniciar sesión. */
export interface LoginResult {
  requires2FA: boolean;
  correo?: string;
  user?: User;
  token?: string;
}

/** Tipos aceptados por POST /auth/resend-code. */
export type CodeType = "registration" | "password_reset" | "2fa_login";
