// src/features/auth/repositories/authRepository.ts — Acceso a /auth.
// Única capa que conoce rutas y forma de las respuestas del backend.
// El backend responde { success, message, data }, así que todo desanida `data`.
import type { AxiosInstance } from "axios";

import { ApiClient } from "@/shared/api/client";
import type {
  CodeType,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  User,
} from "@/features/auth/types";

/**
 * Un 200 sin user o token no debe tratarse como sesión válida. El error imita la
 * forma { response.data.message } de la API para que apiErrorMessage lo muestre
 * tal cual en vez del texto de respaldo de cada pantalla.
 */
function exigirSesion(data: { user?: User; token?: string } | undefined): {
  user: User;
  token: string;
} {
  if (!data?.user || !data.token) {
    throw Object.assign(new Error("Respuesta incompleta del servidor."), {
      response: {
        data: {
          message: "Respuesta incompleta del servidor. Intenta de nuevo.",
        },
      },
    });
  }
  return { user: data.user, token: data.token };
}

/** Contrato: qué operaciones existen sobre la sesión y la cuenta, no cómo se hacen. */
export interface AuthRepository {
  /**
   * Inicia sesión. El backend devuelve user + token.
   */
  login(payload: LoginPayload): Promise<LoginResult>;
  /** Segundo paso del login cuando la cuenta tiene 2FA activo. */
  confirm2FA(correo: string, code: string): Promise<{ user: User; token: string }>;
  /** Crea la cuenta y dispara el código de 6 dígitos al correo. No inicia sesión. */
  register(payload: RegisterPayload): Promise<void>;
  /** Confirma el registro. El backend hace auto-login y devuelve user + token. */
  verifyRegistration(correo: string, code: string): Promise<{ user: User; token: string }>;
  resendCode(correo: string, type: CodeType): Promise<void>;

  forgotPassword(correo: string, method?: "code" | "link"): Promise<void>;
  /** Paso 2: valida el código antes de dejar escribir la contraseña nueva. */
  verifyRecovery(correo: string, code: string): Promise<void>;
  /** Paso 3: fija la contraseña nueva. No inicia sesión: se vuelve al login. */
  resetPassword(params: {
    correo: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void>;
  logout(): Promise<void>;
  /** Usuario de la sesión actual (GET /auth/me). */
  getMe(): Promise<User>;
}

/**
 * Implementación sobre la API REST. La baseURL del client ya incluye /api, así que las
 * rutas van sin ese prefijo. Funciones flecha: los hooks pasan `login` y otros sin el objeto.
 */
export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly http: AxiosInstance) {}

  login = (payload: LoginPayload): Promise<LoginResult> =>
    this.http.post("/auth/login", payload).then((r) => {
      const data = r.data?.data ?? {};
      if (data.requires2FA) {
        return { requires2FA: true, correo: data.correo ?? payload.correo };
      }
      return { requires2FA: false, ...exigirSesion(data) };
    });

  confirm2FA = (correo: string, code: string): Promise<{ user: User; token: string }> =>
    this.http.post("/auth/verify-2fa-login", { correo, code }).then((r) => exigirSesion(r.data?.data));

  register = (payload: RegisterPayload): Promise<void> =>
    this.http.post("/auth/register", payload).then(() => undefined);

  verifyRegistration = (correo: string, code: string): Promise<{ user: User; token: string }> =>
    this.http.post("/auth/verify-registration", { correo, code }).then((r) => exigirSesion(r.data?.data));

  resendCode = (correo: string, type: CodeType): Promise<void> =>
    this.http.post("/auth/resend-code", { correo, type }).then(() => undefined);

  forgotPassword = (correo: string, method: "code" | "link" = "code"): Promise<void> =>
    this.http.post("/auth/forgot-password", { correo, method }).then(() => undefined);

  verifyRecovery = (correo: string, code: string): Promise<void> =>
    this.http.post("/auth/verify-recovery", { correo, code }).then(() => undefined);

  resetPassword = (params: {
    correo: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => this.http.post("/auth/reset-password", params).then(() => undefined);

  logout = (): Promise<void> => this.http.post("/auth/logout").then(() => undefined);

  getMe = (): Promise<User> => this.http.get("/auth/me").then((r) => r.data.data.user);
}

export const authRepository: AuthRepository = new HttpAuthRepository(ApiClient.getInstance().http);
