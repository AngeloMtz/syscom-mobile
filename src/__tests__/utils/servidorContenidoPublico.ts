import type { Manejador } from "./enrutadorServidores";
import { ok } from "./integracion";

/**
 * Contenido público de relleno para montar el Inicio completo (HomeScreen) en una prueba de integración:
 * banners, categorías, marcas, destacados, servicios, contenido institucional y favoritos, todos VACÍOS.
 * Solo atiende GET; el catálogo de productos (que es lo que se prueba) lo pone `servidorTienda`.
 * Las formas salen de los repositories de la app (qué clave leen); no son respuestas reales del backend.
 */
export const contenidoPublicoVacio: Manejador = (config) => {
  if ((config.method ?? "get").toLowerCase() !== "get") return undefined;
  const ruta = config.url ?? "";

  if (["/institutional/sliders", "/catalog/categories", "/catalog/brands", "/catalog/featured"].includes(ruta)) {
    return ok(config, { data: [] });
  }
  if (ruta === "/catalog/services") {
    return ok(config, { data: [], pagination: { page: 1, limit: 6, total: 0, pages: 0 } });
  }
  if (ruta === "/institutional") return ok(config, { data: {} });
  if (ruta === "/favorites") {
    return ok(config, { data: [], meta: { nextCursor: null, hasMore: false, total: 0 } });
  }
  return undefined;
};
