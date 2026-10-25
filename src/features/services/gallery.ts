// src/features/services/gallery.ts — Matemática del zoom de la galería de imágenes.
// Funciones puras (sin React ni gestos): el componente solo las llama.

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
/** Zoom al que salta el doble toque. */
export const DOUBLE_TAP_ZOOM = 2.5;
/** Cuánto cambia el zoom con cada toque de los botones + / −. */
export const ZOOM_STEP = 0.75;

type Touch = { pageX: number; pageY: number };

/** Mantiene el zoom dentro de [MIN_ZOOM, MAX_ZOOM]. */
export function clampScale(scale: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
}

/** Distancia en píxeles entre dos dedos. */
export function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

/**
 * Zoom resultante de un pellizco: el zoom con el que empezó el gesto, escalado
 * por cuánto se abrieron o cerraron los dedos. Sin distancia inicial no cambia.
 */
export function nextScaleFromPinch(baseScale: number, startDistance: number, currentDistance: number): number {
  if (startDistance <= 0) return clampScale(baseScale);
  return clampScale(baseScale * (currentDistance / startDistance));
}

/**
 * Limita el desplazamiento para que la imagen ampliada no deje huecos: con
 * zoom 1 no hay desplazamiento; con más zoom, hasta la mitad de lo que sobresale.
 */
export function clampTranslation(value: number, scale: number, size: number): number {
  const limit = Math.max(0, ((scale - 1) * size) / 2);
  // "+ 0" normaliza el -0 que sale al topar con límite 0.
  return Math.min(limit, Math.max(-limit, value)) + 0;
}

/** Doble toque: si ya está ampliada vuelve a 1; si no, salta al zoom de doble toque. */
export function toggleZoomScale(scale: number): number {
  return scale > MIN_ZOOM ? MIN_ZOOM : DOUBLE_TAP_ZOOM;
}

/** Zoom tras tocar + (direction 1) o − (direction -1). */
export function stepZoom(scale: number, direction: 1 | -1): number {
  return clampScale(scale + direction * ZOOM_STEP);
}
