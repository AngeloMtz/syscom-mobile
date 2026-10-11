// src/features/addresses/types.ts
// Forma de /profile/addresses tomada del código del backend (profile.service.ts y
// validation.ts); aún sin contrastar con una respuesta real. La dirección NO
// tiene teléfono, destinatario ni marca de "por defecto": el backend no los guarda.

export interface Address {
  id_direccion: number;
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  referencias: string | null;
  created_at: string;
}

export type AddressField =
  | "calle"
  | "colonia"
  | "ciudad"
  | "estado"
  | "codigo_postal"
  | "referencias";

/** Valores del formulario: siempre texto (las referencias vacías son ""). */
export interface AddressInput {
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  referencias: string;
}

/** Cuerpo de POST /profile/addresses y de PUT /profile/addresses/:id. */
export interface AddressPayload {
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  referencias?: string;
}

export type AddressErrors = Partial<Record<AddressField, string>>;
