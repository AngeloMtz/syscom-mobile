// src/shared/api/client.ts — Cliente HTTP de la app (patrón Singleton).
// Al ser un módulo de TypeScript se evalúa una sola vez: todas las features
// comparten esta misma instancia, con su base URL, timeout e interceptor.
import axios from "axios";

import { getTokenSync } from "./secureToken";

// En dispositivo físico localhost no apunta a la PC: definir EXPO_PUBLIC_API_URL
// en .env con la IP LAN o la URL del backend en Render. En una compilación de
// producción la variable es obligatoria (se define como variable de entorno de
// EAS): sin ella la app apuntaría en silencio a un localhost que nunca responde.
// Se lee con el nombre completo porque Expo solo la sustituye al empaquetar así.
function resolveApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (url) return url;
  if (__DEV__) {
    console.warn(
      "EXPO_PUBLIC_API_URL no está definida: se usa http://localhost:4000/api. " +
        "En un dispositivo físico define la variable en .env.",
    );
    return "http://localhost:4000/api";
  }
  throw new Error(
    "Falta EXPO_PUBLIC_API_URL: esta compilación no sabe a qué servidor conectarse. " +
      "Defínela como variable de entorno de EAS para el perfil con el que compilas y vuelve a compilar.",
  );
}

export const API_URL = resolveApiUrl();

// El default export de axios expone `create`; la regla avisa por el named
// export homónimo, pero aquí el uso es el correcto.
// eslint-disable-next-line import/no-named-as-default-member
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    // Identifica el canal: el backend solo deja pasar cuentas de rol "usuario"
    // cuando la petición viene de la app móvil.
    "X-Client": "mobile",
    // Evita la página de aviso de ngrok cuando el backend va por túnel.
    "ngrok-skip-browser-warning": "true",
  },
});

// La sesión viaja solo como Bearer. La lectura es síncrona (caché en memoria
// de secureToken) porque el interceptor no puede esperar a SecureStore.
api.interceptors.request.use((config) => {
  const token = getTokenSync();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Texto exacto con el que el backend rechaza un JWT vencido o inválido: responde 403, no 401
 * (authenticateToken, syscom-backend/src/middlewares/auth.middleware.ts). Si cambia allá, cambia aquí.
 */
export const SESSION_EXPIRED_MESSAGE = "Token inválido o expirado";

/**
 * Rutas de /auth/ que se usan SIN sesión. Un 401 o 403 ahí significa credenciales o código incorrectos
 * (o acceso móvil denegado), nunca una sesión caducada.
 */
const PUBLIC_AUTH_ROUTES = [
  "/auth/login",
  "/auth/verify-2fa-login",
  "/auth/register",
  "/auth/verify-registration",
  "/auth/resend-code",
  "/auth/forgot-password",
  "/auth/verify-recovery",
  "/auth/reset-password",
];

let onSessionExpired: (() => void | Promise<void>) | null = null;
let closingSession = false;

/**
 * Quién cierra la sesión cuando el servidor dice que caducó. Lo registra authStore: así este módulo
 * no importa el store (el store ya importa el cliente) y no hay ciclo de importaciones.
 */
export function setSessionExpiredHandler(handler: (() => void | Promise<void>) | null): void {
  onSessionExpired = handler;
}

/** ¿Esta respuesta de error significa que la sesión que enviaba la petición ya no sirve? */
function isSessionExpired(error: any): boolean {
  const config = error?.config;
  const status = error?.response?.status;
  if (!config || (status !== 401 && status !== 403)) return false;

  // Solo cuenta si la petición llevaba el token ACTUAL: una respuesta tardía de una sesión anterior
  // no debe cerrar la nueva.
  const token = getTokenSync();
  if (!token || String(config.headers?.Authorization ?? "") !== `Bearer ${token}`) return false;

  const route = String(config.url ?? "");
  if (PUBLIC_AUTH_ROUTES.some((publica) => route.startsWith(publica))) return false;

  return status === 401 || error.response?.data?.message === SESSION_EXPIRED_MESSAGE;
}

// Sesión caducada: un solo cierre aunque lleguen varias respuestas a la vez. El error SIEMPRE se
// devuelve a quien hizo la petición; el cierre no puede taparlo ni fallar hacia afuera.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (onSessionExpired && !closingSession && isSessionExpired(error)) {
      closingSession = true;
      Promise.resolve()
        .then(() => onSessionExpired?.())
        .catch(() => undefined)
        .finally(() => {
          closingSession = false;
        });
    }
    return Promise.reject(error);
  },
);

export default api;
