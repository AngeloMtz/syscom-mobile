# Reporte de pruebas — Sprint 5

- **Fecha:** 2026-10-31 (UTC). Las corridas se hicieron a las 00:26 UTC en la máquina local de Angel
- **Rama:** `test/41-pruebas-sprint-5` (desde `develop`)
- **Commit base:** `develop` en `629d7d6` (incluye los PR #157, #159, #160, #162, #164 y #165)
- **Historias cubiertas:** #19 (reseñas y calificaciones) y #20 (pruebas end-to-end y build final). Cambios del sprint fuera de esas dos historias: promociones vigentes (#156, PR #157), icono de la app (#158, PR #159), build del APK (#154, PR #160), Mi cuenta sin opciones pendientes (#161, PR #162), descuento en el carrito (#163, PR #164) y URL de la API obligatoria (#78, PR #165)
- **Issues de prueba:** #41 (unitarias) y #42 (análisis estático). La aceptación (#43) y el cierre (#44, #45, #46) no son parte de este reporte
- **Responsable de pruebas:** @AngeloMtz
- **Entorno:** Node v22.13.0, npm 11.12.1 ([entorno.txt](evidencia/sprint-5/entorno.txt))
- **Origen de los datos:** las salidas de lint, `tsc`, `npm audit` y Jest las ejecutó Claude en local y están guardadas en `evidencia/sprint-5/`. Los criterios de aceptación manuales no se ejecutaron: quedan PENDIENTE DE VALIDACIÓN MANUAL

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK: `npx expo lint` y `npx tsc --noEmit` terminan con código 0, sin errores ni advertencias | #42 |
| Auditoría de dependencias | 0 críticas (el CI solo bloquea las críticas). 16 vulnerabilidades en la corrida de referencia: 13 bajas y 3 altas. El total fluctuó entre corridas (ver sección 2) | #42 |
| Unitarias | **123 suites y 1561 pruebas pasan**, con el paralelismo por defecto y con `--maxWorkers=2`. Cobertura global 99.1 % sentencias / 97.55 % ramas / 98.54 % funciones / 99.35 % líneas | #41 |
| Integración | No aplica en este sprint | — |
| Rendimiento | No aplica en este sprint | — |
| Aceptación (manual) | 0 de 11 verificados: todo PENDIENTE DE VALIDACIÓN MANUAL (sección 4; se ejecuta en el APK final, #43) | #43 |

## 2. Análisis estático (#42)

| Comando | Resultado | Evidencia |
|---|---|---|
| `npx expo lint` | exit 0, sin errores ni advertencias | [lint.txt](evidencia/sprint-5/lint.txt) |
| `npx tsc --noEmit` | exit 0, sin errores | [tsc.txt](evidencia/sprint-5/tsc.txt) |
| `npm audit --audit-level=critical` (el paso bloqueante del CI) | exit 0: **0 vulnerabilidades críticas**. La salida de texto resume 16 (13 bajas, 3 altas) | [audit.txt](evidencia/sprint-5/audit.txt) |
| `npm audit --json` (segunda corrida) | 16 en total: 13 bajas, 0 moderadas, 3 altas, 0 críticas | [audit.json](evidencia/sprint-5/audit.json) |

Las 3 altas de la corrida de referencia son `expo` (dependencia directa), `@expo/cli` y `zod` (indirectas). El aviso de `zod` ya estaba aceptado en [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md).

**El total de `npm audit` no fue estable.** Una corrida intermedia de `npm audit --json`, con el mismo `package-lock.json`, dio 45 (1 baja, 42 moderadas, 2 altas, 0 críticas); la salida de texto anterior y la corrida JSON posterior dieron 16. No se guardó la salida de esa corrida de 45 ni se investigó la causa. El documento de advertencias ya registraba que el total fluctúa con el mismo lockfile. Además, ese documento anota **3** vulnerabilidades con SDK 58 (2026-10-27) y hoy salen 16: la diferencia no se investigó, por lo que no se atribuye a ningún cambio. Los totales no se comparan con los de sprints anteriores.

## 3. Pruebas unitarias (#41)

Dos ejecuciones de `npx jest --ci --coverage` sobre el mismo commit:

| Ejecución | Suites | Pruebas | Tiempo de Jest | Fallas | Evidencia |
|---|---|---|---|---|---|
| Paralelismo por defecto | 123 pasan de 123 | 1561 pasan de 1561 | 10.6 s | 0 | [jest-paralelismo-defecto.txt](evidencia/sprint-5/jest-paralelismo-defecto.txt) |
| `--maxWorkers=2` | 123 pasan de 123 | 1561 pasan de 1561 | 19.0 s | 0 | [jest-maxworkers-2.txt](evidencia/sprint-5/jest-maxworkers-2.txt) |

Las dos terminan con exit 0 y superan los umbrales (80 % sentencias, líneas y funciones; 70 % ramas). **Las fallas intermitentes por tiempo límite del issue #129 no se reprodujeron en ninguna de las dos corridas de este cierre.** Durante el sprint sí se vieron en la corrida completa con el paralelismo por defecto, con suites distintas cada vez (documentado en el PR #157); no se midió su causa.

| Métrica global | Obtenida (ambas corridas) | Umbral |
|---|---|---|
| Sentencias | 99.1 % | 80 % |
| Ramas | 97.55 % | 70 % |
| Funciones | 98.54 % | 80 % |
| Líneas | 99.35 % | 80 % |

### Cobertura de los archivos clave del sprint

Cifras de la corrida con el paralelismo por defecto (sentencias / ramas / funciones / líneas).

| Archivo | Cobertura | Líneas sin cubrir |
|---|---|---|
| `cart/cartSelectors.ts` (`getLineDiscount`, `toCartLineData`) | 100 / 100 / 100 / 100 | — |
| `cart/components/CartItemRow.tsx` | 90 / 96.49 / 50 / 90 | 59: `onError` de la imagen (anterior al sprint) |
| `shared/api/client.ts` | 100 / 100 / 100 / 100 | — |
| `catalog/hooks/useOnSaleProducts.ts` | 100 / 100 / 100 / 100 | — |
| `reviews/reviewSelectors.ts`, `reviewValidation.ts`, `reviewKeys.ts` y `reviews/repositories` | 100 / 100 / 100 / 100 | — |
| `reviews/hooks` (4 hooks) | 100 / 86.36 / 100 / 100 | rama: `useProductReviews.ts` 29-31 |
| `reviews/components` (11 componentes) | 97.03 / 95.91 / 97.22 / 99.18 | `MyReviewCard.tsx` 33 (`onError` de la imagen), `WriteReview.tsx` 35 y 78 (guardas), `ProductReviewsSection.tsx` 44 (rama de error) |
| `orders/orderFormat.ts` | 100 / 100 / 100 / 100 | — |

**Archivos de ofertas fuera de la medición.** `catalog/selectors.ts` (donde está `selectOnSale`), `OnSaleSection.tsx` y `OnSaleList.tsx` tienen pruebas, pero **no están en `collectCoverageFrom`** de `package.json`, así que no cuentan en las cifras globales. Se midieron aparte, sin tocar la configuración (ejecutando solo las suites relacionadas; [cobertura-ofertas.txt](evidencia/sprint-5/cobertura-ofertas.txt)):

| Archivo | Sentencias / ramas / funciones / líneas | Sin cubrir |
|---|---|---|
| `catalog/selectors.ts` | 100 / 86.66 / 100 / 100 | ramas 18 y 24 |
| `catalog/components/OnSaleSection.tsx` | 100 / 100 / 100 / 100 | — |
| `catalog/components/OnSaleList.tsx` | 100 / 100 / 100 / 100 | — |

### Trazabilidad historia → funciones → pruebas

Número de pruebas por archivo según la ejecución de este cierre (el archivo completo, no solo lo del sprint).

| Historia o PR | Funciones (archivo fuente) | Prueba (`src/__tests__/`) | Pruebas | Estado |
|---|---|---|---|---|
| #19 lectura (PR #128) | `reviewRepository`, `reviewSelectors`, `useProductReviews` | `reviewRepository.test.ts`, `reviewSelectors.test.ts`, `useProductReviews.test.tsx` | 43 + 43 + 11 | Con prueba |
| #19 | `StarRating`, `ReviewSummary`, `ReviewCard`, `ProductReviewsSection` | `components/ReviewComponents.test.tsx` | 20 | Con prueba |
| #19 escritura (PR #130) | `reviewValidation` | `reviewValidation.test.ts` | 26 | Con prueba |
| #19 | `useCanReview`, `useCreateReview` | `useCanReview.test.tsx`, `useCreateReview.test.tsx` | 8 + 5 | Con prueba |
| #19 | `RatingInput`, `ReviewForm`, `WriteReview`, `WriteReviewAction` | `components/ReviewWriteComponents.test.tsx` | 34 | Con prueba |
| #19 | `reviewKeys` | — (se ejerce desde las pruebas de los hooks; 100 %) | — | Sin prueba directa |
| #19 Mis reseñas (PR #131) | `useMyReviews` | `useMyReviews.test.tsx` | 5 | Con prueba |
| #19 | `MyReviewCard`, `MyReviewsList`, `ReviewStatusBadge` | `components/MyReviewsComponents.test.tsx` | 14 | Con prueba |
| #19 | `orderFormat` (botón Reseñar desde el pedido) | `orderFormat.test.ts` | 52 | Con prueba |
| #19 | Pantallas `reviews/new.tsx`, `reviews/index.tsx` y el detalle `product/[id].tsx` | — | 0 | Sin prueba automática (aceptación manual) |
| #156 ofertas (PR #157) | `selectOnSale`, `ON_SALE_PAGE_SIZE`, `ON_SALE_MAX_PAGES` | `onSaleSelectors.test.ts` | 6 | Con prueba |
| #156 | `productRepository.getOnSale` | `productRepository.test.ts` | 20 (archivo completo) | Con prueba |
| #156 | `useOnSaleProducts` | `useOnSaleProducts.test.tsx` | 3 | Con prueba |
| #156 | `OnSaleSection`, `OnSaleList` | `components/OnSaleComponents.test.tsx` | 10 | Con prueba |
| #156 | Pantalla `promociones.tsx` y la sección de Inicio | — | 0 | Sin prueba automática (aceptación manual) |
| #158 y #154 (PR #159, #160) | `app.config.js` (icono, icono de notificaciones, `expo-build-properties`) y `eas.json` | — | 0 | Sin prueba unitaria: es configuración. Se verificó con `expo config --type public` y con el build `eea67925`. El icono se valida en el APK final |
| #161 Mi cuenta (PR #162) | Pantalla `profile/index.tsx` (opciones visibles y rutas) | `components/ProfileScreen.test.tsx` | 15 | Con prueba (la pantalla está fuera de `collectCoverageFrom`) |
| #163 descuento (PR #164) | `getLineDiscount`, `toCartLineData` | `cartSelectors.test.ts` | 72 (archivo completo) | Con prueba |
| #163 | `CartItemRow` | `components/CartItemRow.test.tsx` | 15 | Con prueba |
| #78 URL de la API (PR #165) | `resolveApiUrl` y `API_URL` (`shared/api/client.ts`) | `apiClient.test.ts` | 15 | Con prueba |

La suma de los archivos de esta tabla da 417 pruebas, todas pasan.

### Funciones sin prueba y propuestas

No hay funciones con lógica nueva o modificada del Sprint 5 sin prueba. Lo que queda sin prueba automática, con la propuesta:

| Qué | Por qué importa | Propuesta (no implementada) |
|---|---|---|
| `selectors.ts`, `OnSaleSection.tsx` y `OnSaleList.tsx` del catálogo no entran a la cobertura global | Se miden aparte pero un cambio futuro que quite sus pruebas no bajaría el umbral | Agregarlos a `collectCoverageFrom` (como se hizo en el Sprint 4 con otros componentes). Las cifras de arriba indican que no bajarían los umbrales. Es un cambio de configuración del umbral, por eso se deja a decisión del equipo |
| `profile/index.tsx` y las demás pantallas de `src/app/` | Mismo criterio de todos los sprints: sin prueba automática de pantallas, las cubre la aceptación manual. `ProfileScreen.test.tsx` es una excepción que sí la prueba | Ninguna |
| Ramas de error de `ProductReviewsSection` (línea 44) y `WriteReview` (35, 78); `onError` de imagen en `MyReviewCard` (33) y `CartItemRow` (59) | Son guardas y manejo de imagen rota | Una prueba por rama (consulta con error, `idPedido` nulo, imagen que falla). Baja prioridad |
| `app.config.js` y `eas.json` | Un error de configuración solo se ve al compilar | Sin prueba unitaria razonable; se valida con `expo config` y con el build |

## 4. Pruebas de aceptación (manuales) (#43)

Todo está **PENDIENTE DE VALIDACIÓN MANUAL**: este cierre no ejecutó pruebas en un dispositivo. Los criterios de #19 y #20 salen del cuerpo de cada issue. Las filas de 5 a 11 no son criterios de un issue: son los cambios del sprint que el equipo decidió validar en el APK final.

| # | Historia o cambio | Criterio | Pasos | Resultado | Evidencia |
|---|---|---|---|---|---|
| 1 | #19 | Solo usuarios que compraron el producto pueden reseñar | 1. Con una cuenta que no compró el producto, abrir su detalle. 2. Comprobar que no aparece "Escribir reseña". 3. Con una cuenta que sí lo compró y recibió, comprobar que aparece y permite enviar la reseña. 4. Entrar a Mis reseñas y comprobar que la reseña aparece con su estado | PENDIENTE DE VALIDACIÓN MANUAL | Captura del paso 3 y 4 |
| 2 | #19 | La reseña se muestra en el detalle del producto | 1. Abrir el detalle de un producto con reseñas aprobadas: ver promedio, resumen y tarjetas. 2. Abrir uno sin reseñas: ver el estado vacío | PENDIENTE DE VALIDACIÓN MANUAL | Existen capturas anteriores en `evidencia/sprint-5/` (`hu19-*`); no hay un resultado dictado para este sprint |
| 3 | #20 | Los 3 flujos críticos funcionan sin errores en un dispositivo real | Ver [e2e-apk.md](e2e-apk.md): la guía de 15 pasos | PENDIENTE: el reporte E2E registra 1 paso fallido (AR, paso 12) y capturas retenidas. Hay que repetirlo con el APK final | [e2e-apk.md](e2e-apk.md) |
| 4 | #20 | Build de APK generado y compartido con los docentes | 1. Generar el APK final. 2. Compartirlo con los docentes | PENDIENTE: el APK `eea67925` está generado; compartirlo lo decide y hace Angel | — |
| 5 | #156 | Sección Ofertas en Inicio y pantalla "Ver todas" | 1. Con una promoción activa, ver la sección Ofertas en Inicio. 2. Tocar "Ver todas". 3. Sin promociones, comprobar que Ofertas no aparece en Inicio y que "Ver todas" dice "No hay promociones por ahora" | PENDIENTE DE VALIDACIÓN MANUAL | Capturas |
| 6 | #163 | Descuento visible en el carrito (original tachado, final y "-N %") | 1. Agregar al carrito un producto con promoción activa (por ejemplo el cargador). 2. Ver la línea: precio tachado, precio con descuento y etiqueta. 3. Pantalla angosta, desborde del texto y lector de pantalla (TalkBack) | PENDIENTE DE VALIDACIÓN MANUAL | Captura |
| 7 | #163 | Sin descuento ni cupón, la línea queda como antes | Agregar un producto sin promoción y ver su línea | PENDIENTE DE VALIDACIÓN MANUAL | Captura |
| 8 | #161 | Mi cuenta ya no muestra las seis opciones sin función | Abrir Mi cuenta: no deben aparecer Cambiar contraseña, Autenticación 2FA, Métodos de pago, Facturación, Aportaciones ni Ayuda; las demás opciones abren su pantalla | PENDIENTE DE VALIDACIÓN MANUAL | Captura |
| 9 | #158 | Icono de la app (aro azul con S) y del icono de notificaciones | 1. Instalar el APK final y ver el icono en el lanzador (incluido el adaptable). 2. Recibir una notificación y ver el icono pequeño en la barra | PENDIENTE DE VALIDACIÓN MANUAL | Captura |
| 10 | #78 | El APK final conecta con el backend de producción | Abrir la app, iniciar sesión y ver el catálogo | PENDIENTE DE VALIDACIÓN MANUAL | — |
| 11 | #154 | El build `preview` termina | Ya hubo un build exitoso (`eea67925`); repetirlo con el commit final | PENDIENTE DE VALIDACIÓN MANUAL | Enlace del build |

## 5. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| — | **Ninguna falla en este cierre.** Lint, `tsc` y Jest terminaron con código 0 en todas las corridas | — | Sin cambios de código | — |

Observaciones, sin corregir:

- **Intermitencia del issue #129:** en este cierre no se reprodujo (ver sección 3). El issue sigue abierto; no se "arregló" nada a ciegas.
- **`npm audit`:** totales distintos entre corridas con el mismo lockfile (sección 2).
- **Durante el sprint** hubo fallas de Jest en un caso aislado y se corrigieron antes de este cierre, en sus propios PR (por ejemplo las pruebas de componentes de ofertas que necesitaban un `QueryClient`, PR #157).

## 6. Límites conocidos

- **iOS:** no se probó. No hay build de iOS y requiere cuenta de pago de Apple.
- **Realidad aumentada (RA):** falla en el Samsung Galaxy A16 del equipo (paso 12 del E2E). La causa no está identificada; la hipótesis sobre los servicios de Google para RA no está verificada ([e2e-apk.md](e2e-apk.md), sección 5).
- **Validación en el APK final (#43):** los cambios de Mi cuenta (#161), ofertas (#156), descuento del carrito (#163), URL de la API obligatoria (#78) e icono (#158) solo tienen pruebas automáticas. Ninguno se probó en dispositivo.
- **Cupones:** la app no tiene pantalla para aplicarlos; el comportamiento "con cupón" del carrito solo está cubierto por pruebas con datos de ejemplo.
- **Pantallas:** las de `src/app/` no tienen prueba automática (salvo `profile/index.tsx`).
- **Formas de respuesta del backend:** las pruebas usan datos de ejemplo; en este cierre no se contrastaron con respuestas reales del backend.
- **Perfil `production` de EAS:** no define `EXPO_PUBLIC_API_URL`. Con el cambio del PR #165, un build `production` sin esa variable fallará al abrir. El perfil `preview` sí la tiene como variable de EAS (consultado con `eas env:list` el 2026-10-30).

## 7. Pendientes

| Pendiente | Quién |
|---|---|
| Aceptación manual de la sección 4 con el APK final | Angel (PENDIENTE DE VALIDACIÓN MANUAL) |
| Compartir el APK con los docentes (cierra el segundo criterio de #20) | Angel |
| Capturas retenidas del E2E (`e20-02`, `e20-06` notificación, `e20-08`, `e20-10`) | Angel |
| Decidir si se agregan `catalog/selectors.ts`, `OnSaleSection.tsx` y `OnSaleList.tsx` a `collectCoverageFrom` | Equipo |
| #129: estabilizar las pruebas con tiempo límite (AddressForm, OrderCard) | Abierto |
| Crear `EXPO_PUBLIC_API_URL` en el entorno `production` de EAS antes de compilar para Google Play | Angel |
| Issues abiertos relacionados con pruebas: #68, #78 (con PR #165 fusionado, falta cerrarlo a mano), #82 | Equipo |

## 8. Evidencia

Archivos en `docs/pruebas/evidencia/sprint-5/`: `entorno.txt`, `lint.txt`, `tsc.txt`, `audit.txt`, `audit.json`, `jest-paralelismo-defecto.txt`, `jest-maxworkers-2.txt` y `cobertura-ofertas.txt` (esta ejecución). Las capturas `hu19-*` y las de `e20/` son anteriores y pertenecen a #19 y #20.

## 9. Conclusión

- **Análisis estático:** lint y `tsc` sin errores ni advertencias; `npm audit` con 0 críticas (el total de vulnerabilidades fluctuó entre corridas).
- **Unitarias:** 123 suites y 1561 pruebas pasan con el paralelismo por defecto y con `--maxWorkers=2`; cobertura global de líneas 99.35 %.
- **Fallas:** ninguna en este cierre. La intermitencia de #129 no se reprodujo.
- **Aceptación:** sin ejecutar; todo PENDIENTE DE VALIDACIÓN MANUAL en el APK final (#43).
