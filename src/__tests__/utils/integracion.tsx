import { QueryClient, QueryClientProvider, notifyManager } from "@tanstack/react-query";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { ReactNode } from "react";

/**
 * Apoyo de las pruebas de integración. Las piezas (Axios con sus interceptores,
 * repository, hook y caché de TanStack Query) son las reales; solo el adapter de
 * Axios es falso, así que nada sale a la red ni toca producción.
 */

/** QueryClient de integración: sin reintentos y sin temporizadores de limpieza largos. */
export function crearClienteIntegracion() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

/**
 * Cada prueba obtiene su propio QueryClient (beforeEach) que se vacía al terminar
 * (afterEach). Llamar una vez por archivo. Devuelve el wrapper para renderHook y
 * `cliente()` para inspeccionar la caché.
 */
export function usarClientePorPrueba() {
  let client: QueryClient;

  // TanStack Query avisa con setTimeout(0): en pruebas se notifica de inmediato
  // para que los cambios ocurran dentro de act().
  beforeAll(() => {
    notifyManager.setScheduler((callback) => callback());
  });
  afterAll(() => {
    notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  });
  beforeEach(() => {
    client = crearClienteIntegracion();
  });
  afterEach(() => {
    client.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { wrapper, cliente: () => client };
}

/** Respuesta 2xx con la envoltura del backend { success: true, ...cuerpo }. */
export function ok(
  config: InternalAxiosRequestConfig,
  cuerpo: Record<string, unknown>,
  status = 200,
): AxiosResponse {
  return {
    data: { success: true, ...cuerpo },
    status,
    statusText: "OK",
    headers: {},
    config,
  } as AxiosResponse;
}
