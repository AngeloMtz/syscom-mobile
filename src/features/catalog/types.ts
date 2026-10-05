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
