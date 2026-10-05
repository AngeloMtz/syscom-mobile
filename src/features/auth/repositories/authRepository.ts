// src/features/auth/repositories/authRepository.ts — Acceso a /auth.
// Única capa que conoce rutas y forma de las respuestas del backend.
// El backend responde { success, message, data }, así que todo desanida `data`.
import api from "@/shared/api/client";
import type {
  CodeType,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  User,
} from "@/features/auth/types";

/** La baseURL del client ya incluye /api, así que las rutas van sin ese prefijo. */
export const authRepository = {
  /**
   * Inicia sesión. El backend tiene dos salidas: si la cuenta usa 2FA corta con
   * requires2FA y no crea sesión; si no, devuelve user + token.
   */
  login: (payload: LoginPayload): Promise<LoginResult> =>
    api.post("/auth/login", payload).then((r) => {
      const data = r.data?.data ?? {};
      if (data.requires2FA) {
        return { requires2FA: true, correo: data.correo ?? payload.correo };
      }
      return { requires2FA: false, user: data.user, token: data.token };
    }),

  /** Segundo paso del login cuando la cuenta tiene 2FA activo. */
  confirm2FA: (correo: string, code: string): Promise<{ user: User; token: string }> =>
    api.post("/auth/verify-2fa-login", { correo, code }).then((r) => ({
      user: r.data.data.user,
      token: r.data.data.token,
    })),

  /** Crea la cuenta y dispara el código de 6 dígitos al correo. No inicia sesión. */
  register: (payload: RegisterPayload): Promise<void> =>
    api.post("/auth/register", payload).then(() => undefined),

  /** Confirma el registro. El backend hace auto-login y devuelve user + token. */
  verifyRegistration: (correo: string, code: string): Promise<{ user: User; token: string }> =>
    api.post("/auth/verify-registration", { correo, code }).then((r) => ({
      user: r.data.data.user,
      token: r.data.data.token,
    })),

  resendCode: (correo: string, type: CodeType): Promise<void> =>
    api.post("/auth/resend-code", { correo, type }).then(() => undefined),

  /**
   * Paso 1 de la recuperación. `method: "code"` envía un código de 6 dígitos
   * que se verifica dentro de la app; `"link"` manda un enlace que se abre en
   * la web. El móvil usa "code" para no salir de la app.
   */
  forgotPassword: (correo: string, method: "code" | "link" = "code"): Promise<void> =>
    api.post("/auth/forgot-password", { correo, method }).then(() => undefined),

  /** Paso 2: valida el código antes de dejar escribir la contraseña nueva. */
  verifyRecovery: (correo: string, code: string): Promise<void> =>
    api.post("/auth/verify-recovery", { correo, code }).then(() => undefined),

  /** Paso 3: fija la contraseña nueva. No inicia sesión: se vuelve al login. */
  resetPassword: (params: {
    correo: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => api.post("/auth/reset-password", params).then(() => undefined),

  logout: (): Promise<void> => api.post("/auth/logout").then(() => undefined),

  /**
   * Usuario de la sesión actual.
   * OJO: este endpoint NO existe todavía en el backend — hay que agregarlo
   * (el fuente no lo tenía porque guardaba el usuario en AsyncStorage).
   * Hasta entonces devuelve 404 y useMe no puede hidratar el objeto user.
   */
  getMe: (): Promise<User> => api.get("/auth/me").then((r) => r.data.data.user),
};

/**
 * Mensaje legible a partir de un error de Axios. La implementación vive en
 * shared/api porque todas las features la necesitan; se reexporta con este
 * nombre para no cambiar los imports de las pantallas de auth.
 */
export { apiErrorMessage as authErrorMessage } from "@/shared/api/errorMessage";
