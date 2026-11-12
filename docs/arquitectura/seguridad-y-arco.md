# Seguridad y derechos ARCO

Compara la evidencia que pide la Actividad 6 con lo que existe hoy en el código. Cubre los criterios 2 y 3 de la rúbrica. Cancelación actualizada con el issue #200, y Oposición y consentimiento con el #212; el resto se revisó el 2026-11-05.

| Criterio | Puntos | Estado |
|---|---|---|
| 2. Seguridad Anti-MitM y cifrado | 1.50 | **Parcial:** hay almacenamiento seguro, pero no certificate pinning |
| 3. Derechos ARCO | 1.50 | **Cumple:** pantallas y endpoints de Acceso, Rectificación y Cancelación, switches de Opt-Out y consentimiento explícito en el registro |

## Criterio 2: seguridad Anti-MitM y cifrado

**Evidencia exigida:** `CertificatePinner` en el cliente HTTP y `EncryptedSharedPreferences` o Keychain.

| Requisito | Estado | Evidencia |
|---|---|---|
| Certificate Pinning (hash SHA-256) | **No implementado** | No hay ninguna configuración ni dependencia de pinning en `src`, `package.json` ni `app.config.js` |
| Cifrado en tránsito | Sí, sin pinning | La URL de producción usa HTTPS, pero la app confía en cualquier certificado válido para el sistema |
| Almacenamiento seguro en iOS | Sí | `expo-secure-store` guarda en Keychain |
| Almacenamiento seguro en Android | Sí, con otra implementación | `expo-secure-store` cifra con AES-GCM y una llave de Android Keystore |

### Almacenamiento del token

El JWT se guarda solo con `expo-secure-store`:
- Escritura: [secureToken.ts:24](../../src/shared/api/secureToken.ts#L24).
- Lectura durante la sesión: una copia en memoria ([secureToken.ts:17](../../src/shared/api/secureToken.ts#L17)), porque el interceptor no puede esperar a SecureStore.
- Borrado al cerrar sesión: [secureToken.ts:47](../../src/shared/api/secureToken.ts#L47).

En Android, la app no usa la clase `EncryptedSharedPreferences` que menciona la rúbrica. La librería guarda los valores en `SharedPreferences` privadas, cifrados con AES-GCM (`AES/GCM/NoPadding`), y la llave vive en `AndroidKeyStore`. Cumple el mismo objetivo, pero el nombre es distinto; conviene explicarlo al presentarlo.

`AsyncStorage` solo se usa para saber si ya se vio el onboarding, que no es un dato sensible ([onboarding.ts:3](../../src/shared/storage/onboarding.ts#L3)).

### Lo que falta: certificate pinning

Sin pinning, un certificado falso que el dispositivo acepte como válido permitiría interceptar el tráfico.

Agregarlo implica:
1. Un módulo nativo o una configuración de red de Android, y por lo tanto un build nuevo.
2. Fijar el hash SHA-256 de la llave del servidor, más al menos un hash de respaldo.
3. Decidir qué pasa cuando Railway renueve el certificado: un pin mal elegido dejaría a la app sin conexión hasta publicar otra versión.
4. Probar en un dispositivo una conexión válida y una rechazada.

**Pendiente de decisión:** el código se congela el 12/11/2026. Si no se implementa antes, queda como limitación conocida. Hay que elegir y verificar la librería para Expo SDK 58.

## Criterio 3: derechos ARCO

**Evidencia exigida:** pantallas y endpoints `GET/PUT/DELETE /profile`, switches de Opt-Out y consentimiento explícito con Aviso de Privacidad.

| Derecho | Estado | Backend | App |
|---|---|---|---|
| **Acceso** | Sí | `GET /profile` | [personal-data.tsx:32](../../src/app/profile/personal-data.tsx#L32) |
| **Rectificación** | Sí | `PUT /profile` | [personal-data.tsx:68](../../src/app/profile/personal-data.tsx#L68) |
| **Cancelación** | Sí, en la app | `DELETE /profile` | [delete-account.tsx](../../src/app/profile/delete-account.tsx) |
| **Oposición** | Sí, por correo y push | `GET` y `PUT /notifications/preferences` | [PreferencesCard.tsx:33-45](../../src/features/notifications/components/PreferencesCard.tsx#L33-L45) |
| **Consentimiento** | Sí, al registrarse | No se guarda | [register.tsx:264-307](<../../src/app/(auth)/register.tsx#L264-L307>) |

Los endpoints de perfil exigen sesión (`authenticateToken` en `syscom-backend/src/modules/profile/routes.ts`).

### Cancelación

`DELETE /profile` exige la contraseña, solo aplica al rol `usuario` y se rechaza si hay pedidos o servicios en curso. El registro del usuario no se borra, porque los pedidos lo referencian:

| Qué pasa | Datos |
|---|---|
| Se borran | Favoritos, carrito, reseñas, notificaciones, tokens de push, 2FA, códigos, preferencias, chats, incidencias, segmento, suscripción al boletín y foto |
| Se anonimizan | Nombre, correo, teléfono y contraseña del usuario; calle, colonia y referencias de sus direcciones; descripciones de sus servicios; mensajes del chat en vivo |
| Se conservan | Pedidos, pagos y redenciones de promociones; ciudad, estado y código postal de las direcciones |

La cuenta queda inactiva, así que el token deja de servir y el login se rechaza. El correo queda libre para registrarse otra vez. La opción existe solo en la app, no en el sitio web.

### Oposición

Es un esquema **Opt-Out**: el correo y el push vienen activados por defecto (`@default(true)` en `preferencias_notificacion`) y el usuario los apaga en Mi cuenta > Notificaciones.

- **App:** los dos interruptores ([PreferencesCard.tsx:33-45](../../src/features/notifications/components/PreferencesCard.tsx#L33-L45)) leen y guardan con `GET` y `PUT /notifications/preferences` ([notificationRepository.ts:33-41](../../src/features/notifications/repositories/notificationRepository.ts#L33-L41)).
- **Backend:** antes de enviar, revisa la preferencia de cada canal en `notifications.service.ts`: pedido confirmado ([L352-L353](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/notifications/notifications.service.ts#L352-L353)), cambio de estado del pedido ([L396-L397](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/notifications/notifications.service.ts#L396-L397)) y promociones ([L550-L551](https://github.com/AngeloMtz/syscom-backend/blob/28ae22e/src/modules/notifications/notifications.service.ts#L550-L551)). El repositorio del backend es privado.

El boletín es una suscripción aparte y no depende de estos interruptores.

### Consentimiento

- La casilla empieza sin marcar ([register.tsx:45](<../../src/app/(auth)/register.tsx#L45>)) y el botón de registro queda bloqueado hasta marcarla ([register.tsx:307](<../../src/app/(auth)/register.tsx#L307>)).
- El texto "Acepto los Términos y Condiciones de uso del servicio y la Política de privacidad" enlaza a cada documento ([register.tsx:285](<../../src/app/(auth)/register.tsx#L285>) y [register.tsx:294](<../../src/app/(auth)/register.tsx#L294>)), y la pantalla de políticas abre la sección elegida ([policies.tsx:24-27](../../src/app/policies.tsx#L24-L27)).
- Los dos documentos tienen contenido publicado. Se administran desde el panel web y la app los obtiene de `/institutional/politicas/:tipo`.
- El backend no registra cuándo ni qué versión se aceptó: `schema.prisma` no tiene un campo de consentimiento.

### Lo que falta

| Falta | Dónde | Nota |
|---|---|---|
| Eliminar la cuenta desde la web | Sitio web | Google Play también pide un enlace web para solicitarlo |
| Registro del consentimiento (opcional) | Backend y base de datos | Guardar la fecha y la versión aceptada; requiere una columna nueva |
