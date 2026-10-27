// src/features/notifications/pushNotifications.ts — Envoltorio sobre expo-notifications.
// No es código puro: toca APIs nativas (permiso del SO, canal de Android, token
// de Expo). Se prueba con el módulo "expo-notifications" simulado (jest.mock).
// Las pantallas y hooks no llaman a expo-notifications directo, solo a este módulo.
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * expo-notifications se carga con tolerancia a fallos: en un Expo Go que no
 * trae su módulo nativo (ExpoTopicSubscriptionModule), importarlo lanza al
 * cargar y tumba toda la app. Sin el módulo, el push queda como "no disponible".
 */
let Notifications: typeof import("expo-notifications") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
} catch {
  Notifications = null;
}

/** Cómo se comporta una notificación recibida con la app abierta: sí se muestra. */
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Canal "default" de Android (obligatorio desde Android 8 para que la
 * notificación se muestre). Sin plataforma Android, no hace nada.
 */
export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android" || !Notifications) return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "General",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Permiso de notificaciones: si ya está concedido no vuelve a preguntar (el
 * propio SO no muestra el diálogo dos veces); si nunca se preguntó, lo pide.
 * Devuelve false también si el usuario ya lo había rechazado antes.
 */
export async function ensurePushPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  if (!actual.canAskAgain) return false;

  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

/**
 * Token de Expo Push de este dispositivo. `null` si no se pudo obtener (sin
 * conexión, emulador sin Google Play Services, etc.) — se trata como "no
 * disponible ahora", no como error fatal.
 */
export async function getExpoPushToken(): Promise<string | null> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || !Notifications) return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}
