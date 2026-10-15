// src/features/services/types.ts
// Shape real de /catalog/services (syscom-backend, client-services controller).
// El listado trae lo básico; el detalle (GET /catalog/services/:id) añade
// que_incluye, proceso y videos.

export interface ServiceCategory {
  id_categoria: number;
  nombre: string;
}

export interface ServiceImage {
  id?: number;
  url: string;
  es_principal?: boolean;
}

export interface ServiceListItem {
  id: number;
  nombre: string;
  slug?: string;
  descripcion?: string | null;
  precio_base?: number | null;
  precio_final?: number | null;
  porcentaje_descuento?: number;
  en_promocion?: boolean;
  duracion_estimada?: string | null;
  garantia_dias?: number | null;
  categoria?: ServiceCategory | null;
  imagen_principal?: string | null;
  imagenes?: ServiceImage[];
}

export interface ServiceStep {
  id: number;
  titulo: string;
  descripcion: string;
  orden?: number;
}

export interface ServiceInclude {
  id: number;
  descripcion: string;
  orden?: number;
}

export interface ServiceVideo {
  id: number;
  titulo: string;
  url: string;
  orden?: number;
}

/** Detalle de servicio: el listado más el contenido ampliado. */
export interface ServiceDetail extends ServiceListItem {
  que_incluye?: ServiceInclude[];
  proceso?: ServiceStep[];
  videos?: ServiceVideo[];
}

export interface ServicePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedServices {
  data: ServiceListItem[];
  pagination: ServicePagination;
}

/** Filtros del listado de servicios. */
export interface ServiceFilters {
  search?: string;
  limit?: number;
}
