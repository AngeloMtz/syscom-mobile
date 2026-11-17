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

## 3. Lo que este documento no incluye
Las rutas exactas, el script y los resultados se agregan en commits posteriores de la misma rama.
