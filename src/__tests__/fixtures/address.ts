import type { Address, AddressInput } from "@/features/addresses/types";

// Forma tomada del código del backend (profile.service.ts, GET /profile/addresses);
// pendiente de contrastar con una respuesta real.

export function makeAddress(over: Partial<Address> = {}): Address {
  return {
    id_direccion: 1,
    calle: "Av. Juárez 123",
    colonia: "Centro",
    ciudad: "Huejutla",
    estado: "Hidalgo",
    codigo_postal: "43000",
    referencias: null,
    created_at: "2026-10-01T12:00:00.000Z",
    ...over,
  };
}

/** Valores del formulario, todos válidos. */
export function makeAddressInput(over: Partial<AddressInput> = {}): AddressInput {
  return {
    calle: "Av. Juárez 123",
    colonia: "Centro",
    ciudad: "Huejutla",
    estado: "Hidalgo",
    codigo_postal: "43000",
    referencias: "",
    ...over,
  };
}
