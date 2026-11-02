# Reporte de pruebas — Regresión final, Sprints 1 a 5 (parte automática de #45)

- **Fecha:** 2026-10-31
- **Rama:** `test/45-regresion-final`
- **Historias cubiertas:** #1–#20 (Sprints 1 a 5)
- **Responsable de pruebas:** @AngeloMtz (parte automática ejecutada con Claude; parte manual ejecutada por Angel el 2026-11-01)
- **Commit probado:** `67391840b7a38b3cec1cee44dcb471a9131a0380` (`develop`, Merge pull request #177, «test: integración completa de los módulos (#44)»). El CI de `develop` en ese commit está en verde (workflow CI, conclusión `success`).
- **Alcance:** parte automática de la regresión final y redacción de la lista manual. La parte automática se entregó en el PR #178 (`Refs #45`). **Actualización 2026-11-02:** la parte manual ya se ejecutó (sección 5) y el PR que la registra cierra #45.
- **Sin cambios de código de producción** en este PR: solo documentos y evidencia.

## Planeación: trazabilidad historia → funciones → pruebas
No se repite aquí. Las tablas de trazabilidad por sprint están en [sprint-1.md](sprint-1.md) a [sprint-5.md](sprint-5.md); la sección 3 de este reporte da el conteo actual de pruebas por historia y la sección 4 revisa qué código de producción cambió desde la primera pasada y si tiene prueba.

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Instalación limpia (`npm ci`) | OK (exit 0), con avisos de paquetes deprecados (sección 2.2) | #45 |
| Análisis estático (lint + tsc) | OK: exit 0 en ambos, sin errores ni advertencias | #45 |
| Unitarias + integración, `--maxWorkers=2` | **132/132 suites y 1665/1665 pruebas pasan, en 2 de 2 corridas.** Cobertura 99.11 % sentencias / 97.46 % ramas / 98.56 % funciones / 99.36 % líneas | #45 |
| Unitarias + integración, paralelismo por defecto (16 workers en esta máquina) | **FALLA, en 3 de 3 corridas** por pruebas que superan 5000 ms: 11, 8 y 7 pruebas fallan. Intermitente y dependiente de la carga; no se corrigió (sección 2.4) | #45 |
| `npm audit --audit-level=critical` | exit 0: **0 críticas**; 45 en total (1 baja, 42 moderadas, 2 altas) | #45 |
| `npx expo-doctor` | **19/20. FALLA 1 verificación**: 12 paquetes de Expo/React Native con parche anterior al esperado por el SDK 58. #121 está cerrado como obsoleto y no hay issue abierto para esto | #45 |
| Comparación con la primera pasada (#1–#15) | Ninguna historia bajó; ningún archivo de prueba desapareció (sección 3) | #45 |
| Producción sin prueba (cambios desde `ef804cf`) | 109 archivos cambiados; **15 sin ninguna prueba que los importe** (pantallas y componentes de vista) (sección 4) | #45 |
| Regresión manual (APK `5df5c1be`, commit `68a572c`, Samsung A16, 2026-11-01) | 51 filas: 9 ya cubiertas en #43/#40, **39 Pasa (según Angel, sin captura)**, **3 No verificable** (AR en el A16 ×2 y enlace del APK sin compartir), **0 Falla**, 0 pendientes (sección 5) | #45 |

## 2. Parte automática

### 2.1 Entorno
- Commit exacto: `67391840b7a38b3cec1cee44dcb471a9131a0380`.
- Clon **limpio** hecho para esta pasada (`git clone` de GitHub y `git checkout` de ese commit; `git status` sin cambios), Node 22.13.0, npm 11.12.1, Windows 11, 16 procesadores lógicos.
- Todas las corridas se hicieron dentro de ese clon, no en la carpeta de trabajo.

### 2.2 `npm ci`
Terminó bien (exit 0): `added 1306 packages, and audited 1307 packages in 1m`. Salida completa, con las advertencias, en [npm-ci.txt](evidencia/regresion-final/npm-ci.txt).

- **Avisos `npm warn deprecated`** (10): `inflight@1.0.6`, `glob@7.2.3`, `whatwg-encoding@3.1.1`, `glob@10.5.0` (6 veces) y `eslint@9.39.5`.
- **No apareció el aviso ERESOLVE de `react-reconciler`** de la primera pasada (`test-renderer@1.3.0` pedía `react@^19.3.0` y el proyecto tenía `react@19.2.3`). Ahora el proyecto está en SDK 58 con React 19.3.0 (ver [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md)). No se investigó más; solo se anota que el aviso ya no sale.
- `npm ci` informó **45 vulnerabilidades** (1 baja, 42 moderadas, 2 altas), igual que `npm audit` (sección 2.5).
- Para cumplir la regla de no publicar correos, en la copia de la evidencia se reemplazó una dirección de contacto que npm imprime dentro del texto del aviso de `glob` por `[correo omitido]`. El resto del archivo es la salida tal cual, salvo que ya no incluye la ruta local del clon.

### 2.3 Análisis estático
| Comando | Resultado | Evidencia |
|---|---|---|
| `npx expo lint` | exit 0, sin salida (0 errores, 0 advertencias) | [lint.txt](evidencia/regresion-final/lint.txt) |
| `npx tsc --noEmit` | exit 0, sin errores | [tsc.txt](evidencia/regresion-final/tsc.txt) |

### 2.4 Pruebas — `npx jest --ci --coverage --json`
Se ejecutó cada variante sobre el mismo commit y el mismo clon. Archivos `.txt` (salida de consola) y `.json` (resultado completo de Jest) en [evidencia/regresion-final/](evidencia/regresion-final/).

| # | Comando | Suites | Pruebas | Tiempo | Resultado | Evidencia |
|---|---|---|---|---|---|---|
| 1 | `jest --ci --coverage --json` (paralelismo por defecto) | 10 fallan, 122 pasan, 132 | 11 fallan, 1654 pasan, 1665 | 147.7 s | **exit 1** | [jest-defecto.txt](evidencia/regresion-final/jest-defecto.txt) |
| 2 | igual (repetición 1) | 7 fallan, 125 pasan | 8 fallan, 1657 pasan | 56.6 s | **exit 1** | [jest-defecto-repeticion1.txt](evidencia/regresion-final/jest-defecto-repeticion1.txt) |
| 3 | igual (repetición 2) | 6 fallan, 126 pasan | 7 fallan, 1658 pasan | 57.9 s | **exit 1** | [jest-defecto-repeticion2.txt](evidencia/regresion-final/jest-defecto-repeticion2.txt) |
| 4 | `jest --ci --coverage --json --maxWorkers=2` | 132 pasan | 1665 pasan | 102.3 s | exit 0 | [jest-workers2.txt](evidencia/regresion-final/jest-workers2.txt) |
| 5 | igual (repetición) | 132 pasan | 1665 pasan | 99.6 s | exit 0 | [jest-workers2-repeticion1.txt](evidencia/regresion-final/jest-workers2-repeticion1.txt) |
| 6 | Control extra: `jest --ci --maxWorkers=2 src/__tests__/integration` (sin cobertura) | 2 fallan, 14 pasan, 16 | 2 fallan, 149 pasan, 151 | 47.0 s | **exit 1** | [jest-integracion-workers2.txt](evidencia/regresion-final/jest-integracion-workers2.txt) |

La corrida 6 no estaba pedida: la hice para ver si los fallos dependían del número de workers. Con 2 workers, esa carpeta sola falló en `ofertasYDescuentoCarrito` y `autenticacion`, y en cambio la batería completa con 2 workers pasó dos veces. Los resultados con 2 workers no son consistentes entre sí; solo hay 2 corridas completas y una parcial, sin más repeticiones.

| Métrica global (corridas 4 y 1) | Obtenida | Umbral |
|---|---|---|
| Sentencias | 99.11 % | 80 % |
| Ramas | 97.46 % | 70 % |
| Funciones | 98.56 % | 80 % |
| Líneas | 99.36 % | 80 % |

La cobertura global fue idéntica en la corrida 1 (la que falló) y en la corrida 4.

#### Pruebas intermitentes
Todas las fallas de las corridas 1 a 3 y 6 salvo una son `Exceeded timeout of 5000 ms for a test.` (Jest corta una prueba a los 5 s). No se arreglaron ni se cambió el tiempo límite, según lo pedido. Mensaje exacto: `thrown: "Exceeded timeout of 5000 ms for a test.` (el resto de la línea es un aviso de Jest sobre `jest.setTimeout`).

| Prueba (archivo › nombre) | Mensaje | Corridas 1 / 2 / 3 (defecto) | Pasó al repetir |
|---|---|---|---|
| `integration/autenticacion` › login sin 2FA: la sesión nace, el token se guarda y el Bearer viaja a perfil y carrito | timeout 5000 ms | falla / falla / falla | Sí, con `--maxWorkers=2` (corridas 4 y 5). **Falló** en la corrida 6 |
| `integration/arranqueDeLaApp` › primer arranque: sin bandera ni token muestra la bienvenida, sin sesión y sin peticiones | timeout 5000 ms | falla / falla / falla | Sí, con 2 workers |
| `integration/chatbotYChatEnVivo` › asistente virtual (HTTP) muestra el saludo y las sugerencias; al tocar una se envía y llega la respuesta del bot | timeout 5000 ms | falla / falla / falla | Sí, con 2 workers |
| `integration/ofertasYDescuentoCarrito` › el Inicio muestra la sección Ofertas cuando hay productos con promoción | timeout 5000 ms | falla / falla / falla | Sí, con 2 workers. **Falló** en la corrida 6 |
| `integration/notificacionesPush` › carga la bandeja y las preferencias del servidor, con la sesión | timeout 5000 ms | falla / falla / falla | Sí, con 2 workers |
| `integration/perfilYMiCuenta` › con sesión, saluda con el nombre que devuelve el servidor y la petición lleva el Bearer | timeout 5000 ms | falla / falla / falla | Sí, con 2 workers |
| `integration/perfilYMiCuenta` › cerrar sesión: desregistra el token del dispositivo con la sesión aún vigente y luego la borra | `expect(received).toBe(expected)` — esperado `false`, recibido `true` (línea 115 del archivo, `isAuthenticated`) | falla / falla / falla | Sí, con 2 workers |
| `integration/resenas` › sin compra, la pantalla de escribir reseña dice «No puedes reseñar este producto» y no muestra el formulario | timeout 5000 ms | falla / falla / pasa | Sí |
| `components/ReviewWriteComponents` › ReviewForm con todo vacío muestra los errores y no envía | timeout 5000 ms | falla / pasa / pasa | Sí |
| `components/NotificationComponents` › PreferencesCard muestra el título y los dos interruptores con los valores del servidor | timeout 5000 ms | falla / pasa / pasa | Sí |
| `components/OrderComponents` › OrderCard muestra folio, fecha de México, estado, productos y total | timeout 5000 ms | falla / pasa / pasa | Sí |

Lo que sí se observa y lo que no:
- Posición de la prueba que falla dentro de su archivo (de los JSON): es la **primera** en `arranqueDeLaApp`, `autenticacion`, `chatbotYChatEnVivo` y `ofertasYDescuentoCarrito`; la 2.ª en `resenas`; la 2.ª y la 3.ª en `perfilYMiCuenta`; la 13.ª de 21 en `notificacionesPush`; y en los tres archivos de componentes la 7.ª (`ReviewWriteComponents`), la 8.ª (`OrderComponents`) y la 11.ª (`NotificationComponents`). Para las que son la primera, es compatible con que el tiempo se vaya en cargar los módulos por primera vez bajo carga de CPU, pero **no lo comprobé**; para las demás no tengo explicación.
- La segunda falla de `perfilYMiCuenta` (la aserción, no el timeout) ocurre justo después del timeout de la prueba anterior de la misma suite. Podría ser consecuencia de esa prueba (estado que quedó sin limpiar), pero tampoco lo comprobé.
- No se midió si el número de workers es la causa: con 2 workers la batería completa pasó 2 de 2 veces y la carpeta de integración sola falló 1 de 1.
- Las primeras fallas de la corrida 1 incluyen además tres pruebas de componentes (`ReviewWriteComponents`, `NotificationComponents`, `OrderComponents`) que no fallaron en las corridas 2 y 3. La corrida 1 fue también la primera corrida de Jest en el clon limpio.
- **CI:** el CI de `develop` en este mismo commit pasó. No hay una repetición de CI en esta pasada, así que no sé si esas pruebas son estables allí.
- La primera pasada (2026-10-19) corrió con el paralelismo por defecto y pasaron 75/75 suites; entonces había 75 suites y 909 pruebas, no 132 y 1665, así que la carga no es comparable.

### 2.5 `npm audit --audit-level=critical`
Exit 0: no hay vulnerabilidades críticas. Total: **45** (1 baja, 42 moderadas, 2 altas, 0 críticas). Salida: [audit.txt](evidencia/regresion-final/audit.txt); detalle en [audit.json](evidencia/regresion-final/audit.json).

Avisos distintos (4): `zod` (alta, [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)), `deepmerge` (baja, [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)), `minimatch` (moderada, [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)) y `glob` (moderada, [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)). Las dos altas son `zod` y `@expo/cli` (esta última por arrastre). Las 5 moderadas directas son `eslint`, `eslint-config-expo`, `expo`, `jest` y `jest-expo` (por arrastre de `minimatch`/`glob`).

### 2.6 `npx expo-doctor`
Exit 1: **19/20 verificaciones pasan; falla «Check that packages match versions required by installed Expo SDK»**. Salida: [expo-doctor.txt](evidencia/regresion-final/expo-doctor.txt).

| Paquete | Esperado | Instalado |
|---|---|---|
| expo | ~58.0.22 | 58.0.19 |
| expo-build-properties | ~58.0.12 | 58.0.11 |
| expo-constants | ~58.0.14 | 58.0.13 |
| expo-dev-client | ~58.0.18 | 58.0.15 |
| expo-font | ~58.0.11 | 58.0.10 |
| expo-linking | ~58.0.15 | 58.0.14 |
| expo-notifications | ~58.1.7 | 58.1.6 |
| expo-router | ~58.0.29 | 58.0.26 |
| expo-web-browser | ~58.0.7 | 58.0.6 |
| jest-expo | ~58.0.13 | 58.0.12 |
| react-native | 0.88.1 | 0.88.0 |
| react-native-screens | ~4.30.1 | 4.30.0 |

Son diferencias de parche. No se corrigen en este PR.

## 3. Comparación con la primera pasada (`ef804cf`)

Datos de hoy: salida JSON de la corrida 4 (`--maxWorkers=2`), conteo por archivo en [pruebas-por-archivo-hoy.tsv](evidencia/regresion-final/pruebas-por-archivo-hoy.tsv). Datos de entonces: la sección 4 de [regresion-sprints-1-3.md](regresion-sprints-1-3.md) (que declara haberlos tomado del JSON de Jest de aquel commit); **no volví a ejecutar `ef804cf`**, así que no verifiqué esas cifras de nuevo. Los 132 archivos de prueba de hoy quedan asignados a una fila y la suma da 1665 (comprobado con un script).

Entre `ef804cf` y `67391840` hay 140 commits. `git diff --name-status` sobre `src/__tests__` muestra **0 archivos de prueba eliminados** o renombrados; hay 11 archivos modificados (9 de pruebas y 2 de apoyo: `fixtures/index.ts` y `utils/servidorTienda.ts`) y 64 nuevos (57 archivos de prueba y 7 de fixtures y utilidades).

### 3.1 Historias #1–#15

| HU | Archivos propios | Antes | Hoy | Cambio | Causa |
|---|---|---|---|---|---|
| #1 Proyecto base | `apiClient` (11→36), `queryClient` (5→5) | 16 | 41 | +25 | `apiClient.test.ts` creció: pruebas de sesión caducada y mensaje de timeout (#171) y de exigir `EXPO_PUBLIC_API_URL` en producción (#78) |
| #2 Navegación principal | — | 0 | 0 | = | Sigue sin pruebas propias (solo pantallas y layouts) |
| #3 Registro e inicio de sesión | 9 archivos (`errorMessage` 9→13) | 46 | 50 | +4 | `errorMessage.test.ts`: mensajes de sesión caducada y timeout (#171) |
| #4 Perfil de usuario | `profileRepository` 4, `useProfile` 3, `useUpdateProfile` 5 | 12 | 12 | = | — (hay pruebas nuevas de perfil fuera de esta fila, ver 3.3) |
| #5 Onboarding y splash | — | 0 | 0 | = | Sigue sin archivo propio; `arranqueDeLaApp.test.tsx` (#44) ejerce el arranque pero se cuenta como integración |
| #6 Categorías | 3 archivos | 8 | 8 | = | — |
| #7 Productos por categoría | `productRepository` (14→20), `useProducts` 10, `products` 6 | 30 | 36 | +6 | Pruebas de promociones vigentes en el repositorio (#156) |
| #8 Buscador y filtros | 3 archivos | 85 | 85 | = | — |
| #9 Detalle de producto | 2 archivos | 51 | 51 | = | — |
| #10 Favoritos | 3 archivos | 56 | 56 | = | — |
| #11 Carrito | `cartSelectors` (60→72), `CartItemRow` (11→15), otros 3 sin cambio | 115 | 131 | +16 | Descuento por promoción en el carrito (#163) |
| #12 Dirección de envío | 7 archivos | 117 | 117 | = | — |
| #13 Pago con Stripe | 7 archivos | 103 | 103 | = | — |
| #14 Confirmación de orden | `orderFormat` (44→52), `useOrder` 5 | 49 | 57 | +8 | Botón «Reseñar» solo si el pedido está entregado (#19) |
| #15 Historial de pedidos | `orderList` 7, `useOrders` 7 | 14 | 14 | = | — |
| **Subtotal propias** | | **702** | **761** | **+59** | |
| Compartidos (7 archivos) | `validation` (22→29), `OrderComponents` (17→26), el resto igual | 91 | 107 | +16 | `validation`: el nombre del perfil acepta 3 a 40 (#173); `OrderComponents`: botón «Reseñar» (#19) |
| Fuera de las HU #1–#15 | `servicesSelectors` (6→10), resto igual | 116 | 120 | +4 | Selectores de servicios (#17, commit `dbee838`) |
| **Total de la primera pasada** | | **909** | **988** | **+79** | |

**Ninguna historia bajó y ningún archivo de la primera pasada desapareció.** No hay filas sospechosas. Aclaro un límite: esto compara **totales por archivo**. Si una prueba se hubiera reemplazado por otra en el mismo archivo, el total no lo mostraría; no revisé prueba por prueba. Las historias #2 y #5 siguen sin pruebas propias, como en la primera pasada.

Control de suma: 988 + 677 (sección 3.2) = 1665.

### 3.2 Historias #16–#20 y cambios de los Sprints 4 y 5 (posteriores a `ef804cf`)

| Historia / cambio | Archivos de prueba | Pruebas |
|---|---|---|
| #16 Realidad aumentada | `arSelectors` 14, `modelViewerHtml` 5, `modelsRepository` 4, `useProductModels` 4, `components/ARButton` 9 | 36 |
| #17 Notificaciones push | `pushNotifications` 10, `useRegisterPushToken` 5, `notificationRepository` 16, `notificationSelectors` 22, `useNotifications` 5, `useNotificationDetail` 2, `useMarkNotificationsRead` 5, `useNotificationPreferences` 6, `components/NotificationComponents` 18 | 89 |
| #18 Chatbot y chat en vivo | `chatSelectors` 12, `chatStore` 5, `chatValidation` 5, `chatbotRepository` 6, `useChatbot` 9, `components/ChatComponents` 16, `components/ChatFab` 10, `liveChatGateway` 20, `liveChatReducer` 15, `liveChatSelectors` 18, `liveChatValidation` 7, `useLiveChat` 18, `components/LiveChatComponents` 6 | 147 |
| #17 y #18 (compartido) | `useLogout` 4 (desregistra el token de push y borra el chat) | 4 |
| #19 Reseñas | `reviewRepository` 43, `reviewSelectors` 43, `reviewValidation` 26, `useCanReview` 8, `useCreateReview` 5, `useMyReviews` 5, `useProductReviews` 11, `components/ReviewComponents` 20, `components/ReviewWriteComponents` 34, `components/MyReviewsComponents` 14 | 209 |
| #20 Pruebas end-to-end y build final | Sin archivo propio: el flujo end-to-end es manual en dispositivo (#43). En automático lo ejerce la integración completa (#44, fila de abajo) | 0 propias |
| Ofertas y promociones (#156, #163) | `onSaleSelectors` 6, `useOnSaleProducts` 3, `components/OnSaleComponents` 10 (más los aumentos de `productRepository`, `cartSelectors` y `CartItemRow` de 3.1) | 19 |
| Perfil y Mi cuenta (#161, #173) | `components/ProfileScreen` 15, `components/PersonalDataScreen` 4, `components/FormField` 2 | 21 |
| Adicionales del Sprint 4 (#104, #115) | `components/BannerCarousel` 11, `serviceGallery` 15 | 26 |
| Integración del Sprint 4 (#39) | `realidadAumentada` 12, `notificacionesPush` 21, `chatbotYChatEnVivo` 25 | 58 |
| Integración completa (#44) | `arranqueDeLaApp` 7, `autenticacion` 12, `extensionesServidorTienda` 8, `ofertasYDescuentoCarrito` 11, `perfilYMiCuenta` 9, `recorridoCompleto` 3, `resenas` 14, `sesionCaducada` 4 | 68 |
| **Total posterior a `ef804cf`** | 57 archivos | **677** |

Nota: `pushNotifications.test.ts` tiene 10 pruebas hoy y [sprint-4.md](sprint-4.md) registró 9 al cierre de ese sprint; no investigué cuál se añadió. Las pantallas de `src/app/` y `ModelViewer3D`/galería de servicios siguen sin pruebas propias (sección 4).

## 4. Producción cambiada desde `ef804cf` y su cobertura de pruebas

`git diff --name-status ef804cf 67391840 -- src ':!src/__tests__'`: **109 archivos** de producción (71 nuevos, 38 modificados; 5138 líneas añadidas y 176 quitadas). La lista completa, con su cobertura y las pruebas que los importan, está en el **Anexo A** y en [produccion-cambiada-cobertura.tsv](evidencia/regresion-final/produccion-cambiada-cobertura.tsv).

Cómo se determinó (y sus límites):
- **Cobertura:** porcentaje de sentencias por archivo del `coverage-final.json` de la corrida 4. Solo existe para los 67 archivos incluidos en `collectCoverageFrom` de `package.json`.
- **Pruebas que lo importan:** búsqueda textual de la ruta con alias `@/` en `src/__tests__`. Que una prueba importe un archivo **no demuestra** que lo pruebe a fondo; para los archivos fuera de `collectCoverageFrom` es la única señal que hay. Las pruebas que cargan un archivo con una ruta relativa o por un nombre distinto no se detectan.

Resultado:
- **67 archivos** con cobertura medida; **59** con 100 % de sentencias y **8** por debajo: `AddressForm.tsx` 85.7 %, `profile/validation.ts` 89.5 %, `MyReviewCard.tsx` 87.5 %, `CartItemRow.tsx` 90 %, `WriteReview.tsx` 93.1 %, `ChatComposer.tsx` 93.8 %, `ProductReviewsSection.tsx` 94.1 % y `pushNotifications.ts` 96 %.
- **42 archivos** fuera de `collectCoverageFrom` (pantallas de `src/app/`, componentes de vista y layouts). De ellos, **27** los importa alguna prueba (sobre todo las de integración) y **15 no los importa ninguna**:

| Archivo | Estado | Observación |
|---|---|---|
| `src/app/(tabs)/_layout.tsx` | M | Pestañas (#2) |
| `src/app/(tabs)/more.tsx` | M | Pantalla «Más» |
| `src/app/(tabs)/services.tsx` | M | Pantalla de servicios |
| `src/app/catalog/[categoryId].tsx` | M | Listado por categoría |
| `src/app/catalog/brand/[brandId].tsx` | M | Listado por marca |
| `src/app/favorites.tsx` | M | Favoritos |
| `src/app/notifications/[id].tsx` | A | Detalle de notificación |
| `src/app/product/[id].tsx` | M | Detalle de producto |
| `src/app/search.tsx` | M | Buscador |
| `src/app/service/[id].tsx` | M | Detalle de servicio |
| `src/features/ar/components/ModelViewer3D.tsx` | A | Visor 3D (WebView) |
| `src/features/onboarding/components/OnboardingFlow.tsx` | M | Onboarding |
| `src/features/services/components/ImageZoomModal.tsx` | A | Galería de servicios |
| `src/features/services/components/ServiceGallery.tsx` | A | Galería de servicios |
| `src/features/services/components/ZoomableImage.tsx` | A | Galería de servicios |

Ya estaban declaradas como «sin prueba automática» en [sprint-4.md](sprint-4.md) y [sprint-5.md](sprint-5.md) las pantallas `chatbot`, `live-chat`, `viewer3d`, Inicio, información y galería. Dos aclaraciones sobre la tabla: `ServiceGallery` y `OnboardingFlow` aparecen mencionados en algún archivo de prueba pero no importados por alias (`servicesSelectors.test.ts` y `arranqueDeLaApp.test.tsx` respectivamente, por texto); no verifiqué si los ejercitan. Por eso entran en la lista de 15. Estos archivos solo se cubren hoy con la regresión manual.

## 5. Regresión manual

Los criterios salen de los issues #1–#20. La regresión manual **se ejecutó el 2026-11-01** y Angel la registró en la [guía de regresión manual](regresion-manual-sprint-5.md), copiada sin cambios. Este reporte copia sus resultados; Claude no ejecutó nada en el dispositivo.

**APK probado**

| Dato | Valor |
|---|---|
| Build de EAS | `5df5c1be-f073-4c20-8f68-384ede518e18` |
| Commit de `develop` | `68a572c` (incluye #172, #174, #179, #180 y #181) |
| Dispositivo | Samsung A16, Android 16 |
| Fecha y hora | 01/11/2026, 10:00 p. m. |
| Probado por | Angel |
| Excepción | La fila de **sesión caducada** (A1) no se hizo con el APK, sino en Expo Go con el backend local y la rama de pruebas de Neon, para no tocar producción |

**Cómo leer los resultados**
- **Pasa (según Angel, sin captura):** el resultado es el que Angel anotó en la guía. La guía prevé guardar capturas, pero no se entregó ninguna con estos resultados; por eso ninguna fila tiene captura. Claude no pudo comprobarlos.
- **Falla:** ninguna fila.
- **No verificable:** la guía lo registró así, o falta una condición que no se ha dado.
- **Ya cubierta en #43/e43** (o #40): [sprint-5-aceptacion.md](sprint-5-aceptacion.md) o [sprint-4.md](sprint-4.md) ya la validó, con las reservas que esos reportes anotan. No se repitió en esta pasada.
- La columna de observaciones de la guía está vacía salvo C02, C09 y C11, y las observaciones de A1, A2 y A3.

### Sprint 1
**HU #1 — Proyecto base**
| Criterio | Pasos | Resultado |
|---|---|---|
| Corre en Expo Go sin errores | 1. `npx expo start`. 2. Abrir en Expo Go (SDK 58). 3. Ver que carga sin pantalla roja ni errores en consola. | **Pasa (según Angel, sin captura)** — guía C01. |
| Estructura documentada en el README | 1. Abrir `README.md`. 2. Confirmar que describe la estructura de carpetas. (La sección «Estructura del proyecto» existe en la línea 82 del README de este commit.) | **Pasa (según Angel, sin captura)** — guía C02. Observación de Angel (copiada): «Aqui falta actualizar el readme sobre algunos, apartados nuevos como el de promociones y servcios. Al igual que los cambios en los issues, como el de E2E.» |
| Variable de entorno con la URL base | 1. Revisar `.env.example` con la variable `EXPO_PUBLIC_*` de la API. 2. Con `.env` creado, confirmar que la app consume esa URL (el catálogo carga datos). | **Pasa (según Angel, sin captura)** — guía C03. |

**HU #2 — Navegación principal** (contra las 5 pestañas vigentes: Inicio, Catálogo, Carrito, Servicios, Más)
| Criterio | Pasos | Resultado |
|---|---|---|
| Las pestañas navegan sin errores | 1. Tocar en orden Inicio, Catálogo, Carrito, Servicios, Más. 2. Confirmar que cada una abre su pantalla y los títulos e íconos son correctos. | **Pasa (según Angel, sin captura)** — guía B09. |
| Perfil desde Más | 1. Entrar a Más. 2. Abrir Perfil. 3. Volver con atrás. | **Pasa (según Angel, sin captura)** — guía C04. |
| Transiciones fluidas | 1. Entrar y salir de un detalle (producto, servicio). 2. Cambiar de pestaña repetidamente. 3. Sin parpadeos, cierres ni pantallas en blanco. | **Pasa (según Angel, sin captura)** — guía B09. |

**HU #3 — Registro e inicio de sesión**
| Criterio | Pasos | Resultado |
|---|---|---|
| Usuario puede registrarse y loguearse | 1. Registrar usuario nuevo y confirmar con el código de verificación. 2. Cerrar sesión. 3. Iniciar sesión (con 2FA si aplica). | **Pasa (según Angel, sin captura)** — guía B03 (registro con código) y B04 (inicio de sesión con 2FA).. El inicio de sesión ya estaba cubierto en #43 ([e43-13](evidencia/sprint-5/e43/e43-13-inicio-sesion-iniciada.jpeg)). |
| Token guardado de forma segura | 1. Iniciar sesión. 2. Cerrar y reabrir la app: la sesión se restaura. 3. Cerrar sesión: al reabrir pide login. | **Pasa (según Angel, sin captura)** — guía B07. |
| Mensajes de error claros con credenciales inválidas | 1. Login con contraseña incorrecta. 2. Login con correo inexistente. 3. Registro con correo inválido o contraseña débil. 4. Leer el mensaje en cada caso. | **Pasa (según Angel, sin captura)** — guía B05. |
| Recuperación de contraseña (flujo asociado) | 1. «Olvidé mi contraseña». 2. Código y nueva contraseña. 3. Iniciar con la nueva. | **Pasa (según Angel, sin captura)** — guía B06. |

**HU #4 — Perfil de usuario**
| Criterio | Pasos | Resultado |
|---|---|---|
| Muestra nombre, correo y datos de contacto | 1. Más → Perfil. 2. Confirmar nombre, correo y teléfono/contacto de la cuenta. | **Pasa (según Angel, sin captura)** — guía B08. Angel corrigió la guía el 2026-11-02: el «No verificable» que traía B08 era un texto pegado por error (pertenecía a la AR, C09). |
| Edita y guarda contra la API | 1. Más → Perfil → datos personales. 2. Cambiar un dato y guardar. 3. Salir y volver: el cambio persiste. 4. Probar un dato inválido: muestra error. | **Pasa (según Angel, sin captura)** — guía B08 (misma corrección que la fila anterior); la guía A2 (**Pasa (según Angel, sin captura)**) confirma además que desde Perfil se edita el nombre. |
| Cerrar sesión funcional | 1. Tocar cerrar sesión. 2. Confirmar que regresa a login y que el carrito/perfil ya no son accesibles. | **Pasa (según Angel, sin captura)** — guía B07. Cierra sesión y reabre: pide login y Carrito/Perfil no son accesibles. |

**HU #5 — Onboarding y splash**
| Criterio | Pasos | Resultado |
|---|---|---|
| Aparece la primera vez y no vuelve | 1. Instalar/limpiar datos de la app. 2. Abrir: se ve el onboarding. 3. Terminarlo, cerrar y reabrir: no vuelve a aparecer. | **Pasa (según Angel, sin captura)** — guía B01. |
| Botón «Omitir» funcional | 1. Con datos limpios, abrir y tocar «Omitir». 2. Llega a la app y al reabrir no reaparece. | **Pasa (según Angel, sin captura)** — guía B02. |

### Sprint 2
**HU #6 — Listado de categorías**
| Criterio | Pasos | Resultado |
|---|---|---|
| Carga desde la API con estado de loading | 1. Abrir Catálogo (con red lenta si es posible). 2. Ver indicador de carga y luego las categorías. | **Pasa (según Angel, sin captura)** — guía B10. |
| Tap en categoría lleva al listado filtrado | 1. Tocar una categoría. 2. Ver solo productos de esa categoría. | **Pasa (según Angel, sin captura)** — guía B10. |

**HU #7 — Productos por categoría**
| Criterio | Pasos | Resultado |
|---|---|---|
| Muestra imagen, nombre y precio | 1. Abrir una categoría con productos. 2. Cada tarjeta muestra imagen, nombre y precio. | **Pasa (según Angel, sin captura)** — guía C05. |
| Paginación / scroll infinito | 1. Bajar hasta el final de una categoría grande. 2. Se cargan más productos sin duplicados. | **Pasa (según Angel, sin captura)** — guía B11. |
| Estado vacío | 1. Abrir una categoría sin productos (o buscar algo sin resultados). 2. Aparece el mensaje de vacío. | **Pasa (según Angel, sin captura)** — guía B11. |

**HU #8 — Buscador**
| Criterio | Pasos | Resultado |
|---|---|---|
| Búsqueda por texto relevante | 1. Abrir el buscador. 2. Escribir un nombre de producto conocido. 3. Los resultados corresponden al texto. | **Pasa (según Angel, sin captura)** — guía B12. |
| Filtros de precio mín/máx | 1. Aplicar mínimo y máximo. 2. Todos los resultados están dentro del rango. 3. Probar mínimo > máximo: muestra error. 4. Quitar filtros. | **Pasa (según Angel, sin captura)** — guía B12. |
| Filtro por categoría | 1. Filtrar por una categoría. 2. Solo salen productos de ella. | **Pasa (según Angel, sin captura)** — guía C06. |

**HU #9 — Detalle de producto**
| Criterio | Pasos | Resultado |
|---|---|---|
| Carrusel de imágenes | 1. Abrir un producto con varias imágenes. 2. Deslizar entre ellas. | **Pasa (según Angel, sin captura)** — guía C07. |
| Variantes y stock | 1. Abrir un producto con variantes y elegir una. 2. Una variante sin stock aparece deshabilitada. 3. Producto agotado: no se puede agregar. | **Pasa (según Angel, sin captura)** — guía B13. |
| Botón «Agregar al carrito» visible | 1. En el detalle, ver el botón sin tener que buscarlo. 2. Tocarlo y confirmar que el producto aparece en Carrito. | **Ya cubierta en #43/e43** (pasos 3 y 4 del #20): [e43-08](evidencia/sprint-5/e43/e43-08-detalle-producto.jpeg) y [e43-09](evidencia/sprint-5/e43/e43-09-carrito.jpeg). Reserva: ninguna captura muestra el toque del botón; se infiere de que el producto llega al carrito |

**HU #10 — Favoritos**
| Criterio | Pasos | Resultado |
|---|---|---|
| Corazón alterna favorito | 1. Tocar el corazón en un producto: queda activo. 2. Tocarlo otra vez: se desactiva. | **Pasa (según Angel, sin captura)** — guía B14. |
| Lista persiste entre sesiones | 1. Marcar 2 favoritos. 2. Abrir favoritos (Más → Perfil → Favoritos). 3. Cerrar sesión, volver a entrar (o reiniciar la app): siguen ahí. | **Pasa (según Angel, sin captura)** — guía B14. |

### Sprint 3
**HU #11 — Carrito**
| Criterio | Pasos | Resultado |
|---|---|---|
| Suma total en tiempo real | 1. Agregar 2 productos. 2. Cambiar cantidades con +/−. 3. El total se actualiza al instante y coincide con precio × cantidad. | **Pasa (según Angel, sin captura)** — guía B15. El total con descuento ya estaba cubierto en #43 ([e43-18](evidencia/sprint-5/e43/e43-18-carrito-descuento.jpeg)). |
| Eliminar quita producto y total | 1. Eliminar un producto. 2. Desaparece de la lista y el total baja. 3. Vaciar el carrito: aparece el estado vacío. | **Pasa (según Angel, sin captura)** — guía B15. |

**HU #12 — Dirección de envío**
| Criterio | Pasos | Resultado |
|---|---|---|
| Valida campos obligatorios | 1. Desde el checkout, nueva dirección. 2. Dejar campos vacíos o inválidos (código postal, teléfono) y guardar. 3. Muestra errores por campo. | **Pasa (según Angel, sin captura)** — guía B16. |
| Guardar para futuras compras | 1. Guardar una dirección válida. 2. Salir y volver al checkout: aparece para seleccionar. 3. Editar y eliminar funcionan. | **Pasa (según Angel, sin captura)** — guía B16. |

**HU #13 — Pago con Stripe (sandbox)**
| Criterio | Pasos | Resultado |
|---|---|---|
| Pago de prueba procesado | 1. Checkout con carrito y dirección. 2. Pagar con tarjeta de prueba la tarjeta de prueba aprobada de Stripe (ver datos-de-prueba.md). 3. El pago se confirma y el pedido aparece (requiere webhook activo, `stripe listen` o el webhook de producción). | **Ya cubierta en #43/e43** (paso 5 y 6 del #20): el pedido aparece confirmado en [e43-10](evidencia/sprint-5/e43/e43-10-pedido-confirmado.jpeg). Reserva: el paso 5 (pago) es «OK según Angel» y no hay captura publicada por datos personales |
| Errores de pago con mensaje claro | 1. Pagar con tarjeta rechazada de prueba la tarjeta de prueba rechazada de Stripe (ver datos-de-prueba.md). 2. Mensaje claro y el carrito se conserva. 3. Cancelar la hoja de pago: no se crea cobro. | **Pasa (según Angel, sin captura)** — guía B17. |

**HU #14 — Confirmación y resumen**
| Criterio | Pasos | Resultado |
|---|---|---|
| Muestra folio de orden | 1. Tras un pago exitoso, ver la confirmación. 2. Muestra folio, productos, total y método de pago. | **Ya cubierta en #43/e43** (paso 6): [e43-10](evidencia/sprint-5/e43/e43-10-pedido-confirmado.jpeg), folio y total. Reserva: el reporte de #43 anota folio y total; no anota productos ni método de pago |
| Botón para volver al inicio | 1. Tocar el botón desde la confirmación. 2. Llega a Inicio. | **Pasa (según Angel, sin captura)** — guía C08. |

**HU #15 — Historial de pedidos**
| Criterio | Pasos | Resultado |
|---|---|---|
| Fecha, total y estado de cada pedido | 1. Abrir el historial (Más → Perfil → Pedidos). 2. Cada pedido muestra fecha, total y estado. 3. Sin pedidos: estado vacío. | **Pasa (según Angel, sin captura)** — guía B18. La lista con pedidos ya estaba cubierta en #43 ([e43-11](evidencia/sprint-5/e43/e43-11-mis-pedidos.jpeg)); B18 añade el estado vacío con la cuenta sin pedidos. |
| Tap abre el detalle | 1. Tocar un pedido. 2. Ver su detalle (productos, total, estado). 3. Volver. | **Pasa (según Angel, sin captura)** — guía B18. |

### Sprint 4
**HU #16 — Realidad aumentada**
| Criterio | Pasos | Resultado |
|---|---|---|
| Botón «Ver en AR» abre la cámara con el modelo del producto | 1. Abrir un producto con modelo 3D. 2. Tocar «Ver en Realidad Aumentada». 3. Tocar «Ver en tu espacio» y colocar el modelo. | **No verificable** — guía C09. Angel anota: el Samsung A16 ya no es compatible con ARCore (Google Play Services para RA) y no hay otro teléfono compatible para probarlo. La contradicción entre #40 (cumple en una development build anterior a SDK 58) y #43 (no funciona en el A16) sigue sin resolverse. |
| Funciona en al menos un producto de prueba | 1. Repetir con otro producto con modelo. 2. Producto sin modelo: no aparece el botón. | **No verificable** — guía C09 (ver fila anterior). La parte «un producto sin modelo no muestra el botón» pasó en C10 (**Pasa (según Angel, sin captura)**); la parte con modelo en un segundo producto no es verificable en el A16. |

**HU #17 — Notificaciones push**
| Criterio | Pasos | Resultado |
|---|---|---|
| Usuario recibe notificación al cambiar estado de un pedido | 1. Hacer un pedido. 2. Desde el panel, cambiar su estado. 3. La notificación llega al dispositivo; al tocarla abre la app. | **Ya cubierta en #43/e43** (pasos 9 a 11): [e43-12](evidencia/sprint-5/e43/e43-12-notificacion.jpeg) («Pedido #15: En preparación»). Reserva: la acción en el panel y el toque de la notificación son «OK según Angel», sin captura concluyente |
| Permiso de notificaciones se solicita correctamente | 1. Instalar o borrar datos. 2. Iniciar sesión. 3. El sistema pide el permiso. | **Ya cubierta en #43/e43** (paso 1): [e43-06](evidencia/sprint-5/e43/e43-06-permiso-notificaciones.jpeg) |

**HU #18 — Chatbot de soporte**
| Criterio | Pasos | Resultado |
|---|---|---|
| Usuario puede enviar mensaje y recibir respuesta | 1. Abrir el asistente. 2. Escribir una pregunta. 3. Llega la respuesta del bot. | **Ya cubierta en #43/e43** (paso 14): [e43-14](evidencia/sprint-5/e43/e43-14-chatbot.jpeg); y en #40: [hu18-chat-respuesta](evidencia/sprint-4/hu18-chat-respuesta.jpeg) |
| Historial de conversación visible durante la sesión | 1. Enviar 2 o más mensajes. 2. Salir y volver al chat sin cerrar sesión: siguen ahí. 3. Cerrar sesión: el chat se borra. | **Pasa (según Angel, sin captura)** — guía B19. |

### Sprint 5
**HU #19 — Reseñas y calificaciones**
| Criterio | Pasos | Resultado |
|---|---|---|
| Solo usuarios que compraron el producto pueden reseñar | 1. Producto sin compra: no aparece «Escribir reseña». 2. Producto comprado (pedido entregado): aparece el formulario. | **Ya cubierta en #43/e43** (pasos 1.1 y 1.2): [e43-01](evidencia/sprint-5/e43/e43-01-sin-compra.jpeg), [e43-02](evidencia/sprint-5/e43/e43-02-formulario-resena.jpeg) |
| Reseña se muestra en el detalle del producto | 1. Enviar una reseña. 2. Verla en Mis reseñas (Pendiente). 3. Abrir el detalle del producto. | **Ya cubierta en #43/e43** (pasos 1.3 a 1.5): [e43-03](evidencia/sprint-5/e43/e43-03-mis-resenas.jpeg), [e43-04](evidencia/sprint-5/e43/e43-04-detalle-con-resenas.jpeg), [e43-05](evidencia/sprint-5/e43/e43-05-detalle-sin-resenas.jpeg). Reserva: lo que se vio fue la reseña propia **pendiente** |
| Reseña **aprobada** visible para cualquier usuario (adicional) | 1. Desde el panel, aprobar la reseña. 2. Con otra cuenta (o sin reseñar), abrir el detalle del producto. 3. Ver la reseña con el autor abreviado y el promedio actualizado. 4. Probar también una rechazada: no aparece. | **Pasa (según Angel, sin captura)** — guía B20. |

**HU #20 — Pruebas end-to-end y build final**
| Criterio | Pasos | Resultado |
|---|---|---|
| Los 3 flujos críticos funcionan sin errores en un dispositivo real (login → compra → notificación) | Guía de 15 pasos de [sprint-5-aceptacion.md](sprint-5-aceptacion.md) sección 4.2 | **Ya cubierta en #43/e43**: 14 de 15 pasos OK; el paso 12 (AR) no funciona en ese dispositivo (ver HU #16). Pasos 5, 8, 9 y 11 son «OK según Angel», sin captura |
| Build de APK/TestFlight generado y compartido con los docentes | 1. Confirmar que el build existe y está terminado. 2. Compartir el enlace de instalación con los docentes. | **No verificable** — guía C11. El ID del build coincide con el anotado (`5df5c1be-f073-4c20-8f68-384ede518e18`; **Pasa (según Angel, sin captura)**). El enlace **no se ha compartido con los docentes**: lo verán desde el dispositivo de Angel y después en Google Play. El criterio «compartido con los docentes» sigue sin cumplirse. Sin build de iOS/TestFlight. |

**Cambios del Sprint 5 validados en el APK final** (ofertas, descuento en el carrito, Mi cuenta, nombre e iconos de la app, conexión con producción, build `preview`): **ya cubiertos en #43/e43**, pasos 3.1 a 3.10 de [sprint-5-aceptacion.md](sprint-5-aceptacion.md) ([e43-16](evidencia/sprint-5/e43/e43-16-ofertas-inicio.jpeg) a [e43-22](evidencia/sprint-5/e43/e43-22-icono-notificacion.jpeg)). Con reservas anotadas allí: 3.2 y 3.5 «según Angel»; TalkBack no se probó; 3.9 sin prueba con un build sin `EXPO_PUBLIC_API_URL`.

### Pendientes que vienen de los hallazgos de #44 (filas nuevas)
Se explican en [integracion-completa.md](integracion-completa.md), sección «Hallazgos». Las pruebas automáticas usan un servidor falso; estas dos filas **solo** se pueden validar contra el backend real.

| Criterio | Pasos | Resultado |
|---|---|---|
| **Sesión caducada** (hallazgo A, #172): al vencer el token, la app cierra la sesión y lleva a iniciar sesión | 1. Entorno de prueba (no producción): obtener un token vencido. Las dos vías posibles, **sin verificar** que apliquen en este backend: (a) hacer que el JWT dure muy poco (si el backend lo permite configurar; revisar la variable en `syscom-backend`), o (b) invalidarlo cambiando el secreto del JWT en ese entorno. No cambiar el secreto de producción: cierra la sesión de todos los usuarios. 2. Iniciar sesión en la app. 3. Esperar a que venza (o invalidar el token). 4. Con la app abierta, ir a Carrito o Perfil. 5. Esperado: mensaje de sesión caducada, vuelve a Login, sin pantallas rotas. 6. Iniciar sesión otra vez y confirmar que todo carga. 7. Anotar en Obs. el texto exacto de la respuesta 403 (la app solo cierra sesión si el texto coincide con «Token inválido o expirado»). | **Pasa (según Angel, sin captura)** — guía A1, **en Expo Go con el backend local y la rama de pruebas de Neon (no con el APK ni en producción)**, con `JWT_EXPIRES_IN=2m`. Tras vencer la sesión y abrir otro apartado, la app vuelve a Login. **Limitaciones:** la app no muestra un mensaje de sesión caducada (no hay texto visible; Angel anota que no sabe si debe aparecer), y el texto exacto de la respuesta 403 no quedó registrado (se perdió al cambiar de apartado), por lo que no se confirmó que la app cierre sesión por coincidir con «Token inválido o expirado». |
| **Nombre de 3 a 40 letras** (hallazgo B, #174 y PR #6 del backend) | 1. Confirmar que el backend desplegado (fork de Railway) ya incluye el PR #6 del backend: sincronizar el fork con el original y comprobar el despliegue. 2. En **Registro**: nombre de 3 letras (por ejemplo «Ana»): se acepta. 3. Nombre de 40 letras: se acepta. 4. Nombre de 2 letras: muestra «El nombre debe tener al menos 3 caracteres». 5. Nombre de 41 letras: lo rechaza. 6. En **Perfil → datos personales**: repetir 3 y 40 letras y guardar; recargar el perfil y ver que persiste. 7. Si el registro de la **web** (que sigue pidiendo 4 a 25) se usa con el mismo nombre, anotar la diferencia. | **Pasa (según Angel, sin captura)** — guía A2, con el APK final contra producción. Angel anota: el registro acepta un nombre de 3 letras; en Perfil permite cambiarlo a otro de 3 letras y la app limita el máximo al escribir; el mínimo es 3 y el máximo 40, y 2 y 41 letras no se permiten. **No quedó registrado:** que el backend desplegado tuviera el PR #6 (commit `cc1177c`), si se probó el nombre de exactamente 40 letras y la comparación con el registro de la web. |

**Total manual:** 51 filas con criterio.

| Estado | Filas |
|---|---|
| Ya cubiertas en #43/e43 o #40 (no se repitieron) | 9 |
| **Pasa (según Angel, sin captura)** | 39 |
| **No verificable** | 3 |
| **Falla** | 0 |
| Pendientes de validación | 0 |

Además hay una fila agrupada de «Cambios del Sprint 5» (10 pasos de #43, ya cubiertos) que no se cuenta arriba, y la prueba A3 de la guía (nombre e ícono de la app, #168; «Pasa» según Angel: «Se muestra bien en todo momento, hasta en las notis»), que corresponde a esa fila agrupada y no se cuenta aparte.

**Filas no verificables (3):** «Botón Ver en AR» y «Funciona en al menos un producto de prueba» (HU #16, el A16 no es compatible con ARCore) y «Build de APK compartido con los docentes» (HU #20, el enlace no se ha compartido).

### Corrección de la guía y coherencia de su cierre
- **B08:** la primera versión de la guía traía «No verificable: el Samsung A16 no es compatible con ARCore», texto pegado por error. Angel la corrigió el 2026-11-02 a «Pasa» y la guía de este repositorio es la versión corregida. En la guía corregida también cambió la tabla de cierre de la Parte C, de 11/11 a 10 pasan y 1 no probado (C09).
- **Tabla de cierre de la guía, ahora coherente con las filas:** Parte A 3/3, Parte B 20/20 (B08 incluida) y Parte C 10 de 11 con 1 no probado (C09). Ya no hay contradicción entre las filas y esa tabla.
- **Conteo:** la guía tiene 34 puntos (3 + 20 + 11) y este reporte 51 filas, porque varias filas se cubren con el mismo punto de la guía (por ejemplo B09 cubre dos y B14 otras dos).

### Limitaciones de la regresión manual
- **Sesión caducada (A1):** se verificó la redirección a Login, pero la app **no muestra un mensaje de sesión caducada** (no hay texto visible). No se registró el texto exacto del 403, así que no se confirmó que el cierre de sesión dependa de «Token inválido o expirado». Se probó en Expo Go con un backend local, no con el APK ni contra producción.
- **AR (C09):** **no verificable** en el Samsung A16, que no es compatible con ARCore. No hay otro teléfono compatible. Queda sin resolver la contradicción entre #40 y #43.
- **Enlace del APK (C11):** **no se ha compartido con los docentes.** Lo verán desde el dispositivo de Angel y después en Google Play. El segundo criterio de #20 no está completo.
- **Sin capturas:** todos los «Pasa» de esta pasada son según Angel, sin captura.
- **Solo Android:** no hay build de iOS.
- **Validación de respuesta incompleta en login, 2FA y verificación de registro (#68, PR #180):** solo se cubre con pruebas automáticas; no se probó en el dispositivo, porque exigiría alterar el backend.
- **A2:** no quedó registrado si el despliegue de Railway incluía el PR #6 del backend, ni si se probó exactamente 40 letras, ni la comparación con el registro de la web (que pide 4 a 25).
- **README (C02):** pasa, pero Angel anota que falta actualizarlo con apartados nuevos (promociones, servicios) y con los cambios de issues como el de E2E.

## 6. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| 1 | `jest --ci --coverage` con el paralelismo por defecto falla (11, 8 y 7 pruebas en 3 corridas) | Pruebas que superan los 5000 ms, casi siempre la primera de una suite de integración. La causa exacta no está comprobada (sección 2.4) | **Ninguna, por instrucción.** Con `--maxWorkers=2` la batería pasa 2 de 2 veces. Conviene abrir un issue de investigación | — |
| 2 | `npx expo-doctor` 19/20: 12 paquetes con parche anterior | Versiones fijadas anteriores a las que pide el SDK 58 vigente | Ninguna. #121 se cerró como obsoleto (era del SDK 57) y no hay issue abierto para el SDK 58 | — |

No se encontraron fallas de aserción en las pruebas, salvo la de `perfilYMiCuenta` (línea 115) que acompaña a un timeout de la misma suite (sección 2.4).

## 7. Estado de #121 y de las vulnerabilidades, contra la primera pasada

| Medida | Primera pasada (2026-10-19, `ef804cf`, SDK 57) | Hoy (2026-10-31, `67391840`, SDK 58) | Cambio |
|---|---|---|---|
| `expo-doctor` | 20/21, 5 paquetes con parche anterior | 19/20, 12 paquetes con parche anterior | **Peor en paquetes (5 → 12)**: es otro SDK, no es la misma lista. El resultado sigue siendo 1 verificación fallida |
| `npm audit`, críticas | 0 | 0 | Igual |
| `npm audit`, altas | 52 | 2 (`zod`, `@expo/cli`) | **Mejor** |
| `npm audit`, moderadas | 15 | 42 | **Peor** (muchas por el arrastre de `minimatch` y `glob` hacia `eslint`, `jest`, `expo`) |
| `npm audit`, total | 67 | 45 | **Mejor** |
| `npm audit` contra el último dato documentado (SDK 58, 2026-10-27: 3 altas, 0 moderadas) | 3 | 45 | **Peor.** No investigué por qué: el `package-lock.json` cambió el 2026-10-28 (instalar `expo-build-properties`, #154) y la base de avisos de npm cambia con el tiempo; no probé qué explica la diferencia |

- **#121:** está **cerrado** (2026-10-30, comentario «Obsoleto: el proyecto ya está en SDK 58, la tabla de versiones del SDK 57 no aplica»). El problema equivalente existe hoy con otro conjunto de paquetes (sección 2.6) y no tiene issue abierto. La migración al SDK 58 llegó con el PR #148 (`f463054`); el issue #147 de esa migración sigue abierto, aunque su cambio está fusionado (no revisé por qué).
- No se corrigió nada, según lo pedido. [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md) quedó desactualizado respecto a las cifras de hoy (45 contra 3); no lo edité.

## 8. Pendientes
- **Regresión manual:** ejecutada (sección 5). Quedan **3 filas no verificables**: AR (HU #16, 2 filas, sin teléfono compatible con ARCore) y el enlace del APK a los docentes (HU #20).
- **Investigar los timeouts** del paralelismo por defecto (sección 2.4) y decidir si se sube el tiempo límite de las pruebas de integración o se reduce el trabajo de su primera prueba. Sin issue todavía.
- **Alinear los 12 paquetes de Expo** (`npx expo install --check`) y revisar las 42 moderadas de `npm audit`.
- **#45:** el PR de esta actualización lo cierra; si Angel prefiere cerrarlo a mano, conviene hacerlo tras revisar las 3 filas no verificables.
- Heredados de #44 y #43: la sesión caducada y el nombre de 3 a 40 letras ya se probaron (según Angel, sin captura; ver las limitaciones de la sección 5) y la reseña aprobada visible pasó (B20). Siguen pendientes la AR en otro dispositivo, iOS (no hay build) y compartir el APK con los docentes.
- Las 15 vistas sin ninguna prueba (sección 4) quedan solo con regresión manual.

## 9. Evidencia
Archivos en `docs/pruebas/evidencia/regresion-final/`:
`npm-ci.txt`, `lint.txt`, `tsc.txt`, `jest-defecto.txt` y `.json`, `jest-defecto-repeticion1.txt` y `.json`, `jest-defecto-repeticion2.txt` y `.json`, `jest-workers2.txt` y `.json`, `jest-workers2-repeticion1.txt` y `.json`, `jest-integracion-workers2.txt`, `audit.txt` y `.json`, `expo-doctor.txt`, `pruebas-por-archivo-hoy.tsv`, `produccion-cambiada.txt` y `produccion-cambiada-cobertura.tsv`.

Resultados de la regresión manual: [regresion-manual-sprint-5.md](regresion-manual-sprint-5.md), la guía que llenó Angel el 2026-11-01, copiada sin cambios. No incluye capturas.

Se conservan todos los intentos, incluidos los que fallaron. Cambios hechos a las copias: se sustituyó la ruta local del clon por `<clon>` y se retiró un correo de contacto de npm y un correo ficticio de una prueba. Lo demás es la salida tal cual. Revisión de privacidad de los archivos nuevos: sin correos, sin nombres completos ni identificadores de pago; los textos `pk_test_` y `sk_test_abc` que aparecen en los `.json` son títulos de pruebas de validación de la configuración de Stripe (`rechaza "pk_test_"`), no claves.

## Anexo A. Producción cambiada desde `ef804cf` (109 archivos)

`Est.`: A = nuevo, M = modificado. `Sentencias`: cobertura de la corrida 4, o «fuera» si el archivo no está en `collectCoverageFrom`. `Importado por`: archivos de `src/__tests__` que lo importan por alias `@/` (ver los límites en la sección 4).

| Est. | Archivo | Sentencias | Importado por |
|---|---|---|---|
| M | `src/app/(auth)/login.tsx` | fuera | integration/autenticacion.test.tsx, integration/recorridoCompleto.test.tsx |
| M | `src/app/(auth)/register.tsx` | fuera | integration/autenticacion.test.tsx |
| M | `src/app/(auth)/reset-password.tsx` | fuera | integration/autenticacion.test.tsx |
| M | `src/app/(auth)/verify-code.tsx` | fuera | integration/autenticacion.test.tsx, integration/recorridoCompleto.test.tsx |
| M | `src/app/(tabs)/_layout.tsx` | fuera | **ninguna** |
| M | `src/app/(tabs)/index.tsx` | fuera | integration/ofertasYDescuentoCarrito.test.tsx, integration/recorridoCompleto.test.tsx |
| M | `src/app/(tabs)/more.tsx` | fuera | **ninguna** |
| M | `src/app/(tabs)/services.tsx` | fuera | **ninguna** |
| M | `src/app/_layout.tsx` | fuera | integration/arranqueDeLaApp.test.tsx |
| M | `src/app/catalog/[categoryId].tsx` | fuera | **ninguna** |
| M | `src/app/catalog/brand/[brandId].tsx` | fuera | **ninguna** |
| A | `src/app/chatbot.tsx` | fuera | integration/chatbotYChatEnVivo.test.tsx |
| M | `src/app/favorites.tsx` | fuera | **ninguna** |
| A | `src/app/live-chat.tsx` | fuera | integration/chatbotYChatEnVivo.test.tsx |
| A | `src/app/notifications/[id].tsx` | fuera | **ninguna** |
| A | `src/app/notifications/index.tsx` | fuera | integration/notificacionesPush.test.tsx |
| M | `src/app/orders/[id].tsx` | fuera | integration/recorridoCompleto.test.tsx |
| M | `src/app/orders/index.tsx` | fuera | integration/recorridoCompleto.test.tsx |
| M | `src/app/product/[id].tsx` | fuera | **ninguna** |
| M | `src/app/profile/index.tsx` | fuera | components/PersonalDataScreen.test.tsx, components/ProfileScreen.test.tsx, integration/perfilYMiCuenta.test.tsx, integration/recorridoCompleto.test.tsx |
| M | `src/app/profile/personal-data.tsx` | fuera | components/PersonalDataScreen.test.tsx, integration/perfilYMiCuenta.test.tsx |
| A | `src/app/promociones.tsx` | fuera | integration/ofertasYDescuentoCarrito.test.tsx |
| A | `src/app/reviews/index.tsx` | fuera | integration/recorridoCompleto.test.tsx, integration/resenas.test.tsx |
| A | `src/app/reviews/new.tsx` | fuera | integration/recorridoCompleto.test.tsx, integration/resenas.test.tsx |
| M | `src/app/search.tsx` | fuera | **ninguna** |
| M | `src/app/service/[id].tsx` | fuera | **ninguna** |
| A | `src/app/viewer3d.tsx` | fuera | integration/realidadAumentada.test.tsx |
| M | `src/features/addresses/components/AddressForm.tsx` | 85.7% | components/AddressForm.test.tsx |
| M | `src/features/addresses/hooks/useAddresses.ts` | 100% | integration/compraDeExtremoAExtremo.test.tsx, integration/sesionCaducada.test.tsx, integration/sesionCompra.test.tsx, useAddresses.test.tsx |
| A | `src/features/ar/components/ARButton.tsx` | 100% | components/ARButton.test.tsx, integration/realidadAumentada.test.tsx |
| A | `src/features/ar/components/ModelViewer3D.tsx` | fuera | **ninguna** |
| A | `src/features/ar/hooks/useProductModels.ts` | 100% | components/ARButton.test.tsx, useProductModels.test.tsx |
| A | `src/features/ar/modelViewerHtml.ts` | 100% | modelViewerHtml.test.ts |
| A | `src/features/ar/repositories/modelsRepository.ts` | 100% | modelsRepository.test.ts, useProductModels.test.tsx |
| A | `src/features/ar/selectors.ts` | 100% | arSelectors.test.ts |
| A | `src/features/ar/types.ts` | fuera | arSelectors.test.ts, modelsRepository.test.ts |
| A | `src/features/auth/hooks/useLogout.ts` | 100% | components/ProfileScreen.test.tsx, integration/notificacionesPush.test.tsx, useLogout.test.tsx |
| M | `src/features/cart/cartSelectors.ts` | 100% | cartSelectors.test.ts, components/CartItemRow.test.tsx, integration/extensionesServidorTienda.test.tsx |
| M | `src/features/cart/components/CartItemRow.tsx` | 90% | components/CartItemRow.test.tsx |
| M | `src/features/cart/hooks/useCart.ts` | 100% | integration/autenticacion.test.tsx, integration/compraDeExtremoAExtremo.test.tsx, integration/sesionCaducada.test.tsx, integration/sesionCompra.test.tsx, useCart.test.tsx, usePayment.test.tsx |
| M | `src/features/cart/types.ts` | fuera | fixtures/cart.ts |
| A | `src/features/catalog/components/OnSaleList.tsx` | fuera | components/OnSaleComponents.test.tsx |
| A | `src/features/catalog/components/OnSaleSection.tsx` | fuera | components/OnSaleComponents.test.tsx |
| A | `src/features/catalog/hooks/useOnSaleProducts.ts` | 100% | useOnSaleProducts.test.tsx |
| M | `src/features/catalog/repositories/productRepository.ts` | 100% | integration/extensionesServidorTienda.test.tsx, productRepository.test.ts, useFeaturedProducts.test.tsx, useOnSaleProducts.test.tsx, useProduct.test.tsx, useProducts.test.tsx, useProductsPreview.test.tsx |
| M | `src/features/catalog/selectors.ts` | fuera | categories.test.ts, onSaleSelectors.test.ts, products.test.ts |
| A | `src/features/chatbot/chatSelectors.ts` | 100% | chatSelectors.test.ts, integration/chatbotYChatEnVivo.test.tsx |
| A | `src/features/chatbot/chatStore.ts` | 100% | chatStore.test.ts, integration/chatbotYChatEnVivo.test.tsx, integration/notificacionesPush.test.tsx, integration/perfilYMiCuenta.test.tsx, integration/recorridoCompleto.test.tsx, useChatbot.test.tsx, useLogout.test.tsx |
| A | `src/features/chatbot/components/ChatBubble.tsx` | 100% | components/ChatComponents.test.tsx |
| A | `src/features/chatbot/components/ChatComposer.tsx` | 93.8% | components/ChatComponents.test.tsx |
| A | `src/features/chatbot/components/ChatFab.tsx` | 100% | components/ChatFab.test.tsx |
| A | `src/features/chatbot/components/LiveGuestForm.tsx` | 100% | components/LiveChatComponents.test.tsx |
| A | `src/features/chatbot/components/LiveMessageBubble.tsx` | 100% | components/LiveChatComponents.test.tsx |
| A | `src/features/chatbot/hooks/useChatbot.ts` | 100% | useChatbot.test.tsx |
| A | `src/features/chatbot/hooks/useLiveChat.ts` | 100% | integration/chatbotYChatEnVivo.test.tsx, useLiveChat.test.tsx |
| A | `src/features/chatbot/liveChat/liveChatGateway.ts` | 100% | liveChatGateway.test.ts, useLiveChat.test.tsx |
| A | `src/features/chatbot/liveChat/liveChatReducer.ts` | 100% | liveChatReducer.test.ts |
| A | `src/features/chatbot/liveChat/liveChatSelectors.ts` | 100% | integration/chatbotYChatEnVivo.test.tsx, liveChatSelectors.test.ts |
| A | `src/features/chatbot/liveChat/types.ts` | fuera | components/LiveChatComponents.test.tsx, liveChatReducer.test.ts |
| A | `src/features/chatbot/liveChat/validation.ts` | 100% | liveChatValidation.test.ts |
| A | `src/features/chatbot/repositories/chatbotRepository.ts` | 100% | chatbotRepository.test.ts, integration/chatbotYChatEnVivo.test.tsx, useChatbot.test.tsx |
| A | `src/features/chatbot/types.ts` | fuera | components/ChatComponents.test.tsx |
| A | `src/features/chatbot/validation.ts` | 100% | chatValidation.test.ts |
| M | `src/features/favorites/hooks/useFavorites.ts` | 100% | integration/favoritosApi.test.tsx, integration/sesionCache.test.tsx, integration/sesionCaducada.test.tsx, useFavorites.test.tsx |
| A | `src/features/notifications/components/NotificationCard.tsx` | 100% | components/NotificationComponents.test.tsx |
| A | `src/features/notifications/components/PreferencesCard.tsx` | 100% | components/NotificationComponents.test.tsx |
| A | `src/features/notifications/hooks/useMarkNotificationsRead.ts` | 100% | useMarkNotificationsRead.test.tsx |
| A | `src/features/notifications/hooks/useNotificationDetail.ts` | 100% | useNotificationDetail.test.tsx |
| A | `src/features/notifications/hooks/useNotificationPreferences.ts` | 100% | components/NotificationComponents.test.tsx, useNotificationPreferences.test.tsx |
| A | `src/features/notifications/hooks/useNotifications.ts` | 100% | useMarkNotificationsRead.test.tsx, useNotifications.test.tsx |
| A | `src/features/notifications/hooks/useRegisterPushToken.ts` | 100% | integration/notificacionesPush.test.tsx, useRegisterPushToken.test.tsx |
| A | `src/features/notifications/notificationSelectors.ts` | 100% | notificationSelectors.test.ts |
| A | `src/features/notifications/pushNotifications.ts` | 96% | pushNotifications.test.ts, useLogout.test.tsx, useRegisterPushToken.test.tsx |
| A | `src/features/notifications/repositories/notificationRepository.ts` | 100% | notificationRepository.test.ts, useLogout.test.tsx, useMarkNotificationsRead.test.tsx, useNotificationDetail.test.tsx, useNotificationPreferences.test.tsx, useNotifications.test.tsx, useRegisterPushToken.test.tsx |
| A | `src/features/notifications/types.ts` | fuera | fixtures/notification.ts, useMarkNotificationsRead.test.tsx, useNotificationPreferences.test.tsx |
| M | `src/features/onboarding/components/OnboardingFlow.tsx` | fuera | **ninguna** |
| M | `src/features/orders/components/OrderDetailView.tsx` | 100% | components/OrderComponents.test.tsx |
| M | `src/features/orders/orderFormat.ts` | 100% | integration/compraDeExtremoAExtremo.test.tsx, orderFormat.test.ts |
| M | `src/features/profile/validation.ts` | 89.5% | validation.test.ts |
| A | `src/features/reviews/components/MyReviewCard.tsx` | 87.5% | components/MyReviewsComponents.test.tsx |
| A | `src/features/reviews/components/MyReviewsList.tsx` | 100% | components/MyReviewsComponents.test.tsx |
| A | `src/features/reviews/components/ProductReviewsSection.tsx` | 94.1% | components/ReviewComponents.test.tsx, integration/resenas.test.tsx |
| A | `src/features/reviews/components/RatingInput.tsx` | 100% | components/ReviewWriteComponents.test.tsx |
| A | `src/features/reviews/components/ReviewCard.tsx` | 100% | components/ReviewComponents.test.tsx |
| A | `src/features/reviews/components/ReviewForm.tsx` | 100% | components/ReviewWriteComponents.test.tsx |
| A | `src/features/reviews/components/ReviewStatusBadge.tsx` | 100% | components/MyReviewsComponents.test.tsx |
| A | `src/features/reviews/components/ReviewSummary.tsx` | 100% | components/ReviewComponents.test.tsx |
| A | `src/features/reviews/components/StarRating.tsx` | 100% | components/ReviewComponents.test.tsx |
| A | `src/features/reviews/components/WriteReview.tsx` | 93.1% | components/ReviewWriteComponents.test.tsx |
| A | `src/features/reviews/components/WriteReviewAction.tsx` | 100% | components/ReviewComponents.test.tsx, components/ReviewWriteComponents.test.tsx |
| A | `src/features/reviews/hooks/useCanReview.ts` | 100% | components/ReviewWriteComponents.test.tsx, useCanReview.test.tsx |
| A | `src/features/reviews/hooks/useCreateReview.ts` | 100% | components/ReviewWriteComponents.test.tsx, useCreateReview.test.tsx |
| A | `src/features/reviews/hooks/useMyReviews.ts` | 100% | components/MyReviewsComponents.test.tsx, useMyReviews.test.tsx |
| A | `src/features/reviews/hooks/useProductReviews.ts` | 100% | components/ReviewComponents.test.tsx, useProductReviews.test.tsx |
| A | `src/features/reviews/repositories/reviewRepository.ts` | 100% | reviewRepository.test.ts, useCanReview.test.tsx, useCreateReview.test.tsx, useMyReviews.test.tsx, useProductReviews.test.tsx |
| A | `src/features/reviews/reviewKeys.ts` | 100% | useCreateReview.test.tsx |
| A | `src/features/reviews/reviewSelectors.ts` | 100% | reviewSelectors.test.ts |
| A | `src/features/reviews/reviewValidation.ts` | 100% | reviewValidation.test.ts |
| A | `src/features/reviews/types.ts` | fuera | fixtures/review.ts |
| A | `src/features/services/components/ImageZoomModal.tsx` | fuera | **ninguna** |
| A | `src/features/services/components/ServiceGallery.tsx` | fuera | **ninguna** |
| A | `src/features/services/components/ZoomableImage.tsx` | fuera | **ninguna** |
| A | `src/features/services/gallery.ts` | 100% | serviceGallery.test.ts |
| M | `src/features/services/selectors.ts` | 100% | servicesSelectors.test.ts |
| M | `src/shared/api/client.ts` | 100% | apiClient.test.ts, authRepository.test.ts, integration/extensionesServidorTienda.test.tsx, liveChatGateway.test.ts, url.test.ts, utils/axiosFake.ts |
| M | `src/shared/api/errorMessage.ts` | 100% | errorMessage.test.ts |
| M | `src/shared/store/authStore.ts` | 100% | components/ReviewWriteComponents.test.tsx, integration/arranqueDeLaApp.test.tsx, integration/autenticacion.test.tsx, integration/chatbotYChatEnVivo.test.tsx, integration/compraDeExtremoAExtremo.test.tsx, integration/favoritosApi.test.tsx, integration/notificacionesPush.test.tsx, integration/ofertasYDescuentoCarrito.test.tsx, integration/perfilYMiCuenta.test.tsx, integration/recorridoCompleto.test.tsx, integration/resenas.test.tsx, integration/sesionCache.test.tsx, integration/sesionCaducada.test.tsx, integration/sesionCompra.test.tsx, session.test.ts, useAddresses.test.tsx, useCanReview.test.tsx, useCart.test.tsx, useChatbot.test.tsx, useConfirm2FA.test.tsx, useFavorites.test.tsx, useLogin.test.tsx, useLogout.test.tsx, useMe.test.tsx, useMyReviews.test.tsx, useNotificationDetail.test.tsx, useNotificationPreferences.test.tsx, useNotifications.test.tsx, useOrder.test.tsx, useOrders.test.tsx, useProfile.test.tsx, useRegister.test.tsx, useRegisterPushToken.test.tsx, useUpdateProfile.test.tsx, useVerifyRegistration.test.tsx, utils/authHooksSetup.ts |
| M | `src/shared/ui/BannerCarousel.tsx` | 100% | components/BannerCarousel.test.tsx |
| M | `src/shared/ui/FormField.tsx` | fuera | components/FormField.test.tsx |
