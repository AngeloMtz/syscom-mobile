import type { LoginPayload, RegisterPayload } from "@/features/auth/types";

export function makeLoginPayload(over: Partial<LoginPayload> = {}): LoginPayload {
  return { correo: "ana@example.com", password: "Password1!", ...over };
}

export function makeRegisterPayload(over: Partial<RegisterPayload> = {}): RegisterPayload {
  return {
    nombre: "Ana",
    apellido_paterno: "Pérez",
    apellido_materno: "López",
    correo: "ana@example.com",
    telefono: "7711234567",
    password: "Password1!",
    confirmPassword: "Password1!",
    ...over,
  };
}
