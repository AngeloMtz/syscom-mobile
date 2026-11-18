# Rendimiento de la API de producción (solo lectura) — Actividad 6

- **Issue:** #225
- **Rama:** `test/225-rendimiento-produccion`
- **Responsable:** @AngeloMtz. Revisa: @LAHH18.
- **Estado de este documento:** solo umbrales y condiciones de la medición. Se fijan en un commit **anterior** al script para que no se ajusten a los resultados. No se modifican después.

## 1. Umbrales (fijados antes de medir)

| Grupo | Rutas | Estadístico | Umbral |
|---|---|---|---|
| Lectura | todas las rutas medidas (públicas y autenticadas) | p95 de 20 repeticiones | **< 1000 ms** |

Es el mismo valor que `UMBRALES_MS.lectura` de `scripts/lib/perfGuard.js` (1000 ms). El veredicto es «cumple» solo si el p95 está **estrictamente por debajo** del umbral. Una ruta con errores no se declara «cumple»: sus tiempos fallidos no cuentan y falsearían el p95.

## 2. Condiciones de la medición

- La medición se hace desde **la computadora de Angel (Huejutla, Hidalgo) hacia Railway**. Los tiempos **incluyen la latencia de red real** (internet doméstico, ruta hasta el servidor y TLS), no solo el tiempo de proceso del servidor. No son comparables con las mediciones locales de `rendimiento-final.md`.
- Es una medición **de solo lectura**: únicamente peticiones GET, con una lista fija de rutas. No se crean, modifican ni borran datos; no se toca checkout, pagos ni la base de datos.
- 20 repeticiones secuenciales por ruta, con 250 ms de pausa entre peticiones y un máximo de 200 peticiones en total.
- La primera muestra de cada ruta se marca aparte (conexión TLS y arranque en frío del servidor pueden inflarla); aun así el p95 oficial se calcula con las 20 muestras.
- El token y la contraseña nunca se imprimen ni se guardan. La URL de producción no se escribe en el repositorio.

## 3. Rutas medidas (lista fija, solo GET)

Salen de lo que la app llama hoy (`src/features/*/repositories`). Cualquier otro método o ruta se rechaza en código (`scripts/lib/perfProduccion.js`). Solo se aceptan los parámetros `page` y `limit` con valor numérico. Con 20 repeticiones por ruta, el máximo de 200 peticiones alcanza justo para estas 10 rutas.

| # | Ruta | Sesión | Nota |
|---|---|---|---|
| 1 | `GET /catalog/products?page=1&limit=20` | no | Listado del catálogo; de su primera respuesta se toma el id de producto de las rutas 2 y 6 (sin peticiones extra) |
| 2 | `GET /catalog/products/:id` | no | Detalle de producto |
| 3 | `GET /catalog/featured?limit=8` | no | Productos destacados |
| 4 | `GET /catalog/categories` | no | Categorías |
| 5 | `GET /catalog/services?page=1&limit=12` | no | Listado de servicios |
| 6 | `GET /reviews/product/:id?page=1&limit=5` | no | Reseñas del producto de la ruta 2 |
| 7 | `GET /cart` | sí | Solo con `PERF_TOKEN` |
| 8 | `GET /profile/addresses` | sí | Solo con `PERF_TOKEN` |
| 9 | `GET /orders?page=1&limit=10` | sí | Solo con `PERF_TOKEN`; de su primera respuesta se toma el id de pedido de la ruta 10 |
| 10 | `GET /orders/:id` | sí | Solo con `PERF_TOKEN`; se omite si la cuenta no tiene pedidos |

El token solo se envía a las rutas 7 a 10.

## 4. Cómo ejecutarlo (PowerShell de Windows, desde la raíz del repo)

El script lo ejecuta Angel; Claude no lo ejecuta contra producción. Variables:
- `PERF_API_URL`: obligatoria, sin valor por defecto, `https`, incluyendo `/api` (la misma que usa la app en producción).
- `PERF_TOKEN`: opcional; con él se miden también las rutas 7 a 10. Úsalo con una cuenta de prueba (ver `docs/pruebas/datos-de-prueba.md`).

**Solo rutas públicas (sin token):**

```powershell
$env:PERF_API_URL = "https://<servidor-de-produccion>/api"
node scripts/medir-produccion-lectura.mjs
Remove-Item Env:PERF_API_URL
```

**Con rutas autenticadas (con token):**

```powershell
$env:PERF_API_URL = "https://<servidor-de-produccion>/api"
$seguro = Read-Host "PERF_TOKEN (no se muestra)" -AsSecureString
$env:PERF_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro))
node scripts/medir-produccion-lectura.mjs
Remove-Item Env:PERF_TOKEN, Env:PERF_API_URL
```

Código de salida: `0` terminó; `2` la guarda rechazó el entorno (no se hizo ninguna petición); `3` se detuvo por 429/5xx repetidos o por el máximo de peticiones.

## 5. Resultado y evidencia

- Cada ejecución escribe `docs/pruebas/evidencia/actividad-6/rendimiento-produccion-<fecha UTC>.json` con: fecha y hora UTC, versión de Node, sistema operativo, modo (público o público+autenticado), y por ruta `n`, mín., p50, p95, máx., media, errores, veredicto y **las muestras en el orden en que se hicieron** (la primera de cada ruta marcada con `primera: true`, para ver si el máximo es esa petición).
- El JSON **no contiene** el token, la contraseña ni la URL de producción (solo `destino: "producción (URL no guardada)"`). Aun así, revisa el archivo antes de subirlo al repositorio.
- Si el servidor responde 429 o 5xx tres veces seguidas, el script se detiene, lo informa y guarda lo medido hasta ese momento.
- Un 401 o 403 en una ruta autenticada (token inválido o vencido) omite el resto de las rutas autenticadas.
- Ejecutarlo lo mínimo necesario: son hasta 200 peticiones de lectura contra producción; no repetirlo en bucle.

## 6. Pendiente de validación manual
El script no se ha ejecutado contra producción. Sus reglas se probaron con pruebas unitarias (`src/__tests__/perfProduccion.test.ts`) con la red simulada. Los resultados reales los genera Angel con los comandos de la sección 4.
