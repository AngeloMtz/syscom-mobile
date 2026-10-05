// src/shared/api/errorMessage.ts — Traducción de errores de Axios a mensajes
// legibles. Vive en shared porque todas las features consumen la misma API y
// el backend responde siempre con la forma { success, message }.

/**
 * El backend responde { success: false, message } y, en validaciones, a veces
 * { errors: [...] }.
 */
export function apiErrorMessage(
  error: any,
  fallback = "Ocurrió un error. Intenta de nuevo.",
): string {
  const data = error?.response?.data;
  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    return typeof first === "string" ? first : (first?.message ?? fallback);
  }
  // 429: el rate limit de /api/auth es de 20 peticiones por IP cada 15 minutos.
  if (error?.response?.status === 429) {
    return "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.";
  }
  if (error?.message === "Network Error") {
    return "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.";
  }
  return fallback;
}
