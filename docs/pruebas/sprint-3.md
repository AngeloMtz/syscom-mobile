# Reporte de pruebas — Sprint 3

- **Fecha:** 2026-10-12
- **Rama:** `test/36-aceptacion-sprint3`
- **Historias cubiertas:** #11–#15 (carrito, dirección de envío, pago con Stripe, confirmación de orden, historial de pedidos)
- **Responsable de pruebas:** @AngeloMtz
- **Commit base:** `develop` en `7685e82` (incluye los PR #97 y #99)

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK: 0 errores y 0 advertencias en ambos | #33 |
| Unitarias | 62 suites y 834 pruebas pasan (suite completa); cobertura 98.89 % sentencias / 98.14 % ramas / 97.7 % funciones / 98.93 % líneas | #32 |
| Integración | 10/10 pasan, con Axios y Stripe simulados | #34 |
| Rendimiento | **Parcial.** Lecturas, escrituras de carrito y checkout medidas, todas cumplen (20/20 válidas, 0 errores); webhook → pedido **sin medición válida** (ver sección 5) | #35 |
| Aceptación (manual) | **PENDIENTE DE VALIDACIÓN MANUAL**: hay 9 capturas, pero Angel aún no reportó el resultado de ningún criterio; 0/10 marcados (ver sección 6) | #36 |

CI (GitHub Actions) de los PR #97 y #99: **Análisis estático** y **Pruebas unitarias** en success. Los números de esta tabla son de la ejecución local sobre esta rama.

## 2. Análisis estático (#33)

| Comando | Resultado | Evidencia |
|---|---|---|
| `npx expo lint --no-cache` | exit 0, sin errores ni advertencias | [lint.txt](evidencia/sprint-3/lint.txt) |
| `npx tsc --noEmit` | exit 0, sin errores | [tsc.txt](evidencia/sprint-3/tsc.txt) |

## 3. Pruebas unitarias (#32)

`npx jest --ci --coverage`: **62 suites, 834 pruebas, todas pasan** (exit 0). Incluye pruebas de sprints anteriores, las de integración (sección 4) y las del script de rendimiento (sección 5). Salida completa en [jest.txt](evidencia/sprint-3/jest.txt).

| Métrica global | Obtenida | Umbral |
|---|---|---|
| Sentencias | 98.89 % | 80 % |
| Ramas | 98.14 % | 70 % |
| Funciones | 97.7 % | 80 % |
| Líneas | 98.93 % | 80 % |

### Trazabilidad historia → funciones → pruebas

| Historia | Funciones (archivo fuente) | Prueba (`src/__tests__/`) | Pruebas | Estado |
|---|---|---|---|---|
| #11 Carrito | `cartRepository`: get, add, updateQuantity, remove | `cartRepository.test.ts` | 21 | Con prueba |
| #11 | Selectores y totales del carrito (`cart/cartSelectors.ts`) | `cartSelectors.test.ts` | 60 | Con prueba |
| #11 | `useCart`, `useAddToCart`, `useUpdateCartItem`, `useRemoveCartItem` (actualización optimista) | `useCart.test.tsx` | 11 | Con prueba |
| #11 | Componentes `CartSummary`, `CartItemRow` | `components/CartSummary.test.tsx`, `components/CartItemRow.test.tsx` | 12 + 11 | Con prueba |
| #12 Dirección | `addressRepository` | `addressRepository.test.ts` | 15 | Con prueba |
| #12 | Validación y selectores de dirección, mensajes de error | `addressValidation.test.ts`, `addressSelectors.test.ts`, `addressErrors.test.ts` | 43 + 21 + 11 | Con prueba |
| #12 | `useAddresses` y mutaciones | `useAddresses.test.tsx` | 12 | Con prueba |
| #12 | Componentes `AddressForm`, `AddressCard` | `components/AddressForm.test.tsx`, `components/AddressCard.test.tsx` | 10 + 5 | Con prueba (ver "Qué quedó fuera") |
| #13 Pago | `paymentRepository` (checkout, order-status) | `paymentRepository.test.ts` | 9 | Con prueba |
| #13 | Reductor de estado, selectores, sondeo, errores y configuración del pago | `paymentReducer.test.ts`, `paymentSelectors.test.ts`, `paymentPolling.test.ts`, `paymentErrors.test.ts`, `paymentConfig.test.ts` | 17 + 19 + 7 + 23 + 2 | Con prueba |
| #13 | `usePayment` (PaymentSheet, verificación ante error ambiguo, pedido por webhook) | `usePayment.test.tsx` | 26 | Con prueba |
| #14 Confirmación | `formatOrderFolio` y formato de pedido (`orders/orderFormat.ts`) | `orderFormat.test.ts` | 44 | Con prueba |
| #14 | `useOrder`, `orderRepository.getById` | `useOrder.test.tsx`, `orderRepository.test.ts` | 5 + 13 | Con prueba |
| #15 Historial | `orderRepository.getPage`, `useOrders`, `orderList` | `orderRepository.test.ts`, `useOrders.test.tsx`, `orderList.test.ts` | (ver arriba) + 7 + 7 | Con prueba |
| #14–#15 | Componentes `OrderCard`, `OrderDetailView`, `OrderStatusBadge` | `components/OrderComponents.test.tsx` | 17 | Con prueba |
| #11–#15 | Pantallas de `src/app/` y `PaymentsProvider` | — | 0 | Sin prueba automática; se valida en la aceptación manual |

### Qué quedó fuera
- Pantallas y layouts de `src/app/`: sin pruebas automáticas (mismo criterio que en el Sprint 2). Los cubre la aceptación manual.
- Los componentes se probaron simulando `@expo/vector-icons` (en Jest no carga `expo-font`/`expo-asset`); se verifica comportamiento y texto, no el aspecto.
- Cobertura de componentes por debajo del resto (por funciones): `AddressForm`/`AddressCard` 64.28 % y `CartSummary`/`CartItemRow` 66.66 % en funciones (callbacks de estilo/UI sin ejercitar).
- **Ramas de `useOrders` (85.71 %) y de `usePayment` (92.1 %):** la rama `?? 0` de `useOrders` (total cuando no hay página) no se ejercita. No se cambió código de producción por esto; queda documentado.

## 4. Pruebas de integración (#34)

Piezas reales: cliente Axios con interceptores, repositories, hooks, caché de TanStack Query y stores. **Solo el `adapter` de Axios y Stripe (PaymentSheet) son falsos**: ninguna petición sale a la red, a Railway ni a Stripe. El servidor falso tiene estado (carrito, direcciones, pedidos, PaymentIntents) en `src/__tests__/utils/servidorTienda.ts`.

| Archivo | Pruebas | Resultado |
|---|---|---|
| `integration/compraDeExtremoAExtremo.test.tsx` | 8: compra completa (carrito → dirección → pago → pedido → historial y detalle); tarjeta rechazada y reintento; hoja cancelada; webhook que tarda; stock insuficiente; carrito vacío; error 400 por campo; error 500 sin exponer texto interno | 8/8 OK |
| `integration/sesionCompra.test.tsx` | 2: al cerrar sesión se vacían carrito, direcciones y pedidos y no se vuelve a consultar; la cuenta siguiente nunca ve el carrito de la anterior | 2/2 OK |

Se comprobó que la prueba detecta regresiones: al quitar a propósito la invalidación de pedidos tras el pago, una prueba falló; el código se restauró.

## 5. Rendimiento (#35)

> **Los tiempos son del backend local contra una rama de Neon. No representan producción (Railway).** El script solo corre contra localhost y se niega con claves live.

Herramienta: `scripts/medir-rendimiento.mjs` (guarda en `scripts/lib/perfGuard.js`; 46 pruebas: 37 de la guarda y 9 del script). Comando: `--con-escrituras --webhook=3`, 20 repeticiones por endpoint, ejecutado por Angel el 2026-10-13 05:58 UTC (noche del 12 de octubre, hora de México). Datos crudos: [rendimiento-2.json](evidencia/sprint-3/rendimiento-2.json). La medición anterior ([rendimiento.json](evidencia/sprint-3/rendimiento.json)) quedó reemplazada: tenía DELETE inválido y no midió checkout.

| Medición | n válidas / errores | p50 (ms) | p95 (ms) | Máx (ms) | Umbral p95 | Veredicto |
|---|---|---|---|---|---|---|
| GET /cart | 20 / 0 | 346 | 352 | 1222 | < 1000 | cumple |
| GET /profile/addresses | 20 / 0 | 137 | 142 | 145 | < 1000 | cumple |
| GET /orders | 20 / 0 | 333 | 337 | 527 | < 1000 | cumple |
| GET /orders/:id | 20 / 0 | 331 | 337 | 599 | < 1000 | cumple |
| POST /cart/items/:id | 20 / 0 | 620 | 630 | 1047 | < 1500 | cumple |
| PATCH /cart/items/:id | 20 / 0 | 277 | 282 | 283 | < 1500 | cumple |
| DELETE /cart/items/:id | 20 / 0 | 279 | 284 | 285 | < 1500 | cumple |
| POST /payments/checkout | 20 / 0 | 670 | 708 | 928 | < 3000 | cumple |
| Webhook → pedido | 0 / 3 | — | — | — | < 10000 | **no medido** (el JSON dice "no cumple") |

Veredictos tal como salieron, sin ajustar umbrales. El umbral se evalúa sobre p95; se anota el máximo porque `GET /cart` tuvo un pico aislado de 1222 ms (1 de 20), por encima de 1000 ms, que no afecta al p95 pero conviene saberlo.

### Webhook → pedido: NO se obtuvo medición válida
Las 3 repeticiones fallaron, por lo que **no hay un tiempo de webhook**. El "no cumple" del JSON significa "no hubo medición", no que el webhook haya tardado más de 10 s:

| Repetición | Resultado | Lectura |
|---|---|---|
| 1 | "tiempo agotado sin pedido" | Se creó el PaymentIntent, pero no apareció ningún pedido en 60 s. Con los datos disponibles no se puede decir si no se confirmó el pago, si `stripe listen` no entregó el evento o si el webhook no creó el pedido. |
| 2 y 3 | "no se creó el PaymentIntent" | El script no creó el PI. El JSON no guarda el estado HTTP, así que la causa exacta se desconoce. |

Hipótesis sin verificar para 2 y 3: tras la repetición 1 el ítem quedó en el carrito (no hubo pedido que lo vaciara) y el producto tiene "Máximo disponible: 1" (visible en [hu11-carrito.jpeg](evidencia/sprint-3/hu11-carrito.jpeg)), así que `POST /cart/items/:id` pudo rechazarse y el script abandona la repetición. Es una hipótesis, no un hallazgo.

### Qué se validó y qué no
- La corrección del script (DELETE con ítem presente, "con errores" en vez de "cumple", registro de omitidas) **funciona contra el backend real**: DELETE salió 20/0, checkout 20/0, GET /orders/:id 20/0 y `omitidas` quedó vacío.
- Mediciones omitidas: ninguna.
- El webhook sigue sin medirse. El pedido SYS-000010 de la aceptación manual (sección 6) se creó por el webhook, pero **no se cronometró**, así que no sirve como medición.

### Pendiente para cerrar el webhook
1. Backend local arriba con el `.env` apuntando a la rama de Neon, la cuenta con **el carrito vacío** y stock suficiente (o un producto con stock ≥ 3).
2. `stripe listen --events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled --forward-to localhost:4000/api/webhooks/stripe` en otra terminal.
3. `node scripts/medir-rendimiento.mjs --con-escrituras --webhook=3 --salida=docs/pruebas/evidencia/sprint-3/rendimiento-3.json`. Por cada repetición, tras presionar Enter: `stripe payment_intents confirm <pi> --payment-method=pm_card_visa`.

## 6. Pruebas de aceptación (manuales) (#36)

- **Quién:** Angel (@AngeloMtz), de forma manual.
- **Dónde:** Expo Go (o emulador), con el backend de SYSCOM y Stripe en **modo de prueba**.
- **Estado:** **PENDIENTE DE VALIDACIÓN MANUAL.** Claude no ejecutó ninguno de estos pasos. Ya están subidas 9 capturas (2026-10-12, de 11:13 a 11:49), pero el resultado de cada criterio (OK / FALLÓ / NO PROBADO) no se ha reportado, por eso la columna Resultado sigue en PENDIENTE. Lo que muestra cada captura está en la tabla siguiente.
- Prerrequisito: sesión iniciada con la cuenta de prueba y al menos un producto con stock.
- Tarjetas de prueba de Stripe: éxito `4242 4242 4242 4242`; rechazada `4000 0000 0000 0002`; 3D Secure `4000 0025 0000 3155`; cualquier fecha futura y CVC.

| Historia | Criterio | Pasos | Resultado | Evidencia |
|---|---|---|---|---|
| #11 | Suma total se actualiza en tiempo real | 1. Agregar 2 productos desde el detalle. 2. Abrir la pestaña Carrito. 3. Subir y bajar la cantidad de un producto con +/−. 4. Observar el total tras cada toque. | PENDIENTE | `hu11-carrito.jpeg` |
| #11 | Eliminar producto lo quita del carrito y del total | 1. En el carrito, eliminar un producto. 2. Verificar que desaparece y que el total baja por su importe. 3. Eliminar el último y ver el estado vacío. | PENDIENTE | `hu11-carrito-vacio.jpeg` |
| #12 | Valida campos obligatorios | 1. Con el carrito lleno, ir a Pagar → agregar dirección. 2. Dejar campos vacíos y guardar. 3. Verificar que marca los obligatorios y no guarda. | PENDIENTE | `hu12-validacion.jpeg` |
| #12 | Permite guardar dirección para futuras compras | 1. Guardar una dirección válida. 2. Salir del checkout y volver a entrar (o reabrir la app). 3. Verificar que la dirección aparece para seleccionarla. | PENDIENTE | `hu12-direcciones.jpeg` |
| #13 | Pago de prueba se procesa correctamente en modo sandbox | 1. Elegir dirección y pagar. 2. En la hoja de pago usar `4242 4242 4242 4242`. 3. Verificar que se confirma y se abre la confirmación del pedido. | PENDIENTE | `hu13-pago.jpeg` |
| #13 | Errores de pago se muestran al usuario con mensaje claro | 1. Pagar con `4000 0000 0000 0002`. 2. Verificar el mensaje de tarjeta rechazada. 3. Reintentar con `4242…` y confirmar que funciona. 4. (Opcional) cerrar la hoja con la X y probar `4000 0025 0000 3155` fallando la autenticación; anotar qué mensaje aparece. | PENDIENTE | `hu13-error.jpeg` |
| #14 | Muestra folio de orden generado | 1. Tras un pago exitoso, ver la pantalla de confirmación. 2. Verificar el folio con formato `SYS-000123` y que coincide con el del historial. | PENDIENTE | `hu14-confirmacion.jpeg` |
| #14 | Botón para volver al inicio | 1. En la confirmación, tocar "Volver al inicio". 2. Verificar que abre Inicio y que "atrás" no regresa al pago. | PENDIENTE | `hu14-inicio.jpeg` |
| #15 | Muestra fecha, total y estado de cada pedido | 1. Abrir Perfil → Mis pedidos. 2. Verificar que cada tarjeta muestra folio, fecha, total y estado. 3. Con más de una página, hacer scroll y comprobar que carga más. | PENDIENTE | `hu15-historial.jpeg` |
| #15 | Tap en pedido muestra el detalle | 1. Tocar un pedido. 2. Verificar productos, total, dirección y estado. 3. Volver y comprobar que la lista sigue ahí. | PENDIENTE | `hu15-detalle.jpeg` |

### Capturas recibidas (qué muestra cada una; no equivale a un resultado)

| Captura | Muestra | Observación |
|---|---|---|
| `hu11-carrito.jpeg` | Carrito con 1 producto (HP ProBook 850 G4 Touch, $7,200.00), "Máximo disponible: 1", total $7,200.00 y "Continuar con el pago" deshabilitado por falta de dirección | No muestra el total cambiando con +/−: con máximo 1 la cantidad no puede subir |
| `hu11-carrito-vacio.jpeg` | Estado vacío "Tu carrito está vacío" con botón "Ver catálogo" | Muestra el resultado de eliminar, no el momento en que el total baja |
| `hu12-validacion.jpeg` | Formulario "Nueva dirección" vacío, con las ayudas "De 5 a 150 caracteres" y "5 dígitos" | **No muestra errores de validación**: es el formulario antes de guardar |
| `hu12-direcciones.jpeg` | "Mis direcciones" con una dirección guardada y seleccionada "Para el envío" | Muestra que la dirección existe; no que persista al reabrir la app |
| `hu13-pago.jpeg` | "Resumen y pago" antes de pagar (producto, dirección, total $7,200.00, aviso de modo de pruebas) | **No muestra el pago hecho**: el pago exitoso se ve en `hu14-confirmacion.jpeg` |
| `hu13-error.jpeg` | "Resumen y pago" con la franja "Pago cancelado. No se te cobró." | La franja corresponde a cancelar/cerrar la hoja, **no al mensaje de tarjeta rechazada**; no se sabe con qué tarjeta se hizo |
| `hu14-confirmacion.jpeg` | "Pedido confirmado": ¡Pago exitoso!, folio `SYS-000010`, "Confirmado", fecha 12 oct 2026, producto, total, dirección, "Volver al inicio" y "Ver mis pedidos" | Muestra el botón, no el resultado de tocarlo |
| `hu15-historial.jpeg` | "Mis pedidos", 1 pedido: `SYS-000010`, 12 oct 2026, Confirmado, 1 producto, $7,200.00 | Folio, fecha, total y estado visibles; 1 solo pedido, sin paginación |
| `hu15-detalle.jpeg` | "Pedido" con folio `SYS-000010`, producto, total, envío y pago (Tarjeta (Stripe), Pagado) | El folio coincide con el de la confirmación y el historial |

**Falta `hu14-inicio.jpeg`** (criterio "Volver al inicio"): no está en la carpeta.

Casos adicionales sugeridos, no son criterios del issue: carrito vacío al abrir el checkout, pedido sin conexión (mensaje de error), sin sesión (redirige a login).

## 7. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| 1 | Script de rendimiento: DELETE con 19 errores de 20 y veredicto "cumple" | Borraba el mismo ítem repetidamente; el veredicto se calculaba solo con las peticiones exitosas | Agregar el ítem antes de cada DELETE; "con errores" si hay errores; registrar omisiones | `96d94b2` (`fix:`; prueba previa en `912ab7b`) (#35). Verificado en la medición real: DELETE 20/0 |
| 2 | Pruebas de integración colgaban Jest (handle abierto) | Las mutaciones conservaban 5 min de `gcTime` en el `queryClient` compartido | `gcTime: 0` en la prueba | Incluida en #34 (PR #99) |
| 3 | En una ejecución de Jest fallaron 4 suites con `EPERM … failed to cache transform results` | Caché de transformación compartida entre workers en Windows | Sin cambio de código: se repitió y pasó; se considera flake del entorno | — |
| 4 | Medición del webhook: 0 de 3 repeticiones válidas | Sin determinar (ver sección 5); el script no guarda el estado HTTP cuando falla la creación del PaymentIntent | Sin corrección todavía | — |

## 8. Límites conocidos

- **Variante y cantidad al agregar:** `POST /cart/items/:id` no recibe variante ni cantidad; el precio es el `precio_base` del producto. La variante visible en el detalle no se envía (comentado en el código).
- **Pedido creado por el webhook, no por la app:** se crea con el contenido ACTUAL del carrito del servidor, sin idempotencia en el webhook. La app sondea `order-status` y verifica ante errores ambiguos.
- **Cancelación de pedidos:** no se cubre en este sprint ni se prueba su efecto sobre stock o pago.
- **PaymentSheet:** los resultados crudos de "cerrar con la X tras un rechazo" y de "3DS en Fail" no se han contrastado en un dispositivo real; el mapeo de mensajes se probó solo con respuestas simuladas.
- **`GET /orders`:** la forma real de la respuesta se confirmó con el backend real en la validación manual del PR #96; las pruebas automáticas usan respuestas simuladas.
- **Rendimiento:** solo del backend local contra Neon; el webhook → pedido no tiene medición válida (sección 5).
- **Stock del producto de prueba:** el producto usado tiene "Máximo disponible: 1"; con ese stock no se puede probar subir la cantidad con +.

## 9. Pendientes

| Pendiente | Quién |
|---|---|
| Validación manual de los 10 criterios y capturas (sección 6) | Angel |
| Repetir solo la medición del webhook con carrito vacío y `stripe listen --events …` (sección 5) | Angel |
| Reportar el resultado de cada criterio y agregar `hu14-inicio.jpeg`; retomar `hu12-validacion` y `hu13-pago` con capturas que muestren el error de validación y la hoja de pago | Angel |
| Probar PaymentSheet en dispositivo (X tras rechazo, 3DS en Fail) y decidir sobre el mensaje de respaldo `localizedMessage` | Angel |
| Release `release/sprint-3` → `main` y tag `v0.3.0` | Tras la aprobación del PR; el tag solo con aviso previo |

## 10. Evidencia

Archivos en `docs/pruebas/evidencia/sprint-3/`: `lint.txt`, `tsc.txt`, `jest.txt` (esta ejecución), `rendimiento-2.json` (medición vigente), `rendimiento.json` (medición anterior, con DELETE inválido; se conserva como historial) y 9 capturas `hu11` a `hu15`.
