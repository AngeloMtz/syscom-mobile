// src/features/ar/selectors.ts — Reglas de presentación de los modelos 3D.
// Funciones puras: no tocan la red ni React. Toda la lógica testeable del
// módulo de RA vive aquí.
import { Platform } from "react-native";

import { resolveAssetUrl } from "@/shared/utils/url";
import type { ModelFormat, Product3DModel, ProductModels } from "@/features/ar/types";

/**
 * Agrupa los modelos por formato y resuelve la URL (relativa → absoluta).
 * Si hay más de uno del mismo formato se queda con el primero.
 */
export function selectProductModels(modelos: Product3DModel[]): ProductModels {
  const result: ProductModels = {};
  for (const m of modelos) {
    const formato = (m.formato ?? "").toLowerCase() as ModelFormat;
    const url = resolveAssetUrl(m.url);
    if (!url) continue;
    if (formato === "glb" && !result.glb) result.glb = url;
    else if (formato === "usdz" && !result.usdz) result.usdz = url;
  }
  return result;
}

/**
 * ¿Hay RA real disponible en este dispositivo?
 * - iOS necesita .usdz (Quick Look).
 * - Android necesita .glb (Scene Viewer).
 * Si no hay el formato de la plataforma, se muestra el visor 3D sin el botón "Ver en tu espacio".
 */
export function isARAvailable(models: ProductModels, platform: typeof Platform.OS = Platform.OS): boolean {
  if (platform === "ios") return !!models.usdz;
  if (platform === "android") return !!models.glb;
  return false;
}

/** ¿Hay algo que mostrar? Con glb basta para el visor 3D (model-viewer en WebView). */
export function hasAnyModel(models: ProductModels): boolean {
  return !!models.glb || !!models.usdz;
}

/**
 * URL del Scene Viewer de Google (Android). Lanza la RA real sin salir de la
 * app usando el intent de Google.
 */
export function buildSceneViewerUrl(glbUrl: string, title?: string): string {
  const base = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbUrl)}&mode=ar_preferred`;
  return title ? `${base}&title=${encodeURIComponent(title)}` : base;
}
