// src/shared/api/errorMessage.ts — Traducción de errores de Axios a mensajes
// legibles. Vive en shared porque todas las features consumen la misma API y
// el backend responde siempre con la forma { success, message }.

/**
 * El backend responde { success: false, message } (o `error` con texto) y, en validaciones, a veces
 * { errors: [...] }.
 */
export function apiErrorMessage(
  error: any,
  fallback = "Ocurrió un error. Intenta de nuevo.",
): string {
  const data = error?.response?.data;
  if (typeof data?.message === "string") return data.message;
  // Algunos endpoints del catálogo responden { success: false, error: "texto" }.
  if (typeof data?.error === "string") return data.error;
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
  // Tiempo de espera agotado: el cliente corta a los 15 s y Axios lo reporta sin respuesta del servidor.
  const message = typeof error?.message === "string" ? error.message : "";
  if (error?.code === "ECONNABORTED" || /^timeout of \d+ms exceeded$/.test(message)) {
    return "El servidor tardó demasiado en responder. Intenta de nuevo.";
  }
  return fallback;
}
