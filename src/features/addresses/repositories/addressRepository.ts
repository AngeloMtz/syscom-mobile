// src/features/addresses/repositories/addressRepository.ts — Acceso a /profile/addresses.
// Todas las rutas exigen sesión (Bearer, lo agrega el interceptor del cliente).
// El backend responde { success, data } y borra de forma lógica (activa=false).
// Forma tomada del código del backend; sin verificar con una respuesta viva.
import api from "@/shared/api/client";
import type { Address, AddressPayload } from "@/features/addresses/types";

const status = (error: unknown) => (error as { response?: { status?: number } } | null)?.response?.status;

/** POST y PUT devuelven la fila completa de Prisma: aquí solo se conserva lo que usa la app. */
function toAddress(raw: unknown): Address {
  const r = raw as Partial<Address> | null | undefined;
  if (!r || typeof r.id_direccion !== "number") {
    throw new Error("La respuesta no incluye la dirección");
  }
  return {
    id_direccion: r.id_direccion,
    calle: r.calle ?? "",
    colonia: r.colonia ?? "",
    ciudad: r.ciudad ?? "",
    estado: r.estado ?? "",
    codigo_postal: r.codigo_postal ?? "",
    referencias: r.referencias ?? null,
    created_at: r.created_at ?? "",
  };
}

export const addressRepository = {
  /** Direcciones activas del usuario, de la más reciente a la más antigua. */
  getAll: (): Promise<Address[]> =>
    api.get("/profile/addresses").then((r) => {
      const data = r.data?.data;
      return Array.isArray(data)
        ? data.filter((a): a is Address => typeof a?.id_direccion === "number")
        : [];
    }),

  create: (payload: AddressPayload): Promise<Address> =>
    api.post("/profile/addresses", payload).then((r) => toAddress(r.data?.data)),

  update: (id: number, payload: AddressPayload): Promise<Address> =>
    api.put(`/profile/addresses/${id}`, payload).then((r) => toAddress(r.data?.data)),

  /** Elimina (borrado lógico). El 404 (ya no estaba) cuenta como éxito. */
  remove: (id: number): Promise<void> =>
    api.delete(`/profile/addresses/${id}`).then(
      () => undefined,
      (error) => {
        if (status(error) === 404) return undefined;
        throw error;
      },
    ),
};
