// src/shared/utils/format.ts — Formato de datos para mostrar.

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Precio en pesos mexicanos: 1234.5 → "$1,234.50". */
export const formatPrice = (value: number): string => mxn.format(value);
