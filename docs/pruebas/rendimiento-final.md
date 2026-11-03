# Reporte de pruebas — Rendimiento final (#46)

- **Fecha:** umbrales fijados el 2026-11-02 (commit `9172f27`, antes de medir); API medida el 2026-11-03 (05:28 a 05:32 UTC)
- **Rama:** `test/46-rendimiento` (desde `develop` en `1c3ee75`, con el PR #182 ya fusionado)
- **Historias cubiertas:** #1–#20 (rendimiento del cierre del proyecto)
- **Responsable de pruebas:** @AngeloMtz (parte de la API ejecutada con Claude; parte en dispositivo por Angel)

> **Los umbrales de la sección 2 se fijaron en el commit `9172f27`, antes de medir**, para que no se ajusten a los resultados, y no se modificaron después. Los tiempos de la API son del backend **local** contra una rama de Neon; **no representan producción (Railway)**.

## Planeación: trazabilidad historia → funciones → pruebas
Este reporte es de rendimiento, no de funciones nuevas. Lo que se mide y con qué herramienta:

| Qué | Herramienta | Quién la ejecuta | Estado |
|---|---|---|---|
| Tiempo de respuesta de la API (lectura, carrito, checkout) | `scripts/medir-rendimiento.mjs`, contra el backend **local** con la base en una rama de Neon | Angel ejecutó el script; Claude guardó y analizó la salida | Medido (sección 3) |
| Webhook → pedido | El mismo script con `--webhook=N` (exige `stripe listen` y confirmar cada PaymentIntent a mano) | — | **No medido** en esta pasada |
| Arranque en frío y carga de pantallas con datos de red (incluye el catálogo, `/catalog/*`), en el teléfono | Cronómetro en el dispositivo | Angel | PENDIENTE DE VALIDACIÓN MANUAL |
| Tamaño del APK | Tamaño del archivo del build | Angel | Solo se registra |

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK: exit 0 en ambos (sección 5) | #46 |
| Unitarias | No aplica en este reporte | — |
| Integración | No aplica | — |
| Rendimiento, API (local) | 3 corridas × 8 endpoints, todos «cumple» por p95 (20/20 válidas, 0 errores). El máximo superó el umbral en `POST /cart/items/:id` y `GET /cart` en las 3 corridas (sección 3). **Webhook y `/catalog/*` no medidos** | #46 |
| Rendimiento, en dispositivo | **PENDIENTE DE VALIDACIÓN MANUAL** | #46 |
| Tamaño del APK | **PENDIENTE DE VALIDACIÓN MANUAL** (solo se registra) | #46 |

## 2. Umbrales fijados antes de medir

### 2.1 API (los del script, sin cambios)
Son los de `UMBRALES_MS` en `scripts/lib/perfGuard.js`. No se modifican en este trabajo. El veredicto es «cumple» solo si el valor está **estrictamente por debajo** del umbral.

| Grupo | Endpoints | Estadístico del veredicto | Umbral |
|---|---|---|---|
| Lectura | `GET /cart`, `GET /profile/addresses`, `GET /orders`, `GET /orders/:id` | p95 de 20 repeticiones | < 1000 ms |
| Carrito | `POST`, `PATCH` y `DELETE /cart/items/:id` | p95 de 20 repeticiones | < 1500 ms |
| Checkout | `POST /payments/checkout` | p95 de 20 repeticiones | < 3000 ms |
| Webhook → pedido | Pedido creado tras confirmar el pago | Peor caso (máximo) | < 10000 ms |

Reglas del script que también quedan fijadas: con cualquier error en una medición el veredicto es «con errores» (no «cumple»); si no hay datos, «sin datos». El script también guarda mín., p50, p95, máx. y media, y el máximo se anota aunque no decida el veredicto.

### 2.2 App en dispositivo
Estas métricas se miden con cronómetro en el teléfono; el estadístico es la **mediana** y se anota el **máximo**. Se exigen las dos condiciones.

| Métrica | Mediana | Máximo |
|---|---|---|
| Arranque en frío (de tocar el ícono a ver la primera pantalla utilizable) | ≤ 5 s | ≤ 8 s |
| Pantalla con datos de red (de abrirla a ver los datos) | ≤ 3 s | ≤ 5 s |

El procedimiento (cuántas repeticiones, qué pantallas, cómo se cronometra) se define junto con la tabla de la sección «En dispositivo» al completar el reporte; no cambia los umbrales de arriba.

### 2.3 Tamaño del APK
**Solo se registra.** No tiene umbral ni veredicto.

## 3. API (backend local)

> **Local, no producción.** Los tiempos no incluyen la latencia de red de Railway y la base es una rama de Neon (`ml-dataset`, verificada por Angel).

### 3.1 Cómo se midió
- **Comando** (3 veces, ejecutado por Angel en su terminal; Claude no manejó credenciales): `node scripts/medir-rendimiento.mjs --con-escrituras --salida=<corrida-N.json>`, con `PERF_N=20`, `PERF_DB_ES_RAMA=si`, `PERF_API_URL=http://localhost:4000/api` y sin `--webhook`.
- **Repeticiones:** 20 por endpoint y por corrida, en secuencia. Las 3 corridas fueron seguidas (05:28:56, 05:30:33 y 05:32:11 UTC).
- **Veredicto por p95** (percentil por rango más cercano) contra el umbral de la sección 2.1; «cumple» exige estar estrictamente por debajo. El máximo se anota aunque no decida el veredicto.
- **Resultado en las 3 corridas:** 20 mediciones válidas y 0 errores en cada endpoint, `omitidas` vacío (la cuenta de prueba tenía dirección y pedidos) y exit code 0. Se crearon 60 PaymentIntents de prueba sin confirmar (20 por corrida).

### 3.2 Resultados
Cada celda es **p50 / p95 / máx.** en ms. Datos crudos: [corrida-1.json](evidencia/rendimiento-final/corrida-1.json), [corrida-2.json](evidencia/rendimiento-final/corrida-2.json), [corrida-3.json](evidencia/rendimiento-final/corrida-3.json).

| Endpoint | Umbral p95 (ms) | Corrida 1 | Corrida 2 | Corrida 3 | Veredicto (1, 2, 3) | Máximo ≥ umbral |
|---|---|---|---|---|---|---|
| GET /cart | < 1000 | 570 / 583 / 1833 | 567 / 598 / 1010 | 562 / 579 / 1035 | cumple, cumple, cumple | 3 de 3 |
| GET /profile/addresses | < 1000 | 154 / 164 / 170 | 145 / 150 / 150 | 146 / 154 / 174 | cumple, cumple, cumple | 0 de 3 |
| GET /orders | < 1000 | 349 / 372 / 580 | 350 / 371 / 598 | 366 / 384 / 610 | cumple, cumple, cumple | 0 de 3 |
| GET /orders/:id | < 1000 | 376 / 392 / 732 | 357 / 373 / 655 | 358 / 364 / 629 | cumple, cumple, cumple | 0 de 3 |
| POST /cart/items/:id | < 1500 | 641 / 655 / 1829 | 655 / 674 / 1783 | 647 / 686 / 1785 | cumple, cumple, cumple | 3 de 3 |
| PATCH /cart/items/:id | < 1500 | 289 / 307 / 308 | 295 / 310 / 316 | 295 / 301 / 302 | cumple, cumple, cumple | 0 de 3 |
| DELETE /cart/items/:id | < 1500 | 287 / 312 / 320 | 295 / 304 / 307 | 292 / 298 / 311 | cumple, cumple, cumple | 0 de 3 |
| POST /payments/checkout | < 3000 | 1113 / 1215 / 1452 | 1096 / 1159 / 1339 | 1100 / 1172 / 1280 | cumple, cumple, cumple | 0 de 3 |

**Veredicto: cumple en los 8 endpoints en las 3 corridas.** El veredicto es por p95, como acordó el script, no por el máximo.

### 3.3 Máximos por encima del umbral
El criterio acordado es el p95, así que esto **no cambia el veredicto**, pero conviene saberlo:
- **`POST /cart/items/:id`:** el máximo superó 1500 ms en las 3 corridas (1829, 1783 y 1785 ms), mientras su p95 fue de 655 a 686 ms.
- **`GET /cart`:** el máximo superó 1000 ms en las **3** corridas (1833, 1010 y 1035 ms), con p95 de 579 a 598 ms. En la corrida 1 el exceso fue claro; en las corridas 2 y 3 fue de solo 10 y 35 ms por encima.
- Ningún otro endpoint superó su umbral con el máximo (el mayor fue `POST /payments/checkout`, 1452 ms, con umbral de 3000 ms).

**Posición de la muestra máxima: no consta.** Los `.json` guardan solo n, mín., p50, p95, máx. y media, no las 20 muestras individuales, así que no se puede decir si el máximo fue la primera petición. Lo que sí se puede calcular con la media es que, quitando el máximo, las otras 19 muestras promedian casi lo mismo que el p50 (tabla de abajo), lo que es consistente con **un solo valor atípico por endpoint y corrida**. Que ese valor sea la primera petición (conexión o caché en frío) es una **hipótesis sin confirmar**; para confirmarla habría que guardar las muestras en orden.

| Endpoint | Promedio de las otras 19 muestras, corridas 1 / 2 / 3 (ms) |
|---|---|
| GET /cart | 570 / 570 / 563 |
| POST /cart/items/:id | 640 / 657 / 651 |

### 3.4 Comparación con la medición de Sprint 3
Sprint 3 ([sprint-3.md](sprint-3.md), 2026-10-13, misma herramienta, local + Neon). Cada celda es p50 / p95 en ms.

| Endpoint | Sprint 3 | Hoy (rango de las 3 corridas) |
|---|---|---|
| GET /cart | 346 / 352 | 562–570 / 579–598 |
| GET /profile/addresses | 137 / 142 | 145–154 / 150–164 |
| GET /orders | 333 / 337 | 349–366 / 371–384 |
| GET /orders/:id | 331 / 337 | 357–376 / 364–392 |
| POST /cart/items/:id | 620 / 630 | 641–655 / 655–686 |
| PATCH /cart/items/:id | 277 / 282 | 289–295 / 301–310 |
| DELETE /cart/items/:id | 279 / 284 | 287–295 / 298–312 |
| POST /payments/checkout | 670 / 708 | 1096–1113 / 1159–1215 |

Hoy salió más lento que en Sprint 3 en todos los endpoints, sobre todo `GET /cart` y `POST /payments/checkout`. **No se investigó la causa** (podrían ser el estado de los datos, el equipo o la rama de Neon; no hay datos para decirlo). Todos siguen dentro de los umbrales por p95.

### 3.5 Lo que no se midió
- **Webhook → pedido:** no se midió (no se usó `--webhook`). En Sprint 3 tampoco se pudo medir. No hay valor contra el umbral de 10000 ms, y no se declara ni «cumple» ni «no cumple».
- **Catálogo (`/catalog/*`):** el script no lo mide. Se cubre en la parte del dispositivo (sección 4), como pantalla con datos de red.
- **Producción (Railway):** nada de esto se midió allí; el script lo impide.
- **Rendimiento de la app** (arranque, pantallas, memoria): solo en dispositivo.

### 3.6 Limitaciones
- **Backend local:** sin la latencia de red ni la carga de Railway, y con el cliente (Node) en la misma máquina que el servidor.
- **Una cuenta de prueba, una máquina, una rama de Neon**, 20 repeticiones secuenciales por endpoint; no hay carga concurrente. No se controló qué más usaba el equipo.
- **Solo 3 corridas seguidas**, en un intervalo de unos 3 minutos; no muestran variación entre días.
- **Un solo dispositivo** para la parte del teléfono (sección 4).

## 4. En dispositivo

**PENDIENTE DE VALIDACIÓN MANUAL** (Angel). Los umbrales están en la sección 2.2. Las tablas están vacías a propósito; el APK, el dispositivo y el procedimiento los llena quien mide.

| Dato | Valor |
|---|---|
| Build / APK | |
| Dispositivo y versión de Android | |
| Fecha y hora | |
| Red (Wi-Fi / datos) y backend usado | |

### 4.1 Arranque en frío (umbral: mediana ≤ 5 s, máximo ≤ 8 s)

| # | Tiempo (s) |
|---|---|
| 1 | |
| 2 | |
| 3 | |
| 4 | |
| 5 | |

| Mediana | Máximo | Veredicto |
|---|---|---|
| | | |

### 4.2 Pantallas con datos de red (umbral: mediana ≤ 3 s, máximo ≤ 5 s)
Incluye el catálogo (`/catalog/*`), que la medición de la API no cubre.

| Pantalla | Tiempos (s) | Mediana | Máximo | Veredicto |
|---|---|---|---|---|
| Catálogo | | | | |
| | | | | |
| | | | | |

### 4.3 Tamaño del APK
**PENDIENTE DE VALIDACIÓN MANUAL.** Solo se registra; no hay umbral ni veredicto.

| Build | Tamaño (MB) |
|---|---|
| | |

## 5. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| 1 | Ninguna medición falló ni dio error en la API | — | — | — |
| 2 | Los `.txt` de las corridas salieron con caracteres rotos (`ΓåÆ` por `→`, `├│` por `ó`) | PowerShell 5.1 interpretó la salida UTF-8 de Node con la página de códigos de la consola (CP437) al capturarla con `Tee-Object` y la volvió a guardar como UTF-8. Los bytes de `→` (`E2 86 92`) leídos en CP437 dan `ΓåÆ`, y los de `ó` (`C3 B3`) dan `├│` | **Ninguna, a propósito.** Los `.txt` se dejan tal cual como evidencia. La evidencia principal son los `.json`, que escribe Node directo en UTF-8 y se leen bien | — |

**Análisis estático:** `npx expo lint` exit 0 (0 errores, 0 advertencias) y `npx tsc --noEmit` exit 0, ejecutados sobre la rama `test/46-rendimiento`.

## 6. Pendientes
- **Medición en dispositivo (arranque en frío y pantallas con datos de red) y tamaño del APK:** PENDIENTE DE VALIDACIÓN MANUAL (Angel). Con esas medidas se abre el PR.
- **Webhook → pedido:** no medido; requeriría `stripe listen` y confirmar cada PaymentIntent a mano.
- **Posición de la muestra máxima** en `GET /cart` y `POST /cart/items/:id`: no consta; confirmarla exigiría que el script guarde las muestras en orden (no se cambió el script en este trabajo).
- Mediciones contra producción: fuera de alcance por la guarda del script.

## 7. Evidencia
Archivos en `docs/pruebas/evidencia/rendimiento-final/`:
- `corrida-1.json`, `corrida-2.json`, `corrida-3.json`: evidencia principal (estadísticas por endpoint).
- `corrida-1.txt`, `corrida-2.txt`, `corrida-3.txt`: salida de consola, **con la codificación rota** descrita en la falla 2 y sin editar. Su última línea repite la ruta local de la carpeta de Angel.

Revisión de privacidad hecha antes de commitear: sin correos, tokens, direcciones ni identificadores de pago en los `.json` ni en los `.txt`.
