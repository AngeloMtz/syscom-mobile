# Reporte de pruebas — Sprint 4

- **Fecha:** 2026-10-25
- **Ramas:** `test/37-38-unitarias-estatico-sprint4` (PR 1) y `test/39-integracion-sprint4` (PR 2)
- **Historias cubiertas:** #16–#18 (Realidad Aumentada, notificaciones push, chatbot de soporte). Como historias adicionales: #104 (Inicio), #105 (Información institucional) y #115 (Servicios)
- **Responsable de pruebas:** @AngeloMtz
- **Commit base:** `develop` en `b824bd5` para el PR 1 (incluye los PR #127, #132 y #133) y en `5be3bb8` para el PR 2 (incluye además el #136)

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK: 0 errores y 0 advertencias en ambos | #38 |
| Unitarias | 118 suites y 1498 pruebas pasan en la suite completa (58 son de integración); cobertura 99.08 % sentencias / 97.49 % ramas / 98.53 % funciones / 99.34 % líneas | #37 |
| Integración | 58/58 pasan con servicios simulados (AR, push y chatbot). La integración real con servicios externos queda PENDIENTE DE VALIDACIÓN MANUAL (sección 4) | #39 |
| Rendimiento | No aplica en este sprint | — |
| Aceptación (manual) | PENDIENTE (PR 3) | #40 |

Los resultados de las secciones 2 y 3 son de la ejecución local sobre esta rama.

## 2. Análisis estático (#38)

| Comando | Resultado | Evidencia |
|---|---|---|
| `npx expo lint --no-cache` | exit 0, sin errores ni advertencias | [lint.txt](evidencia/sprint-4/lint.txt) |
| `npx tsc --noEmit` | exit 0, sin errores | [tsc.txt](evidencia/sprint-4/tsc.txt) |

## 3. Pruebas unitarias (#37)

`npx jest --ci --coverage`: **118 suites, 1498 pruebas, todas pasan** (exit 0, 12 s). Incluye las pruebas de sprints anteriores y las 58 de integración de la sección 4. Salida completa en [jest.txt](evidencia/sprint-4/jest.txt).

| Métrica global | Obtenida | Umbral |
|---|---|---|
| Sentencias | 99.08 % | 80 % |
| Ramas | 97.49 % | 70 % |
| Funciones | 98.53 % | 80 % |
| Líneas | 99.34 % | 80 % |

### Pruebas nuevas del PR 1 (48)

Componentes que no tenían prueba. Se agregaron a `collectCoverageFrom`; no se cambió código de producción.

| Componente | Archivo de prueba (`src/__tests__/components/`) | Pruebas | Cobertura de líneas |
|---|---|---|---|
| `NotificationCard` | `NotificationComponents.test.tsx` | 10 | 100 % |
| `PreferencesCard` | `NotificationComponents.test.tsx` | 8 | 100 % |
| `ChatFab` | `ChatFab.test.tsx` | 10 | 100 % |
| `ARButton` | `ARButton.test.tsx` | 9 | 100 % |
| `BannerCarousel` | `BannerCarousel.test.tsx` | 11 | 100 % |

Se comprobó que las pruebas detectan cambios en el código: se alteró a propósito cada una de estas líneas y la prueba correspondiente falló; el código se restauró cada vez.

| Cambio hecho a propósito | Prueba que falló |
|---|---|
| `BannerCarousel`: no limpiar el temporizador al desmontar | "al desmontar deja de rotar" y "si las imágenes pasan a ser una sola…" |
| `BannerCarousel`: no volver al primer banner al llegar al último | "al llegar al último banner vuelve al primero" |
| `ChatFab`: no ocultarlo en el carrito | "se oculta en el carrito…" y "reacciona al cambio de pantalla…" |
| `NotificationCard`: invertir el punto de "sin leer" | "una notificación sin leer lo anuncia…" y "una notificación leída no dice…" |
| `PreferencesCard`: no aplicar el cambio del interruptor | "al cambiar push guarda…" y "al cambiar correo guarda…" |
| `ARButton`: mostrarlo aunque no haya ningún modelo | "un producto sin modelos 3D no muestra el botón" |

### Trazabilidad historia → funciones → pruebas

| Historia | Funciones (archivo fuente) | Prueba (`src/__tests__/`) | Pruebas | Estado |
|---|---|---|---|---|
| #16 AR | `selectProductModels`, `isARAvailable`, `hasAnyModel`, `buildSceneViewerUrl` (`ar/selectors.ts`) | `arSelectors.test.ts` | 14 | Con prueba |
| #16 | `buildModelViewerHtml` (`ar/modelViewerHtml.ts`) | `modelViewerHtml.test.ts` | 5 | Con prueba |
| #16 | `modelsRepository.getByProductId` | `modelsRepository.test.ts` | 4 | Con prueba |
| #16 | `useProductModels` | `useProductModels.test.tsx` | 4 | Con prueba |
| #16 | `ARButton` | `components/ARButton.test.tsx` | 9 | Con prueba |
| #16 | `ModelViewer3D` (WebView) y la pantalla `/viewer3d` | — | 0 | Sin prueba automática |
| #17 Push | `configureAndroidChannel`, `ensurePushPermission`, `getExpoPushToken` (`notifications/pushNotifications.ts`, con `expo-notifications` simulado) | `pushNotifications.test.ts` | 9 | Con prueba |
| #17 | `useRegisterPushToken` | `useRegisterPushToken.test.tsx` | 5 | Con prueba |
| #17 | `notificationRepository` | `notificationRepository.test.ts` | 16 | Con prueba |
| #17 | `flattenNotifications`, `getNextNotificationsPage`, `markAsReadInPages`, `countUnread`, `findNotificationById`, `getNotificationTypeInfo`, `timeAgo` (`notifications/notificationSelectors.ts`) | `notificationSelectors.test.ts` | 22 | Con prueba |
| #17 | `useNotifications`, `useNotificationDetail`, `useMarkNotificationsRead`, `useNotificationPreferences` | `useNotifications.test.tsx`, `useNotificationDetail.test.tsx`, `useMarkNotificationsRead.test.tsx`, `useNotificationPreferences.test.tsx` | 5 + 2 + 5 + 6 | Con prueba |
| #17 | `NotificationCard`, `PreferencesCard` | `components/NotificationComponents.test.tsx` | 10 + 8 | Con prueba |
| #17 y #18 | `useLogout` (desregistra el token de push y borra la conversación del chatbot) | `useLogout.test.tsx` | 4 | Con prueba |
| #18 Chatbot | `shouldShowChatFab`, `parseChatText` (`chatbot/chatSelectors.ts`) | `chatSelectors.test.ts` | 12 | Con prueba |
| #18 | `chatStore` | `chatStore.test.ts` | 5 | Con prueba |
| #18 | `validateChatMessage` (`chatbot/validation.ts`) | `chatValidation.test.ts` | 5 | Con prueba |
| #18 | `chatbotRepository.sendMessage` | `chatbotRepository.test.ts` | 6 | Con prueba |
| #18 | `useChatbot` | `useChatbot.test.tsx` | 9 | Con prueba |
| #18 | `ChatBubble`, `ChatComposer` | `components/ChatComponents.test.tsx` | 16 | Con prueba |
| #18 | `ChatFab` | `components/ChatFab.test.tsx` | 10 | Con prueba |
| #18 | `liveChatGateway` (Socket.io simulado) | `liveChatGateway.test.ts` | 20 | Con prueba |
| #18 | `liveChatReducer` | `liveChatReducer.test.ts` | 15 | Con prueba |
| #18 | `liveChatSelectors` | `liveChatSelectors.test.ts` | 18 | Con prueba |
| #18 | `validateGuest`, `validateLiveMessage` (`chatbot/liveChat/validation.ts`) | `liveChatValidation.test.ts` | 7 | Con prueba |
| #18 | `useLiveChat` | `useLiveChat.test.tsx` | 18 | Con prueba |
| #18 | `LiveGuestForm`, `LiveMessageBubble` | `components/LiveChatComponents.test.tsx` | 6 | Con prueba |
| #18 | Pantallas `chatbot.tsx` y `live-chat.tsx` | — | 0 | Sin prueba automática |
| #104 Inicio (adicional) | `brandRepository`, `useBrands` | `brandRepository.test.ts`, `useBrands.test.tsx` | 3 + 2 | Con prueba |
| #104 | `productRepository.getFeatured` y filtro `id_marca` | `productRepository.test.ts` | 14 (del archivo completo) | Con prueba |
| #104 | `useFeaturedProducts`, `useProductsPreview` | `useFeaturedProducts.test.tsx`, `useProductsPreview.test.tsx` | 2 + 2 | Con prueba |
| #104 | `institutionalRepository` (banners) y `useInstitutional` | `institutionalRepository.test.ts`, `useInstitutional.test.tsx` | 13 + 10 | Con prueba |
| #104 | `resolveAssetUrl` (`shared/utils/url.ts`) | `url.test.ts` | 5 | Con prueba |
| #104 | `BannerCarousel` | `components/BannerCarousel.test.tsx` | 11 | Con prueba |
| #104 | Pantalla de Inicio (`(tabs)/index.tsx`) | — | 0 | Sin prueba automática |
| #105 Información (adicional) | `institutionalRepository` y `useInstitutional` (contenido, preguntas frecuentes, boletín) | `institutionalRepository.test.ts`, `useInstitutional.test.tsx` | (ver #104) | Con prueba |
| #105 | `decodeEntities`, `parseHtmlBlocks`, `parseHtmlInline` (`shared/utils/html.ts`) | `html.test.ts` | 9 | Con prueba |
| #105 | Pantallas `informacion`, `about`, `faqs`, `policies` y `contact` | — | 0 | Sin prueba automática |
| #115 Servicios (adicional) | `serviceRepository` | `serviceRepository.test.ts` | 8 | Con prueba |
| #115 | `getServiceImageUrl`, `getServicePrice`, `getServiceGalleryUrls` (`services/selectors.ts`) | `servicesSelectors.test.ts` | 10 | Con prueba |
| #115 | Funciones de zoom de la galería (`services/gallery.ts`) | `serviceGallery.test.ts` | 15 | Con prueba |
| #115 | `useService`, `useServices`, `useServicesPreview` | `useService.test.tsx`, `useServices.test.tsx`, `useServicesPreview.test.tsx` | 4 + 4 + 2 | Con prueba |
| #115 | Componentes `ServiceGallery`, `ZoomableImage`, `ImageZoomModal` y las pantallas de servicios | — | 0 | Sin prueba automática |

### Qué quedó fuera
- Las pantallas de `src/app/` no tienen pruebas automáticas (mismo criterio que en los sprints anteriores); las cubre la aceptación manual.
- Sin prueba automática: `ModelViewer3D`, `ServiceGallery`, `ZoomableImage` e `ImageZoomModal`, y no están en `collectCoverageFrom`.

## 4. Pruebas de integración (#39)

Piezas reales: cliente Axios con sus interceptores, repositorios, hooks, caché de TanStack Query, stores y las pantallas o componentes. Solo se simula lo externo: el `adapter` de Axios, `expo-notifications`, `expo-constants` y `expo-router`, el WebView, `expo-web-browser` y `Linking`, y `socket.io-client` (con un socket falso que reproduce el protocolo del namespace `/contact`). **No se usó red real, producción, dispositivo ni credenciales.** Archivos en `src/__tests__/integration/` (no están en `collectCoverageFrom`, a propósito).

| Archivo | Flujo | Pruebas | Resultado |
|---|---|---|---|
| `realidadAumentada.test.tsx` | #16: `ARButton` → `useProductModels` → `modelsRepository` → `Viewer3DScreen` | 12 | OK |
| `notificacionesPush.test.tsx` | #17: permiso → token → registro en el backend → cierre de sesión → bandeja y preferencias (`NotificationsScreen`) | 21 | OK |
| `chatbotYChatEnVivo.test.tsx` | #18: asistente (`ChatbotScreen`, HTTP) y chat en vivo (`LiveChatScreen`, Socket.io) | 25 | OK |

Total: **58 pruebas, 58 pasan** (salida en [jest.txt](evidencia/sprint-4/jest.txt)).

### Qué cubre cada flujo
| Flujo | Casos |
|---|---|
| AR | Android con glb y usdz (visor con el modelo y Scene Viewer con la URL codificada y el título); iOS (Quick Look con el usdz); rutas relativas del catálogo que llegan como URL absoluta; solo un formato (se ve el modelo 3D pero no "Ver en tu espacio"); fallo al abrir la RA (el visor sigue); producto sin modelos, 404 y error 500 de carga (no hay botón); visor sin modelo en los parámetros (explica y permite volver); petición pública (sin credenciales) y una sola consulta para dos botones del mismo producto |
| Push | Sin sesión (no pide permiso ni toca el backend); permiso concedido, preguntado y concedido, denegado, y rechazado antes sin poder volver a preguntar; sin `projectId` de EAS; token que Expo no entrega; backend que falla (500 o sin red) con reintento en el siguiente inicio de sesión; cierre de sesión (desregistra el token antes de borrar la sesión, aunque el backend falle, y borra la conversación del chatbot); bandeja y preferencias (cambio inmediato y guardado de las dos, rechazo del servidor con vuelta al valor anterior, marcar una o todas como leídas, error con "Reintentar", vacío y sin sesión) |
| Chatbot | Asistente: saludo y sugerencias, historial en orden con una sola sesión, historial al reabrir el chat y borrado al cerrar sesión, nombre y credencial solo con sesión, error con "Reintentar envío" sin duplicar el mensaje, respuesta vacía, escalamiento a una persona, mensaje vacío y una sola petición en curso. Chat en vivo: conexión con token por websocket, fila, asesor, mensajes en ambos sentidos, "escribiendo…", aviso de inactividad y "Sigo aquí", pérdida de conexión y reanudación con el historial, reconexión agotada con "Reintentar", error del servidor, fuera de horario y sin asesores, cierre por el asesor y nueva conversación, "Terminar chat", "Salir de la fila", salir de la pantalla, mensajes tardíos tras terminar e invitado con nombre y correo |

### Comprobación de que las pruebas detectan cambios
Se alteró a propósito el código de producción en 25 puntos (se restauró cada vez). En 24 falló al menos una prueba; la restante no se detecta por pantalla.

| Suite | Cambios hechos a propósito | Detectados |
|---|---|---|
| AR | no codificar la URL del glb en `buildSceneViewerUrl`; mostrar el botón sin comprobar que hay modelos; no resolver rutas relativas; desactivar Quick Look en iOS; pasar el usdz como glb; poner `staleTime` en 0 | 6 de 6 |
| Push | no respetar "no volver a preguntar"; registrar aunque el permiso se niegue; no borrar el chat al cerrar sesión; no desregistrar el token; quitar el cambio inmediato de la preferencia; mandar solo un campo al guardar preferencias; no marcar leída en la caché; cambiar la ruta de registro | 8 de 8 |
| Chatbot | `transports` de websocket a polling; no mandar `existingConversationId` al reconectar; no emitir `chat:leave`; quitar el aviso de conexión perdida; no mandar `nombreUsuario`; no marcar el escalamiento; no reutilizar el `sessionId`; no terminar la conversación al salir de la pantalla; no marcar el mensaje fallido; aceptar eventos después de cerrar; quitar el aviso de "Espera la respuesta anterior." de `useChatbot` | 10 de 11 |

El cambio no detectado es el último: `ChatComposer` ya bloquea el envío mientras llega la respuesta, así que desde la pantalla hay dos barreras y quitar solo la de `useChatbot` no cambia el resultado visible (esa barrera la cubre la prueba unitaria del hook).

### PENDIENTE DE VALIDACIÓN MANUAL
Lo que depende de servicios externos reales no se puede probar con servicios simulados y queda pendiente. Hay que hacerlo en un dispositivo, con una cuenta de prueba.

| Flujo | Qué falta | Cómo probarlo | Resultado esperado |
|---|---|---|---|
| Push en dispositivo físico | Entrega real por Expo Push y Firebase, y el permiso del sistema | 1. Instalar una development build de EAS con `google-services.json`. 2. Iniciar sesión y conceder el permiso cuando el sistema lo pida. 3. Enviar una promoción. 4. Poner la app en segundo plano o cerrada y enviar otra. 5. Desactivar "Notificaciones push" en Notificaciones y enviar otra. 6. Cerrar sesión y enviar otra | Llegan las dos primeras; no llegan la tercera ni la de después de cerrar sesión. El token queda registrado al iniciar sesión y desactivado al cerrarla |
| Push por cambio de estado del pedido | El envío al cambiar el estado de un pedido (hoy solo se validó la promoción) | Con un pedido de la cuenta de prueba, cambiar su estado (por ejemplo, desde el panel de administración) | Llega una notificación de tipo "Pedido" y aparece en la bandeja |
| AR en cámara | La cámara, ARCore o Scene Viewer (Android) y Quick Look (iOS) | 1. Abrir en el celular un producto que tenga modelo 3D. 2. Tocar "Ver en Realidad Aumentada" y comprobar que el modelo se puede girar. 3. Tocar "Ver en tu espacio" y colocar el modelo en una superficie. 4. Repetir con un producto sin modelo | Se abre la cámara con el modelo en el espacio; el producto sin modelo no muestra el botón. En iOS (sin probar hasta ahora) debe abrir Quick Look con el usdz |
| Chatbot contra el backend real | La calidad de las respuestas reales y el servidor Socket.io | 1. Abrir el asistente y preguntar por productos, horarios y servicios. 2. Pedir hablar con una persona y comprobar el aviso. 3. Con un asesor conectado, iniciar el chat en vivo e intercambiar mensajes. 4. Sin asesores, o fuera de horario, iniciar el chat. 5. Con el chat activo, activar el modo avión unos segundos y desactivarlo | Respuestas del bot y escalamiento correctos; el chat en vivo conecta con el asesor y la conversación se reanuda tras la pérdida de conexión; sin asesores o fuera de horario se explica y se muestra el horario |

Límite: las formas de las respuestas que reproducen los servidores falsos salen del código de la app y del backend; estas pruebas no las contrastaron con respuestas reales.

## 5. Pruebas de aceptación (manuales) (#40)

PENDIENTE (PR 3).

## 6. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| 1 | `tsc` marcaba `Cannot find name 'global'` en la prueba nueva de `BannerCarousel` | El proyecto no tiene `@types/node`, así que `global` no existe para TypeScript | Se usa `globalThis` en la prueba. Se detectó antes de confirmar el commit | `e2e3e8c` |
| 2 | En la primera corrida completa de Jest fallaron 8 pruebas en 7 suites por tiempo límite (suites de 64 a 77 s) | Intermitente: al repetir la suite completa pasaron las 1440 pruebas en 41 s. Es el patrón del issue #129; la causa no se midió | Sin cambio de código | — |

| 3 | En las pruebas de integración del chatbot, varias pruebas fallaban en cadena | Dos errores de las propias pruebas: el contador de UUID del mock era global (los ids dependían del orden) y se llamó a `act()` sin `await` (en Testing Library 14 es asíncrono), lo que contaminaba las pruebas siguientes | Contador reiniciado en cada prueba y `await act(...)` | `084d99a` |
| 4 | En las pruebas de integración de push, 4 pruebas no leían el estado de los interruptores | En Android el `Switch` nativo expone `on` y `enabled` en lugar de `value` y `disabled` | La prueba lee ambos nombres | `979aa80` |
| 5 | Al alterar el código a propósito, una corrida de Jest se quedó colgada | La prueba del cambio inmediato de preferencias dejaba retenida la respuesta del backend falso si fallaba antes de liberarla | La compuerta se libera siempre en `afterEach` | `979aa80` |

No se encontraron fallos en código de producción con estas pruebas.

## 7. Límites conocidos

- **iOS sin probar:** la validación manual de AR, notificaciones y chatbot se hizo en Android.
- **Push por cambio de estado del pedido sin validar:** solo se probó el envío de una promoción.
- **El toque sobre la notificación no está manejado:** no hay un manejador del toque sobre una notificación (no se encontró `addNotificationResponseReceivedListener` en `src`).
- **Numeración #115/#116:** el issue de Servicios es el #115, pero el PR #118, su commit y los archivos de evidencia (`hu116-*`) usan #116, que no existe.
- **Capturas faltantes u obsoletas:** `hu105-servicios.jpeg` muestra el marcador "Esta sección estará disponible próximamente" de antes de que existiera Servicios. Según los nombres de los archivos, no hay captura de: el permiso de notificaciones (#17), políticas ni preguntas frecuentes (#105), el resultado de los botones de llamada, correo y WhatsApp (#105), carga, vacío y recarga por arrastre de Inicio (#104), ni paginación, carga y vacío de Servicios (#115).

## 8. Pendientes

| Pendiente | Dónde |
|---|---|
| Validación manual de la integración real: push en dispositivo físico, push por cambio de estado del pedido, AR en cámara y chatbot contra el backend real (sección 4) | PENDIENTE DE VALIDACIÓN MANUAL |
| Pruebas de aceptación (#40) | PENDIENTE (PR 3) |

## 9. Evidencia

Archivos en `docs/pruebas/evidencia/sprint-4/`: `lint.txt`, `tsc.txt` y `jest.txt` (esta ejecución), además de las capturas de las historias (`hu16-*`, `hu17-*`, `hu18-*`, `hu104-*`, `hu105-*` y `hu116-*`).
