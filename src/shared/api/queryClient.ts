// src/shared/api/queryClient.ts — Instancia única de TanStack Query.
// Vive fuera del componente para que no se recree en cada render.
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // En móvil la red falla de formas transitorias (cambio de wifi a datos),
      // pero reintentar de más deja al usuario esperando sin feedback.
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 min: el catálogo no cambia cada segundo
      refetchOnReconnect: true,
    },
    mutations: {
      // Un login o un registro no se reintentan solos: el usuario decide.
      retry: 0,
    },
  },
});
