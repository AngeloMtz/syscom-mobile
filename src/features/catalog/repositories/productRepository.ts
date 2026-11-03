// src/features/catalog/repositories/productRepository.ts — Acceso a /catalog/products.
// Endpoint público. El backend pagina con page/limit y devuelve
// { success, data: Producto[], pagination }.
import api from "@/shared/api/client";
import type {
  PaginatedProducts,
  ProductDetail,
  ProductFilters,
  ProductListItem,
} from "@/features/catalog/types";
import { ON_SALE_MAX_PAGES, ON_SALE_PAGE_SIZE, selectOnSale } from "@/features/catalog/selectors";

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
          id_marca: filters.id_marca,
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

  /** Productos destacados para el home (GET /catalog/featured). */
  getFeatured: (limit = 8): Promise<ProductListItem[]> =>
    api.get("/catalog/featured", { params: { limit } }).then((r) => {
      const data = r.data?.data;
      return Array.isArray(data) ? data : [];
    }),

  /**
   * Productos con promoción vigente. El backend no filtra por `en_promocion`, así que se
   * recorre el catálogo en páginas de 100 (como la web) hasta una página corta, con tope
   * de ON_SALE_MAX_PAGES. Los precios ya vienen calculados por el servidor.
   */
  getOnSale: async (): Promise<ProductListItem[]> => {
    const todos: ProductListItem[] = [];
    for (let page = 1; page <= ON_SALE_MAX_PAGES; page++) {
      const { data } = await productRepository.getPage({ limit: ON_SALE_PAGE_SIZE }, page);
      todos.push(...data);
      if (data.length < ON_SALE_PAGE_SIZE) break;
    }
    return selectOnSale(todos);
  },

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
