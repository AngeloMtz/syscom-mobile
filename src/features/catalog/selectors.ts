// src/features/catalog/selectors.ts — Reglas de presentación sobre las categorías.

import type { Category } from "@/features/catalog/types";

/**
 * Categorías que se muestran en el catálogo: raíz y de productos. Mismo criterio
 * que la web (CategoriesSection): los servicios tienen su propio flujo y las
 * subcategorías se alcanzan al filtrar por su categoría raíz.
 */
export function selectRootProductCategories(categories: Category[]): Category[] {
  return categories.filter(
    (c) => c.tipo === "producto" && (c.es_padre === true || c.id_padre == null),
  );
}
