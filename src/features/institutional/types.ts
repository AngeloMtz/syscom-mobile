// src/features/institutional/types.ts
// Shape real de /institutional y /contact (syscom-backend). Los campos son
// opcionales porque el admin puede dejarlos vacíos en el panel.

export interface InstitutionalValue {
  titulo?: string;
  nombre?: string;
  descripcion?: string;
}

export interface BusinessHour {
  dia: string;
  apertura?: string;
  cierre?: string;
  cerrado?: boolean;
}

export interface InstitutionalContent {
  mision?: string | null;
  vision?: string | null;
  descripcion_empresa?: string | null;
  historia?: string | null;
  imagen_historia?: string | null;
  valores?: InstitutionalValue[] | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: Record<string, unknown> | string | null;
  horarios?: BusinessHour[] | null;
}

export interface Slider {
  id?: number;
  imagen_url?: string | null;
  imagen?: string | null;
  url_imagen?: string | null;
  titulo?: string;
}

export interface Faq {
  id_faq?: number;
  pregunta: string;
  respuesta: string;
}

export interface Policy {
  tipo: string;
  titulo: string;
  contenido: string;
}
