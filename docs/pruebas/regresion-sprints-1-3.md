# Reporte de pruebas — Regresión Sprints 1 a 3 (primera pasada de #45)

- **Fecha:** 2026-10-19
- **Rama:** `test/45-regresion-sprints-1-3`
- **Historias cubiertas:** #1–#15 (Sprints 1, 2 y 3)
- **Responsable de pruebas:** @AngeloMtz (parte automática ejecutada con Claude; parte manual pendiente)
- **Commit probado:** `ef804cf` (`develop`, Merge pull request #120). Incluye #111, #112, #119 y #120.
- **Alcance:** primera pasada de la regresión (#45). El cierre final de #45 incluirá el Sprint 4, por eso este PR usa `Refs #45` y no `Closes #45`.

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Instalación limpia (`npm ci`) | OK, con advertencias (sección 2) | #45 |
| Análisis estático (lint + tsc) | OK: exit 0 en ambos, sin errores ni advertencias | #45 |
| Unitarias | 75/75 suites y 909/909 pruebas pasan; cobertura 99.02 % líneas / 97.88 % ramas | #45 |
| `npm audit --audit-level=critical` | exit 0: **0 críticas**; 67 en total (15 moderadas, 52 altas) | #45 |
| `npx expo-doctor` | **20/21. FALLA 1 verificación** (5 paquetes con parche anterior al esperado). Ya registrado en #121 | #121 |
| Trazabilidad HU #1–#15 | 13 de 15 historias con pruebas propias; **#2 y #5 sin pruebas propias** (sección 4) | #45 |
| Aceptación manual (regresión) | **PENDIENTE DE VALIDACIÓN MANUAL** (sección 5) | #45 |

## 2. Parte automática

### 2.1 Entorno
- Commit exacto: `ef804cf57fd45415ad061565a2e794e989ff424e` (`git log -1 --oneline`: `ef804cf Merge pull request #120 from AngeloMtz/docs/114-eresolve-test-renderer`).
- Clon limpio de `develop` actualizado (`git status` sin cambios al iniciar), Node 22.13.0, Windows 11.

### 2.2 `npm ci`
Terminó bien: `added 1040 packages, and audited 1041 packages in 3m`. Advertencias observadas:
- **ERESOLVE de `react-reconciler`:** `test-renderer@1.3.0` pide `react@^19.3.0` y el proyecto usa `react@19.2.3`. Es el aviso ya aceptado en #114 (ver [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md)).
- **Paquetes deprecados:** `inflight@1.0.6`, `glob@7.2.3` (4 veces), `whatwg-encoding@2.0.0`, `abab@2.0.6`, `domexception@4.0.0`, `uuid@7.0.3`, `eslint@9.39.5`.
- `npm ci` informó **66 vulnerabilidades** (15 moderadas, 51 altas); `npm audit` en la corrida posterior informó 67 (ver 2.5). La fluctuación 66/67 ya estaba documentada en #113.
- Limitación: solo se capturó el final de la salida de `npm ci`; las primeras líneas de advertencias no quedaron guardadas, por eso la lista puede no ser exhaustiva y no hay archivo de evidencia de `npm ci`.

### 2.3 Análisis estático
| Comando | Resultado | Evidencia |
|---|---|---|
| `npx expo lint` | exit 0, sin salida (0 errores, 0 advertencias) | [lint.txt](evidencia/regresion/lint.txt) |
| `npx tsc --noEmit` | exit 0, sin errores | [tsc.txt](evidencia/regresion/tsc.txt) |

### 2.4 Pruebas unitarias — `npx jest --ci --coverage`
**75 suites, 909 pruebas, todas pasan** (exit 0, 8.8 s). Salida: [jest.txt](evidencia/regresion/jest.txt).

| Métrica global | Obtenida | Umbral |
|---|---|---|
| Sentencias | 98.89 % | 80 % |
| Ramas | 97.88 % | 70 % |
| Funciones | 97.91 % | 80 % |
| Líneas | 99.02 % | 80 % |

**Primer intento fallido (no es un fallo de código):** la primera corrida terminó con exit 1: 73 suites pasaron y 2 no llegaron a ejecutarse (`useProductsPreview.test.tsx` y `brandRepository.test.ts`), con 904 pruebas pasando. La causa fue `EPERM: operation not permitted, rename` al escribir el caché de transformación de Jest en `%TEMP%` (carrera entre workers en Windows). No hubo ninguna aserción fallida. Al repetir el mismo comando en el mismo commit pasaron las 75 suites. La salida del intento fallido se conserva en [jest-primer-intento-EPERM.txt](evidencia/regresion/jest-primer-intento-EPERM.txt). Es un riesgo de entorno local; no se observó en CI (Linux).

### 2.5 `npm audit --audit-level=critical`
Exit 0: no hay vulnerabilidades críticas. Total: **67** (15 moderadas, 52 altas). Salida: [audit.txt](evidencia/regresion/audit.txt). Estado de las altas y moderadas: ver [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md).

### 2.6 `npx expo-doctor`
Exit 1: **20/21 verificaciones pasan; falla "Check that packages match versions required by installed Expo SDK"**. Salida: [expo-doctor.txt](evidencia/regresion/expo-doctor.txt).

| Paquete | Esperado | Instalado |
|---|---|---|
| expo | ~57.0.30 | 57.0.25 |
| expo-constants | ~57.0.22 | 57.0.19 |
| expo-linking | ~57.0.13 | 57.0.11 |
| expo-router | ~57.0.28 | 57.0.23 |
| jest-expo | ~57.0.6 | 57.0.5 |

Son diferencias de parche. Ya existe el issue **#121** para alinearlas; no se corrige en este PR.

## 3. Navegación vigente (referencia para la regresión manual)
Cinco pestañas en `src/app/(tabs)/_layout.tsx`: **Inicio, Catálogo, Carrito, Servicios, Más**. Perfil se abre desde **Más** (`src/app/profile/`). El criterio original de #2 habla de "4 pestañas: Inicio, Catálogo, Carrito, Perfil"; la navegación cambió después de cerrar esa historia, así que la verificación manual de #2 se hace contra la navegación actual.

## 4. Trazabilidad HU #1–#15 → pruebas automáticas
Las cifras salen del JSON de Jest (`--json`) de este mismo commit. Los archivos están en `src/__tests__/`. "Compartido" significa que el archivo cubre más de una historia y su total no se reparte.

| HU | Historia | Archivos de prueba propios | Pruebas |
|---|---|---|---|
| #1 | Proyecto base | `apiClient.test.ts` (11), `queryClient.test.ts` (5) | 16 |
| #2 | Navegación principal | — | **0 (sin pruebas automáticas; solo pantallas/layouts)** |
| #3 | Registro e inicio de sesión | `authRepository.test.ts` (17), `useLogin` (3), `useRegister` (2), `useConfirm2FA` (2), `useVerifyRegistration` (2), `useResendCode` (2), `usePasswordRecovery` (6), `useMe` (3), `errorMessage.test.ts` (9) | 46 |
| #4 | Perfil de usuario | `profileRepository.test.ts` (4), `useProfile` (3), `useUpdateProfile` (5) | 12 |
| #5 | Onboarding y splash | — propio | **0 propias (solo el tramo de `session.test.ts`, compartido)** |
| #6 | Listado de categorías | `categoryRepository.test.ts` (3), `useCategories` (2), `categories.test.ts` (3) | 8 |
| #7 | Productos por categoría | `productRepository.test.ts` (14), `useProducts` (10), `products.test.ts` (6) | 30 |
| #8 | Buscador y filtros | `searchFilters.test.ts` (33), `useDebouncedValue` (6), `priceValidation.test.ts` (46) | 85 |
| #9 | Detalle de producto | `productDetail.test.ts` (46), `useProduct` (5) | 51 |
| #10 | Favoritos | `favoriteRepository.test.ts` (19), `favoriteSelectors.test.ts` (29), `useFavorites` (8) | 56 |
| #11 | Carrito | `cartRepository.test.ts` (21), `cartSelectors.test.ts` (60), `useCart` (11), `components/CartSummary` (12), `components/CartItemRow` (11) | 115 |
| #12 | Dirección de envío | `addressRepository.test.ts` (15), `addressValidation` (43), `addressSelectors` (21), `addressErrors` (11), `useAddresses` (12), `components/AddressForm` (10), `components/AddressCard` (5) | 117 |
| #13 | Pago con Stripe | `paymentRepository` (9), `paymentReducer` (17), `paymentSelectors` (19), `paymentPolling` (7), `paymentErrors` (23), `paymentConfig` (2), `usePayment` (26) | 103 |
| #14 | Confirmación de orden | `orderFormat.test.ts` (44), `useOrder` (5) | 49 |
| #15 | Historial de pedidos | `orderList.test.ts` (7), `useOrders` (7) | 14 |

**Compartidos entre historias**

| Archivo | Historias | Pruebas |
|---|---|---|
| `validation.test.ts` (validación de auth y de perfil) | #3 y #4 | 22 |
| `session.test.ts` (token, authStore y onboarding) | #3 y #5 | 14 |
| `orderRepository.test.ts`, `components/OrderComponents.test.tsx` | #14 y #15 | 13 + 17 = 30 |
| `integration/catalogoApi.test.tsx` | #6–#9 | 7 |
| `integration/favoritosApi.test.tsx` | #10 | 6 |
| `integration/compraDeExtremoAExtremo.test.tsx` | #11–#14 | 8 |
| `integration/sesionCache.test.tsx`, `integration/sesionCompra.test.tsx` | #3, #11–#13 | 2 + 2 |

**Fuera de las HU #1–#15 (no se cuentan en la tabla):** rendimiento (`perfGuard` 37, `medirRendimiento` 9), utilidades (`html` 9, `url` 5), Home y marcas (`brandRepository` 3, `useBrands` 2, `useFeaturedProducts` 2, `useProductsPreview` 2), información institucional (`institutionalRepository` 13, `useInstitutional` 10) y servicios (`serviceRepository` 8, `servicesSelectors` 6, `useService` 4, `useServices` 4, `useServicesPreview` 2).

**Control de suma:** 75 archivos, 909 pruebas = 16 + 46 + 12 + 8 + 30 + 85 + 51 + 56 + 115 + 117 + 103 + 49 + 14 (propias de HU) + 22 + 14 + 30 + 7 + 6 + 8 + 4 (compartidas) + 46 (rendimiento) + 14 (utilidades) + 9 (Home y marcas) + 23 (institucional) + 24 (servicios).

**Historias sin pruebas propias**
- **#2 Navegación principal:** ninguna prueba automática. Se cubre solo en la regresión manual.
- **#5 Onboarding:** sin archivo propio; solo lo ejerce `session.test.ts`. Los componentes y el flujo de pantalla no tienen pruebas automáticas.
- Las pantallas de `src/app/` no tienen pruebas automáticas en ninguna historia; solo se validan manualmente.

## 5. Regresión manual — PENDIENTE DE VALIDACIÓN MANUAL
Los criterios salen de los issues #1–#15 (`gh api repos/AngeloMtz/syscom-mobile/issues/<n>`). Ejecutar en Expo Go o emulador sobre este commit, con una cuenta de prueba (ver [datos-de-prueba.md](datos-de-prueba.md)) y Stripe en modo de prueba. Marcar **una** opción por fila (pasa / falla) y anotar observaciones. Si algo falla, guardar captura en `docs/pruebas/evidencia/regresion/` y avisar para abrir un issue; no se corrige dentro de este PR.

Resultado: `[ ] Pasa` · `[ ] Falla` · Observaciones: ______

### Sprint 1
**HU #1 — Proyecto base**
| Criterio | Pasos | Resultado |
|---|---|---|
| Corre en Expo Go sin errores | 1. `npx expo start`. 2. Abrir en Expo Go. 3. Ver que carga sin pantalla roja ni errores en consola. | [ ] Pasa [ ] Falla — Obs: |
| Estructura documentada en el README | 1. Abrir `README.md`. 2. Confirmar que describe la estructura de carpetas. NOTA: al momento de esta corrida el README de `develop` no tenía la sección de estructura; ya está en el PR #124 (issue #123). Debería pasar cuando #124 entre a `develop`; verificar leyendo el README. | [ ] Pasa [ ] Falla — Obs: |
| Variable de entorno con la URL base | 1. Revisar `.env.example` con la variable `EXPO_PUBLIC_*` de la API. 2. Con `.env` creado, confirmar que la app consume esa URL (el catálogo carga datos). | [ ] Pasa [ ] Falla — Obs: |

**HU #2 — Navegación principal** (contra las 5 pestañas vigentes)
| Criterio | Pasos | Resultado |
|---|---|---|
| Las pestañas navegan sin errores | 1. Tocar en orden Inicio, Catálogo, Carrito, Servicios, Más. 2. Confirmar que cada una abre su pantalla y los títulos e íconos son correctos. | [ ] Pasa [ ] Falla — Obs: |
| Perfil desde Más | 1. Entrar a Más. 2. Abrir Perfil. 3. Volver con atrás. | [ ] Pasa [ ] Falla — Obs: |
| Transiciones fluidas | 1. Entrar y salir de un detalle (producto, servicio). 2. Cambiar de pestaña repetidamente. 3. Sin parpadeos, cierres ni pantallas en blanco. | [ ] Pasa [ ] Falla — Obs: |

**HU #3 — Registro e inicio de sesión**
| Criterio | Pasos | Resultado |
|---|---|---|
| Usuario puede registrarse y loguearse | 1. Registrar usuario nuevo y confirmar con el código de verificación. 2. Cerrar sesión. 3. Iniciar sesión (con 2FA si aplica). | [ ] Pasa [ ] Falla — Obs: |
| Token guardado de forma segura | 1. Iniciar sesión. 2. Cerrar y reabrir la app: la sesión se restaura. 3. Cerrar sesión: al reabrir pide login. | [ ] Pasa [ ] Falla — Obs: |
| Mensajes de error claros con credenciales inválidas | 1. Login con contraseña incorrecta. 2. Login con correo inexistente. 3. Registro con correo inválido o contraseña débil. 4. Leer el mensaje en cada caso. | [ ] Pasa [ ] Falla — Obs: |
| Recuperación de contraseña (flujo asociado) | 1. "Olvidé mi contraseña". 2. Código y nueva contraseña. 3. Iniciar con la nueva. | [ ] Pasa [ ] Falla — Obs: |

**HU #4 — Perfil de usuario**
| Criterio | Pasos | Resultado |
|---|---|---|
| Muestra nombre, correo y datos de contacto | 1. Más → Perfil. 2. Confirmar nombre, correo y teléfono/contacto de la cuenta. | [ ] Pasa [ ] Falla — Obs: |
| Edita y guarda contra la API | 1. Más → Perfil → datos personales. 2. Cambiar un dato y guardar. 3. Salir y volver: el cambio persiste. 4. Probar un dato inválido: muestra error. | [ ] Pasa [ ] Falla — Obs: |
| Cerrar sesión funcional | 1. Tocar cerrar sesión. 2. Confirmar que regresa a login y que el carrito/perfil ya no son accesibles. | [ ] Pasa [ ] Falla — Obs: |

**HU #5 — Onboarding y splash**
| Criterio | Pasos | Resultado |
|---|---|---|
| Aparece la primera vez y no vuelve | 1. Instalar/limpiar datos de la app. 2. Abrir: se ve el onboarding. 3. Terminarlo, cerrar y reabrir: no vuelve a aparecer. | [ ] Pasa [ ] Falla — Obs: |
| Botón "Omitir" funcional | 1. Con datos limpios, abrir y tocar "Omitir". 2. Llega a la app y al reabrir no reaparece. | [ ] Pasa [ ] Falla — Obs: |

### Sprint 2
**HU #6 — Listado de categorías**
| Criterio | Pasos | Resultado |
|---|---|---|
| Carga desde la API con estado de loading | 1. Abrir Catálogo (con red lenta si es posible). 2. Ver indicador de carga y luego las categorías. | [ ] Pasa [ ] Falla — Obs: |
| Tap en categoría lleva al listado filtrado | 1. Tocar una categoría. 2. Ver solo productos de esa categoría. | [ ] Pasa [ ] Falla — Obs: |

**HU #7 — Productos por categoría**
| Criterio | Pasos | Resultado |
|---|---|---|
| Muestra imagen, nombre y precio | 1. Abrir una categoría con productos. 2. Cada tarjeta muestra imagen, nombre y precio. | [ ] Pasa [ ] Falla — Obs: |
| Paginación / scroll infinito | 1. Bajar hasta el final de una categoría grande. 2. Se cargan más productos sin duplicados. | [ ] Pasa [ ] Falla — Obs: |
| Estado vacío | 1. Abrir una categoría sin productos (o buscar algo sin resultados). 2. Aparece el mensaje de vacío. | [ ] Pasa [ ] Falla — Obs: |

**HU #8 — Buscador**
| Criterio | Pasos | Resultado |
|---|---|---|
| Búsqueda por texto relevante | 1. Abrir el buscador. 2. Escribir un nombre de producto conocido. 3. Los resultados corresponden al texto. | [ ] Pasa [ ] Falla — Obs: |
| Filtros de precio mín/máx | 1. Aplicar mínimo y máximo. 2. Todos los resultados están dentro del rango. 3. Probar mínimo > máximo: muestra error. 4. Quitar filtros. | [ ] Pasa [ ] Falla — Obs: |
| Filtro por categoría | 1. Filtrar por una categoría. 2. Solo salen productos de ella. | [ ] Pasa [ ] Falla — Obs: |

**HU #9 — Detalle de producto**
| Criterio | Pasos | Resultado |
|---|---|---|
| Carrusel de imágenes | 1. Abrir un producto con varias imágenes. 2. Deslizar entre ellas. | [ ] Pasa [ ] Falla — Obs: |
| Variantes y stock | 1. Abrir un producto con variantes y elegir una. 2. Una variante sin stock aparece deshabilitada. 3. Producto agotado: no se puede agregar. | [ ] Pasa [ ] Falla — Obs: |
| Botón "Agregar al carrito" visible | 1. En el detalle, ver el botón sin tener que buscarlo. 2. Tocarlo y confirmar que el producto aparece en Carrito. | [ ] Pasa [ ] Falla — Obs: |

**HU #10 — Favoritos**
| Criterio | Pasos | Resultado |
|---|---|---|
| Corazón alterna favorito | 1. Tocar el corazón en un producto: queda activo. 2. Tocarlo otra vez: se desactiva. | [ ] Pasa [ ] Falla — Obs: |
| Lista persiste entre sesiones | 1. Marcar 2 favoritos. 2. Abrir favoritos (Más → Perfil → Favoritos). 3. Cerrar sesión, volver a entrar (o reiniciar la app): siguen ahí. | [ ] Pasa [ ] Falla — Obs: |

### Sprint 3
**HU #11 — Carrito**
| Criterio | Pasos | Resultado |
|---|---|---|
| Suma total en tiempo real | 1. Agregar 2 productos. 2. Cambiar cantidades con +/−. 3. El total se actualiza al instante y coincide con precio × cantidad. | [ ] Pasa [ ] Falla — Obs: |
| Eliminar quita producto y total | 1. Eliminar un producto. 2. Desaparece de la lista y el total baja. 3. Vaciar el carrito: aparece el estado vacío. | [ ] Pasa [ ] Falla — Obs: |

**HU #12 — Dirección de envío**
| Criterio | Pasos | Resultado |
|---|---|---|
| Valida campos obligatorios | 1. Desde el checkout, nueva dirección. 2. Dejar campos vacíos o inválidos (código postal, teléfono) y guardar. 3. Muestra errores por campo. | [ ] Pasa [ ] Falla — Obs: |
| Guardar para futuras compras | 1. Guardar una dirección válida. 2. Salir y volver al checkout: aparece para seleccionar. 3. Editar y eliminar funcionan. | [ ] Pasa [ ] Falla — Obs: |

**HU #13 — Pago con Stripe (sandbox)**
| Criterio | Pasos | Resultado |
|---|---|---|
| Pago de prueba procesado | 1. Checkout con carrito y dirección. 2. Pagar con tarjeta de prueba `4242 4242 4242 4242`. 3. El pago se confirma y el pedido aparece (requiere webhook activo, `stripe listen`). | [ ] Pasa [ ] Falla — Obs: |
| Errores de pago con mensaje claro | 1. Pagar con tarjeta rechazada de prueba `4000 0000 0000 9995`. 2. Mensaje claro y el carrito se conserva. 3. Cancelar la hoja de pago: no se crea cobro. | [ ] Pasa [ ] Falla — Obs: |

**HU #14 — Confirmación y resumen**
| Criterio | Pasos | Resultado |
|---|---|---|
| Muestra folio de orden | 1. Tras un pago exitoso, ver la confirmación. 2. Muestra folio, productos, total y método de pago. | [ ] Pasa [ ] Falla — Obs: |
| Botón para volver al inicio | 1. Tocar el botón desde la confirmación. 2. Llega a Inicio. | [ ] Pasa [ ] Falla — Obs: |

**HU #15 — Historial de pedidos**
| Criterio | Pasos | Resultado |
|---|---|---|
| Fecha, total y estado de cada pedido | 1. Abrir el historial (Más → Perfil → Pedidos). 2. Cada pedido muestra fecha, total y estado. 3. Sin pedidos: estado vacío. | [ ] Pasa [ ] Falla — Obs: |
| Tap abre el detalle | 1. Tocar un pedido. 2. Ver su detalle (productos, total, estado). 3. Volver. | [ ] Pasa [ ] Falla — Obs: |

**Total manual:** 0/38 filas ejecutadas (todas PENDIENTES).

## 6. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| 1 | `npx expo-doctor` 20/21: 5 paquetes con parche anterior | Versiones fijadas en `package.json` anteriores a las del SDK 57 vigente | Registrada en el issue #121; no se corrige en este PR | — |
| 2 | Primera corrida de `jest` con 2 suites sin ejecutar | `EPERM` al renombrar el caché de transformación en `%TEMP%` (Windows, workers en paralelo); no hubo aserciones fallidas | Ninguna: al repetir el comando pasan las 75 suites. Solo entorno local | — |

No se encontraron fallas de código en las pruebas automáticas.

## 7. Pendientes
- **Regresión manual de las 38 filas de la sección 5:** la hace una persona en dispositivo o emulador (Angel/Luis Ángel). Este reporte la deja sin resultados a propósito.
- Historias #2 y #5 sin pruebas automáticas propias: decidir si se agregan o se aceptan como solo-manuales.
- Alinear paquetes de Expo (#121) y vulnerabilidades altas abiertas (#113 y el documento de advertencias).
- El cierre final de #45 debe incorporar el Sprint 4 y repetir esta corrida sobre el commit final.

## 8. Evidencia
Archivos en `docs/pruebas/evidencia/regresion/`: `lint.txt`, `tsc.txt`, `jest.txt`, `jest-primer-intento-EPERM.txt`, `audit.txt`, `expo-doctor.txt`.
