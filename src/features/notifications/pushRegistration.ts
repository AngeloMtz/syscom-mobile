// src/features/notifications/pushRegistration.ts — Registro del dispositivo para push.
// Otras features piden desregistrar el dispositivo aquí, sin conocer el repositorio.
import { getExpoPushToken } from "@/features/notifications/pushNotifications";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";

/** Da de baja el token de Expo Push de este dispositivo, si hay uno. */
export async function unregisterDevicePush(): Promise<void> {
  const token = await getExpoPushToken();
  if (token) await notificationRepository.unregisterPushToken(token);
}
