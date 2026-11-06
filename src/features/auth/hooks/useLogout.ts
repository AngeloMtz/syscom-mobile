// src/features/auth/hooks/useLogout.ts
// Cierra sesión. Antes de borrar el JWT, intenta desregistrar el token de
// Expo Push de este dispositivo: el endpoint exige sesión, así que tiene que
// pasar primero. Es best-effort — si falla (sin conexión, token ya vencido),
// igual se cierra la sesión; el token simplemente queda activo en el backend
// hasta que expire por sí solo o alguien vuelva a iniciar sesión y lo reemplace.
import { useChatStore } from "@/features/chatbot/chatStore";
import { unregisterDevicePush } from "@/features/notifications/pushRegistration";
import { useAuthStore } from "@/shared/store/authStore";

export function useLogout(): () => Promise<void> {
  const logout = useAuthStore((s) => s.logout);

  return async () => {
    try {
      await unregisterDevicePush();
    } catch {
      // Sin bloquear el cierre de sesión por esto.
    }
    await logout();
    // La conversación con el chatbot es de esta cuenta: otra no debe verla.
    useChatStore.getState().reset();
  };
}
