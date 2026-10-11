import api from "@/shared/api/client";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

/**
 * Reemplaza el adapter de la instancia de Axios por uno falso: los interceptores
 * corren de verdad, pero ninguna petición sale a la red. Llamar una vez por
 * archivo de prueba (a nivel de módulo) y resetear `adapter` en beforeEach.
 */
export function crearAxiosFalso() {
  const adapter = jest.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>();

  beforeAll(() => {
    api.defaults.adapter = adapter;
  });

  /** Responde la próxima petición con la envoltura del backend { success, ...cuerpo }. */
  function responde(cuerpo: Record<string, unknown>) {
    adapter.mockImplementationOnce(
      async (config) =>
        ({
          data: { success: true, ...cuerpo },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }) as AxiosResponse,
    );
  }

  /** Última petición recibida, con el cuerpo ya convertido a objeto. */
  function ultimaPeticion() {
    const config = adapter.mock.calls[adapter.mock.calls.length - 1][0] as InternalAxiosRequestConfig;
    const cuerpo = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    return { metodo: config.method, ruta: config.url, params: config.params, cuerpo };
  }

  return { adapter, responde, ultimaPeticion };
}
