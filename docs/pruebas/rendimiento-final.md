# Reporte de pruebas — Rendimiento final (#46)

- **Fecha:** 2026-11-02 (umbrales fijados antes de medir; las mediciones se agregan en commits posteriores)
- **Rama:** `test/46-rendimiento` (desde `develop` en `1c3ee75`, con el PR #182 ya fusionado)
- **Historias cubiertas:** #1–#20 (rendimiento del cierre del proyecto)
- **Responsable de pruebas:** @AngeloMtz (parte de la API ejecutada con Claude; parte en dispositivo por Angel)

> **Este commit solo fija los umbrales.** No contiene ninguna medición. Los umbrales de la sección 2 quedan registrados antes de medir para que no se ajusten a los resultados. Cualquier cambio posterior a esta sección debe explicarse en el reporte.

## Planeación: trazabilidad historia → funciones → pruebas
Este reporte es de rendimiento, no de funciones nuevas. Lo que se mide y con qué herramienta:

| Qué | Herramienta | Quién la ejecuta | Estado |
|---|---|---|---|
| Tiempo de respuesta de la API (lectura, carrito, checkout) | `scripts/medir-rendimiento.mjs`, contra el backend **local** con la base en una rama de Neon | Claude, con el backend que Angel confirme | Por medir |
| Webhook → pedido | El mismo script con `--webhook=N` (exige `stripe listen` y confirmar cada PaymentIntent a mano) | — | No se mide en esta pasada |
| Arranque en frío y carga de pantallas con datos de red, en el teléfono | Cronómetro en el dispositivo | Angel | Por medir (PENDIENTE DE VALIDACIÓN MANUAL) |
| Tamaño del APK | Tamaño del archivo del build | Angel | Solo se registra |

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | Por ejecutar | #46 |
| Unitarias | No aplica en este reporte | — |
| Integración | No aplica | — |
| Rendimiento, API (local) | Por medir | #46 |
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
Por medir. Se completa en un commit posterior.

## 4. En dispositivo
Por medir. Se completa en un commit posterior.

## 5. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| — | Ninguna registrada todavía | — | — | — |

## 6. Pendientes
- Medición de la API: por ejecutar.
- Medición en dispositivo y tamaño del APK: Angel.

## 7. Evidencia
Archivos en `docs/pruebas/evidencia/rendimiento-final/` (se crean al medir).
