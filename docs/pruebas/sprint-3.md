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
| Rendimiento | **Parcial.** Lecturas y escrituras de carrito medidas (cumplen); DELETE inválido; checkout y webhook → pedido **sin medir** (ver sección 5) | #35 |
| Aceptación (manual) | **PENDIENTE DE VALIDACIÓN MANUAL**: 0/10 criterios validados (los recorre Angel en Expo Go) | #36 |

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

Herramienta: `scripts/medir-rendimiento.mjs` (guarda en `scripts/lib/perfGuard.js`; 53 pruebas del script y su guarda). Medición ejecutada por Angel el 2026-10-13 04:26 UTC (2026-10-12 por la noche, hora de México), 20 repeticiones por endpoint. Datos crudos: [rendimiento.json](evidencia/sprint-3/rendimiento.json).

| Medición | n válidas / errores | p50 (ms) | p95 (ms) | Umbral p95 | Veredicto |
|---|---|---|---|---|---|
| GET /cart | 20 / 0 | 163 | 178 | < 1000 | cumple |
| GET /profile/addresses | 20 / 0 | 168 | 193 | < 1000 | cumple |
| GET /orders | 20 / 0 | 381 | 388 | < 1000 | cumple |
| POST /cart/items/:id | 20 / 0 | 664 | 842 | < 1500 | cumple |
| PATCH /cart/items/:id | 20 / 0 | 307 | 329 | < 1500 | cumple |
| DELETE /cart/items/:id | 1 / 19 | — | — | < 1500 | **INVÁLIDA** (ver abajo) |
| GET /orders/:id | — | — | — | < 1000 | **No medida**: la cuenta de prueba no tenía pedidos |
| POST /payments/checkout | — | — | — | < 3000 | **No medida**: ver abajo |
| Webhook → pedido | — | — | — | < 10000 | **No medida** (no se pidió `--webhook`) |

Veredictos tal como salieron, sin ajustar umbrales.

### Por qué hay mediciones inválidas o ausentes
- **DELETE:** el script borraba el mismo ítem 20 veces; la primera funcionó y las otras 19 fallaron porque el ítem ya no estaba. Esos datos no sirven y el "cumple" del JSON **no debe leerse como resultado**. Fallo del script, no del backend.
- **Checkout:** el script lo omite si la cuenta no tiene direcciones guardadas. No tenerlas explica la ausencia (el JSON de esa versión no registraba las omisiones).
- **Webhook:** requiere `--webhook=N` y confirmar cada PaymentIntent a mano.

### Corrección (commit `fix:`)
En esta rama el script ya agrega el ítem antes de cada DELETE (y solo cronometra el DELETE), no declara "cumple" cuando hay errores (`con errores`) y registra en el JSON lo omitido y su motivo (`omitidas`). Cubierto por pruebas nuevas contra un servidor local falso. **Esta corrección no se ha ejercitado contra el backend real**: hay que repetir la medición.

### Pendiente de repetir (Angel)
1. Confirmar que el `.env` de `syscom-backend` apunta a la **rama de Neon**, no a producción.
2. Guardar una dirección en la cuenta de prueba (y, si se quiere medir `GET /orders/:id`, tener al menos un pedido).
3. Correr, con el backend local arriba, `node scripts/medir-rendimiento.mjs --con-escrituras --webhook=3 --salida=docs/pruebas/evidencia/sprint-3/rendimiento-2.json` con `PERF_TOKEN`, `PERF_DB_ES_RAMA=si` y `PERF_PRODUCT_ID`, y en otra terminal `stripe listen --forward-to localhost:4000/api/webhooks/stripe`. Por cada repetición: `stripe payment_intents confirm <pi> --payment-method=pm_card_visa`.
4. Pasar el JSON para completar esta sección.

## 6. Pruebas de aceptación (manuales) (#36)

- **Quién:** Angel (@AngeloMtz), de forma manual.
- **Dónde:** Expo Go (o emulador), con el backend de SYSCOM y Stripe en **modo de prueba**.
- **Estado:** **PENDIENTE DE VALIDACIÓN MANUAL.** Claude no ejecutó ninguno de estos pasos.
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

Capturas por tomar en `docs/pruebas/evidencia/sprint-3/` con los nombres de la tabla. Casos adicionales sugeridos, no son criterios del issue: carrito vacío al abrir el checkout, pedido sin conexión (mensaje de error), sin sesión (redirige a login).

## 7. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| 1 | Script de rendimiento: DELETE con 19 errores de 20 y veredicto "cumple" | Borraba el mismo ítem repetidamente; el veredicto se calculaba solo con las peticiones exitosas | Agregar el ítem antes de cada DELETE; "con errores" si hay errores; registrar omisiones | `fix:` de esta rama (#35) |
| 2 | Pruebas de integración colgaban Jest (handle abierto) | Las mutaciones conservaban 5 min de `gcTime` en el `queryClient` compartido | `gcTime: 0` en la prueba | Incluida en #34 (PR #99) |
| 3 | En una ejecución de Jest fallaron 4 suites con `EPERM … failed to cache transform results` | Caché de transformación compartida entre workers en Windows | Sin cambio de código: se repitió y pasó; se considera flake del entorno | — |

## 8. Límites conocidos

- **Variante y cantidad al agregar:** `POST /cart/items/:id` no recibe variante ni cantidad; el precio es el `precio_base` del producto. La variante visible en el detalle no se envía (comentado en el código).
- **Pedido creado por el webhook, no por la app:** se crea con el contenido ACTUAL del carrito del servidor, sin idempotencia en el webhook. La app sondea `order-status` y verifica ante errores ambiguos.
- **Cancelación de pedidos:** no se cubre en este sprint ni se prueba su efecto sobre stock o pago.
- **PaymentSheet:** los resultados crudos de "cerrar con la X tras un rechazo" y de "3DS en Fail" no se han contrastado en un dispositivo real; el mapeo de mensajes se probó solo con respuestas simuladas.
- **`GET /orders`:** la forma real de la respuesta se confirmó con el backend real en la validación manual del PR #96; las pruebas automáticas usan respuestas simuladas.
- **Rendimiento:** medición parcial y solo del backend local contra Neon (sección 5).

## 9. Pendientes

| Pendiente | Quién |
|---|---|
| Validación manual de los 10 criterios y capturas (sección 6) | Angel |
| Repetir la medición de rendimiento con la corrección (sección 5) | Angel |
| Probar PaymentSheet en dispositivo (X tras rechazo, 3DS en Fail) y decidir sobre el mensaje de respaldo `localizedMessage` | Angel |
| Release `release/sprint-3` → `main` y tag `v0.3.0` | Tras la aprobación del PR; el tag solo con aviso previo |

## 10. Evidencia

Archivos en `docs/pruebas/evidencia/sprint-3/`: `lint.txt`, `tsc.txt`, `jest.txt` (esta ejecución), `rendimiento.json` (medición del script anterior, con las limitaciones de la sección 5).
