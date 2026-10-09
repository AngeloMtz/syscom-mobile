// src/features/catalog/searchFilters.ts — De lo que escribe el usuario a ProductFilters.
import type { ProductFilters } from "@/features/catalog/types";
import { validatePriceRange } from "@/features/catalog/validation";

export type SearchCriteria = {
  texto: string;
  minTxt: string;
  maxTxt: string;
  categoria?: number;
};

/**
 * Arma los filtros para la API. Omite lo vacío (sin claves en undefined) y, si
 * el rango de precios es inválido, no envía ningún precio.
 */
export function buildProductFilters({ texto, minTxt, maxTxt, categoria }: SearchCriteria): ProductFilters {
  const filters: ProductFilters = {};

  const search = texto.trim();
  if (search) filters.search = search;
  if (categoria !== undefined) filters.categoria = categoria;

  const { precioMin, precioMax } = validatePriceRange(minTxt, maxTxt);
  if (precioMin !== undefined) filters.precioMin = precioMin;
  if (precioMax !== undefined) filters.precioMax = precioMax;

  return filters;
}

/** Hay criterio de búsqueda con texto, categoría o cualquier precio (0 incluido). */
export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    Boolean(filters.search) ||
    filters.categoria !== undefined ||
    filters.precioMin !== undefined ||
    filters.precioMax !== undefined
  );
}
