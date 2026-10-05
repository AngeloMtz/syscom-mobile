// src/shared/api/client.ts — Cliente HTTP de la app (patrón Singleton).
// Al ser un módulo de TypeScript se evalúa una sola vez: todas las features
// comparten esta misma instancia, con su base URL, timeout e interceptor.
import axios from "axios";

import { getTokenSync } from "./secureToken";

// En dispositivo físico localhost no apunta a la PC: definir EXPO_PUBLIC_API_URL
// en .env con la IP LAN o la URL del backend en Render.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";

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

export default api;
