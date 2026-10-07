// src/features/catalog/selectors.ts — Reglas de presentación sobre las categorías.

import type { Category, ProductListItem } from "@/features/catalog/types";

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

/** Imagen principal del producto (o la primera); undefined si no tiene ninguna. */
export function getPrincipalImageUrl(product: Pick<ProductListItem, "imagenes">): string | undefined {
  const imgs = product.imagenes ?? [];
  return (imgs.find((i) => i.es_principal) ?? imgs[0])?.url || undefined;
}

/** Stock sumado de todas las variantes; el backend no entrega un total. */
export function getTotalStock(product: Pick<ProductListItem, "variantes">): number {
  return (product.variantes ?? []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}
