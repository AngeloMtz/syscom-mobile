// src/features/orders/orderList.ts — Reglas del historial paginado. Funciones puras.
import type { OrderSummary, OrdersPage } from "@/features/orders/types";

/**
 * Une las páginas en una lista. Si un pedido nuevo corre la paginación, el
 * mismo pedido puede venir en dos páginas: se conserva la primera aparición.
 * No modifica las páginas recibidas.
 */
export function flattenOrders(pages: OrdersPage[]): OrderSummary[] {
  const seen = new Set<number>();
  const result: OrderSummary[] = [];
  for (const page of pages) {
    for (const order of page.data) {
      if (seen.has(order.id_pedido)) continue;
      seen.add(order.id_pedido);
      result.push(order);
    }
  }
  return result;
}

/** Número de la página siguiente, o undefined si ya se cargó la última. */
export function getNextOrdersPage(last: OrdersPage): number | undefined {
  return last.page < last.totalPages ? last.page + 1 : undefined;
}
