# Reporte de pruebas — Sprint 2

- **Fecha:** 2026-10-11
- **Rama:** `test/30-integracion-sprint2`
- **Historias cubiertas:** #6–#10 (categorías, productos por categoría, buscador, detalle de producto, favoritos)
- **Responsable de pruebas:** @AngeloMtz
- **Commit base:** `develop` en `eab2772` (incluye los PR #84, #86 y #87)

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK: 0 errores y 0 advertencias en ambos | #29 |
| Unitarias | 334 pruebas pasan (suite completa: 349 con las 15 de integración), cobertura 98.93 % sentencias / 97.2 % ramas / 99.34 % funciones / 99.35 % líneas | #28 |
| Integración | 15/15 pasan, con la API simulada | #30 |
| Rendimiento | No aplica en este sprint | — |
| Aceptación (manual) | Validada por Angel en Expo Go: 12/12 criterios OK; 7 con alguna captura (3 de ellas parciales) y 5 sin captura (ver sección 5) | #31 |

Resultado de CI (GitHub Actions, PR #89, commit `a6e5acb`): los checks **Análisis estático** y **Pruebas unitarias** salieron en **success**. El job de análisis estático incluye `npm audit --audit-level=critical` (bloqueante), que también pasó; la auditoría de nivel alto es informativa (`continue-on-error`) y no bloquea. `npm audit` **sigue sin ejecutarse en local**. Los resultados de las secciones 2 y 3 son de la ejecución local.

## 2. Análisis estático (#29)

Ejecutado en local sobre la rama, con salida guardada en `evidencia/sprint-2/`:

| Comando | Resultado | Evidencia |
|---|---|---|
| `npx expo lint --no-cache` | exit 0, sin errores ni advertencias | [lint.txt](evidencia/sprint-2/lint.txt) |
| `npx tsc --noEmit` | exit 0, sin errores | [tsc.txt](evidencia/sprint-2/tsc.txt) |

Nota: con `typedRoutes` activo, los tipos de las rutas nuevas (`/product/[id]`, `/favorites`) se generan al arrancar Metro (`npx expo start`). En un clon limpio hay que hacerlo una vez antes de `tsc`.

## 3. Pruebas unitarias (#28)

`npx jest --ci --coverage`: **33 suites, 349 pruebas, todas pasan** (exit 0). De ellas, 15 son de integración (sección 4) y 334 son unitarias. El total incluye pruebas de Sprint 1 y de issues posteriores. Salida completa en [jest.txt](evidencia/sprint-2/jest.txt).

| Métrica global | Obtenida | Umbral |
|---|---|---|
| Sentencias | 98.93 % | 80 % |
| Ramas | 97.2 % | 70 % |
| Funciones | 99.34 % | 80 % |
| Líneas | 99.35 % | 80 % |

### Trazabilidad historia → funciones → pruebas

| Historia | Funciones (archivo fuente) | Prueba (`src/__tests__/`) | Pruebas | Estado |
|---|---|---|---|---|
| #6 Categorías | `categoryRepository.getAll` | `categoryRepository.test.ts` | 3 | Con prueba |
| #6 | `useRootCategories` | `useCategories.test.tsx` | 2 | Con prueba |
| #6 | `selectRootProductCategories` (`catalog/selectors.ts`) | `categories.test.ts` | 3 | Con prueba |
| #7 Productos por categoría | `productRepository.getPage`, `PRODUCTS_PAGE_SIZE` | `productRepository.test.ts` | 9 (incluye `getById`, HU #9) | Con prueba |
| #7 | `useInfiniteProducts` (paginación, `keepPrevious`) | `useProducts.test.tsx` | 10 | Con prueba |
| #7 | `getPrincipalImageUrl`, `getTotalStock`, `formatPrice` | `products.test.ts` | 6 | Con prueba |
| #8 Buscador | `buildProductFilters`, `hasActiveFilters`, `canSearch` (`catalog/searchFilters.ts`) | `searchFilters.test.ts` | 33 | Con prueba |
| #8 | `validatePriceRange` y reglas de precio (`catalog/validation.ts`) | `priceValidation.test.ts` | 46 | Con prueba |
| #8 | `useDebouncedValue` | `useDebouncedValue.test.tsx` | 6 | Con prueba |
| #9 Detalle | `parseProductId`, `isVariantAvailable`, `pickInitialVariant`, `isProductSoldOut`, `getGalleryImageUrls`, `formatStock`, `getDiscountInfo`, `cleanDescription`, `getVisibleAttributes` (`catalog/productDetail.ts`) | `productDetail.test.ts` | 46 | Con prueba |
| #9 | `productRepository.getById` (404 → `null`) | `productRepository.test.ts` | (ver #7) | Con prueba |
| #9 | `useProduct` | `useProduct.test.tsx` | 5 | Con prueba |
| #9 | `apiErrorMessage` lee `error` (cambio en archivo compartido) | `errorMessage.test.ts` | 9 | Con prueba |
| #10 Favoritos | `parsePrice`, `toFavoriteCardData`, `toFavoriteProduct`, `dedupeFavorites`, `favoriteIds`, `isFavorite`, `applyFavoriteChange` (`favorites/favoriteSelectors.ts`) | `favoriteSelectors.test.ts` | 29 | Con prueba |
| #10 | `favoriteRepository`: `getPage`, `getAll` (tope de 200), `add`, `remove` | `favoriteRepository.test.ts` | 19 | Con prueba |
| #10 | `useFavorites`, `useFavoriteIds`, `useToggleFavorite` | `useFavorites.test.tsx` | 8 | Con prueba |
| Transversal (#85) | `authStore.logout` limpia la caché de consultas | `session.test.ts` | 13 (incluye 1 nueva) | Con prueba |
| #6–#10 | Componentes y pantallas: `CategoryCard`, `ProductCard`, `ImageCarousel`, `VariantSelector`, `FavoriteButton`, `FavoriteCard`, y las rutas de `src/app/` | — | 0 | Sin prueba automática; se valida en la aceptación manual |

### Qué quedó fuera
- Componentes visuales y pantallas: sin pruebas automáticas (renderizar `FlatList` y `expo-router` en Jest es frágil y de poco valor). Los cubre la aceptación manual.
- Los archivos de `src/app/` y `components/` no están en `collectCoverageFrom`, por lo que la cobertura medida es la de la lógica (hooks, repositories, selectores, validaciones, stores).

## 4. Pruebas de integración (#30)

Piezas reales: cliente Axios con sus interceptores, repository, hook y caché de TanStack Query (y `authStore` real en la prueba de sesión). **Solo el `adapter` de Axios es falso**: no se hace ninguna petición a la red ni a producción. Archivos en `src/__tests__/integration/` (la carpeta entra en el `testMatch` por defecto de `jest-expo` y corre en CI con `npx jest --ci --coverage`; no está en `collectCoverageFrom`, a propósito).

Cada prueba crea su propio `QueryClient` con `retry: false` y `gcTime: 0` y lo vacía al terminar. Excepción documentada en `sesionCache.test.tsx`: `authStore.logout` limpia el `queryClient` compartido, así que esa prueba usa esa instancia (con los mismos valores y vaciándola antes y después de cada prueba).

| Archivo | Prueba | Resultado |
|---|---|---|
| `catalogoApi.test.tsx` | Los filtros (texto, precio, categoría) llegan como parámetros HTTP y los resultados se aplanan con su total | OK |
| | La paginación pide la página 2 con los mismos filtros y concatena | OK |
| | Con un rango de precios inválido no se hace ninguna petición | OK |
| | Un error 500 llega al hook como error, sin datos | OK |
| | Categorías: de la lista plana solo quedan las raíz de productos | OK |
| | Detalle: se pide por id y se expone | OK |
| | Detalle: un 404 llega como "no encontrado", sin error | OK |
| `favoritosApi.test.tsx` | Agregar: la lista cambia **antes** de que responda el POST (respuesta retenida a mano) y luego se sincroniza | OK |
| | Quitar: cambia al instante y el servidor termina sin ese favorito | OK |
| | Un 500 en el POST revierte la lista y expone el error | OK |
| | Un 409 (ya era favorito) cuenta como éxito | OK |
| | Sin sesión no sale ninguna petición a `/favorites` | OK |
| | Con sesión la petición lleva `Authorization: Bearer` | OK |
| `sesionCache.test.tsx` | Al cerrar sesión la caché queda sin datos de la cuenta (favoritos, `me`, `profile`) y no se vuelve a consultar | OK |
| | Otra cuenta en el mismo dispositivo nunca llega a mostrar favoritos de la anterior | OK |

Total: 15 pruebas, 15 pasan. Se corrieron en serie (`--detectOpenHandles`, 3 veces) y en paralelo, sin handles abiertos y sin fallos.

### Límites conocidos
- **La forma real de `GET /favorites` no está contrastada con una respuesta real.** El servidor falso usa la forma tomada del código del backend (`favorites.service.ts`); el catálogo sí se contrastó con la API real durante la HU #9. Una prueba con la API simulada no detecta un cambio en el contrato real.
- **Carrito: No aplica en este sprint.** El título del issue #30 menciona "catálogo/carrito", pero el carrito es la HU #11 (Sprint 3) y aún no existe código.
- La limpieza de caché en `logout` se observa con los hooks aún montados: TanStack recrea las consultas **vacías** (`data: undefined`, `idle`). Lo que se afirma es que no queda ningún dato ni petición en curso.
- Estas pruebas no cubren la interfaz (pantallas, corazón, carrusel).

## 5. Pruebas de aceptación (manuales) (#31)

- **Quién:** Angel (@AngeloMtz), de forma manual.
- **Dónde:** Expo Go (las capturas muestran un dispositivo Android y productos reales del catálogo de SYSCOM).
- **Cuándo:** 2026-10-11.
- Resultado reportado por Angel: todos los criterios salieron bien. Claude no ejecutó esta validación; solo la registra y relaciona las capturas con cada historia.
- "Sin captura" significa que el criterio fue validado por Angel pero no hay imagen que lo muestre.

| Historia | Criterio | Resultado | Evidencia |
|---|---|---|---|
| #6 | Carga categorías desde la API con estado de loading | OK (validado por Angel) | [hu6-categorias.jpeg](evidencia/sprint-2/hu6-categorias.jpeg): categorías cargadas. Estado de loading: sin captura |
| #6 | Tap en categoría navega al listado de productos filtrado | OK (validado por Angel) | [hu7-catalogo.jpeg](evidencia/sprint-2/hu7-catalogo.jpeg): listado resultante de "Computadoras y Laptops" |
| #7 | Muestra imagen, nombre y precio de cada producto | OK (validado por Angel) | [hu7-catalogo.jpeg](evidencia/sprint-2/hu7-catalogo.jpeg): 15 productos con imagen, marca, nombre y precio |
| #7 | Paginación o infinite scroll funcional | OK (validado por Angel, sin captura) | — |
| #7 | Estado vacío manejado (sin productos) | OK (validado por Angel, sin captura) | — |
| #8 | Búsqueda por texto retorna resultados relevantes | OK (validado por Angel) | [hu8-busqueda.jpeg](evidencia/sprint-2/hu8-busqueda.jpeg): "HP", 10 resultados |
| #8 | Filtros de precio mín/máx aplican correctamente | OK (validado por Angel, sin captura) | — (la captura de búsqueda muestra los campos de precio vacíos; no hay imagen de un filtro aplicado) |
| #9 | Carrusel de imágenes funcional | OK (validado por Angel) | [hu9-detalle.jpeg](evidencia/sprint-2/hu9-detalle.jpeg): carrusel con 3 indicadores. El deslizamiento no se aprecia en una imagen fija |
| #9 | Muestra variantes (si existen) y deshabilita si no hay stock | OK (validado por Angel, sin captura) | — (el producto de la captura tiene una sola variante, por lo que no aparece el selector) |
| #9 | Botón "Agregar al carrito" visible | OK (validado por Angel) | [hu9-detalle.jpeg](evidencia/sprint-2/hu9-detalle.jpeg) |
| #10 | Ícono de corazón alterna estado favorito | OK (validado por Angel) | [hu10-favoritos.jpeg](evidencia/sprint-2/hu10-favoritos.jpeg) (corazón lleno en la lista) y [hu7-catalogo.jpeg](evidencia/sprint-2/hu7-catalogo.jpeg) (un corazón lleno entre tarjetas). La alternancia paso a paso: sin captura |
| #10 | Lista de favoritos persiste entre sesiones | OK (validado por Angel, sin captura) | [hu10-favoritos.jpeg](evidencia/sprint-2/hu10-favoritos.jpeg) muestra la lista; la persistencia al reabrir la app no tiene captura |

Capturas disponibles en `docs/pruebas/evidencia/sprint-2/`: `hu6-categorias.jpeg` (#6), `hu7-catalogo.jpeg` (#7, y muestra corazones de #10), `hu8-busqueda.jpeg` (#8), `hu9-detalle.jpeg` (#9), `hu10-favoritos.jpeg` (#10).

## 6. Cierre

- Los issues #28, #29, #30 y #31 se cierran con el PR de esta rama (`Closes`), pero GitHub solo cierra al llegar a la rama por defecto (`main`): se cerrarán al fusionar el release del Sprint 2.
- CI (GitHub Actions, PR #89, commit `a6e5acb`): **Análisis estático** y **Pruebas unitarias** en success (ver sección 1). `npm audit` sigue sin ejecutarse en local.
- Pendiente de confirmar con el backend: forma real de `GET /favorites` y tipo de `precio_base` (número o texto); pregunta abierta sobre si `precio_extra` debe sumarse (HU #9 / carrito HU #11).
