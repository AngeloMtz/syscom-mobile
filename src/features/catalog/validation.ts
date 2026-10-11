// src/features/catalog/validation.ts — Validación del rango de precios del buscador.
// Formato de entrada coherente con formatPrice (es-MX): la coma separa miles y el
// punto es el único separador decimal. Funciones puras, sin dependencias de UI.

/** Tope razonable para un precio; evita valores absurdos que la API no espera. */
export const MAX_PRICE = 99_999_999;

export type ParsedPrice = { value?: number; error?: string };

export type PriceRangeResult = {
  precioMin?: number;
  precioMax?: number;
  errors: { min?: string; max?: string; rango?: string };
  valid: boolean;
};

const THOUSANDS = /^\d{1,3}(,\d{3})+(\.\d+)?$/;
const PLAIN = /^\d+(\.\d+)?$/;
const NEGATIVE = /^-\d[\d,]*(\.\d+)?$/;
const DIGITS_AND_COMMAS = /^\d[\d,]*(\.\d+)?$/;

/**
 * Convierte lo que escribe el usuario en un precio. Vacío no es error (campo
 * opcional); "1,500.50" vale 1500.5; la coma como decimal ("1500,5") se rechaza.
 */
export function parsePriceInput(text: string): ParsedPrice {
  const t = text.trim();
  if (t === "") return { value: undefined };

  if (NEGATIVE.test(t)) return { error: "El precio no puede ser negativo" };

  if (!THOUSANDS.test(t) && !PLAIN.test(t)) {
    return DIGITS_AND_COMMAS.test(t)
      ? { error: "Usa punto para los decimales (ej. 1500.50)" }
      : { error: "Escribe solo números" };
  }

  const value = Number(t.replace(/,/g, ""));
  if (value > MAX_PRICE) return { error: "El precio es demasiado grande" };
  return { value };
}

/**
 * Valida mínimo y máximo (ambos opcionales). Solo devuelve precios cuando todo
 * es válido: con cualquier error no se debe consultar con un rango a medias.
 */
export function validatePriceRange(minText: string, maxText: string): PriceRangeResult {
  const min = parsePriceInput(minText);
  const max = parsePriceInput(maxText);
  const errors: PriceRangeResult["errors"] = {};

  if (min.error) errors.min = min.error;
  if (max.error) errors.max = max.error;

  if (!errors.min && !errors.max && min.value !== undefined && max.value !== undefined && min.value > max.value) {
    errors.rango = "El mínimo no puede ser mayor que el máximo";
  }

  const valid = Object.keys(errors).length === 0;
  return {
    precioMin: valid ? min.value : undefined,
    precioMax: valid ? max.value : undefined,
    errors,
    valid,
  };
}
