// src/features/notifications/hooks/useRegisterPushToken.ts
// Registra el token de Expo Push del dispositivo en el backend mientras haya
// sesión. No pide permiso de forma intrusiva: si el usuario ya lo rechazó
// antes, no insiste (ensurePushPermission no vuelve a preguntar en ese caso).
// Falla en silencio: sin push el resto de la app funciona igual.
import { useEffect } from "react";

import { configureAndroidChannel, ensurePushPermission, getExpoPushToken } from "@/features/notifications/pushNotifications";
import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import { useAuthStore } from "@/shared/store/authStore";

export function useRegisterPushToken(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelado = false;

    (async () => {
      await configureAndroidChannel();
      const permitido = await ensurePushPermission();
      if (!permitido || cancelado) return;

      const token = await getExpoPushToken();
      if (!token || cancelado) return;

      try {
        await notificationRepository.registerPushToken(token);
      } catch {
        // Sin conexión o error del servidor: se reintenta la próxima vez que
        // isAuthenticated vuelva a activarse (siguiente arranque de la app).
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [isAuthenticated]);
}
