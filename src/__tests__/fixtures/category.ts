import type { Category } from "@/features/catalog/types";

/** Categoría raíz de productos. Cada llamada devuelve un objeto nuevo. */
export function makeCategory(over: Partial<Category> = {}): Category {
  return {
    id: 1,
    nombre: "Computadoras",
    descripcion: null,
    tipo: "producto",
    estado: "activa",
    imagen_url: null,
    es_padre: true,
    id_padre: null,
    cantidad_productos: 0,
    ...over,
  };
}
