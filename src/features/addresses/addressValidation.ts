// src/features/addresses/addressValidation.ts — Espejo de createAddressSchema del backend
// (syscom-backend/src/modules/profile/validation.ts) y de su sanitización
// (utils/sanitize.ts): el backend limpia el texto y DESPUÉS mide los largos.

import type { AddressErrors, AddressInput, AddressPayload } from "@/features/addresses/types";

/** Lo que el backend rechaza con 400 "Se detectaron caracteres no permitidos". */
export function hasDangerousContent(value: string): boolean {
  return /<[^>]*>/.test(value) || /javascript:/i.test(value) || /on\w+\s*=/i.test(value);
}

/** Misma limpieza que `sanitizeString` del backend. */
export function sanitizeAddressField(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

const FORBIDDEN = "Este campo contiene caracteres no permitidos";

const TEXT_RULES = [
  { field: "calle", min: 5, max: 150, who: "La calle" },
  { field: "colonia", min: 3, max: 100, who: "La colonia" },
  { field: "ciudad", min: 3, max: 100, who: "La ciudad" },
  { field: "estado", min: 3, max: 100, who: "El estado" },
] as const;

/** Errores por campo con las reglas y los mensajes del backend. Sin errores → `{}`. */
export function validateAddress(input: AddressInput): AddressErrors {
  const errors: AddressErrors = {};

  for (const { field, min, max, who } of TEXT_RULES) {
    const raw = input[field];
    if (hasDangerousContent(raw)) {
      errors[field] = FORBIDDEN;
      continue;
    }
    const value = sanitizeAddressField(raw);
    if (value.length < min) errors[field] = `${who} debe tener al menos ${min} caracteres`;
    else if (value.length > max) errors[field] = `${who} no puede exceder ${max} caracteres`;
  }

  if (hasDangerousContent(input.codigo_postal) || !/^\d{5}$/.test(sanitizeAddressField(input.codigo_postal))) {
    errors.codigo_postal = "El código postal debe tener exactamente 5 dígitos";
  }

  if (hasDangerousContent(input.referencias)) {
    errors.referencias = FORBIDDEN;
  } else if (sanitizeAddressField(input.referencias).length > 255) {
    errors.referencias = "Las referencias no pueden exceder 255 caracteres";
  }

  return errors;
}

const clean = (input: AddressInput) => ({
  calle: sanitizeAddressField(input.calle),
  colonia: sanitizeAddressField(input.colonia),
  ciudad: sanitizeAddressField(input.ciudad),
  estado: sanitizeAddressField(input.estado),
  codigo_postal: sanitizeAddressField(input.codigo_postal),
  referencias: sanitizeAddressField(input.referencias),
});

/** Cuerpo para crear: las referencias vacías se omiten. */
export function toCreatePayload(input: AddressInput): AddressPayload {
  const { referencias, ...rest } = clean(input);
  return referencias === "" ? rest : { ...rest, referencias };
}

/** Cuerpo para editar: las referencias vacías se envían ("") para borrarlas. */
export function toUpdatePayload(input: AddressInput): AddressPayload {
  return clean(input);
}
