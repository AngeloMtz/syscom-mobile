// src/features/services/hooks/useService.ts
import { useQuery } from "@tanstack/react-query";

import { serviceRepository } from "@/features/services/repositories/serviceRepository";

/** Convierte el id de la ruta a número; null si no es válido. */
function parseServiceId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Detalle de un servicio por el id de la ruta. Con un id inválido no consulta;
 * un 404 llega como `null` desde el repository y se expone como `notFound`.
 */
export const useService = (rawId: string | string[] | undefined) => {
  const id = parseServiceId(rawId);
  const query = useQuery({
    queryKey: ["service", id],
    queryFn: () => serviceRepository.getById(id as number),
    enabled: id !== null,
  });
  return { ...query, notFound: id === null || (query.isSuccess && query.data === null) };
};
