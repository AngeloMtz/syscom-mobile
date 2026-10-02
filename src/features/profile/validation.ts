// src/features/profile/validation.ts
// Espejo de updateProfileSchema del backend. OJO: el nombre aquí admite 4–25
// caracteres, no 3–40 como en el registro — son dos schemas distintos y manda
// el del endpoint que se va a llamar.
import type { UpdateProfileDTO } from "./types";

export type ProfileErrors = Partial<Record<keyof UpdateProfileDTO, string>>;

export function validateProfile(datos: UpdateProfileDTO): ProfileErrors {
  const e: ProfileErrors = {};
  const nombre = datos.nombre.trim();
  const paterno = datos.apellido_paterno.trim();
  const materno = datos.apellido_materno.trim();

  if (nombre.length < 4) e.nombre = "El nombre debe tener al menos 4 caracteres";
  else if (nombre.length > 25) e.nombre = "El nombre no puede exceder 25 caracteres";

  if (paterno.length < 2) e.apellido_paterno = "Debe tener al menos 2 caracteres";
  else if (paterno.length > 100) e.apellido_paterno = "No puede exceder 100 caracteres";

  if (materno.length < 2) e.apellido_materno = "Debe tener al menos 2 caracteres";
  else if (materno.length > 100) e.apellido_materno = "No puede exceder 100 caracteres";

  if (!/^\d{10}$/.test(datos.telefono)) e.telefono = "El teléfono debe tener exactamente 10 dígitos";

  return e;
}
