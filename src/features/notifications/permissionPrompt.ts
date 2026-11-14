// src/features/notifications/permissionPrompt.ts — Explicación previa al permiso de notificaciones.
// Se muestra ANTES del diálogo del sistema: el usuario sabe para qué es el permiso y puede
// dejarlo para después sin que el sistema lo marque como rechazado.
import { Alert } from "react-native";

export const PERMISO_NOTIFICACIONES = {
  titulo: "¿Activar notificaciones?",
  mensaje:
    "Te avisaremos cuando cambie el estado de tus pedidos y cuando haya promociones. " +
    "Puedes desactivarlas cuando quieras en Mi cuenta > Notificaciones.",
  aceptar: "Permitir",
  posponer: "Ahora no",
};

/** Muestra la explicación. Resuelve true si el usuario acepta; false si la pospone o la cierra. */
export function explicarPermisoNotificaciones(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      PERMISO_NOTIFICACIONES.titulo,
      PERMISO_NOTIFICACIONES.mensaje,
      [
        { text: PERMISO_NOTIFICACIONES.posponer, style: "cancel", onPress: () => resolve(false) },
        { text: PERMISO_NOTIFICACIONES.aceptar, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
