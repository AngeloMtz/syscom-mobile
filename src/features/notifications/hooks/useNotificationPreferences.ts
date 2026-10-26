// src/features/notifications/hooks/useNotificationPreferences.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationRepository } from "@/features/notifications/repositories/notificationRepository";
import type { NotificationPreferences } from "@/features/notifications/types";
import { useAuthStore } from "@/shared/store/authStore";

export const PREFERENCES_KEY = ["notifications", "preferences"] as const;

/** Preferencias de canal (correo/push) del usuario. Sin sesión no consulta. */
export const useNotificationPreferences = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: notificationRepository.getPreferences,
    enabled: isAuthenticated,
  });
};

/**
 * Guarda las preferencias. El interruptor cambia al instante (actualización
 * optimista); si el servidor rechaza el cambio, vuelve al valor anterior.
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, NotificationPreferences, { anterior?: NotificationPreferences }>({
    mutationFn: notificationRepository.updatePreferences,
    retry: 0,
    onMutate: async (prefs) => {
      await queryClient.cancelQueries({ queryKey: PREFERENCES_KEY });
      const anterior = queryClient.getQueryData<NotificationPreferences>(PREFERENCES_KEY);
      queryClient.setQueryData<NotificationPreferences>(PREFERENCES_KEY, prefs);
      return { anterior };
    },
    onError: (_error, _prefs, contexto) => {
      if (contexto?.anterior) queryClient.setQueryData(PREFERENCES_KEY, contexto.anterior);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY });
    },
  });
};
