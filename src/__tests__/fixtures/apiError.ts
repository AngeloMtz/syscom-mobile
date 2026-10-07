/**
 * Error con la forma que deja Axios cuando el backend responde con error:
 * { response: { status, data: { success: false, message } } }.
 * Para errores de validación pasar `errors`; para error de red usar makeNetworkError.
 */
export function makeApiError(
  over: { status?: number; message?: string; errors?: unknown[] } = {},
) {
  const { status = 400, message, errors } = over;
  return {
    response: {
      status,
      data: {
        success: false,
        ...(message !== undefined && { message }),
        ...(errors !== undefined && { errors }),
      },
    },
  };
}

/** Error sin respuesta del servidor (sin internet). */
export function makeNetworkError() {
  return { message: "Network Error" };
}
