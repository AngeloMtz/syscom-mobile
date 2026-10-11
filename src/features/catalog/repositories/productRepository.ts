// src/features/catalog/repositories/productRepository.ts — Acceso a /catalog/products.
// Endpoint público. El backend pagina con page/limit y devuelve
// { success, data: Producto[], pagination }.
import api from "@/shared/api/client";
import type { PaginatedProducts, ProductDetail, ProductFilters } from "@/features/catalog/types";

export const PRODUCTS_PAGE_SIZE = 20;

export const productRepository = {
  /**
   * Una página de productos. Con `categoria` el backend incluye también las
   * subcategorías, a diferencia de /categories/:id/products (solo la exacta).
   */
  getPage: (filters: ProductFilters, page: number): Promise<PaginatedProducts> =>
    api
      .get("/catalog/products", {
        params: {
          page,
          limit: filters.limit ?? PRODUCTS_PAGE_SIZE,
          categoria: filters.categoria,
          search: filters.search,
          precioMin: filters.precioMin,
          precioMax: filters.precioMax,
          ordenar: filters.ordenar,
        },
      })
      .then((r) => ({
        data: Array.isArray(r.data?.data) ? r.data.data : [],
        pagination: r.data?.pagination ?? { page, limit: PRODUCTS_PAGE_SIZE, total: 0, pages: 0 },
      })),

  /**
   * Detalle de un producto. El backend responde 404 si no existe o no está
   * activo: se devuelve null para que la pantalla muestre "no encontrado".
   */
  getById: (id: number): Promise<ProductDetail | null> =>
    api.get(`/catalog/products/${id}`).then(
      (r) => {
        if (!r.data?.data) throw new Error("La respuesta no incluye el producto");
        return r.data.data as ProductDetail;
      },
      (error) => {
        if (error?.response?.status === 404) return null;
        throw error;
      },
    ),
};
