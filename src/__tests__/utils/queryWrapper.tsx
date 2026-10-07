import { QueryClient, QueryClientProvider, notifyManager } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * Cliente de TanStack Query para pruebas: sin reintentos (un error falla de
 * inmediato) y con gcTime Infinity (sin temporizadores de limpieza que dejen
 * vivo el proceso de Jest).
 */
export function crearQueryClientDePrueba() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
}

/**
 * Registra en el archivo de prueba que la llamó un cliente nuevo por prueba
 * (beforeEach) y su limpieza (afterEach), y devuelve el wrapper para renderHook.
 * Llamar una vez, a nivel de módulo o dentro de un describe.
 */
export function usarQueryWrapper() {
  let client: QueryClient;

  // TanStack Query avisa a los componentes con setTimeout(0), es decir, después
  // de que act() termina: React se queja y el estado llega tarde. En pruebas se
  // notifica de inmediato para que los cambios ocurran dentro de act().
  beforeAll(() => {
    notifyManager.setScheduler((callback) => callback());
  });

  afterAll(() => {
    notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  });

  beforeEach(() => {
    client = crearQueryClientDePrueba();
  });

  afterEach(() => {
    client.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { wrapper };
}
