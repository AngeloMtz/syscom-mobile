// src/features/auth/hooks/useLogout.ts
// Cierra sesión. Antes de borrar el JWT, intenta desregistrar el token de
// Expo Push de este dispositivo: el endpoint exige sesión, así que tiene que
// pasar primero. Es best-effort — si falla (sin conexión, token ya vencido),
// igual se cierra la sesión; el token simplemente queda activo en el backend
// hasta que expire por sí solo o alguien vuelva a iniciar sesión y lo reemplace.
import { getExpoPushToken } from "@/features/notifications/pushNotifications";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import { useAuthStore } from "@/shared/store/authStore";

export function useLogout(): () => Promise<void> {
  const logout = useAuthStore((s) => s.logout);

  return async () => {
    try {
      const token = await getExpoPushToken();
      if (token) await notificationRepository.unregisterPushToken(token);
    } catch {
      // Sin bloquear el cierre de sesión por esto.
    }
    await logout();
  };
}
