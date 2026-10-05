// src/features/auth/validation.ts — Validación de formularios de sesión.
// Espejo del validador Zod del backend, que es el que valida de verdad
// (syscom-backend/src/modules/auth/validation.ts). Aquí solo se evita el
// viaje de red obvio.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reglas del backend, en el mismo orden en que se muestran al usuario. */
export const PASSWORD_RULES = [
  { label: "8 caracteres o más", test: (p: string) => p.length >= 8 },
  { label: "Una mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Una minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Un número", test: (p: string) => /\d/.test(p) },
  { label: "Un símbolo @$!%*?&#/", test: (p: string) => /[@$!%*?&#/]/.test(p) },
];

export const passwordIsValid = (password: string): boolean =>
  PASSWORD_RULES.every((r) => r.test(password));

/** Valida el correo con las reglas del backend: formato y largo máximo. */
export function validateEmail(correo: string): string | undefined {
  if (!correo) return "El correo es requerido";
  if (!EMAIL_RE.test(correo)) return "Formato de correo inválido";
  if (correo.length > 150) return "El correo es demasiado largo";
  return undefined;
}
