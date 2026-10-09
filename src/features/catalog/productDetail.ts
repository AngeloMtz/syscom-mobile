// src/features/catalog/productDetail.ts — Reglas de presentación del detalle de producto.
// Funciones puras: no tocan la red ni React, así se prueban sin simular nada.
// No hay función de precio por variante: el backend no confirma que `precio_extra`
// se sume (precio_final y el carrito parten solo de precio_base), así que la app
// muestra `precio_final` tal cual lo entrega el servidor.

import type {
  ProductAttribute,
  ProductImage,
  ProductListItem,
  ProductVariant,
} from "@/features/catalog/types";

/** Id de la ruta /product/[id] como entero positivo; null si no es válido. */
export function parseProductId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Una variante se puede comprar si está activa y le queda stock. */
export function isVariantAvailable(variant: Pick<ProductVariant, "estado" | "stock">): boolean {
  return variant.estado === "activa" && Number(variant.stock) > 0;
}

/** Variante preseleccionada: la primera disponible; null si no hay ninguna. */
export function pickInitialVariant(variantes: ProductVariant[]): ProductVariant | null {
  return variantes.find(isVariantAvailable) ?? null;
}

/** Agotado: ninguna variante disponible (también sin variantes, como en la tarjeta). */
export function isProductSoldOut(product: Pick<ProductListItem, "variantes">): boolean {
  return !(product.variantes ?? []).some(isVariantAvailable);
}

/** URLs de la galería: la principal primero y el resto por `orden`; sin URLs vacías. */
export function getGalleryImageUrls(imagenes: ProductImage[] | undefined): string[] {
  return [...(imagenes ?? [])]
    .sort((a, b) => Number(b.es_principal) - Number(a.es_principal) || a.orden - b.orden)
    .map((i) => i.url)
    .filter((url) => Boolean(url));
}

export function formatStock(stock: number): string {
  if (!(stock > 0)) return "Agotado";
  return stock === 1 ? "1 disponible" : `${stock} disponibles`;
}

/**
 * Datos del descuento a mostrar (precio tachado y porcentaje). Solo con
 * promoción vigente y un precio final menor al base; si no, null.
 */
export function getDiscountInfo(
  product: Pick<ProductListItem, "en_promocion" | "precio_base" | "precio_final" | "porcentaje_descuento">,
): { precioAnterior: number; porcentaje: number | null } | null {
  if (!product.en_promocion || !(product.precio_base > product.precio_final)) return null;
  const porcentaje = Math.round(product.porcentaje_descuento);
  return { precioAnterior: product.precio_base, porcentaje: porcentaje > 0 ? porcentaje : null };
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * Descripción como texto plano. El backend la entrega como texto libre (hoy sin
 * HTML); por si algún día llega marcado se quitan las etiquetas, porque
 * <Text> mostraría el HTML literal. null si no queda contenido.
 */
export function cleanDescription(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const text = raw
    .replace(/\r\n?/g, "\n")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|nbsp|#39);/g, (e) => ENTITIES[e])
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text === "" ? null : text;
}

/** Atributos con nombre y valor; el valor lleva su unidad si la tiene. */
export function getVisibleAttributes(
  atributos: ProductAttribute[] | undefined,
): { nombre: string; valor: string }[] {
  return (atributos ?? []).flatMap((a) => {
    const nombre = a.nombre?.trim();
    const valor = a.valor?.trim();
    if (!nombre || !valor) return [];
    const unidad = a.unidad?.trim();
    return [{ nombre, valor: unidad ? `${valor} ${unidad}` : valor }];
  });
}
