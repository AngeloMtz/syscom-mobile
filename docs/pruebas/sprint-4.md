# Reporte de pruebas — Sprint 4

- **Fecha:** 2026-10-25
- **Rama:** `test/37-38-unitarias-estatico-sprint4`
- **Historias cubiertas:** #16–#18 (Realidad Aumentada, notificaciones push, chatbot de soporte). Como historias adicionales: #104 (Inicio), #105 (Información institucional) y #115 (Servicios)
- **Responsable de pruebas:** @AngeloMtz
- **Commit base:** `develop` en `b824bd5` (incluye los PR #127, #132 y #133)

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK: 0 errores y 0 advertencias en ambos | #38 |
| Unitarias | 115 suites y 1440 pruebas pasan; cobertura 99.08 % sentencias / 97.35 % ramas / 98.53 % funciones / 99.34 % líneas | #37 |
| Integración | PENDIENTE (PR 2 y 3) | #39 |
| Rendimiento | No aplica en este sprint | — |
| Aceptación (manual) | PENDIENTE (PR 2 y 3) | #40 |

Los resultados de las secciones 2 y 3 son de la ejecución local sobre esta rama.

## 2. Análisis estático (#38)

| Comando | Resultado | Evidencia |
|---|---|---|
| `npx expo lint --no-cache` | exit 0, sin errores ni advertencias | [lint.txt](evidencia/sprint-4/lint.txt) |
| `npx tsc --noEmit` | exit 0, sin errores | [tsc.txt](evidencia/sprint-4/tsc.txt) |

## 3. Pruebas unitarias (#37)

`npx jest --ci --coverage`: **115 suites, 1440 pruebas, todas pasan** (exit 0, 41 s). Incluye las pruebas de sprints anteriores. Salida completa en [jest.txt](evidencia/sprint-4/jest.txt).

| Métrica global | Obtenida | Umbral |
|---|---|---|
| Sentencias | 99.08 % | 80 % |
| Ramas | 97.35 % | 70 % |
| Funciones | 98.53 % | 80 % |
| Líneas | 99.34 % | 80 % |

### Pruebas nuevas de esta rama (48)

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

PENDIENTE (PR 2 y 3).

## 5. Pruebas de aceptación (manuales) (#40)

PENDIENTE (PR 2 y 3).

## 6. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| 1 | `tsc` marcaba `Cannot find name 'global'` en la prueba nueva de `BannerCarousel` | El proyecto no tiene `@types/node`, así que `global` no existe para TypeScript | Se usa `globalThis` en la prueba. Se detectó antes de confirmar el commit | `e2e3e8c` |
| 2 | En la primera corrida completa de Jest fallaron 8 pruebas en 7 suites por tiempo límite (suites de 64 a 77 s) | Intermitente: al repetir la suite completa pasaron las 1440 pruebas en 41 s. Es el patrón del issue #129; la causa no se midió | Sin cambio de código | — |

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
| Pruebas de integración (#39) | PENDIENTE (PR 2 y 3) |
| Pruebas de aceptación (#40) | PENDIENTE (PR 2 y 3) |

## 9. Evidencia

Archivos en `docs/pruebas/evidencia/sprint-4/`: `lint.txt`, `tsc.txt` y `jest.txt` (esta ejecución), además de las capturas de las historias (`hu16-*`, `hu17-*`, `hu18-*`, `hu104-*`, `hu105-*` y `hu116-*`).
