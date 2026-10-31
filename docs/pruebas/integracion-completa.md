# Reporte de pruebas — Integración completa (cierre, issue #44)

- **Fecha:** 2026-10-31
- **Rama:** `test/44-integracion-completa` (PR B). El PR A (utilidades y sesión) es el #170, ya fusionado
- **Historias cubiertas:** suma de #1–#20 (los módulos que tienen pruebas de integración se listan en la sección 3)
- **Responsable de pruebas:** @AngeloMtz
- **Commit base:** `develop` en `2e6fefb` (incluye los PR #170, #172, #174 y #176)

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK: `npx expo lint` 0 errores y 0 advertencias; `npx tsc --noEmit` sin errores | #44 |
| Unitarias + integración (suite completa) | 132 suites y 1665 pruebas pasan (`--maxWorkers=2`); cobertura 99.11 % sentencias / 97.46 % ramas / 98.56 % funciones / 99.36 % líneas (umbral del proyecto: 80/80/80/70) | #44 |
| Integración | **151/151 pasan** en 16 archivos (28 son de este PR). Contra servidores falsos, **no** contra el backend real | #44 |
| Alteraciones a propósito | 5 cambios al código de producción, todos detectados; 2 de ellos NO se detectaron con la primera versión de la prueba y obligaron a reforzarla (sección 6) | #44 |
| Rendimiento | No aplica (lo cubre el issue #46) | — |
| Aceptación (manual) | No aplica aquí (issue #43 y E2E en APK, #20) | — |

## 2. Qué valida y qué NO valida

Son pruebas de integración **de la app con un servidor falso**. Las piezas son las reales: pantallas, hooks, repositories, selectores, el cliente Axios con sus interceptores (Bearer y sesión caducada), la caché de TanStack Query y los stores. Solo se simula lo externo: el `adapter` de Axios (los servidores falsos), `expo-router`, `expo-secure-store`, `expo-notifications`, `expo-constants`, el SDK de Stripe y los iconos.

- **Sí validan:** el contrato que la app espera del servidor (qué rutas llama, con qué cuerpo, con qué cabecera, y cómo reacciona a sus respuestas) y que las pantallas, la caché y los stores se mantienen coherentes entre módulos.
- **No validan:** el comportamiento del backend real, de la base de datos, de Stripe, de las notificaciones push ni del dispositivo. **Las formas de respuesta de los servidores falsos salen del código de la app (qué campos lee cada repository) y del código del backend, no de respuestas reales.** Los textos de los mensajes de error y de `reason` de los servidores falsos son de prueba: no se copiaron del backend. Los códigos que los servidores falsos asumen sin haberlos contrastado (por ejemplo 409 para una reseña duplicada) tampoco están verificados contra el backend.
- **Sin red real, sin producción y sin credenciales.**

Los archivos están en `src/__tests__/integration/` y, a propósito, no entran en `collectCoverageFrom`.

## 3. Archivos de integración

| Archivo | Flujo | HU | Pruebas | PR |
|---|---|---|---|---|
| `arranqueDeLaApp.test.tsx` | Hidratación de sesión y onboarding al arrancar (RootLayout) | #3, #5 | 7 | previo |
| `autenticacion.test.tsx` | Registro, login, 2FA y recuperación de contraseña | #2, #3 | 12 | previo |
| `catalogoApi.test.tsx` | Filtros → hook → repository → Axios → caché | #6–#9 | 7 | previo |
| `favoritosApi.test.tsx` | Favoritos: hook → repository → Axios → caché | #10 | 6 | previo |
| `compraDeExtremoAExtremo.test.tsx` | Carrito → dirección → pago → pedido → historial | #11–#15 | 8 | previo |
| `sesionCache.test.tsx` | Sesión y caché compartida (`authStore` + `queryClient` real) | #3, #4, #10 | 2 | previo |
| `sesionCompra.test.tsx` | Al cerrar sesión no queda nada de la cuenta anterior en carrito, direcciones, pedidos ni pago | #3, #11–#15 | 2 | previo |
| `realidadAumentada.test.tsx` | Botón AR → modelos → visor | #16 | 12 | previo |
| `notificacionesPush.test.tsx` | Permiso → token → registro → bandeja y preferencias → cierre de sesión | #17 | 21 | previo |
| `chatbotYChatEnVivo.test.tsx` | Asistente (HTTP) y chat en vivo (Socket.io simulado) | #18 | 25 | previo |
| `perfilYMiCuenta.test.tsx` | Guarda de sesión, datos personales y cierre de sesión desde Mi cuenta | #2, #4 | 9 | PR A (#170) |
| `extensionesServidorTienda.test.tsx` | Comprueba las utilidades de la tienda (promociones, cupones, catálogo paginado, pedido entregado) y el enrutador | utilidades | 8 | PR A (#170) |
| `sesionCaducada.test.tsx` | Un 403 «Token inválido o expirado» (o un 401) cierra la sesión y saca al login | #3 | 4 | #172 |
| `ofertasYDescuentoCarrito.test.tsx` | Ofertas en el Inicio y «Ver todas»; precio con descuento en el carrito y en el pago | Inicio, #11, #13 | 11 | **PR B** |
| `resenas.test.tsx` | Quién puede reseñar, envío, Mis reseñas, reseña aprobada y errores del servidor | #19 | 14 | **PR B** |
| `recorridoCompleto.test.tsx` | Recorrido de un cliente de principio a fin, tarjeta rechazada y cambio de cuenta | #2–#4, #11–#15, #19 | 3 | **PR B** |
| **Total** | | | **151** | |

Los 13 archivos anteriores a este PR suman 123 pruebas; este PR agrega 3 archivos y 28 pruebas.

### Utilidades de apoyo (`src/__tests__/utils/`)
| Utilidad | Para qué sirve | Cambio en este PR |
|---|---|---|
| `enrutadorServidores.ts` | Combina varios servidores falsos en un solo `adapter` y registra las peticiones con su cabecera Authorization | sin cambios |
| `servidorAuth.ts` | Cuentas, códigos de correo, tokens y perfil | solo aditivo: `cuentaDe(config)` |
| `servidorTienda.ts` | Carrito, direcciones, pagos, pedidos y catálogo con promociones | solo aditivo: `monto` en cada PaymentIntent y `sembrarPedido()` |
| `servidorResenas.ts` | can-review, `POST /reviews`, `/reviews/my` y `/reviews/product/:id` (solo aprobadas), con `aprobarResena()` y `rechazarResena()` | **nuevo** |
| `servidorContenidoPublico.ts` | Banners, categorías, marcas, destacados, servicios, contenido institucional y favoritos vacíos, para montar el Inicio | **nuevo** |

Antes y después de tocar las utilidades se corrieron **todas** las pruebas de integración (secciones de evidencia): antes 13 suites y 123 pruebas pasan ([01-antes-utilidades.txt](evidencia/integracion/01-antes-utilidades.txt)); después, 123/123 con las utilidades nuevas ([02-despues-utilidades.txt](evidencia/integracion/02-despues-utilidades.txt)). Ver la nota de la sección 7 sobre la primera corrida posterior, que mostró 2 fallos que no se repitieron. Después de la última utilidad agregada (`sembrarPedido`) se corrió otra vez toda la carpeta: 16 suites y 151 pruebas pasan, con las 13 suites anteriores incluidas.

## 4. Qué cubre cada archivo nuevo

| Archivo | Casos |
|---|---|
| `ofertasYDescuentoCarrito` | Inicio muestra Ofertas con la etiqueta de descuento; sin promociones el Inicio no pinta Ofertas; «Ver todas» lleva a `/promociones`; Promociones lista solo lo que tiene promoción, del mayor al menor descuento; sin promociones dice «No hay promociones por ahora»; con más de 100 productos en oferta se piden las páginas 1 y 2 del catálogo y se juntan (101 ofertas); carrito con precio tachado, precio con descuento por unidad, «-10 %» y total del servidor; línea sin promoción pintada como siempre; línea con cupón con el precio del cupón y sin etiqueta de descuento; al desactivar la promoción desaparece de Ofertas y el carrito vuelve al precio normal; el PaymentIntent y el pedido salen con el total descontado, no con el precio base |
| `resenas` | Sin compra no hay formulario (en el detalle y en la pantalla de escribir); un pedido no entregado no da derecho y al entregarse sí; el detalle ofrece «Escribir reseña» con un pedido entregado; el pedido entregado de otro producto no da derecho; el envío manda el pedido que dio derecho y la reseña queda «Pendiente» en Mis reseñas, y el detalle avisa «Ya dejaste una reseña»; al aprobarla un administrador el detalle la muestra con autor, promedio y total; una reseña rechazada sale «Rechazada» y nunca en el detalle; errores 400, 409 y 500 (mensaje del servidor, texto conservado, reintento); fallo al verificar la compra con «Reintentar»; sin sesión (reseñas públicas, «Escribir reseña» lleva al login, no se consulta lo privado) y guardas de Mis reseñas y escribir reseña |
| `recorridoCompleto` | **1.** Login con 2FA → Inicio con Ofertas «-10 %» → carrito con descuento → pago → confirmación y detalle con el total descontado → un pedido aún no entregado no ofrece «Reseñar» → pedido entregado (acción de prueba sobre el servidor falso) → «Reseñar» → reseña «Pendiente» en Mis reseñas → cierre de sesión sin token y con la caché sin datos. **2.** Tarjeta rechazada: no hay cobro ni pedido, el carrito se conserva y el reintento crea un PaymentIntent nuevo y cobra el total descontado. **3.** La cuenta siguiente en el mismo dispositivo no ve nada de la anterior (caché vacía, su perfil, Mis reseñas vacía, y cada petición con su propio Bearer) |

## 5. Comandos

```bash
# Solo las pruebas de integración
npx jest --ci --maxWorkers=2 src/__tests__/integration

# Solo las de este PR
npx jest --ci --maxWorkers=2 "src/__tests__/integration/(ofertasYDescuentoCarrito|resenas|recorridoCompleto)"

# Suite completa con cobertura (la del CI)
npx jest --ci --coverage --maxWorkers=2

# Análisis estático
npx expo lint
npx tsc --noEmit
```

## 6. Comprobación de que las pruebas detectan cambios

Se alteró a propósito el código de producción (cada cambio se restauró con `git checkout` y se verificó con `git status` que no quedó nada). Se corrieron las 3 pruebas de este PR (28 pruebas) por cada alteración. Salida completa en [03-alteraciones.txt](evidencia/integracion/03-alteraciones.txt).

| # | Cambio hecho a propósito | Archivo | Pruebas que fallan | Detectado |
|---|---|---|---|---|
| M1 | El descuento no se deriva de `precio_base` (usa el precio unitario como base) | `cart/cartSelectors.ts` | 2: carrito con precio tachado y «-10 %»; recorrido completo | Sí |
| M2 | «Escribir reseña» no depende de lo que responde can-review | `reviews/components/WriteReviewAction.tsx` | 4: sin compra, pedido sin entregar, pedido de otro producto, envío y seguimiento | Sí |
| M3 | El cierre de sesión no limpia la caché (`queryClient.clear()` comentado) | `shared/store/authStore.ts` | **0 con la primera versión de la prueba** → 2 con la prueba corregida (M3b): recorrido completo y cuenta siguiente | Sí, tras reforzar la prueba |
| M4 | Las ofertas incluyen productos sin promoción | `catalog/selectors.ts` | 5: lista de Promociones, sin promociones en Inicio y en Promociones, paginación, desactivar promoción | Sí |
| M5 | «Reseñar» aparece en el detalle de un pedido aunque no esté entregado | `orders/orderFormat.ts` | **0 con la primera versión** → 1 con la prueba corregida (M5b): recorrido completo | Sí, tras reforzar la prueba |

Dos alteraciones (M3 y M5) pasaron desapercibidas con la primera versión de las pruebas, y eso mostró dos huecos que se corrigieron:
- **M3:** el `queryClient` de la prueba descartaba los datos al salir de cada pantalla (`gcTime: 0`), así que la prueba no podía saber si el cierre de sesión los limpiaba. Ahora conserva las consultas (`gcTime` infinito) y solo `clear()` las quita.
- **M5:** la prueba miraba «Reseñar» solo en la pantalla de confirmación, donde ese botón no se muestra de todos modos. Se agregó el paso del detalle normal de un pedido que aún no se entrega.

Las pruebas usan la lógica de producción real; las alteraciones se hicieron sobre ella, no sobre los servidores falsos.

## 7. Hallazgos

Los tres del PR A y su estado real:

| # | Hallazgo | Estado real |
|---|---|---|
| A | Sin manejo de sesión caducada: el backend responde **403** «Token inválido o expirado» y la app no lo trataba | **Corregido** en el PR #172 (issue #171, cerrado). El cliente cierra la sesión con un 401, o con un 403 **solo si el texto del backend coincide** con «Token inválido o expirado»; cualquier otro 403 no cierra sesión. Probado con el servidor falso (`sesionCaducada.test.tsx`). **PENDIENTE DE VALIDACIÓN MANUAL:** con un token vencido real en el dispositivo, la app debe volver al login |
| B | El nombre del perfil pedía 4–25 caracteres y el registro, 3–40 | **Corregido** en la app (PR #174, issue #173, cerrado, incluye la pantalla Datos personales) y en el backend (PR #6 de `LAHH18/syscom-backend`, fusionado, issue #5). **Pendiente:** confirmar que el fork desplegado se sincronizó con ese cambio. **PENDIENTE DE VALIDACIÓN MANUAL:** guardar Datos personales con un nombre de 3 letras y con uno de 40 contra el backend ya desplegado. La web sigue pidiendo 4–25 en su **registro** (`syscom-frontend`, `src/lib/validations/auth.ts`); su formulario de perfil no mide el nombre |
| C | `useLogout` no revoca el token: no llama a `POST /auth/logout` | **Limitación documentada, sin cambio.** El backend solo borra la cookie en `/auth/logout` y no revoca el JWT (vive 7 días, sin refresh). La app cierra la sesión localmente (borra el token y la caché) y desregistra el token de push antes de hacerlo. Un JWT robado seguiría siendo válido hasta que expire |

### Nota sobre las corridas del trabajo
- La primera corrida de integración tras tocar las utilidades mostró **2 pruebas fallidas** (`autenticacion` y `notificacionesPush`) cuyo mensaje no se guardó. No se repitieron: esas dos suites solas dieron 33/33 y las corridas completas siguientes dieron 123/123. En otra corrida posterior, sin los archivos nuevos, `autenticacion` falló una vez por **«Exceeded timeout of 5000 ms»** (la prueba del login sin 2FA). La causa no se investigó: la sospecha es que el tiempo de espera de 5 s por defecto de Jest es justo para esas pruebas cuando la máquina está cargada. **Puede aparecer como una falla intermitente en el CI** y no se cambió, por quedar fuera del alcance de este PR.
- En `recorridoCompleto` el `queryClient` real de la app guarda los datos 5 minutos (`staleTime`): el detalle de un pedido ya visitado se muestra con el estado anterior hasta que se refresca (jalar para actualizar) o pasan 5 minutos. La prueba simula ese refresco con `invalidateQueries`. Es comportamiento actual de la app, no se cambió.

## 8. Límites conocidos

- **Límite de solicitudes en `/auth`:** el backend permite 20 solicitudes cada 15 minutos por IP en `/api/auth` (con `trust proxy` en 1). Detrás de una red compartida o de un proxy, varios usuarios o varias pruebas manuales pueden agotarlo y recibir un 429. La app muestra «Demasiados intentos…», pero el límite es del backend y las pruebas de integración no lo ejercitan contra el servidor real.
- **El mensaje de error 500 puede exponer texto interno:** el backend devuelve a veces el mensaje interno del error (`err.message`) en los 500. La app lo muestra tal cual en la mayoría de las pantallas; en el pago, un 5xx se reemplaza por un texto genérico. Pendiente en el backend.
- **Contraseñas con patrones bloqueados:** el backend rechaza contraseñas que contengan ciertos patrones que su validación trata como «contenido peligroso» aunque cumplan las reglas visibles de longitud, mayúscula, minúscula, número y símbolo. La app solo valida las reglas visibles, así que el rechazo llega del servidor con su mensaje.
- **El servidor falso de la tienda solo modela una cuenta:** carrito y pedidos son únicos. Por eso la comprobación entre cuentas se hace sobre la caché, el perfil, Mis reseñas y el Bearer de cada petición, y no sobre carrito ni pedidos.
- **Sin detalle de producto:** las pruebas de reseñas montan la sección de reseñas que el detalle incrusta (`ProductReviewsSection`), no la pantalla completa del detalle del producto.
- **Pago:** se prueba el hook de pago con el SDK de Stripe simulado, no la pantalla `checkout` (que exige la clave publicable real de Stripe).
- **Códigos y textos de los servidores falsos:** de prueba, no contrastados con el backend (ver sección 2).

## 9. Qué queda manual / fuera de integración

| Qué | Por qué no está en integración | Dónde se valida |
|---|---|---|
| Stripe real (PaymentSheet, tarjetas de prueba, webhook que crea el pedido) | Requiere Stripe y el webhook del backend reales | E2E en APK (#20) |
| Push real (entrega por Expo Push y Firebase, toque sobre la notificación) | Requiere dispositivo, Firebase y permisos del sistema | Aceptación manual (sprint 4 y 5) |
| Realidad aumentada en cámara | Requiere ARCore o Quick Look en dispositivo | Aceptación manual (sprint 4) |
| Chat en vivo y chatbot contra el backend real | Los tests usan un socket y un asistente simulados | Aceptación manual (sprint 4) |
| Render en dispositivo (diseño, teclado, gestos, fuentes, iconos) | Los tests no pintan en pantalla; los iconos están simulados | Aceptación manual |
| Producción (Railway, Neon, variables de entorno, `EXPO_PUBLIC_API_URL` en el perfil `production` de EAS) | Sin red real ni credenciales | Despliegue y E2E (#20) |
| iOS | Ninguna prueba se ejecutó en iOS | Pendiente, sin dispositivo |
| Enrutado real de `expo-router` (rutas, layouts, guardas por segmento y la transición entre pantallas) | `expo-router` está simulado: las pruebas llaman a las pantallas directamente y comprueban qué navegación piden | E2E en APK (#20) |

## 10. Evidencia

Archivos en `docs/pruebas/evidencia/integracion/`:
- `01-antes-utilidades.txt` y `02-despues-utilidades.txt`: integración antes y después de tocar las utilidades.
- `03-alteraciones.txt`: salida de cada alteración a propósito.
- `lint.txt`, `tsc.txt` y `jest.txt`: la verificación final.

## 11. Conclusión

- **Análisis estático:** lint sin errores ni advertencias y `tsc` sin errores.
- **Pruebas:** 132 suites y 1665 pruebas pasan; 151 son de integración (28 de este PR). Cobertura global 99.11 % / 97.46 % / 98.56 % / 99.36 %, por encima del umbral.
- **Lo que demuestran:** que la app, con un servidor que se comporta como esperan sus repositories, mantiene coherentes la sesión, las ofertas, el carrito con descuento, el pago, los pedidos y las reseñas entre módulos, y que las pruebas detectan 5 cambios deliberados al código de producción.
- **Lo que NO demuestran:** el comportamiento del backend real, de Stripe, del dispositivo ni de producción. Eso sigue PENDIENTE DE VALIDACIÓN MANUAL (sección 9).
