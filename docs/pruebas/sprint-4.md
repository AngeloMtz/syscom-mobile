# Reporte de pruebas — Sprint 4

- **Fecha:** 2026-10-25
- **Ramas:** `test/37-38-unitarias-estatico-sprint4` (PR 1), `test/39-integracion-sprint4` (PR 2) y `test/40-aceptacion-sprint4` (PR 3)
- **Historias cubiertas:** #16–#18 (Realidad Aumentada, notificaciones push, chatbot de soporte). Como historias adicionales: #104 (Inicio), #105 (Información institucional) y #115 (Servicios)
- **Responsable de pruebas:** @AngeloMtz
- **Commit base:** `develop` en `b824bd5` para el PR 1 (incluye los PR #127, #132 y #133) en `5be3bb8` para el PR 2 (incluye además el #136) y en `29795b3` para el PR 3 (incluye además #139 y #140)

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK: 0 errores y 0 advertencias en ambos | #38 |
| Unitarias | 118 suites y 1498 pruebas pasan en la suite completa (58 son de integración); cobertura 99.08 % sentencias / 97.49 % ramas / 98.53 % funciones / 99.34 % líneas | #37 |
| Integración | 58/58 pasan con servicios simulados (AR, push y chatbot). La integración real con servicios externos queda PENDIENTE DE VALIDACIÓN MANUAL (sección 4) | #39 |
| Rendimiento | No aplica en este sprint | — |
| Aceptación (manual) | **NO PROBADO** en los 24 criterios de #16, #17, #18, #104, #105 y #115 (0 Cumple, 0 No cumple, 0 Parcial). PENDIENTE DE VALIDACIÓN MANUAL (sección 5) | #40 |

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

Nota (PR 3): la fila de push por cambio de estado del pedido depende de que el backend lo envíe; el equipo indicó que hoy no lo envía (límite conocido, sección 7).

## 5. Pruebas de aceptación (manuales) (#40)

- **Quién:** las pruebas de aceptación son manuales y las ejecuta Angel (@AngeloMtz).
- **Resultado:** **ninguna se ejecutó.** De los 24 criterios de las historias #16, #17, #18 y de las adicionales #104, #105 y #115: **0 Cumple, 0 No cumple, 0 Parcial y 24 NO PROBADO.** Todo lo NO PROBADO queda como PENDIENTE DE VALIDACIÓN MANUAL.
- Los resultados de la tabla son los que dictó Angel; Claude no ejecutó ni asumió ninguno. El texto de los criterios es el de los issues.
- **En este PR no se agregan capturas nuevas.** La columna "Evidencia existente" se llenó solo por el **nombre del archivo**: no se abrieron las imágenes para este reporte, así que no se afirma qué muestran.

| Historia | Criterio (texto del issue) | Resultado | Evidencia existente (por nombre de archivo) | Nota |
|---|---|---|---|---|
| #16 | Botón "Ver en AR" abre la cámara con el modelo del producto | NO PROBADO | `hu16-boton-ar.jpeg`, `hu16-visor-3d.jpeg`, `hu16-ar-escena.jpeg` | Existen capturas con esos nombres, pero el resultado de aceptación de este criterio es NO PROBADO. |
| #16 | Funciona en al menos un producto de prueba | NO PROBADO | `hu16-ar-escena.jpeg` | Existe una captura con ese nombre, pero el resultado de aceptación es NO PROBADO. Falta `hu16-sin-modelo` (no tomada). |
| #17 | Usuario recibe notificación de prueba al cambiar estado de un pedido | NO PROBADO | `hu17-push-recibido.jpeg` (por el nombre: una notificación push recibida; el nombre no dice que sea por un cambio de estado de pedido) | NO PROBADO. Límite conocido: el backend no envía push al cambiar el estado. Falta `hu17-cambio-estado-pedido` (no tomada). |
| #17 | Permiso de notificaciones se solicita correctamente | NO PROBADO | Ninguna | NO PROBADO. Falta `hu17-permiso-notificaciones` (no tomada). |
| #18 | Usuario puede enviar mensaje y recibir respuesta del chatbot | NO PROBADO | `hu18-chat-saludo.jpeg`, `hu18-chat-respuesta.jpeg` | Existen capturas con esos nombres, pero el resultado de aceptación es NO PROBADO. |
| #18 | Historial de conversación visible durante la sesión | NO PROBADO | Ninguna | NO PROBADO. Falta `hu18-chat-historial` (no tomada). |
| #104 | La pestaña Inicio muestra un carrusel de promociones que se puede deslizar | NO PROBADO | `hu104-carrusel.jpeg` | NO PROBADO. |
| #104 | Muestra una sección de productos destacados y, al tocar uno, abre su detalle | NO PROBADO | Ninguna con un nombre que lo indique (`hu104-contacto-productos.jpeg` menciona productos, pero por el nombre no se sabe si ilustra los destacados) | NO PROBADO. |
| #104 | Muestra las marcas que maneja SYSCOM y, al tocar una, abre el catálogo de esa marca | NO PROBADO | `hu104-categorias-marcas.jpeg`, `hu104-marca-catalogo.jpeg` | NO PROBADO. |
| #104 | Tiene estados de carga, error con "Reintentar" y vacío, y se puede actualizar jalando hacia abajo | NO PROBADO | `hu104-error.jpeg` (solo el estado de error; por los nombres no hay captura de carga, vacío ni de jalar para actualizar) | NO PROBADO. |
| #104 | Tiene un acceso visible a la información institucional (HU siguiente) | NO PROBADO | Ninguna | NO PROBADO. |
| #105 | Existe una sección "Información" accesible desde Perfil y desde Inicio | NO PROBADO | `hu105-acceso-perfil.jpeg`, `hu105-hub.jpeg`, `hu105-tabs.jpeg` (por los nombres; no se sabe si muestran el acceso desde Inicio) | NO PROBADO. |
| #105 | "Quiénes somos" muestra misión, visión y valores | NO PROBADO | `hu105-nosotros.jpeg` | NO PROBADO. |
| #105 | Muestra las políticas de SYSCOM (privacidad, envíos, devoluciones y garantía, según las que existan en el sitio) | NO PROBADO | Ninguna | NO PROBADO. Falta `hu105-politicas` (no tomada). |
| #105 | Las preguntas frecuentes se muestran en una lista que se expande al tocar cada una | NO PROBADO | Ninguna | NO PROBADO. Falta `hu105-faq` (no tomada). |
| #105 | Contacto muestra teléfono, correo y horario, con botones que abren la llamada, el correo o WhatsApp | NO PROBADO | `hu105-contacto.jpeg` (por el nombre; no dice si muestra los botones ni qué abren) | NO PROBADO. |
| #105 | Se puede volver atrás desde cada pantalla sin errores | NO PROBADO | Ninguna | NO PROBADO. |
| #115 | El listado muestra cada servicio con su imagen, nombre y duración estimada, con paginación al llegar al final | NO PROBADO | `hu116-listado.jpeg` (por los nombres no hay captura de la paginación) | NO PROBADO. Los archivos de evidencia usan `hu116` por la numeración #115/#116 (sección 7). |
| #115 | Se puede buscar un servicio por nombre | NO PROBADO | `hu116-busqueda.jpeg` | NO PROBADO. |
| #115 | Al tocar un servicio se abre su detalle: galería de imágenes, descripción, duración, garantía, qué incluye y pasos del proceso | NO PROBADO | `hu116-detalle.jpeg` | NO PROBADO. |
| #115 | Si el servicio tiene video, se puede reproducir o abrir desde el detalle; si no tiene, no se muestra la sección | NO PROBADO | Ninguna | NO PROBADO. Falta `hu116-detalle-video` (no tomada). |
| #115 | La pantalla de Inicio tiene una sección “Servicios” con acceso al listado completo | NO PROBADO | `hu116-home-servicios.jpeg` | NO PROBADO. |
| #115 | Tiene estados de carga, error con “Reintentar” y vacío, y se puede actualizar jalando hacia abajo | NO PROBADO | `hu116-error.jpeg` (solo el estado de error; por los nombres no hay captura de carga, vacío ni de jalar para actualizar) | NO PROBADO. |
| #115 | Las funciones nuevas incluyen sus pruebas unitarias en el mismo PR y el CI pasa | NO PROBADO | Ninguna | NO PROBADO. El resultado de #115 lo dictó el equipo como NO PROBADO; las pruebas unitarias de Servicios están en la sección 3. |

### Capturas existentes en `evidencia/sprint-4/` (vínculo solo por el nombre)
| Captura | Historia y criterio que ilustra, según su nombre |
|---|---|
| `hu16-boton-ar.jpeg`, `hu16-visor-3d.jpeg`, `hu16-ar-escena.jpeg` | #16: botón "Ver en AR", visor 3D y escena de AR |
| `hu17-push-recibido.jpeg` | #17: notificación push recibida (el nombre no dice que sea por cambio de estado de pedido) |
| `hu17-email-recibido.jpeg`, `hu17-inbox-notificaciones.jpeg`, `hu17-notificacion-detalle.jpeg`, `hu17-notificacion-leida.jpeg` | #17: correo, bandeja, detalle y notificación leída; por el nombre no corresponden a ninguno de los dos criterios del issue |
| `hu18-chat-saludo.jpeg`, `hu18-chat-respuesta.jpeg` | #18: saludo y respuesta del chatbot |
| `hu18-chat-asesor.jpeg`, `hu18-chat-sin-comunicacion.jpeg` | #18: chat con asesor y caso sin comunicación; por el nombre no corresponden a los criterios del issue |
| `hu104-carrusel.jpeg` | #104: carrusel |
| `hu104-categorias-marcas.jpeg`, `hu104-marca-catalogo.jpeg` | #104: marcas y catálogo de una marca |
| `hu104-contacto-productos.jpeg` | #104: contacto y productos; por el nombre no se sabe a qué criterio corresponde |
| `hu104-error.jpeg` | #104: estado de error |
| `hu105-acceso-perfil.jpeg`, `hu105-hub.jpeg`, `hu105-tabs.jpeg` | #105: acceso a la sección "Información" |
| `hu105-nosotros.jpeg` | #105: "Quiénes somos" |
| `hu105-contacto.jpeg` | #105: contacto |
| `hu105-servicios.jpeg` | Obsoleta: no corresponde a un criterio vigente (ver "no tomadas") |
| `hu116-listado.jpeg` | #115: listado de servicios |
| `hu116-busqueda.jpeg` | #115: búsqueda |
| `hu116-detalle.jpeg` | #115: detalle de un servicio |
| `hu116-home-servicios.jpeg` | #115: sección "Servicios" en Inicio |
| `hu116-error.jpeg` | #115: estado de error |

### Capturas no tomadas
Las que mencionó el reporte y no existen:
- `hu16-sin-modelo`
- `hu17-permiso-notificaciones`
- `hu17-cambio-estado-pedido`
- `hu18-chat-historial`
- `hu105-politicas`
- `hu105-faq`
- `hu116-detalle-video`
- La actualización de `hu105-servicios` (la actual está obsoleta).

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
- **Push por cambio de estado del pedido sin validar:** solo se probó el envío de una promoción. Límite conocido (dicho por el equipo): el backend no envía push al cambiar el estado del pedido.
- **El toque sobre la notificación no está manejado:** no hay un manejador del toque sobre una notificación (no se encontró `addNotificationResponseReceivedListener` en `src`).
- **Numeración #115/#116:** el issue de Servicios es el #115, pero el PR #118, su commit y los archivos de evidencia (`hu116-*`) usan #116, que no existe.
- **Capturas faltantes u obsoletas:** `hu105-servicios.jpeg` muestra el marcador "Esta sección estará disponible próximamente" de antes de que existiera Servicios. Según los nombres de los archivos, no hay captura de: el permiso de notificaciones (#17), políticas ni preguntas frecuentes (#105), el resultado de los botones de llamada, correo y WhatsApp (#105), carga, vacío y recarga por arrastre de Inicio (#104), ni paginación, carga y vacío de Servicios (#115).
- **Aceptación sin ejecutar:** los 24 criterios de #16, #17, #18, #104, #105 y #115 están NO PROBADOS (sección 5). Ninguna historia del sprint tiene validación de aceptación.
- **Capturas no tomadas:** las ocho de la lista de la sección 5.

## 8. Pendientes

| Pendiente | Dónde |
|---|---|
| Validación manual de la integración real: push en dispositivo físico, push por cambio de estado del pedido, AR en cámara y chatbot contra el backend real (sección 4) | PENDIENTE DE VALIDACIÓN MANUAL |
| Aceptación #16: los 2 criterios (botón "Ver en AR" abre la cámara con el modelo; funciona en al menos un producto de prueba) | NO PROBADO: PENDIENTE DE VALIDACIÓN MANUAL |
| Aceptación #17: los 2 criterios (notificación al cambiar estado de un pedido, con el límite de que el backend no envía push al cambiar el estado; permiso de notificaciones) | NO PROBADO: PENDIENTE DE VALIDACIÓN MANUAL |
| Aceptación #18: los 2 criterios (enviar mensaje y recibir respuesta; historial visible durante la sesión) | NO PROBADO: PENDIENTE DE VALIDACIÓN MANUAL |
| Aceptación #104 Inicio: los 5 criterios | NO PROBADO: PENDIENTE DE VALIDACIÓN MANUAL |
| Aceptación #105 Información: los 6 criterios | NO PROBADO: PENDIENTE DE VALIDACIÓN MANUAL |
| Aceptación #115 Servicios: los 7 criterios | NO PROBADO: PENDIENTE DE VALIDACIÓN MANUAL |
| Tomar las capturas no tomadas (sección 5) | Pendiente |

## 9. Evidencia

Archivos en `docs/pruebas/evidencia/sprint-4/`: `lint.txt`, `tsc.txt` y `jest.txt` (esta ejecución), además de las capturas de las historias (`hu16-*`, `hu17-*`, `hu18-*`, `hu104-*`, `hu105-*` y `hu116-*`).

## 10. Conclusión

- **Análisis estático:** lint y `tsc` sin errores ni advertencias.
- **Unitarias:** 118 suites y 1498 pruebas pasan, con 99.34 % de cobertura de líneas.
- **Integración:** 58/58 pasan con servicios simulados. La integración real con servicios externos (push en dispositivo físico, push por cambio de estado del pedido, AR en cámara y chatbot contra el backend real) está PENDIENTE DE VALIDACIÓN MANUAL.
- **Aceptación: no se ejecutó.** Los 24 criterios de #16, #17, #18, #104, #105 y #115 están NO PROBADOS; ninguno está Cumple, No cumple ni Parcial. Mientras no se ejecuten, las historias del sprint no tienen validación de aceptación.
- **Límites conocidos:** iOS sin probar; el backend no envía push al cambiar el estado del pedido; el toque sobre una notificación no está manejado; la numeración #115/#116; y las capturas no tomadas u obsoletas.
