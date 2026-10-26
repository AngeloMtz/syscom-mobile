// src/features/ar/types.ts
// Shape real de GET /catalog/products/:id/modelos-3d (syscom-backend, services/admin-models3d).
// El backend devuelve los modelos sin filtrar por formato: la app elige según
// la plataforma (glb en Android para Scene Viewer, usdz en iOS para Quick Look).

export type ModelFormat = "glb" | "usdz" | string;

export interface Product3DModel {
  id: number;
  url: string;
  formato: ModelFormat;
}

/** Modelos de un producto agrupados por plataforma. Lo que consume la pantalla. */
export interface ProductModels {
  /** Para Android (Scene Viewer) y para el visor 3D en WebView con <model-viewer>. */
  glb?: string;
  /** Para iOS (Quick Look). */
  usdz?: string;
}
