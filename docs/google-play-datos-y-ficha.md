# Datos para Google Play — syscom-mobile

- **Fecha de elaboración:** 2026-11-06
- **Issue:** #198
- **Alcance:** solo documentación. No se modificó código, `app.config.js` ni `eas.json`.
- **Uso:** material de apoyo para llenar Play Console (política de privacidad, "Seguridad de los datos" y ficha). La política que se publica es [politica-de-privacidad.md](politica-de-privacidad.md).

## Convenciones

| Marca | Significa |
|---|---|
| **Verificado** | Comprobado en el código de este repositorio o del backend (`syscom-backend`), con archivo y línea |
| **No consta** | No hay evidencia en el código revisado |
| **Confirmar con Luis** | Depende del backend, de la base de datos o del despliegue y no se pudo comprobar desde el código |

Las referencias al backend son al clon local `syscom-backend` (rama con último commit `cc1177c`). Este documento **no contiene valores** de variables ni secretos, solo sus nombres.

---

## 1. Inventario de datos (con evidencia)

### 1.1 Cuenta

| Dato | Qué hace la app | Evidencia |
|---|---|---|
| Nombre, apellido paterno, apellido materno, correo, teléfono y contraseña | El formulario de registro los envía al backend (`POST /auth/register`). La contraseña viaja en el cuerpo de la petición | [types.ts:24-32](../src/features/auth/types.ts#L24-L32), [authRepository.ts:90](../src/features/auth/repositories/authRepository.ts#L90), campos en [register.tsx:139-215](../src/app/(auth)/register.tsx#L139-L215) |
| Código de verificación (correo) | Se pide un código enviado por correo para verificar el registro | [authRepository.ts:93](../src/features/auth/repositories/authRepository.ts#L93) |
| Inicio de sesión y 2FA | `POST /auth/login`; si la cuenta tiene 2FA, se pide un código y se envía con `POST /auth/verify-2fa-login`. La app **no** tiene pantalla para activar o desactivar el 2FA (solo lee `two_factor_enabled`) | [authRepository.ts:78-87](../src/features/auth/repositories/authRepository.ts#L78-L87), [profile/types.ts:16](../src/features/profile/types.ts#L16) |
| Recuperación de contraseña | Correo + método, código y nueva contraseña | [authRepository.ts:99-109](../src/features/auth/repositories/authRepository.ts#L99-L109) |
| Sesión (JWT) | Se guarda en el almacén seguro del sistema (Keychain/Keystore) bajo la clave `syscom.token` y se envía como `Bearer` | [secureToken.ts:11-25](../src/shared/api/secureToken.ts#L11-L25), [client.ts:98-101](../src/shared/api/client.ts#L98-L101) |
| Datos del perfil | Lectura (`GET /profile`) y edición de nombre, apellidos y teléfono (`PUT /profile`). El correo no se puede modificar | [profileRepository.ts:20-23](../src/features/profile/repositories/profileRepository.ts#L20-L23), [profile/types.ts:19-25](../src/features/profile/types.ts#L19-L25) |
| Foto de perfil | La app solo **muestra** `foto_perfil` si existe (por ejemplo en reseñas). No consta en la app ninguna pantalla ni llamada para subirla; el backend sí expone `POST/DELETE /profile/photo` | [profile/types.ts:14](../src/features/profile/types.ts#L14), [reviews/types.ts:7-11](../src/features/reviews/types.ts#L7-L11); backend: `modules/profile/routes.ts:103,109` |
| Contraseña en el backend | Se guarda como `password_hash` | backend: `prisma/schema.prisma` (modelo `usuarios`, campo `password_hash`) |

### 1.2 Direcciones, carrito, favoritos, pedidos y reseñas

| Dato | Qué hace la app | Evidencia |
|---|---|---|
| Direcciones de envío | Calle, colonia, ciudad, estado, código postal y referencias (opcional). Se listan, crean, editan y eliminan | [addresses/types.ts:6-15](../src/features/addresses/types.ts#L6-L15), [addressRepository.ts:31-46](../src/features/addresses/repositories/addressRepository.ts#L31-L46). El backend las elimina con *soft delete* (`modules/profile/routes.ts:75-77`) |
| Carrito y favoritos | Productos y cantidades asociados a la cuenta | [cartRepository.ts:38-84](../src/features/cart/repositories/cartRepository.ts#L38-L84), [favoriteRepository.ts:16-54](../src/features/favorites/repositories/favoriteRepository.ts#L16-L54) |
| Pedidos | Se consultan (`GET /orders`); incluyen método de pago y el identificador del PaymentIntent de Stripe | [orderRepository.ts:31-46](../src/features/orders/repositories/orderRepository.ts#L31-L46), [orders/types.ts:37-43](../src/features/orders/types.ts#L37-L43) |
| Reseñas | Calificación, título (opcional) y comentario, ligados a un pedido. Quedan pendientes hasta que un admin las apruebe; las aprobadas se muestran con el nombre, apellido paterno y foto del autor. La app no ofrece borrarlas | [reviewRepository.ts:81-91](../src/features/reviews/repositories/reviewRepository.ts#L81-L91), [reviews/types.ts:7-25](../src/features/reviews/types.ts#L7-L25) |

### 1.3 Pagos (Stripe)

**Qué envía la app al backend:** solo el `id_direccion` (`POST /payments/checkout`) y luego consulta `order-status` con el id del PaymentIntent. [paymentRepository.ts:26,35](../src/features/payments/repositories/paymentRepository.ts#L26)

**Qué captura Stripe:** los datos de la tarjeta se escriben en la hoja de pago (PaymentSheet) del SDK de Stripe, que los envía directamente a Stripe. La app recibe solo un `clientSecret` y un `paymentIntentId`; en el código de la app **no consta** ningún acceso al número de tarjeta, vencimiento o CVC. [usePayment.ts:148-153](../src/features/payments/hooks/usePayment.ts#L148-L153), [payments/types.ts:5-9](../src/features/payments/types.ts#L5-L9)

**Qué envía el backend a Stripe** (`paymentIntents.create`): monto en centavos, moneda `mxn`, `metadata` con `id_usuario` e `id_direccion`, y una descripción `Syscom — Checkout Usuario #<id>`. **No consta** que envíe nombre, correo, teléfono ni dirección en texto. Backend: `modules/payments/payments.service.ts:128-136`.

**Pedido:** lo crea el webhook de Stripe tras el pago exitoso, no la app. [paymentRepository.ts:1-4](../src/features/payments/repositories/paymentRepository.ts#L1-L4)

**Aviso en pantalla:** el checkout dice "Modo de pruebas: usa solo tarjetas de prueba de Stripe". [checkout.tsx:261](../src/app/checkout.tsx#L261). **Confirmar con Luis/Angel** si producción usa claves *live*; si no, la ficha y la política no deben prometer cobros reales.

**SDK de Stripe:** el SDK nativo puede recopilar datos del dispositivo por su cuenta (prevención de fraude). Eso no consta en el código de la app: **Confirmar** con la guía de Stripe para el formulario de seguridad de datos de Google Play antes de enviarlo.

### 1.4 Notificaciones push

| Aspecto | Evidencia |
|---|---|
| Tras iniciar sesión, la app configura el canal, **pide el permiso** de notificaciones y obtiene el **token de Expo Push** | [useRegisterPushToken.ts:20-26](../src/features/notifications/hooks/useRegisterPushToken.ts#L20-L26), [pushNotifications.ts:35-71](../src/features/notifications/pushNotifications.ts#L35-L71) |
| El token se envía al backend (`POST /notifications/push/expo/register`) y se desregistra al cerrar sesión (si hay conexión) | [notificationRepository.ts:45,49](../src/features/notifications/repositories/notificationRepository.ts#L45), [useLogout.ts:14-23](../src/features/auth/hooks/useLogout.ts#L14-L23), [pushRegistration.ts:7-10](../src/features/notifications/pushRegistration.ts#L7-L10) |
| El backend guarda el token ligado al usuario (`expo_push_tokens`, borrado en cascada si se elimina el usuario) | backend: `prisma/schema.prisma:174-184` |
| Para enviar, el backend llama al servicio de Expo (`https://exp.host/--/api/v2/push/send`) con título, cuerpo y datos de la notificación; en Android Expo lo entrega vía FCM | backend: `modules/notifications/notifications.service.ts:66-76`; [app.config.js:20](../app.config.js#L20) y `expo-notifications/android/build.gradle:43` (`firebase-messaging`) |
| El usuario puede apagar los canales correo y push | [PreferencesCard.tsx](../src/features/notifications/components/PreferencesCard.tsx), [notificationRepository.ts:34-41](../src/features/notifications/repositories/notificationRepository.ts#L34-L41) |
| Tipos de notificación | `pedido`, `stock` (solo admin) y `campana` (promociones): [notifications/types.ts:5](../src/features/notifications/types.ts#L5) |

### 1.5 Chatbot y chat en vivo

**Chatbot (asistente virtual)**

- La app envía a `POST /chatbot/message`: `sessionId` (UUID generado en el dispositivo), el **texto del mensaje** y, si hay sesión, el **nombre** del usuario. [chatbotRepository.ts:14-20](../src/features/chatbot/repositories/chatbotRepository.ts#L14-L20), [useChatbot.ts:17-22](../src/features/chatbot/hooks/useChatbot.ts#L17-L22), [chatStore.ts:1-4,33](../src/features/chatbot/chatStore.ts#L1-L4)
- El historial en el dispositivo vive solo en memoria y se borra al cerrar sesión. [chatStore.ts:50](../src/features/chatbot/chatStore.ts#L50)
- **Proveedor:** el backend usa **Groq** (API compatible con OpenAI, con la clave `GROQ_API_KEY` y el modelo de `CHATBOT_MODEL`). Backend: `modules/chatbot/chatbot.service.ts:11-21,350-351`. El nombre se añade al *system prompt*.
- El backend guarda el historial de la conversación por `sessionId` en `chatbot_sessions` (sin id de usuario). Backend: `prisma/schema.prisma:962-968`. **No consta** un plazo de conservación (**Confirmar con Luis**).
- Las herramientas del bot consultan catálogo, servicios, información de la empresa y disponibilidad (`chatbot.tools.ts`); no consta que consulten datos personales.

**Chat en vivo con asesores**

- Conexión Socket.io al backend. Con sesión se identifica con el JWT; **sin sesión pide nombre y correo** del invitado. Se envían los mensajes y, opcionalmente, el producto consultado. [liveChatGateway.ts:52-56,69-73,107](../src/features/chatbot/liveChat/liveChatGateway.ts#L52-L56), [liveChat/types.ts:39-42](../src/features/chatbot/liveChat/types.ts#L39-L42)
- El backend guarda las conversaciones (`conversaciones` con `nombre_invitado` y `correo_invitado`; `mensajes_conversacion` con `contenido`). Backend: `prisma/schema.prisma:840-877`. Plazo de conservación: **No consta**.

### 1.6 Boletín y contacto

- Boletín: nombre y correo (`POST /contact/newsletter`), voluntario, sin sesión. [institutionalRepository.ts:50](../src/features/institutional/repositories/institutionalRepository.ts#L50), [contact.tsx:107-119](../src/app/contact.tsx#L107-L119). Se guarda en `suscriptores_boletin` (backend, `prisma/schema.prisma:186`).
- Los botones de teléfono, WhatsApp, correo y mapa abren apps externas con los datos **de la empresa**; la app no envía datos del usuario. [contact.tsx:38-40,90](../src/app/contact.tsx#L38-L40)

### 1.7 Realidad aumentada y visor 3D

- El visor 3D es un `WebView` que carga el componente `<model-viewer>` desde `https://ajax.googleapis.com/…/model-viewer/3.5.0/` (Google) y el modelo `.glb`/`.usdz` del producto. Esa petición revela a esos servidores la IP y datos técnicos del dispositivo. [modelViewerHtml.ts:22](../src/features/ar/modelViewerHtml.ts#L22), [ModelViewer3D.tsx:14-26](../src/features/ar/components/ModelViewer3D.tsx#L14-L26)
- "Ver en tu espacio" en Android abre **Scene Viewer de Google** (`https://arvr.google.com/scene-viewer/1.0?file=<url del modelo>…`); en iOS abre el `.usdz` con Quick Look. [selectors.ts:46-49](../src/features/ar/selectors.ts#L46-L49), [viewer3d.tsx:29-37](../src/app/viewer3d.tsx#L29-L37)
- **La app no declara ni solicita el permiso de cámara** y no usa `expo-camera`. La cámara la usa el visor de RA de Google fuera de la app. (Comprobado: `package.json` y el manifiesto generado no contienen `CAMERA`.)

### 1.8 Ubicación, analítica, anuncios y otros

| Tema | Resultado | Evidencia |
|---|---|---|
| Ubicación (GPS) | **No consta.** No hay `expo-location` ni permisos de ubicación | `package.json`; manifiesto (sección 2) |
| Analítica | **No consta.** No hay SDK de analítica (Firebase Analytics, Sentry, etc.) | `package.json` |
| Anuncios / ID de publicidad | **No consta.** No hay SDK de anuncios ni permiso `AD_ID` en el manifiesto de la app | `package.json`; sección 2 |
| Contactos, fotos, archivos del usuario, micrófono | **No consta.** No hay `expo-contacts`, `expo-image-picker` ni `expo-media-library` | `package.json` |
| Almacenamiento local | JWT en almacén seguro (`syscom.token`); bandera `onboarding_completed` en AsyncStorage; la caché de consultas (TanStack Query) y el chat están en memoria y se limpian al cerrar sesión | [secureToken.ts:11](../src/shared/api/secureToken.ts#L11), [onboarding.ts:8](../src/shared/storage/onboarding.ts#L8), [authStore.ts:35-41](../src/shared/store/authStore.ts#L35-L41) |
| Imágenes de productos y servicios | URLs absolutas (Cloudinary) o relativas al backend | [url.ts:6](../src/shared/utils/url.ts#L6) |
| Cloudinary en el backend | Dependencia `cloudinary` y `multer-storage-cloudinary`; las fotos de perfil que se suben (desde la web/admin) van a Cloudinary | backend: `package.json`, `src/config/cloudinary.ts` |
| Correo transaccional | El backend envía códigos de verificación, 2FA y recuperación vía **Brevo** | backend: `package.json` (`@getbrevo/brevo`), `src/services/email.services.ts` |
| Base de datos y hosting | PostgreSQL en **Neon** (según `CLAUDE.md` del backend); despliegue en **Railway** (`railway.json`). **Confirmar con Luis** la configuración de producción | backend: `CLAUDE.md:10`, `railway.json` |
| Cifrado en tránsito | La URL del backend sale de `EXPO_PUBLIC_API_URL` (variable de EAS); su valor de producción no está en el repo. El manifiesto no habilita tráfico sin cifrar. **Confirmar** que la URL de producción es `https://` (y el socket `wss://`) | [client.ts:10-27](../src/shared/api/client.ts#L10-L27), [liveChatGateway.ts:52](../src/features/chatbot/liveChat/liveChatGateway.ts#L52) |
| Respaldo de Android | El manifiesto generado trae `allowBackup="true"` con reglas que excluyen el almacén seguro (`secure_store_backup_rules`) | manifiesto generado (sección 2) |
| Eliminar la cuenta | **No consta.** No hay pantalla ni `DELETE /profile` (el backend solo borra direcciones y foto) | [seguridad-y-arco.md](arquitectura/seguridad-y-arco.md) (criterio 3); backend: `modules/profile/routes.ts:37-109` |

> **Alerta para Play Console:** Google exige, a las apps que permiten crear una cuenta, ofrecer la eliminación de la cuenta desde la app y desde un enlace web. Hoy no consta ninguna de las dos. Esto ya está registrado como pendiente de decisión en [seguridad-y-arco.md](arquitectura/seguridad-y-arco.md). Requisito de Google: confirmarlo en la ayuda de Play Console antes de enviar (no se consultó en esta tarea).

---

## 2. Permisos de Android

### 2.1 Lo que declara el proyecto

`app.config.js` **no declara `android.permissions`** (líneas 17-28: solo `package`, `googleServicesFile`, iconos y `predictiveBackGestureEnabled`). Los permisos vienen de los plugins y de las librerías.

Manifiesto generado con `expo prebuild --platform android --no-install` en una copia temporal del proyecto (no se creó `android/` en el repo):

| Permiso | Origen | Para qué se usa |
|---|---|---|
| `INTERNET` | Plantilla de Expo / `expo-file-system` | Todas las llamadas al backend, Stripe, Expo Push y el visor 3D |
| `VIBRATE` | Plantilla de Expo | Vibración de React Native y de notificaciones |
| `READ_EXTERNAL_STORAGE` (`maxSdkVersion=32`) | Plantilla de Expo / `expo-file-system` | Acceso a archivos en Android 12 o anterior. **No consta** que el código de la app lo use directamente |
| `WRITE_EXTERNAL_STORAGE` (`maxSdkVersion=32`) | Plantilla de Expo / `expo-file-system` | Igual que el anterior |
| `SYSTEM_ALERT_WINDOW` | Plantilla de Expo | Superposiciones de la herramienta de desarrollo (`expo-dev-client`). **No consta** que la app lo use en producción |
| `POST_NOTIFICATIONS` | `expo-notifications` | Mostrar notificaciones (Android 13+); lo solicita [pushNotifications.ts:54](../src/features/notifications/pushNotifications.ts#L54) |
| `RECEIVE_BOOT_COMPLETED` | `expo-notifications` | Reprogramar notificaciones tras reiniciar el equipo |

Además, `firebase-messaging` (dependencia de `expo-notifications`) suele añadir al manifiesto combinado permisos de red/espera (por ejemplo `WAKE_LOCK`, `ACCESS_NETWORK_STATE` y el de recepción de FCM). **No se pudo comprobar** porque el manifiesto combinado solo existe tras compilar con Gradle.

### 2.2 Pendiente de validación manual

**PENDIENTE DE VALIDACIÓN MANUAL (Angel):** obtener el manifiesto **final** del AAB de producción y revisar la lista de permisos:

1. Descargar el `.aab` del build de producción de EAS.
2. Con `bundletool` (`bundletool dump manifest --bundle=app.aab`) o con Android Studio ("Analyze APK"), listar los `uses-permission`.
3. Comparar con la tabla anterior; si aparece `CAMERA`, `AD_ID`, ubicación u otro permiso sensible, avisar antes de enviar el formulario.
4. Play Console (Contenido de la app → Permisos) mostrará la misma lista tras subir el AAB.

---

## 3. Formulario "Seguridad de los datos" de Play Console

Columnas: **¿Se recoge?** = sale del dispositivo hacia un servidor (el nuestro o de un tercero). **¿Se comparte?** = se transfiere a un tercero que no actúa solo como proveedor de servicios en nombre de SYSCOM; el criterio final de "compartir" lo define Google y debe revisarse en la consola. **Cifrado en tránsito:** el código no envía datos en claro (HTTPS/WSS) siempre que `EXPO_PUBLIC_API_URL` de producción sea `https://` — **Confirmar con Luis/Angel**. **¿Se puede borrar?** se refiere a que el usuario pueda borrarlo.

| Tipo de dato (Play) | ¿Se recoge? | ¿Se comparte con terceros? | Obligatorio / opcional | Cifrado en tránsito | ¿Se puede borrar? |
|---|---|---|---|---|---|
| **Nombre** | Sí (registro, perfil, chat, boletín) | Sí al chatbot (nombre en el prompt a Groq, si hay sesión). Reseñas aprobadas lo muestran a otros usuarios | Obligatorio para crear cuenta | Sí* | Editable en la app; borrar la cuenta: **No consta** |
| **Correo electrónico** | Sí (registro, chat de invitado, boletín) | Brevo envía correos del backend (proveedor de servicios). **Confirmar con Luis** | Obligatorio para cuenta | Sí* | Cuenta: **No consta**. Boletín: baja con `token_baja` (**Confirmar con Luis**) |
| **Número de teléfono** | Sí (registro y perfil) | No consta | Obligatorio en el registro de la app | Sí* | Editable; borrar: **No consta** |
| **Dirección física** (envío) | Sí | No consta que se envíe a terceros (a Stripe solo va `id_direccion`) | Obligatorio para comprar | Sí* | Sí: la app elimina direcciones (*soft delete* en el backend; **Confirmar con Luis** si se purga) |
| **Información de usuario y cuenta: contraseña / identificadores** | Sí (contraseña, id de usuario, JWT) | No | Obligatorio | Sí* | Cuenta: **No consta** |
| **Historial de compras** | Sí (pedidos) | Stripe procesa el pago; el pedido en sí no se envía a terceros | Se genera al comprar | Sí* | **No consta** (los pedidos no se borran desde la app) |
| **Información de pago** (tarjeta) | **No pasa por la app ni por el backend**: la captura el SDK de Stripe. Declarar según la guía de Stripe para Play | Sí, Stripe | Obligatorio para pagar con tarjeta | Sí (Stripe) | Lo gestiona Stripe |
| **Mensajes en la app** (chatbot y chat en vivo) | Sí (texto de los mensajes) | Chatbot: Groq procesa el texto. Chat en vivo: no consta | Opcional | Sí* | **No consta** (borrado por el usuario); plazo: **Confirmar con Luis** |
| **Reseñas y calificaciones** (contenido generado por el usuario) | Sí | Se muestran públicamente tras aprobación | Opcional | Sí* | **No consta** (la app no permite borrarlas) |
| **Fotos** | No (la app no las sube; solo muestra `foto_perfil`) | — | — | — | El backend permite borrar la foto (`DELETE /profile/photo`); la app no |
| **ID de dispositivo u otros ID** | Sí: token de Expo Push (identificador del dispositivo para notificaciones) | Sí, Expo (servicio de envío) y Google (FCM) | Opcional (requiere permitir notificaciones) | Sí | Se desregistra al cerrar sesión (si hay conexión); **Confirmar con Luis** el borrado definitivo |
| **Ubicación** | No consta | — | — | — | — |
| **Contactos / calendario / archivos / micrófono** | No consta | — | — | — | — |
| **Cámara / vídeo** | La app **no** accede a la cámara (la RA la abre Google fuera de la app) | — | — | — | — |
| **Actividad en la app** (búsquedas, favoritos, carrito) | Sí, ligados a la cuenta | No consta | Funcional | Sí* | Carrito y favoritos: sí se pueden quitar |
| **Registros de fallos, rendimiento, analítica** | No consta (sin SDK de analítica) | — | — | — | — |
| **Datos de dispositivo técnicos hacia Google** (IP, al cargar `model-viewer` y Scene Viewer) | Sí, de forma incidental al abrir el visor 3D/RA | Sí, Google | Solo si se usa el visor 3D | Sí (https) | No aplica |

\* Confirmar que la URL de producción es `https://` (ver sección 1.8).

**Preguntas generales del formulario**

| Pregunta | Respuesta con lo que consta |
|---|---|
| ¿La app recoge o comparte datos de usuario? | Sí |
| ¿Todos los datos se cifran en tránsito? | Sí, **si** `EXPO_PUBLIC_API_URL` de producción es `https://`. **Confirmar con Luis/Angel** |
| ¿Ofrece al usuario una forma de solicitar la eliminación de sus datos? | **No consta** (ver alerta de la sección 1.8) |
| ¿Sigue la política de Familias? | No aplica: no hay evidencia de que la app sea para niños |

---

## 4. Textos de la ficha de Play Store

Solo funciones que existen en el código: catálogo y búsqueda, detalle de producto, visor 3D/RA, carrito, favoritos, pago con tarjeta (Stripe), pedidos, reseñas, direcciones, notificaciones, chatbot, chat en vivo, servicios, promociones y contacto.

### 4.1 Descripción corta (máx. 80 caracteres)

```
Catálogo, compras y servicios de SYSCOM desde tu celular, con vista 3D y RA.
```

(76 caracteres.)

### 4.2 Descripción larga

```
SYSCOM en tu celular: consulta el catálogo de productos tecnológicos, revisa promociones y compra desde la app.

QUÉ PUEDES HACER
• Explorar el catálogo por categorías y marcas, y buscar productos.
• Ver el detalle de cada producto, con su galería y sus reseñas.
• Ver los productos en 3D y, en equipos compatibles, "Ver en tu espacio" con realidad aumentada.
• Guardar tus favoritos y armar tu carrito.
• Pagar con tarjeta de forma segura con Stripe: los datos de tu tarjeta los procesa Stripe.
• Guardar tus direcciones de envío y consultar tus pedidos.
• Escribir reseñas de los productos que compraste.
• Conocer los servicios de SYSCOM y las promociones vigentes.
• Resolver dudas con el asistente virtual o hablar con un asesor en el chat en vivo.
• Recibir notificaciones sobre tus pedidos y promociones; tú decides qué canales activar.
• Proteger tu cuenta con verificación por correo y, si lo tienes activado, verificación en dos pasos.

TU PRIVACIDAD
Consulta nuestra política de privacidad en: <URL_POLITICA_DE_PRIVACIDAD>

CONTACTO
<CORREO_DE_CONTACTO>
```

Notas para quien publique:
- No se prometen funciones que no existen (por ejemplo, cobros en producción, mientras se confirme si Stripe está en modo *live*; ver sección 1.3).
- La política de privacidad debe estar publicada en una URL pública y se pega en Play Console; `<URL_POLITICA_DE_PRIVACIDAD>` queda por definir.

---

## 5. Pendientes antes de enviar a Google

| # | Pendiente | Responsable |
|---|---|---|
| 1 | Confirmar plazos de conservación (chatbot, chat en vivo, pedidos, tokens de push) | Luis |
| 2 | Confirmar que la URL de producción es `https://` y el socket `wss://` | Luis / Angel |
| 3 | Confirmar si Stripe en producción es *live* o *test* | Angel |
| 4 | Decidir la eliminación de cuenta (pantalla y `DELETE /profile`) o declararla como limitación | Equipo / Product Owner |
| 5 | Obtener el manifiesto final del AAB y validar permisos (sección 2.2) | Angel |
| 6 | Contrastar la tabla de la sección 3 con las guías de Stripe, Firebase y Expo para Data safety | Angel |
| 7 | Definir `<CORREO_DE_CONTACTO>`, `<FECHA>` y la URL pública de la política | Angel |
