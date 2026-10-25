// src/features/orders/orderFormat.ts — Presentación de pedidos. Funciones puras.
import { toCents } from "@/features/cart/cartSelectors";
import type { StatusTone } from "@/features/orders/types";

/** "en_revision" → "En revision": legible aunque el backend agregue un valor nuevo. */
function humanize(raw: string): string {
  const text = raw.replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Folio derivado del id: SYS-NNNNNN (6 dígitos con ceros; un id más largo no se
 * trunca). Es solo presentación: el backend no guarda un folio propio, y el
 * correo y el panel web siguen mostrando "Pedido #id" hasta que lo adopten.
 */
export function formatOrderFolio(idPedido: number): string {
  if (!Number.isInteger(idPedido) || idPedido <= 0) return "SYS-------";
  return `SYS-${String(idPedido).padStart(6, "0")}`;
}

const STATUS_LABELS: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Solo los productos de un pedido entregado se pueden reseñar (lo mismo que exige el backend). */
export function isOrderReviewable(estado: string | null | undefined): boolean {
  return typeof estado === "string" && estado.trim().toLowerCase() === "entregado";
}

export function orderStatusLabel(estado: string | null | undefined): string {
  if (!estado) return "Estado no disponible";
  return STATUS_LABELS[estado] ?? humanize(estado);
}

const STATUS_TONES: Record<string, StatusTone> = {
  pendiente_pago: "warning",
  confirmado: "info",
  en_preparacion: "neutral",
  en_camino: "warning",
  entregado: "success",
  cancelado: "danger",
};

export function orderStatusTone(estado: string | null | undefined): StatusTone {
  return (estado && STATUS_TONES[estado]) || "neutral";
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/** America/Mexico_City es UTC-6 fijo desde que se eliminó el horario de verano (oct 2022). */
const MEXICO_OFFSET_MS = 6 * 60 * 60 * 1000;

/** "12 oct 2026" en hora de México, sin hora del día. Fecha nula o inválida → texto neutro. */
export function formatOrderDate(iso: string | null | undefined): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(t)) return "Fecha no disponible";
  const d = new Date(t - MEXICO_OFFSET_MS);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function paymentMethodLabel(metodo: string | null | undefined): string {
  if (!metodo) return "No disponible";
  return metodo.toLowerCase() === "stripe" ? "Tarjeta (Stripe)" : humanize(metodo);
}

export function paymentStatusLabel(estadoPago: string | null | undefined): string {
  if (!estadoPago) return "No disponible";
  if (estadoPago === "completado") return "Pagado";
  return humanize(estadoPago);
}

/** Total en pesos; el Decimal llega como texto o número. null si no es válido. */
export function orderTotal(value: unknown): number | null {
  const cents = toCents(value);
  return cents === null ? null : cents / 100;
}

/** "1 producto" / "3 productos". */
export function formatItemCount(count: number): string {
  const n = Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
  return n === 1 ? "1 producto" : `${n} productos`;
}

/** Id de la ruta /orders/[id] como entero positivo; null si no es válido. */
export function parseOrderId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
