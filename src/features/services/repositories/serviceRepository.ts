// src/features/services/repositories/serviceRepository.ts — Acceso a /catalog/services.
// Endpoint público y paginado (page/limit). Única capa que conoce las rutas y la
// forma de la respuesta ({ success, data, pagination }).
import api from "@/shared/api/client";
import type { PaginatedServices, ServiceDetail, ServiceFilters } from "@/features/services/types";

export const SERVICES_PAGE_SIZE = 12;

export const serviceRepository = {
  /**
   * Una página de servicios. Con `search` consulta /catalog/services/search
   * (busca también en la descripción); sin texto, el listado completo.
   */
  getPage: (filters: ServiceFilters, page: number): Promise<PaginatedServices> => {
    const q = filters.search?.trim();
    const limit = filters.limit ?? SERVICES_PAGE_SIZE;
    const ruta = q ? "/catalog/services/search" : "/catalog/services";
    const params = q ? { q, page, limit } : { page, limit };
    return api.get(ruta, { params }).then((r) => ({
      data: Array.isArray(r.data?.data) ? r.data.data : [],
      pagination: r.data?.pagination ?? { page, limit, total: 0, pages: 0 },
    }));
  },

  /** Detalle de un servicio. 404 → null para que la pantalla muestre "no encontrado". */
  getById: (id: number): Promise<ServiceDetail | null> =>
    api.get(`/catalog/services/${id}`).then(
      (r) => (r.data?.data as ServiceDetail) ?? null,
      (error) => {
        if (error?.response?.status === 404) return null;
        throw error;
      },
    ),
};
