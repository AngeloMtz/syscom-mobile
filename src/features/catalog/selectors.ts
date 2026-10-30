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

/** Tamaño de página y tope del recorrido que arma la lista de promociones. */
export const ON_SALE_PAGE_SIZE = 100;
/**
 * Límite conocido: el backend no filtra por `en_promocion`, así que la lista se arma
 * recorriendo el catálogo (como la web). Con 10 páginas de 100 solo se revisan los
 * primeros 1000 productos; si el catálogo crece más, las ofertas del resto no aparecen
 * hasta que el servidor ofrezca ese filtro.
 */
export const ON_SALE_MAX_PAGES = 10;

/**
 * Productos con una promoción que de verdad rebaja el precio, de mayor a menor
 * descuento. El orden entre descuentos iguales se conserva.
 */
export function selectOnSale(products: ProductListItem[]): ProductListItem[] {
  return products
    .filter((p) => p.en_promocion && p.precio_final < p.precio_base)
    .sort((a, b) => b.porcentaje_descuento - a.porcentaje_descuento);
}
