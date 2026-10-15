// src/features/institutional/types.ts
// Para #104: banners (sliders) del home y el teléfono para el CTA de contacto.
// El resto del contenido institucional llega en su propia HU.

export interface Slider {
  id?: number;
  imagen_url?: string | null;
  imagen?: string | null;
  url_imagen?: string | null;
  titulo?: string;
}

export interface InstitutionalContent {
  telefono?: string | null;
  correo?: string | null;
  direccion?: Record<string, unknown> | string | null;
}
