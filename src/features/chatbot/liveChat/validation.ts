// src/features/chatbot/liveChat/validation.ts — Reglas del chat en vivo.
// Mismos límites que el backend (chatInitSchema y chatMessageSchema).
import { EMAIL_RE } from "@/features/auth/validation";
import type { GuestData } from "@/features/chatbot/liveChat/types";

export const LIVE_MESSAGE_MAX = 1000;
export const GUEST_NAME_MAX = 100;
export const GUEST_EMAIL_MAX = 150;

export type GuestCheck =
  | { ok: true; guest: GuestData }
  | { ok: false; errors: { name?: string; email?: string } };

/** Nombre y correo que el backend exige a quien chatea sin cuenta. */
export function validateGuest(name: string, email: string): GuestCheck {
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const errors: { name?: string; email?: string } = {};

  if (cleanName.length === 0) errors.name = "Escribe tu nombre.";
  else if (cleanName.length > GUEST_NAME_MAX) errors.name = `El nombre no puede pasar de ${GUEST_NAME_MAX} caracteres.`;

  if (cleanEmail.length === 0) errors.email = "Escribe tu correo.";
  else if (!EMAIL_RE.test(cleanEmail)) errors.email = "Correo inválido.";
  else if (cleanEmail.length > GUEST_EMAIL_MAX) errors.email = `El correo no puede pasar de ${GUEST_EMAIL_MAX} caracteres.`;

  return errors.name || errors.email ? { ok: false, errors } : { ok: true, guest: { name: cleanName, email: cleanEmail } };
}

export type LiveMessageCheck = { ok: true; text: string } | { ok: false; error: string };

export function validateLiveMessage(raw: string): LiveMessageCheck {
  const text = raw.trim();
  if (text.length === 0) return { ok: false, error: "Escribe un mensaje." };
  if (text.length > LIVE_MESSAGE_MAX) {
    return { ok: false, error: `El mensaje no puede pasar de ${LIVE_MESSAGE_MAX} caracteres.` };
  }
  return { ok: true, text };
}
