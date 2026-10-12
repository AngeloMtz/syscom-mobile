// src/features/orders/repositories/orderRepository.ts — Acceso a /orders.
// Exige sesión y rol usuario (Bearer, lo agrega el interceptor). El backend
// filtra por id_pedido Y id_usuario: un pedido ajeno responde 404.
// Forma tomada del código del backend; sin verificar con una respuesta viva.
import api from "@/shared/api/client";
import type { OrderDetail } from "@/features/orders/types";

const status = (error: unknown) => (error as { response?: { status?: number } } | null)?.response?.status;

export const orderRepository = {
  /** Detalle de un pedido del usuario, o null si no existe o no es suyo (404). */
  getById: (id: number): Promise<OrderDetail | null> =>
    api.get(`/orders/${id}`).then(
      (r) => {
        const d = r.data?.data;
        if (typeof d?.id_pedido !== "number") throw new Error("La respuesta no incluye el pedido");
        return {
          id_pedido: d.id_pedido,
          id_usuario: typeof d.id_usuario === "number" ? d.id_usuario : 0,
          estado: String(d.estado ?? ""),
          total: d.total ?? "0",
          fecha_pedido: typeof d.fecha_pedido === "string" ? d.fecha_pedido : null,
          direccion: d.direccion ?? null,
          items: Array.isArray(d.items) ? d.items : [],
          pago: d.pago ?? null,
        } as OrderDetail;
      },
      (error) => {
        if (status(error) === 404) return null;
        throw error;
      },
    ),
};
