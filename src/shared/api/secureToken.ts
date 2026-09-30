// src/shared/api/secureToken.ts — Persistencia del JWT en el almacén seguro
// del sistema (Keychain en iOS, Keystore en Android).
//
// SecureStore es asíncrono, pero el interceptor de Axios es síncrono y no
// puede esperarlo. Por eso se mantiene una copia en memoria del token:
// `getTokenSync()` la lee sin await. La memoria es la fuente de verdad durante
// la sesión; SecureStore es la que sobrevive al cierre de la app.
import * as SecureStore from "expo-secure-store";

/** Clave bajo la que vive el JWT en SecureStore. */
export const TOKEN_KEY = "syscom.token";

/** Copia en memoria para el interceptor, que no puede esperar a SecureStore. */
let tokenEnMemoria: string | null = null;

/** Lectura síncrona para el interceptor de Axios. */
export function getTokenSync(): string | null {
  return tokenEnMemoria;
}

/** Guarda el token en el almacén seguro y actualiza la copia en memoria. */
export async function saveToken(token: string): Promise<void> {
  tokenEnMemoria = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/** Lee el token del almacén seguro. Devuelve null si no hay o si falla. */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Hidrata la copia en memoria desde SecureStore. Se llama una vez al arrancar,
 * antes de que el interceptor necesite el token.
 */
export async function restoreToken(): Promise<string | null> {
  const token = await getToken();
  tokenEnMemoria = token;
  return token;
}

/** Borra el token de ambos lados. Se usa al cerrar sesión. */
export async function clearToken(): Promise<void> {
  tokenEnMemoria = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Si no existía, no hay nada que limpiar.
  }
}
