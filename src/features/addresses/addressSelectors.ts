// src/features/addresses/addressSelectors.ts — Reglas de presentación de direcciones.
// Funciones puras: no tocan la red ni React.

import { canCheckout } from "@/features/cart/cartSelectors";
import type { CartResult } from "@/features/cart/types";
import type { Address, AddressInput } from "@/features/addresses/types";

/** "Calle y número, Colonia": para una fila corta. */
export function formatAddressLine(a: Address): string {
  return `${a.calle}, ${a.colonia}`;
}

/** Dirección completa en una línea. */
export function formatAddressFull(a: Address): string {
  return `${a.calle}, ${a.colonia}, ${a.ciudad}, ${a.estado}, C.P. ${a.codigo_postal}`;
}

const time = (a: Address): number => {
  const t = Date.parse(a.created_at);
  return Number.isNaN(t) ? 0 : t;
};

/** De la más reciente a la más antigua (a igual fecha, id mayor primero). No modifica la lista. */
export function sortByRecent(list: Address[]): Address[] {
  return [...list].sort((a, b) => time(b) - time(a) || b.id_direccion - a.id_direccion);
}

/**
 * Dirección para el envío: la elegida si sigue en la lista; si no (nunca se
 * eligió, se eliminó o el id era de otra cuenta), la más reciente. No hay
 * "dirección por defecto" en el backend.
 */
export function resolveSelectedAddress(
  addresses: Address[] | undefined,
  selectedId: number | null,
): Address | null {
  if (!addresses || addresses.length === 0) return null;
  return addresses.find((a) => a.id_direccion === selectedId) ?? sortByRecent(addresses)[0];
}

/** Lista sin la dirección indicada, para el borrado optimista. */
export function removeAddress(list: Address[] | undefined, id: number): Address[] {
  return (list ?? []).filter((a) => a.id_direccion !== id);
}

/** Valores iniciales del formulario al editar. */
export function addressToInput(a: Address): AddressInput {
  return {
    calle: a.calle,
    colonia: a.colonia,
    ciudad: a.ciudad,
    estado: a.estado,
    codigo_postal: a.codigo_postal,
    referencias: a.referencias ?? "",
  };
}

/**
 * Selector del pago (HU #13): carrito sin líneas bloqueantes y con una dirección
 * de envío. El botón de pago sigue deshabilitado hasta que exista el flujo.
 */
export function canProceedToPayment(cart: CartResult | undefined, address: Address | null): boolean {
  return address !== null && canCheckout(cart);
}
