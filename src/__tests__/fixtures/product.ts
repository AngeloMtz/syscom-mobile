import type {
  PaginatedProducts,
  Pagination,
  ProductImage,
  ProductListItem,
  ProductVariant,
} from "@/features/catalog/types";

export function makeProductImage(over: Partial<ProductImage> = {}): ProductImage {
  return { id: 1, url: "https://example.com/producto-1.jpg", es_principal: true, orden: 1, ...over };
}

export function makeProductVariant(over: Partial<ProductVariant> = {}): ProductVariant {
  return { id: 1, nombre: "Estándar", precio_extra: 0, stock: 10, estado: "activa", ...over };
}

/** Producto de listado sin promoción. Los arreglos son nuevos en cada llamada. */
export function makeProduct(over: Partial<ProductListItem> = {}): ProductListItem {
  return {
    id: 1,
    sku: "SKU-001",
    nombre: "Laptop de prueba",
    slug: "laptop-de-prueba",
    marca: null,
    modelo: null,
    precio_base: 1000,
    condicion: "nuevo",
    estado: "activo",
    es_destacado: false,
    envio_gratis: false,
    imagenes: [makeProductImage()],
    variantes: [makeProductVariant()],
    categoria: { id: 1, nombre: "Computadoras" },
    precio_final: 1000,
    descuento: 0,
    porcentaje_descuento: 0,
    en_promocion: false,
    ...over,
  };
}

export function makePagination(over: Partial<Pagination> = {}): Pagination {
  return { page: 1, limit: 20, total: 1, pages: 1, ...over };
}

/** Respuesta de una página de productos del repository. */
export function makePaginatedProducts(
  over: Partial<PaginatedProducts> = {},
): PaginatedProducts {
  return { data: [makeProduct()], pagination: makePagination(), ...over };
}
