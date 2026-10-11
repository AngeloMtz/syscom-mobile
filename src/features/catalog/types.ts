// src/features/catalog/types.ts
// Shape real de GET /catalog/categories (syscom-backend, categories.controller).
// Lista plana: las subcategorías traen `id_padre`; las raíz traen `es_padre: true`.

export interface Category {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: "producto" | "servicio";
  estado: string;
  imagen_url: string | null;
  es_padre: boolean;
  id_padre: number | null;
  /** Conteo directo: una categoría raíz puede marcar 0 aunque sus hijas tengan productos. */
  cantidad_productos: number;
}

export interface ProductImage {
  id: number;
  url: string;
  es_principal: boolean;
  orden: number;
}

export interface ProductVariant {
  id: number;
  nombre: string;
  precio_extra: number;
  stock: number;
  estado: string;
}

export interface BrandInfo {
  id: number;
  nombre: string;
  slug: string;
  logo_url: string | null;
}

/**
 * Producto de un listado (GET /catalog/products). Los precios con promoción ya
 * vienen calculados por el servidor: la app los muestra y no los recalcula.
 */
export interface ProductListItem {
  id: number;
  sku: string;
  nombre: string;
  slug: string;
  marca: BrandInfo | null;
  modelo: string | null;
  precio_base: number;
  condicion: "nuevo" | "usado" | "reacondicionado";
  estado: string;
  es_destacado: boolean;
  envio_gratis: boolean;
  imagenes: ProductImage[];
  variantes: ProductVariant[];
  categoria: { id: number; nombre: string } | null;
  precio_final: number;
  descuento: number;
  porcentaje_descuento: number;
  en_promocion: boolean;
}

export interface ProductAttribute {
  id: number;
  nombre: string;
  valor: string;
  grupo: string;
  unidad: string | null;
}

/**
 * Producto de GET /catalog/products/:id. Suma al de listado la descripción,
 * los atributos y la garantía. `variantes` trae solo las activas.
 */
export interface ProductDetail extends ProductListItem {
  tipo_producto: string;
  descripcion: string | null;
  atributos: ProductAttribute[];
  garantia_duracion: string | null;
  garantia_tipo: string | null;
  garantia_extendida: boolean;
  envio_dias_estimados: string | null;
  promocion_id: number | null;
  promocion_nombre: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedProducts {
  data: ProductListItem[];
  pagination: Pagination;
}

/** Filtros que acepta GET /catalog/products. */
export interface ProductFilters {
  categoria?: number;
  search?: string;
  precioMin?: number;
  precioMax?: number;
  ordenar?: "relevancia" | "precio_asc" | "precio_desc" | "nombre" | "nuevo";
  limit?: number;
}
