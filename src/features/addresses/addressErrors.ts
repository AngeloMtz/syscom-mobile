// src/features/addresses/addressErrors.ts — Errores del servidor en el formulario.
// El 400 de validación trae `errors: [{ field, message }]`. Un 5xx puede traer
// texto interno (Prisma), así que nunca se muestra: va un mensaje genérico.
import type { AddressErrors, AddressField } from "@/features/addresses/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";

const GENERIC = "No pudimos completar la operación. Intenta de nuevo más tarde.";

const FIELDS: readonly string[] = [
  "calle",
  "colonia",
  "ciudad",
  "estado",
  "codigo_postal",
  "referencias",
] satisfies AddressField[];

const statusOf = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } } | null | undefined)?.response?.status;

/** Mensaje para mostrar al usuario; en 5xx nunca el texto del servidor. */
export function addressErrorMessage(error: unknown, fallback: string = GENERIC): string {
  const status = statusOf(error);
  if (typeof status === "number" && status >= 500) return fallback;
  return apiErrorMessage(error, fallback);
}

/** Separa el error del servidor en errores por campo y un mensaje general. */
export function mapServerFieldErrors(error: unknown): { fields: AddressErrors; general?: string } {
  const status = statusOf(error);
  if (typeof status === "number" && status >= 500) return { fields: {}, general: GENERIC };

  const list = (error as { response?: { data?: { errors?: unknown } } } | null | undefined)?.response?.data
    ?.errors;
  const fields: AddressErrors = {};
  if (Array.isArray(list)) {
    for (const item of list as { field?: unknown; message?: unknown }[]) {
      if (typeof item?.field === "string" && FIELDS.includes(item.field) && typeof item.message === "string") {
        fields[item.field as AddressField] = item.message;
      }
    }
  }

  return {
    fields,
    general: Object.keys(fields).length > 0 ? undefined : addressErrorMessage(error),
  };
}
