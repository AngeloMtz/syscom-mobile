// src/features/cart/cartSelectors.ts — Reglas de presentación del carrito.
// Funciones puras: no tocan la red ni React.
//
// Precios: la app usa solo `precio_unitario` que manda el backend, en centavos
// enteros. No suma `precio_extra` ni usa `precio_final`: el backend cobra la
// foto de `precio_base` guardada al agregar.

import type { CartItem, CartItemStatus, CartLineData, CartResult } from "@/features/cart/types";

/** Máximo por producto que acepta el backend (PATCH 0–99, POST bloquea en 99). */
export const MAX_ITEM_QUANTITY = 99;

/** Precio como centavos enteros. Acepta número o texto (Decimal); null si no es válido. */
export function toCents(value: unknown): number | null {
  let n: number;
  if (typeof value === "number") n = value;
  else if (typeof value === "string" && value.trim() !== "") n = Number(value);
  else return null;
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** Centavos como texto con dos decimales, igual que `meta.totalPrice`. */
export function centsToPriceString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Importe de una línea en centavos (precio del servidor × cantidad); null si el precio no es válido. */
export function lineSubtotalCents(item: CartItem): number | null {
  const unit = toCents(item.precio_unitario);
  return unit === null ? null : unit * item.cantidad;
}

/** Suma local de las líneas con precio válido. Solo respaldo: el total es el del backend. */
export function cartTotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (lineSubtotalCents(item) ?? 0), 0);
}

/** Total a mostrar en pesos: el del servidor; si no es válido, la suma local. */
export function getCartTotal(cart: CartResult | undefined): number {
  if (!cart) return 0;
  return (toCents(cart.totalPrice) ?? cartTotalCents(cart.items)) / 100;
}

/** Unidades totales del carrito. */
export function cartUnits(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.cantidad, 0);
}

/**
 * Stock de la línea: suma de las variantes activas. null si no hay ninguna: en
 * ese caso el backend no valida stock al pagar, así que la app no lo inventa.
 */
export function getItemStock(item: CartItem): number | null {
  const variantes = item.productos.variantes_producto ?? [];
  if (variantes.length === 0) return null;
  return variantes.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0);
}

/** Cantidad máxima que se puede pedir de la línea: el menor entre 99 y el stock. */
export function maxQuantity(item: CartItem): number {
  const stock = getItemStock(item);
  return stock === null ? MAX_ITEM_QUANTITY : Math.min(MAX_ITEM_QUANTITY, stock);
}

export function getItemStatus(item: CartItem): CartItemStatus {
  if (item.productos.estado !== "activo") return "no_disponible";
  const stock = getItemStock(item);
  if (stock !== null && stock <= 0) return "agotado";
  if (stock !== null && item.cantidad > stock) return "excede";
  return "ok";
}

/** Datos de una línea del carrito listos para pintar. */
export function toCartLineData(item: CartItem): CartLineData {
  const status = getItemStatus(item);
  const max = maxQuantity(item);
  const unit = toCents(item.precio_unitario);
  const subtotal = lineSubtotalCents(item);
  return {
    id: item.productos.id_producto,
    nombre: item.productos.nombre,
    marca: item.productos.marcas?.nombre ?? null,
    imagenUrl: item.productos.producto_imagenes?.[0]?.url_imagen || undefined,
    cantidad: item.cantidad,
    precioUnitario: unit === null ? null : unit / 100,
    subtotal: subtotal === null ? null : subtotal / 100,
    stock: getItemStock(item),
    maxQuantity: max,
    status,
    canIncrease: (status === "ok") && item.cantidad < max,
    canDecrease: item.cantidad > 1,
    blocking: status !== "ok",
  };
}

/**
 * Selector del pago (HU #13): hay líneas, ninguna bloqueante (agotada, sin
 * disponibilidad o por encima del stock). El backend valida de nuevo al pagar.
 */
export function canCheckout(cart: CartResult | undefined): boolean {
  if (!cart || cart.items.length === 0) return false;
  return cart.items.every((item) => getItemStatus(item) === "ok");
}

/**
 * Carrito esperado tras fijar la cantidad de un producto (0 lo quita). Sirve
 * para pintar el cambio al instante: el total se ajusta con Δcantidad ×
 * precio_unitario sobre el total del servidor. No modifica `current`.
 */
export function applyQuantityChange(
  current: CartResult | undefined,
  productId: number,
  cantidad: number,
): CartResult {
  const base: CartResult = current ?? { items: [], total: 0, totalPrice: "0.00", truncated: false };
  const item = base.items.find((i) => i.productos.id_producto === productId);
  if (!item) return base;

  const next = Math.min(MAX_ITEM_QUANTITY, Math.max(0, Math.trunc(cantidad)));
  const unit = toCents(item.precio_unitario);
  const currentTotal = toCents(base.totalPrice) ?? cartTotalCents(base.items);
  const totalPrice =
    unit === null
      ? base.totalPrice
      : centsToPriceString(Math.max(0, currentTotal + unit * (next - item.cantidad)));

  if (next === 0) {
    return {
      ...base,
      items: base.items.filter((i) => i !== item),
      total: Math.max(0, base.total - 1),
      totalPrice,
    };
  }
  return {
    ...base,
    items: base.items.map((i) => (i === item ? { ...i, cantidad: next } : i)),
    totalPrice,
  };
}

/** Carrito esperado tras quitar un producto. */
export function applyRemove(current: CartResult | undefined, productId: number): CartResult {
  return applyQuantityChange(current, productId, 0);
}

/** Qué pasó al agregar: 409 = ya hay 99, 404 = el producto ya no está disponible. */
export function classifyAddError(error: unknown): "max" | "unavailable" | "other" {
  const status = (error as { response?: { status?: number } } | null | undefined)?.response?.status;
  if (status === 409) return "max";
  if (status === 404) return "unavailable";
  return "other";
}
