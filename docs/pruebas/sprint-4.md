# Reporte de pruebas — Sprint 4

- **Fecha:** 2026-10-25 (aceptación manual dictada el 2026-10-27)
- **Ramas:** `test/37-38-unitarias-estatico-sprint4` (PR 1), `test/39-integracion-sprint4` (PR 2) `test/40-aceptacion-sprint4` (PR 3) y `test/40-aceptacion-manual-sprint4` (PR 4)
- **Historias cubiertas:** #16–#18 (Realidad Aumentada, notificaciones push, chatbot de soporte). Como historias adicionales: #104 (Inicio), #105 (Información institucional) y #115 (Servicios)
- **Responsable de pruebas:** @AngeloMtz
- **Commit base:** `develop` en `b824bd5` para el PR 1 (incluye los PR #127, #132 y #133) en `5be3bb8` para el PR 2 (incluye además el #136) en `29795b3` para el PR 3 (incluye además #139 y #140) y en `dbb922e` para el PR 4 (incluye la migración a SDK 58, #148)

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK: 0 errores y 0 advertencias en ambos | #38 |
| Unitarias | 118 suites y 1498 pruebas pasan en la suite completa (58 son de integración); cobertura 99.08 % sentencias / 97.49 % ramas / 98.53 % funciones / 99.34 % líneas | #37 |
| Integración | 58/58 pasan con servicios simulados (AR, push y chatbot). La integración real con servicios externos queda PENDIENTE DE VALIDACIÓN MANUAL (sección 4) | #39 |
| Rendimiento | No aplica en este sprint | — |
| Aceptación (manual) | **24 Cumple, 0 No cumple, 0 Parcial y 0 NO PROBADO** en los criterios de #16, #17, #18, #104, #105 y #115, según los resultados que dictó Angel el 2026-10-27 (sección 5). Con salvedades: modelo y versión de Android del dispositivo PENDIENTES, #17-1 sin evidencia de cambio de estado de pedido y capturas nuevas pendientes | #40 |

Los resultados de las secciones 2 y 3 son de la ejecución local del PR 3. **No se volvieron a ejecutar en el PR 4** (sobre SDK 58): sus cifras no describen el `develop` actual; los checks del PR corren en CI.

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

### Estado tras la aceptación manual del 2026-10-27 (PR 4)
Solo se marca como hecho lo que cubren los resultados dictados por Angel (sección 5). Lo demás sigue PENDIENTE DE VALIDACIÓN MANUAL. No se dictó si el dispositivo fue físico ni contra qué backend se probó.

| Flujo | Hecho (según los resultados dictados) | Sigue pendiente |
|---|---|---|
| Push en dispositivo | Permiso de notificaciones (#17-2) y recepción de notificaciones (#17-1), con capturas de promociones en un Android | Segundo plano o app cerrada, interruptor "Notificaciones push" desactivado y cierre de sesión (pasos 4 a 6): no se dictó resultado |
| Push por cambio de estado del pedido | #17-1 dictado como Cumple | **PENDIENTE DE CONFIRMAR POR ANGEL:** ninguna captura lo muestra y el límite conocido es que el backend no lo enviaba |
| AR en cámara | Botón "Ver en AR" y modelo en la cámara con un producto con modelo (#16-1, #16-2) | Producto sin modelo (paso 4) y iOS con Quick Look: no se dictó resultado |
| Chatbot | Enviar un mensaje y recibir respuesta, e historial de la sesión (#18-1, #18-2) | Chat en vivo con un asesor conectado y reconexión tras modo avión: no se dictó resultado. La captura `hu18-chat-sin-comunicacion.jpeg` muestra el caso sin asesores, pero no hay resultado dictado para ese caso |


## 5. Pruebas de aceptación (manuales) (#40)

- **Quién:** las pruebas de aceptación son manuales y las ejecuta Angel (@AngeloMtz).
- **Resultado (PR 4, dictado por Angel el 2026-10-27):** de los 24 criterios de #16, #17, #18, #104, #105 y #115: **24 Cumple, 0 No cumple, 0 Parcial y 0 NO PROBADO.** Claude no ejecutó ni asumió ningún resultado; el texto de los criterios es el de los issues. Angel dictó los resultados de #16 a #104-3 uno por uno y el resto como "todo aprobado". En #115-7 (pruebas unitarias y CI) el resultado no se midió en esta corrida: lo respaldan la sección 3 y los checks del PR.
- **Observación de diseño dictada por Angel (no cambia el resultado):** al escribir en el chatbot o en atención, el teclado sube y casi no se ve lo que se escribe. Se registra aquí; no se abrió issue.
- **Dispositivo y build de la corrida:** build de desarrollo (*development build*) sobre SDK 58 (`develop` en `dbb922e`). **Modelo del dispositivo y versión de Android: PENDIENTE** (Angel no los dictó). Las capturas existentes tienen barra de estado de iPhone y de Android, así que provienen de al menos dos dispositivos, pero no dicen su modelo.
- **Evidencia:** en este PR **no se agregan capturas nuevas**; las nuevas están **PENDIENTES** de copiarse a `evidencia/sprint-4/`. La columna "Evidencia existente" usa las 27 capturas que ya estaban en `develop` (15 al 26 de octubre), **anteriores a la migración a SDK 58 y a esta corrida**. El 2026-10-27 se abrió cada una y la columna describe lo que muestra, no solo su nombre. Angel indicó que el contenido de las capturas es correcto tal cual.

| Historia | Criterio (texto del issue) | Resultado | Evidencia existente (qué muestra) | Nota |
|---|---|---|---|---|
| #16 | Botón "Ver en AR" abre la cámara con el modelo del producto | Cumple | `hu16-boton-ar.jpeg` (botón "Ver en Realidad Aumentada" en el detalle de un producto), `hu16-visor-3d.jpeg` (visor 3D con "Ver en tu espacio"), `hu16-ar-escena.jpeg` (el modelo sobre un piso, con la cámara) | |
| #16 | Funciona en al menos un producto de prueba | Cumple | Las tres anteriores: todas del mismo producto (Lenovo Yoga Convertible Touch) | Falta `hu16-sin-modelo` (no tomada). |
| #17 | Usuario recibe notificación de prueba al cambiar estado de un pedido | Cumple (dictado) | `hu17-push-recibido.jpeg` (Android; notificación de **promoción** "Prueba 4"), `hu17-inbox-notificaciones.jpeg`, `hu17-notificacion-detalle.jpeg`, `hu17-notificacion-leida.jpeg` | **Salvedad:** ninguna captura muestra un cambio de estado de pedido (todas son promociones) y el límite conocido es que el backend no enviaba push al cambiar el estado. Se registra el resultado dictado; **qué se probó exactamente: PENDIENTE DE CONFIRMAR POR ANGEL.** Falta `hu17-cambio-estado-pedido` (no tomada). |
| #17 | Permiso de notificaciones se solicita correctamente | Cumple | Ninguna | Falta `hu17-permiso-notificaciones` (no tomada). |
| #18 | Usuario puede enviar mensaje y recibir respuesta del chatbot | Cumple | `hu18-chat-respuesta.jpeg` (saludo, la pregunta "Que laptops tienen?" y la respuesta con 5 productos), `hu18-chat-saludo.jpeg` | `hu18-chat-saludo.jpeg` muestra la pantalla de Inicio con el botón flotante del chat, no el saludo. Observación del teclado (arriba). |
| #18 | Historial de conversación visible durante la sesión | Cumple | `hu18-chat-respuesta.jpeg` (saludo, pregunta y respuesta juntos en pantalla) | Falta `hu18-chat-historial` (no tomada). |
| #104 | La pestaña Inicio muestra un carrusel de promociones que se puede deslizar | Cumple | `hu104-carrusel.jpeg` (carrusel con indicadores de página), `hu104-categorias-marcas.jpeg` (indicador en otra posición) | Barra de 4 pestañas (interfaz anterior). |
| #104 | Muestra una sección de productos destacados y, al tocar uno, abre su detalle | Cumple | `hu104-carrusel.jpeg`, `hu104-categorias-marcas.jpeg` (sección "Destacados") | Ninguna captura del detalle abierto desde un destacado. |
| #104 | Muestra las marcas que maneja SYSCOM y, al tocar una, abre el catálogo de esa marca | Cumple | `hu104-categorias-marcas.jpeg` (sección "Marcas"), `hu104-marca-catalogo.jpeg` (catálogo "Genérico", 7 productos) | |
| #104 | Tiene estados de carga, error con "Reintentar" y vacío, y se puede actualizar jalando hacia abajo | Cumple | `hu104-error.jpeg` (error "No pudimos cargar los productos" con "Reintentar", en la categoría Accesorios) | Sin captura de carga, vacío ni de jalar para actualizar. |
| #104 | Tiene un acceso visible a la información institucional (HU siguiente) | Cumple | `hu104-contacto-productos.jpeg` (banner "¿Necesitas asesoría?" con "Contáctanos"), `hu105-hub.jpeg` | |
| #105 | Existe una sección "Información" accesible desde Perfil y desde Inicio | Cumple | `hu105-acceso-perfil.jpeg` (pestaña "Más" con "Información"), `hu105-hub.jpeg` (el hub), `hu105-tabs.jpeg` (Inicio con la barra de 5 pestañas, incluida "Más") | La pestaña ahora se llama "Más". Sin captura del acceso desde Inicio. |
| #105 | "Quiénes somos" muestra misión, visión y valores | Cumple | `hu105-nosotros.jpeg` (misión y visión; los valores no se ven en la captura) | |
| #105 | Muestra las políticas de SYSCOM (privacidad, envíos, devoluciones y garantía, según las que existan en el sitio) | Cumple | `hu105-hub.jpeg` (solo la entrada "Políticas") | Falta `hu105-politicas` (no tomada). |
| #105 | Las preguntas frecuentes se muestran en una lista que se expande al tocar cada una | Cumple | `hu105-hub.jpeg` (solo la entrada "Preguntas frecuentes") | Falta `hu105-faq` (no tomada). |
| #105 | Contacto muestra teléfono, correo y horario, con botones que abren la llamada, el correo o WhatsApp | Cumple | `hu105-contacto.jpeg` (teléfono, WhatsApp, correo, horario y ubicación) | La captura no muestra lo que abre cada botón. |
| #105 | Se puede volver atrás desde cada pantalla sin errores | Cumple | Ninguna | |
| #115 | El listado muestra cada servicio con su imagen, nombre y duración estimada, con paginación al llegar al final | Cumple | `hu116-listado.jpeg` (imagen o ícono, nombre, duración y precio; la paginación no se ve) | Los archivos de evidencia usan `hu116` por la numeración #115/#116 (sección 7). |
| #115 | Se puede buscar un servicio por nombre | Cumple | `hu116-busqueda.jpeg` ("Instalación de cámaras" con un resultado) | |
| #115 | Al tocar un servicio se abre su detalle: galería de imágenes, descripción, duración, garantía, qué incluye y pasos del proceso | Cumple | `hu116-detalle.jpeg` (imagen, descripción, duración, garantía y galería; "qué incluye" y los pasos no se ven en la captura) | |
| #115 | Si el servicio tiene video, se puede reproducir o abrir desde el detalle; si no tiene, no se muestra la sección | Cumple | Ninguna | Falta `hu116-detalle-video` (no tomada). |
| #115 | La pantalla de Inicio tiene una sección “Servicios” con acceso al listado completo | Cumple | `hu116-home-servicios.jpeg` (sección "Servicios" con "Ver todo") | |
| #115 | Tiene estados de carga, error con “Reintentar” y vacío, y se puede actualizar jalando hacia abajo | Cumple | `hu116-error.jpeg` (error con "Reintentar" en el detalle de un servicio) | Sin captura de carga, vacío ni de jalar para actualizar. |
| #115 | Las funciones nuevas incluyen sus pruebas unitarias en el mismo PR y el CI pasa | Cumple | Ninguna | Resultado dictado. Las pruebas unitarias de Servicios están en la sección 3; los checks de este PR corren en CI. |

### Capturas existentes en `evidencia/sprint-4/` (anteriores a SDK 58)
| Captura | Qué muestra (revisada el 2026-10-27) | Estado |
|---|---|---|
| `hu16-boton-ar.jpeg`, `hu16-visor-3d.jpeg` | Detalle del producto con el botón de AR y visor 3D con "Ver en tu espacio" (iPhone) | Vigente |
| `hu16-ar-escena.jpeg` | Modelo del producto sobre un piso, en la escena de AR | Vigente |
| `hu17-push-recibido.jpeg` | Notificación de promoción "Prueba 4" en el panel de un Android | Vigente (no es de cambio de estado de pedido) |
| `hu17-email-recibido.jpeg` | Correo "Prueba 3 — SySCOM" en Gmail (iPhone). Incluye el saludo "Hola Angel"; no se ve la dirección de correo | Vigente |
| `hu17-inbox-notificaciones.jpeg`, `hu17-notificacion-detalle.jpeg`, `hu17-notificacion-leida.jpeg` | Bandeja con 4 sin leer, detalle de "Prueba 4" y bandeja con 2 sin leer (Android) | Vigentes |
| `hu18-chat-saludo.jpeg` | Pantalla de Inicio con el botón flotante del chat | Vigente; el nombre no corresponde al contenido |
| `hu18-chat-respuesta.jpeg` | Conversación con el asistente: saludo, pregunta y respuesta | Vigente |
| `hu18-chat-asesor.jpeg` | Formulario "Chatea con un asesor" (nombre y correo, vacío) | Vigente |
| `hu18-chat-sin-comunicacion.jpeg` | "No hay asesores disponibles" con "Ver contacto" y "Volver al asistente" | Vigente |
| `hu104-carrusel.jpeg`, `hu104-categorias-marcas.jpeg`, `hu104-contacto-productos.jpeg`, `hu104-error.jpeg`, `hu104-marca-catalogo.jpeg` | Inicio, marcas, banner de contacto con productos, error de carga y catálogo de la marca "Genérico" (iPhone, barra de 4 pestañas) | Vigentes; interfaz anterior (4 pestañas, "Perfil") |
| `hu105-acceso-perfil.jpeg`, `hu105-hub.jpeg`, `hu105-tabs.jpeg`, `hu105-nosotros.jpeg`, `hu105-contacto.jpeg` | Pestaña "Más", hub "Información", Inicio con la barra de 5 pestañas, "Nosotros" y "Contacto" (iPhone) | Vigentes |
| `hu105-servicios.jpeg` | Pestaña "Servicios" con "Esta sección estará disponible próximamente" | **Obsoleta:** no corresponde a un criterio vigente; se conserva como historial |
| `hu116-listado.jpeg`, `hu116-busqueda.jpeg`, `hu116-detalle.jpeg`, `hu116-home-servicios.jpeg`, `hu116-error.jpeg` | Listado, búsqueda, detalle, sección en Inicio y error de Servicios (iPhone) | Vigentes |

### Capturas no tomadas
Las que mencionó el reporte y no existen (la columna "Evidencia" de la tabla las cita):
- `hu16-sin-modelo`
- `hu17-permiso-notificaciones`
- `hu17-cambio-estado-pedido`
- `hu18-chat-historial`
- `hu105-politicas`
- `hu105-faq`
- `hu116-detalle-video`
- Las capturas de la corrida del 2026-10-27 en SDK 58: PENDIENTES de copiarse a `evidencia/sprint-4/`.

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

- **iOS:** no se dictó ninguna prueba en iOS. Varias capturas existentes tienen barra de estado de iPhone, pero no se afirma que iOS esté probado ni que Quick Look funcione.
- **Dispositivo:** modelo y versión de Android PENDIENTES. Build: *development build* sobre SDK 58.
- **Evidencia anterior a SDK 58:** las 27 capturas existentes son del 15 al 26 de octubre; no hay capturas de la corrida del 2026-10-27.
- **Teclado en el chat:** al escribir en el chatbot o en atención, el teclado sube y casi no se ve lo que se escribe (observación de diseño dictada por Angel).
- **Push por cambio de estado del pedido:** #17-1 se dictó como Cumple, pero las capturas solo muestran promociones y el equipo había indicado que el backend no lo enviaba. PENDIENTE DE CONFIRMAR POR ANGEL.
- **El toque sobre la notificación no está manejado:** no hay un manejador del toque sobre una notificación (no se encontró `addNotificationResponseReceivedListener` en `src`).
- **Numeración #115/#116:** el issue de Servicios es el #115, pero el PR #118, su commit y los archivos de evidencia (`hu116-*`) usan #116, que no existe.
- **Capturas faltantes u obsoletas:** `hu105-servicios.jpeg` muestra el marcador "Esta sección estará disponible próximamente" de antes de que existiera Servicios. Según los nombres de los archivos, no hay captura de: el permiso de notificaciones (#17), políticas ni preguntas frecuentes (#105), el resultado de los botones de llamada, correo y WhatsApp (#105), carga, vacío y recarga por arrastre de Inicio (#104), ni paginación, carga y vacío de Servicios (#115).
- **Capturas no tomadas:** las de la lista de la sección 5.

## 8. Pendientes

| Pendiente | Dónde |
|---|---|
| Modelo del dispositivo y versión de Android de la corrida del 2026-10-27 | PENDIENTE (Angel) |
| Copiar a `evidencia/sprint-4/` las capturas de la corrida del 2026-10-27 en SDK 58 | PENDIENTE (Angel) |
| #17-1: confirmar qué se probó (la evidencia solo muestra promociones y el límite conocido dice que el backend no envía push al cambiar el estado) | PENDIENTE DE CONFIRMAR POR ANGEL |
| Validación manual de la integración real que los resultados dictados no cubren: segundo plano, interruptor y cierre de sesión en push; producto sin modelo e iOS en AR; chat en vivo con asesor y reconexión (sección 4) | PENDIENTE DE VALIDACIÓN MANUAL |
| Tomar las capturas no tomadas (sección 5) | Pendiente |
| Teclado que tapa el campo de texto en el chatbot y en atención | Observación de diseño; decidir si se abre un issue |
| Volver a ejecutar lint, tsc y Jest sobre SDK 58 para actualizar las secciones 2 y 3 | Pendiente (los checks del PR corren en CI) |

## 9. Evidencia

Archivos en `docs/pruebas/evidencia/sprint-4/`: `lint.txt`, `tsc.txt` y `jest.txt` (esta ejecución), además de las capturas de las historias (`hu16-*`, `hu17-*`, `hu18-*`, `hu104-*`, `hu105-*` y `hu116-*`), todas anteriores a SDK 58.

## 10. Conclusión

- **Análisis estático:** lint y `tsc` sin errores ni advertencias.
- **Unitarias:** 118 suites y 1498 pruebas pasan, con 99.34 % de cobertura de líneas.
- **Integración:** 58/58 pasan con servicios simulados. De la integración real, los resultados dictados cubren AR en cámara y el mensaje con respuesta del chatbot; sigue PENDIENTE DE VALIDACIÓN MANUAL lo que se detalla en la sección 4.
- **Aceptación:** 24 criterios de #16, #17, #18, #104, #105 y #115: 24 Cumple, 0 No cumple, 0 Parcial y 0 NO PROBADO, según los resultados que dictó Angel el 2026-10-27. Salvedades: #17-1 sin evidencia de cambio de estado de pedido (PENDIENTE DE CONFIRMAR POR ANGEL), modelo y versión de Android PENDIENTES, y capturas de la corrida nueva PENDIENTES; la evidencia existente es anterior a SDK 58. Observación de diseño: el teclado tapa el campo de texto del chat.
- **Límites conocidos:** iOS sin una prueba dictada; #17-1 por confirmar; el toque sobre una notificación no está manejado; la numeración #115/#116; y las capturas no tomadas u obsoletas.
