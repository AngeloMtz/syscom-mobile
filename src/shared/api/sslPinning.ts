// src/shared/api/sslPinning.ts — Certificate pinning de las peticiones a la API.
// La app solo acepta la conexión si la cadena del servidor contiene una de las llaves
// públicas fijadas (SHA-256 del SPKI, en base64). En Android lo aplica el CertificatePinner
// de OkHttp y en iOS TrustKit. Cubre fetch y XMLHttpRequest (Axios); no cubre el WebSocket
// del chat en vivo. Detalle y mantenimiento: docs/arquitectura/certificate-pinning.md
import {
  addSslPinningErrorListener,
  initializeSslPinning,
  isSslPinningAvailable,
  type PinningOptions,
} from "react-native-ssl-public-key-pinning";

import { API_URL } from "./client";

/**
 * Raíces de Let's Encrypt (ISRG). Se fijan raíces y no el certificado del servidor porque el
 * de Railway (*.up.railway.app) se renueva cada pocos meses; una raíz dura años.
 */
export const API_PUBLIC_KEY_HASHES = [
  // ISRG Root YE: raíz de la cadena actual del servidor.
  "sCkq5UWXjg+7mKu9lMhhYF5bGLsy7VI/UNW3tccdR7w=",
  // ISRG Root X2: firma a Root YE en la cadena que envía el servidor.
  "diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=",
  // ISRG Root X1: respaldo si Railway vuelve a la cadena clásica de Let's Encrypt.
  "C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=",
];

export type PinningStatus = "activo" | "sin-https" | "no-disponible" | "error";

/** Dominio que se fija, o null si la API no va por HTTPS (backend local en desarrollo). */
export function pinnedHost(apiUrl: string): string | null {
  const match = /^https:\/\/([^/:?#]+)/i.exec(apiUrl.trim());
  return match ? match[1].toLowerCase() : null;
}

/** Opciones para la librería: solo ese dominio, sin subdominios. */
export function pinningOptions(host: string): PinningOptions {
  return { [host]: { includeSubdomains: false, publicKeyHashes: API_PUBLIC_KEY_HASHES } };
}

let escuchandoErrores = false;

/**
 * Activa el pinning para el dominio de la API. Se llama al arrancar, antes de la primera
 * petición. Nunca lanza: devuelve el resultado para que el arranque no se detenga.
 * En Expo Go no existe el módulo nativo y se omite.
 */
export async function enableSslPinning(apiUrl: string = API_URL): Promise<PinningStatus> {
  const host = pinnedHost(apiUrl);
  if (!host) return "sin-https";
  if (!isSslPinningAvailable()) return "no-disponible";

  try {
    await initializeSslPinning(pinningOptions(host));
  } catch (error) {
    console.warn("No se pudo activar el certificate pinning", error);
    return "error";
  }

  if (!escuchandoErrores) {
    escuchandoErrores = true;
    addSslPinningErrorListener(({ serverHostname }) => {
      console.warn(`Certificate pinning: se rechazó la conexión con ${serverHostname}`);
    });
  }
  return "activo";
}
