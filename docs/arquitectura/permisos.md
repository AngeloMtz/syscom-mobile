# Permisos de la app

La app declara solo los permisos que usa y pide en tiempo de ejecución únicamente el de notificaciones, explicando antes para qué sirve. No usa cámara, ubicación, micrófono, contactos ni archivos.

## Permisos de Android

| Permiso | Lo agrega | Tipo | Justificación |
|---|---|---|---|
| `INTERNET` | Plantilla de Expo | Normal | Comunicarse con la API de SYSCOM |
| `POST_NOTIFICATIONS` | `expo-notifications` | **Se pide en tiempo de ejecución** (Android 13+) | Avisar del estado de los pedidos y de las promociones |
| `VIBRATE` | Plantilla de Expo | Normal | Que las notificaciones puedan vibrar |
| `RECEIVE_BOOT_COMPLETED` | `expo-notifications` | Normal | Lo usa la librería de notificaciones al reiniciar el teléfono |

Las librerías de Firebase (push) y de Stripe (pagos) pueden agregar permisos normales de red, como `ACCESS_NETWORK_STATE`. Los permisos normales los concede Android al instalar, sin preguntar.

### Permisos bloqueados

La plantilla de Expo agrega estos permisos, pero la app no los usa, así que se quitan del manifest con `blockedPermissions` en [app.config.js](../../app.config.js):

| Permiso | Por qué se quita |
|---|---|
| `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` | La app no lee ni guarda archivos |
| `SYSTEM_ALERT_WINDOW` | La app no dibuja sobre otras apps (solo lo usa el menú de desarrollo, que conserva el suyo) |

En el `AndroidManifest.xml` generado quedan con `tools:node="remove"`, y Android los elimina del APK. La prueba [appConfigPermisos.test.ts](../../src/__tests__/appConfigPermisos.test.ts) falla si se quita alguno de la lista o si se bloquea uno necesario.

**Sin permiso de cámara:** "Ver en tu espacio" (realidad aumentada) abre la app de Google (Scene Viewer), que usa su propio permiso de cámara.

## Permiso de notificaciones en tiempo de ejecución

Se pide al iniciar sesión, en dos pasos:

1. **Explicación de la app** ([permissionPrompt.ts](../../src/features/notifications/permissionPrompt.ts)): "¿Activar notificaciones? Te avisaremos cuando cambie el estado de tus pedidos y cuando haya promociones. Puedes desactivarlas cuando quieras en Mi cuenta > Notificaciones." Con **Ahora no** y **Permitir**.
2. **Diálogo del sistema:** solo aparece si el usuario eligió **Permitir** ([pushNotifications.ts](../../src/features/notifications/pushNotifications.ts), `ensurePushPermission`).

| Caso | Qué pasa |
|---|---|
| El permiso ya está concedido | No se muestra nada |
| El usuario elige "Ahora no" o cierra la explicación | El sistema no pregunta; se vuelve a ofrecer en el siguiente inicio de la app |
| El usuario lo rechazó en el diálogo del sistema y Android ya no deja volver a preguntar | No se insiste |

Lo coordina [useRegisterPushToken.ts](../../src/features/notifications/hooks/useRegisterPushToken.ts). Pruebas: [permissionPrompt.test.ts](../../src/__tests__/permissionPrompt.test.ts), [pushNotifications.test.ts](../../src/__tests__/pushNotifications.test.ts) y [notificacionesPush.test.tsx](../../src/__tests__/integration/notificacionesPush.test.tsx).
