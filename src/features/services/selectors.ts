// src/features/services/selectors.ts — Reglas de presentación de servicios.
import type { ServiceListItem } from "@/features/services/types";
import { resolveAssetUrl } from "@/shared/utils/url";

/** Imagen a mostrar: la principal o la primera; undefined si no hay ninguna. */
export function getServiceImageUrl(
  service: Pick<ServiceListItem, "imagen_principal" | "imagenes">,
): string | undefined {
  return resolveAssetUrl(service.imagen_principal ?? service.imagenes?.[0]?.url);
}

/** Precio a mostrar: el final si existe, si no el base; null si no hay. */
export function getServicePrice(service: Pick<ServiceListItem, "precio_base" | "precio_final">): number | null {
  return service.precio_final ?? service.precio_base ?? null;
}

/**
 * Todas las imágenes del servicio, sin repetidas y con la principal al frente.
 * Es la lista que recorre la galería del detalle.
 */
export function getServiceGalleryUrls(
  service: Pick<ServiceListItem, "imagen_principal" | "imagenes">,
): string[] {
  const principal = resolveAssetUrl(service.imagen_principal);
  const todas = (service.imagenes ?? [])
    .map((img) => resolveAssetUrl(img.url))
    .filter((u): u is string => !!u);
  const unicas = Array.from(new Set(todas));
  return principal ? [principal, ...unicas.filter((u) => u !== principal)] : unicas;
}
