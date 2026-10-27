Sí hay `|| echo "Jest no llegó a imprimir un resumen."`# Plan de pruebas — syscom-mobile
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- **Fecha de elaboración:** 2026-10-26
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- **Issue:** #143
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- **Base:** `develop` en `faa8d77` (Merge pull request #141)
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- **Fuentes:** `.github/workflows/ci.yml`, `package.json`, `docs/pruebas/`, ejecuciones de CI y estado de los issues #25 a #46 consultados en GitHub el 2026-10-26.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- **Responsable:** @AngeloMtz. Revisa: @LAHH18.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## Convenciones de este documento
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Marca | Significa |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| **Implementada** | Existe en el repositorio y corre hoy en el pipeline |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| **Parcial** | Existe, pero no cubre todo el tipo de prueba o no corre en el pipeline |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| **Manual** | Se ejecuta a mano y se registra en `docs/pruebas/sprint-N.md` |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| **PROPUESTA** | No existe en el repositorio. Es una idea de este plan, sin compromiso ni fecha |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| **NO EJECUTADO** | Existe o se describe, pero no hay ejecución real que lo respalde |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Todas las horas de GitHub Actions están en UTC. Nada de lo marcado PROPUESTA se ha implementado ni medido.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`---
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## 1. Objetivo y alcance
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`**Objetivo:** que cada cambio que entra a `develop` y `main` pase por verificaciones automáticas y repetibles, y que lo que no se puede automatizar (dispositivo real, cámara, push, backend real) quede registrado como validación manual con instrucciones claras.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`**Qué se prueba:** la app móvil (React Native + Expo + TypeScript) en `src/`: validaciones, repositories, hooks, stores, selectores y componentes de los módulos de autenticación, catálogo, carrito, direcciones, pagos, pedidos, reseñas, favoritos, AR, notificaciones, chatbot y servicios/institucional. El backend (Express + PostgreSQL) se reutiliza y **no se prueba en este repositorio**.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`**Qué no cubre este plan:** pruebas del backend, pruebas en iOS físico, y cualquier prueba contra producción.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`### Niveles (pirámide)
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."````
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`                 /\
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`                /  \     Cima: aceptación (manual), regresión, estrés
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`               /----\
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`              /      \   Medio: integración, rendimiento
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`             /--------\
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`            /          \ Base: análisis estático y pruebas unitarias
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`           /____________\
Sí hay `|| echo "Jest no llegó a imprimir un resumen."````
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Nivel | Tipos | Estado general |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Base | Análisis estático, unitarias | Implementados y automáticos en CI |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Medio | Integración, rendimiento | Parciales: integración con servicios simulados dentro de Jest; rendimiento solo con script manual en local |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Cima | Aceptación, regresión, estrés | Aceptación y regresión manuales o parciales; estrés es PROPUESTA |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`---
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## 2. Evento → qué corre
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Fuente: `.github/workflows/ci.yml`. El disparador es:
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."````yaml
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`on:
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`  pull_request:
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`    branches: [develop, main]
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`  push:
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`    branches: [develop, main]
Sí hay `|| echo "Jest no llegó a imprimir un resumen."````
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`El workflow tiene **dos jobs**: `analisis-estatico` ("Análisis estático") y `pruebas-unitarias` ("Pruebas unitarias"). No hay filtro por nombre de rama de origen, así que un PR de `feature/`, `fix/`, `test/` o `docs/` hacia `develop` corre lo mismo. No hay `workflow_dispatch` ni `schedule`.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Evento | Análisis estático (ESLint, tsc, auditoría) | Pruebas unitarias (Jest + cobertura) | Integración (con simulados) | Compilación | Regresión | Rendimiento | Estrés | Aceptación |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|---|---|---|---|---|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| `pull_request` hacia `develop` (`feature/`, `fix/`, `test/`, `docs/`) | **Corre** | **Corre** | **Corre** (dentro de Jest) | No corre; PROPUESTA | **Corre** solo la parte de Jest completo; no hay job propio | No corre | No corre | No corre (manual) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| `push` a `develop` (tras fusionar un PR) | **Corre** | **Corre** | **Corre** (dentro de Jest) | No corre; PROPUESTA | Igual que arriba | No corre | No corre | No corre (manual) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| `pull_request` de `release/sprint-N` hacia `main` | **Corre** | **Corre** | **Corre** (dentro de Jest) | No corre; PROPUESTA | Igual que arriba | No corre | No corre | No corre (manual) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| `push` a `main` (tras fusionar el release) | **Corre** | **Corre** | **Corre** (dentro de Jest) | No corre; PROPUESTA | Igual que arriba | No corre | No corre | No corre (manual) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| `push` a una rama de trabajo sin PR | No corre (el `push` solo filtra `develop` y `main`) | No corre | No corre | No corre | No corre | No corre | No corre | No corre |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Manual (`workflow_dispatch`) | **No existe hoy.** PROPUESTA: agregarlo para correr rendimiento y estrés en entorno aislado | **No existe hoy** | **No existe hoy** | **No existe hoy** | **No existe hoy** | **No existe hoy.** PROPUESTA | **No existe hoy.** PROPUESTA | No aplica |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Notas:
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- "Integración (con simulados)": las 8 pruebas de `src/__tests__/integration/` se ejecutan porque `package.json` solo excluye `fixtures/` y `utils/` de Jest. No tienen job propio ni se pueden correr por separado en CI.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- "Regresión": el job de unitarias ejecuta **toda** la batería de Jest en cada evento, por lo que detecta regresiones de lo ya cubierto por pruebas. Eso no es la pasada de regresión planeada en #45 (que incluye validación manual).
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- Aceptación, rendimiento y estrés **nunca** corren en CI hoy.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`---
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## 3. Matriz por tipo de prueba
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Tipo | Herramienta | Evento disparador | Ramas | Job | Estado | Evidencia en el repositorio |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|---|---|---|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Unitarias | Jest 29 + `jest-expo` + React Native Testing Library (`renderHook` para hooks) | `pull_request` y `push` | `develop`, `main` (y PRs hacia ellas) | `Pruebas unitarias` | **Implementada** | `src/__tests__/` (118 archivos `.test.*` en `src/`, incluidos `components/` e `integration/`); `docs/pruebas/evidencia/sprint-N/jest.txt`; artefacto `cobertura` en CI (14 días) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Análisis estático | ESLint (`npx expo lint`), TypeScript (`npx tsc --noEmit`), `npm audit` | `pull_request` y `push` | `develop`, `main` (y PRs hacia ellas) | `Análisis estático` | **Implementada** | `lint.txt` y `tsc.txt` en `docs/pruebas/evidencia/sprint-1` a `sprint-4`; resumen del job en cada ejecución |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Verificación de entorno | `scripts/verificar-entorno.mjs --ci` | `pull_request` y `push` | igual | `Análisis estático` (primer paso) | **Implementada** | [matriz-de-entornos.md](matriz-de-entornos.md) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Integración (servicios simulados) | Jest, 8 archivos en `src/__tests__/integration/` (catálogo, favoritos, sesión/caché, sesión/compra, compra de extremo a extremo, AR, notificaciones push, chatbot y chat en vivo) | `pull_request` y `push` | igual | `Pruebas unitarias` (sin job propio) | **Parcial.** Axios y los servicios externos están simulados | Archivos citados; secciones de integración de `sprint-2.md`, `sprint-3.md`, `sprint-4.md` |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Integración real (backend, Stripe, push en dispositivo, AR en cámara) | Ninguna automatizada | — | — | — | **Manual.** PENDIENTE DE VALIDACIÓN MANUAL en el Sprint 4 | `sprint-4.md`, sección 4 |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Regresión | Jest completo (automática) + pasada manual guiada | `pull_request` y `push` (solo la parte de Jest) | igual | `Pruebas unitarias` | **Parcial.** La pasada de #45 cubrió los Sprints 1–3 el 2026-10-19; falta el cierre con los Sprints 4 y 5 | [regresion-sprints-1-3.md](regresion-sprints-1-3.md); `docs/pruebas/evidencia/regresion/` |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Aceptación | Manual contra los criterios de cada issue (Expo Go o emulador) | Ninguno automático | — | — | **Manual** | `docs/pruebas/sprint-N.md` y capturas en `docs/pruebas/evidencia/sprint-N/`. Sprint 4: 24 criterios **NO PROBADO** |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Rendimiento | `scripts/medir-rendimiento.mjs` (guarda en `scripts/lib/perfGuard.js`, 46 pruebas del script y su guarda) | Manual, con `node` desde la PC de quien mide | Cualquiera, solo contra backend **local** | Ninguno | **Parcial.** Medición del Sprint 3 hecha por Angel el 2026-10-13; webhook → pedido **NO MEDIDO**. Solo backend; la app móvil no se mide | `docs/pruebas/evidencia/sprint-3/rendimiento-2.json` (vigente) y `rendimiento.json` (anterior, con DELETE inválido); `sprint-3.md`, sección 5 |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Estrés | Ninguna | — | — | — | **PROPUESTA.** No hay herramienta, script ni medición en el repo | — |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Compilación | Ninguna en CI (`expo export` o build de EAS) | — | — | — | **PROPUESTA.** No existe paso de compilación en el workflow | — |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Datos de la última evidencia local de Jest guardada en el repo: `docs/pruebas/evidencia/sprint-4/jest.txt` registra 118 suites y 1498 pruebas pasando, `EXIT=0`. Es una ejecución local del Sprint 4, no de CI, y no se volvió a correr para este documento: **NO EJECUTADO en esta rama**.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`---
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## 4. Paralelo contra secuencial
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`### Por qué Análisis estático y Pruebas unitarias corren en paralelo
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Ninguno de los dos jobs declara `needs`, así que GitHub Actions los lanza a la vez, cada uno en su propio runner (`ubuntu-24.04`) y con su propio `npm ci`. Es una decisión explícita del workflow (comentario al inicio del archivo):
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- **Son independientes.** El lint y los tipos no necesitan el resultado de Jest y viceversa.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- **Se ve todo en una sola corrida.** Si uno falla, el otro termina igual y deja su resumen y sus artefactos; no hay que corregir y volver a lanzar para descubrir el segundo fallo.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- **El tiempo total lo marca el job más lento**, no la suma de ambos.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- Hay un caso real: en la ejecución 40166678826 (2026-10-25, PR de `feature/19-resenas-escritura`) "Pruebas unitarias" falló en 37 s mientras "Análisis estático" terminó en éxito en 51 s. Ambos jobs llegaron a su fin.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`### Tiempos reales de ejecuciones recientes
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Duración de cada job = `completedAt − startedAt` según la API de GitHub (`gh run view`). Incluye `npm ci` y la espera del runner dentro del job. No se midió por paso.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Run | Fecha (UTC) | Evento y rama | Análisis estático | Pruebas unitarias | Job más lento (referencia del tiempo de pared) | Suma aritmética de ambos* |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|---|---|---|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40418493051 | 2026-10-26 | `push` `main` | 57 s | 58 s | 58 s | 115 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40418053554 | 2026-10-26 | `pull_request` `release/sprint-4` | 57 s | 54 s | 57 s | 111 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40416211437 | 2026-10-26 | `push` `develop` | 34 s | 46 s | 46 s | 80 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40412121949 | 2026-10-26 | `pull_request` `test/40-aceptacion-sprint4` | 53 s | 55 s | 55 s | 108 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40372986739 | 2026-10-26 | `push` `develop` | 44 s | 53 s | 53 s | 97 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40367775290 | 2026-10-26 | `pull_request` `test/39-integracion-sprint4` | 39 s | 55 s | 55 s | 94 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40362251500 | 2026-10-26 | `pull_request` `docs/137-audit-follow-redirects` | 54 s | 46 s | 54 s | 100 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40286807167 | 2026-10-26 | `pull_request` `fix/137-follow-redirects` | 57 s | 57 s | 57 s | 114 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40274698419 | 2026-10-26 | `pull_request` `test/37-38-unitarias-estatico-sprint4` | 50 s | 52 s | 52 s | 102 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 40166678826 | 2026-10-25 | `pull_request` `feature/19-resenas-escritura` (Pruebas unitarias **falló**) | 51 s | 37 s (falla) | 51 s | 88 s |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`\* La suma es solo aritmética de las duraciones observadas. **No es una ejecución secuencial real**: nunca se ejecutó el workflow con `needs` entre estos dos jobs, así que no hay medición secuencial y no se estima una.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Lectura honesta: en estas 10 ejecuciones, cada job dura entre 34 s y 58 s. Paralelo y secuencial difieren por la duración del job más corto (de 34 s a 54 s en estas ejecuciones). El beneficio es real pero pequeño en términos absolutos.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`### Qué etapas futuras llevarían `needs` (todas PROPUESTA)
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Ninguna existe hoy. Un job lleva `needs` cuando consume algo de otro o no tiene sentido si el anterior falló:
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Etapa futura | ¿Con `needs`? | Razón |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Compilación (`expo export`) | Puede correr en paralelo con las dos actuales, o con `needs` de ambas si se quiere ahorrar minutos cuando falla el código | No depende del resultado de Jest para ejecutarse |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Integración con servicios reales en entorno aislado | Sí: `needs: [analisis-estatico, pruebas-unitarias]` | Es más lenta y costosa; no tiene caso lanzarla si lo básico falla |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Regresión como job propio | Sí: después de unitarias | Reutiliza la misma batería con selección explícita |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Aceptación automatizada (por ejemplo con una herramienta E2E) | Sí: después de la compilación | Necesita un artefacto de la app compilada |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Rendimiento y estrés | Sí, y solo en `workflow_dispatch` | Deben correr en entorno aislado y no bloquear cada PR |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`---
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## 5. Reglas del pipeline
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Verificadas leyendo `.github/workflows/ci.yml` y la protección de ramas en GitHub el 2026-10-26.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Regla | Estado real |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Sin `continue-on-error` | **Cumple.** No aparece en el workflow |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Sin `\|\| true` | **Cumple.** No aparece. Sí hay `\|\| echo "Jest no llegó a imprimir un resumen."` en el paso "Resumen de pruebas y cobertura", que solo escribe el resumen (`if: always()`); el paso que decide, "Pruebas unitarias (Jest)", no lo usa |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| `set +e` | Aparece en el paso de auditoría de nivel alto, pero captura el código de salida y el paso falla (`process.exit(1)`) si la auditoría no se pudo ejecutar. No oculta fallos |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Un job fallido marca el workflow como fallido | **Cumple.** Observado: el run 40166678826 terminó con `conclusion: failure` por la falla de "Pruebas unitarias" |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| `pipefail` en Jest | Los pasos con `tee` usan `shell: bash`, así que el código de salida es el de Jest |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Checks requeridos en `main` | **Sí.** "Análisis estático" y "Pruebas unitarias". `strict: false` (no exige que la rama esté al día con la base) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Checks requeridos en `develop` | **Sí.** Los mismos dos |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Aprobación | 1 aprobación requerida en `main` y en `develop`; también aplica a administradores (`enforce_admins: true`). Regla del proyecto: Claude nunca aprueba ni fusiona |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Umbral de cobertura | En `package.json` (`coverageThreshold.global`): **líneas 80 %, sentencias 80 %, funciones 80 %, ramas 70 %**. Si no se cumple, Jest sale con código distinto de 0 y el job falla. Solo mide los archivos de `collectCoverageFrom` |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Auditoría | `npm audit --audit-level=critical` **bloquea** el job. Las vulnerabilidades de nivel alto son **informativas**: anotación de advertencia y tabla en el resumen del job. Un fallo de ejecución de la auditoría (red, registro, JSON inválido) **sí falla** el paso. Decisiones registradas en [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Límite conocido: `collectCoverageFrom` es una lista explícita. Una carpeta nueva con lógica que no se agregue a esa lista **no cuenta** en la cobertura (regla en [umbral-de-cobertura.md](umbral-de-cobertura.md)).
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`---
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## 6. Criterios de aprobación por tipo de prueba
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Tipo | Criterio | ¿Existe hoy? |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Unitarias | Todas las suites pasan (`npx jest --ci --coverage` con código 0) y se cumple el umbral global: líneas ≥ 80 %, sentencias ≥ 80 %, funciones ≥ 80 %, ramas ≥ 70 % | **Sí**, en `package.json` y en CI |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Análisis estático | `npx expo lint` y `npx tsc --noEmit` terminan con código 0 | **Sí**, en CI |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Auditoría de dependencias | 0 vulnerabilidades críticas. Las altas no bloquean y se documentan | **Sí**, en CI |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Entorno | Node ≥ 22.13.0 y existe `package-lock.json` | **Sí**, `scripts/verificar-entorno.mjs --ci` |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Integración (simulados) | Todas las pruebas de `src/__tests__/integration/` pasan | **Sí**, por estar dentro de Jest. No hay criterio propio |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Integración real | Sin umbral definido; hoy se registra como PENDIENTE DE VALIDACIÓN MANUAL | **No.** PROPUESTA: listar escenarios y resultado esperado por servicio |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Regresión | Sin umbral definido; el criterio práctico es que Jest completo pase y la pasada manual no encuentre fallos nuevos | **Parcial.** PROPUESTA: definir cuántos casos manuales y qué fallos bloquean el cierre |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Aceptación | Cada criterio del issue se marca Cumple / No cumple / Parcial / NO PROBADO. Lo NO PROBADO no cuenta como aprobado | **Sí**, como práctica en `sprint-N.md`. No hay un porcentaje mínimo de criterios que deban cumplirse: PROPUESTA |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Rendimiento | Umbrales por tipo de operación en `scripts/lib/perfGuard.js` (`UMBRALES_MS`): lectura 1000 ms, carrito 1500 ms, checkout 3000 ms, webhook 10000 ms | **Sí**, en el script. Aplican solo al backend local, y el veredicto es "cumple / no cumple" tal cual salga |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Estrés | Sin criterio | **No.** PROPUESTA: definir carga máxima esperada, tasa de error aceptable y recuperación, antes de medir |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Compilación | Sin criterio | **No.** PROPUESTA: que el paso de exportación termine con código 0 |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`---
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## 7. Evidencia y documentación
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Qué | Dónde |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Reporte por sprint | `docs/pruebas/sprint-N.md` (existen `sprint-1.md` a `sprint-4.md`; el Sprint 5 aún no tiene reporte) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Plantilla de reporte | [PLANTILLA.md](PLANTILLA.md) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Evidencia (capturas, logs, mediciones) | `docs/pruebas/evidencia/sprint-N/` y `docs/pruebas/evidencia/regresion/` |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Artefactos de CI | Artefacto `cobertura` (carpeta `coverage/`), conservado 14 días, subido por el job "Pruebas unitarias". Resumen de cada job en la pestaña de la ejecución (`GITHUB_STEP_SUMMARY`) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Plantilla de PR | `.github/pull_request_template.md` (incluye `Closes #n`) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Datos de prueba | [datos-de-prueba.md](datos-de-prueba.md) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Documentos de soporte:
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- [matriz-de-entornos.md](matriz-de-entornos.md): qué se verifica en local, en CI y en dispositivo.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- [umbral-de-cobertura.md](umbral-de-cobertura.md): umbral global y regla de `collectCoverageFrom`.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md): decisiones sobre `npm audit` y avisos de `npm ci`.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- [regresion-sprints-1-3.md](regresion-sprints-1-3.md): primera pasada de #45 (2026-10-19).
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Regla del proyecto: lo que no se puede ejecutar desde el entorno de Claude (dispositivo, capturas) se deja como **PENDIENTE DE VALIDACIÓN MANUAL** con instrucciones para la persona que valida.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`---
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## 8. Calendario de pruebas por sprint
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Estado de cada issue consultado en GitHub el 2026-10-26 (`gh issue view`). "Cerrado" es el estado del issue (`COMPLETED`); el detalle de qué se probó está en el reporte del sprint.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Sprint | Historias | Unitarias | Est. código | Integración | Rendimiento | Aceptación |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|---|---|---|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 1 | #1–#5 | #25 cerrado (2026-10-05) | #26 cerrado (2026-10-05) | — | — | #27 cerrado (2026-10-05) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 2 | #6–#10 | #28 cerrado (2026-10-11) | #29 cerrado (2026-10-11) | #30 cerrado (2026-10-11) | — | #31 cerrado (2026-10-11) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 3 | #11–#15 | #32 cerrado (2026-10-13) | #33 cerrado (2026-10-13) | #34 cerrado (2026-10-13) | #35 cerrado (2026-10-13) | #36 cerrado (2026-10-13) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 4 | #16–#18 | #37 cerrado (2026-10-26) | #38 cerrado (2026-10-26) | #39 **abierto** | — | #40 **abierto** |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| 5 | #19–#20 | #41 **abierto** | #42 **abierto** | — | — | #43 **abierto** |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Cierre (S6) | Todas | — | — | #44 integración completa **abierto** | #46 rendimiento **abierto** | Regresión #45 **abierto** |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Observaciones del estado del Sprint 4:
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- #39: `sprint-4.md` ya registra 58 pruebas de integración con servicios simulados que pasan; la integración real sigue PENDIENTE DE VALIDACIÓN MANUAL. Por eso el issue sigue abierto.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`- #40: `sprint-4.md` registra los 24 criterios (de #16, #17, #18, #104, #105 y #115) como **NO PROBADO**: 0 Cumple, 0 No cumple, 0 Parcial.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Para el Sprint 5, solo #19 tiene capturas en `docs/pruebas/evidencia/sprint-5/`; no existe `sprint-5.md`.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`---
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`## 9. Brecha y siguiente paso
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Todo lo de esta tabla es **PROPUESTA**; se prioriza por el menor esfuerzo y el mayor valor, sin fechas comprometidas.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Brecha | Estado hoy | Siguiente paso propuesto |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`|---|---|---|
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Compilación en CI | No existe | Agregar un job que compruebe que la app compila/exporta, en paralelo con los dos actuales |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Job propio de integración | Corre dentro de Jest, sin separar | Separar con un patrón de ruta (`src/__tests__/integration/`) para ver su resultado y tiempo por separado |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Job propio de regresión | Solo Jest completo; la pasada manual es aparte | Definir el conjunto de regresión y cuándo corre (por ejemplo, en el PR de `release/sprint-N` hacia `main`) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Aceptación automatizada | 100 % manual; el Sprint 4 tiene 24 criterios NO PROBADO | Evaluar una herramienta E2E sobre una compilación de desarrollo; mientras tanto, completar la validación manual pendiente |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Integración real (push, AR, chatbot, Stripe) | PENDIENTE DE VALIDACIÓN MANUAL | Ejecutar y registrar la validación en dispositivo físico |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Rendimiento | Script manual, solo backend local; webhook NO MEDIDO | Medir el webhook y definir una medición de la app móvil (arranque, pantallas) |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| Estrés | No existe | Definir escenarios y umbrales, y ejecutarlos en `workflow_dispatch` |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`| `workflow_dispatch` | No existe | Agregarlo para las pruebas pesadas, sin bloquear los PRs |
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`**Regla de seguridad para rendimiento y estrés:** las pruebas de estrés **NUNCA** se ejecutan contra el backend de producción (Railway). Solo contra un entorno aislado y desechable, con su propia base de datos y claves de prueba (nunca claves live de Stripe). El script de rendimiento actual ya aplica esa regla en `perfGuard.js` (solo acepta `localhost`, `127.0.0.1` y `[::1]`), y cualquier herramienta de estrés debería heredarla.
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`
Sí hay `|| echo "Jest no llegó a imprimir un resumen."`Cambiar el workflow o agregar herramientas requiere un issue propio y su PR; este documento no los incluye.
