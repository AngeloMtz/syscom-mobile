# Plan de pruebas — syscom-mobile

- **Fecha de elaboración:** 2026-10-26
- **Issue:** #143
- **Base:** `develop` en `faa8d77` (Merge pull request #141)
- **Fuentes:** `.github/workflows/ci.yml`, `package.json`, `docs/pruebas/`, ejecuciones de CI y estado de los issues #25 a #46 consultados en GitHub el 2026-10-26.
- **Responsable:** @AngeloMtz. Revisa: @LAHH18.
- **Actualizado:** 2026-10-27 (issue #150): SDK 58 (#148), Jest 30 y cifras medidas ese día sobre `develop` en `dbb922e`. Las ejecuciones de CI de la sección 4 no se volvieron a medir.

## Convenciones de este documento

| Marca | Significa |
|---|---|
| **Implementada** | Existe en el repositorio y corre hoy en el pipeline |
| **Parcial** | Existe, pero no cubre todo el tipo de prueba o no corre en el pipeline |
| **Manual** | Se ejecuta a mano y se registra en `docs/pruebas/sprint-N.md` |
| **PROPUESTA** | No existe en el repositorio. Es una idea de este plan, sin compromiso ni fecha |
| **NO EJECUTADO** | Existe o se describe, pero no hay ejecución real que lo respalde |

Todas las horas de GitHub Actions están en UTC. Nada de lo marcado PROPUESTA se ha implementado ni medido.

---

## 1. Objetivo y alcance

**Objetivo:** que cada cambio que entra a `develop` y `main` pase por verificaciones automáticas y repetibles, y que lo que no se puede automatizar (dispositivo real, cámara, push, backend real) quede registrado como validación manual con instrucciones claras.

**Qué se prueba:** la app móvil (React Native + Expo + TypeScript) en `src/`: validaciones, repositories, hooks, stores, selectores y componentes de los módulos de autenticación, catálogo, carrito, direcciones, pagos, pedidos, reseñas, favoritos, AR, notificaciones, chatbot y servicios/institucional. El backend (Express + PostgreSQL) se reutiliza y **no se prueba en este repositorio**.

**Qué no cubre este plan:** pruebas del backend, pruebas en iOS físico, y cualquier prueba contra producción.

### Niveles (pirámide)

```
                 /\
                /  \     Cima: aceptación (manual), regresión, estrés
               /----\
              /      \   Medio: integración, rendimiento
             /--------\
            /          \ Base: análisis estático y pruebas unitarias
           /____________\
```

| Nivel | Tipos | Estado general |
|---|---|---|
| Base | Análisis estático, unitarias | Implementados y automáticos en CI |
| Medio | Integración, rendimiento | Parciales: integración con servicios simulados dentro de Jest; rendimiento solo con script manual en local |
| Cima | Aceptación, regresión, estrés | Aceptación y regresión manuales o parciales; estrés es PROPUESTA |

---

## 2. Evento → qué corre

Fuente: `.github/workflows/ci.yml`. El disparador es:

```yaml
on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop, main]
```

El workflow tiene **dos jobs**: `analisis-estatico` ("Análisis estático") y `pruebas-unitarias` ("Pruebas unitarias"). No hay filtro por nombre de rama de origen, así que un PR de `feature/`, `fix/`, `test/` o `docs/` hacia `develop` corre lo mismo. No hay `workflow_dispatch` ni `schedule`.

| Evento | Análisis estático (ESLint, tsc, auditoría) | Pruebas unitarias (Jest + cobertura) | Integración (con simulados) | Compilación | Regresión | Rendimiento | Estrés | Aceptación |
|---|---|---|---|---|---|---|---|---|
| `pull_request` hacia `develop` (`feature/`, `fix/`, `test/`, `docs/`) | **Corre** | **Corre** | **Corre** (dentro de Jest) | No corre; PROPUESTA | **Corre** solo la parte de Jest completo; no hay job propio | No corre | No corre | No corre (manual) |
| `push` a `develop` (tras fusionar un PR) | **Corre** | **Corre** | **Corre** (dentro de Jest) | No corre; PROPUESTA | Igual que arriba | No corre | No corre | No corre (manual) |
| `pull_request` de `release/sprint-N` hacia `main` | **Corre** | **Corre** | **Corre** (dentro de Jest) | No corre; PROPUESTA | Igual que arriba | No corre | No corre | No corre (manual) |
| `push` a `main` (tras fusionar el release) | **Corre** | **Corre** | **Corre** (dentro de Jest) | No corre; PROPUESTA | Igual que arriba | No corre | No corre | No corre (manual) |
| `push` a una rama de trabajo sin PR | No corre (el `push` solo filtra `develop` y `main`) | No corre | No corre | No corre | No corre | No corre | No corre | No corre |
| Manual (`workflow_dispatch`) | **No existe hoy.** PROPUESTA: agregarlo para correr rendimiento y estrés en entorno aislado | **No existe hoy** | **No existe hoy** | **No existe hoy** | **No existe hoy** | **No existe hoy.** PROPUESTA | **No existe hoy.** PROPUESTA | No aplica |

Notas:
- "Integración (con simulados)": las 8 pruebas de `src/__tests__/integration/` se ejecutan porque `package.json` solo excluye `fixtures/` y `utils/` de Jest. No tienen job propio ni se pueden correr por separado en CI.
- "Regresión": el job de unitarias ejecuta **toda** la batería de Jest en cada evento, por lo que detecta regresiones de lo ya cubierto por pruebas. Eso no es la pasada de regresión planeada en #45 (que incluye validación manual).
- Aceptación, rendimiento y estrés **nunca** corren en CI hoy.

---

## 3. Matriz por tipo de prueba

| Tipo | Herramienta | Evento disparador | Ramas | Job | Estado | Evidencia en el repositorio |
|---|---|---|---|---|---|---|
| Unitarias | Jest 30 (`jest ~30.5.2`) + `jest-expo` ~58.0.12 + React Native Testing Library (`renderHook` para hooks) | `pull_request` y `push` | `develop`, `main` (y PRs hacia ellas) | `Pruebas unitarias` | **Implementada** | `src/__tests__/` (119 archivos `.test.*` en `src/`, incluidos `components/` e `integration/`); `docs/pruebas/evidencia/sprint-N/jest.txt`; artefacto `cobertura` en CI (14 días) |
| Análisis estático | ESLint (`npx expo lint`), TypeScript (`npx tsc --noEmit`), `npm audit` | `pull_request` y `push` | `develop`, `main` (y PRs hacia ellas) | `Análisis estático` | **Implementada** | `lint.txt` y `tsc.txt` en `docs/pruebas/evidencia/sprint-1` a `sprint-4`; resumen del job en cada ejecución |
| Verificación de entorno | `scripts/verificar-entorno.mjs --ci` | `pull_request` y `push` | igual | `Análisis estático` (primer paso) | **Implementada** | [matriz-de-entornos.md](matriz-de-entornos.md) |
| Integración (servicios simulados) | Jest, 8 archivos en `src/__tests__/integration/` (catálogo, favoritos, sesión/caché, sesión/compra, compra de extremo a extremo, AR, notificaciones push, chatbot y chat en vivo) | `pull_request` y `push` | igual | `Pruebas unitarias` (sin job propio) | **Parcial.** Axios y los servicios externos están simulados | Archivos citados; secciones de integración de `sprint-2.md`, `sprint-3.md`, `sprint-4.md` |
| Integración real (backend, Stripe, push en dispositivo, AR en cámara) | Ninguna automatizada | — | — | — | **Manual.** PENDIENTE DE VALIDACIÓN MANUAL en el Sprint 4 | `sprint-4.md`, sección 4 |
| Regresión | Jest completo (automática) + pasada manual guiada | `pull_request` y `push` (solo la parte de Jest) | igual | `Pruebas unitarias` | **Parcial.** La pasada de #45 cubrió los Sprints 1–3 el 2026-10-19; falta el cierre con los Sprints 4 y 5 | [regresion-sprints-1-3.md](regresion-sprints-1-3.md); `docs/pruebas/evidencia/regresion/` |
| Aceptación | Manual contra los criterios de cada issue (Expo Go o emulador) | Ninguno automático | — | — | **Manual** | `docs/pruebas/sprint-N.md` y capturas en `docs/pruebas/evidencia/sprint-N/`. Sprint 4: 24 criterios **NO PROBADO** |
| Rendimiento | `scripts/medir-rendimiento.mjs` (guarda en `scripts/lib/perfGuard.js`, 46 pruebas del script y su guarda) | Manual, con `node` desde la PC de quien mide | Cualquiera, solo contra backend **local** | Ninguno | **Parcial.** Medición del Sprint 3 hecha por Angel el 2026-10-13; webhook → pedido **NO MEDIDO**. Solo backend; la app móvil no se mide | `docs/pruebas/evidencia/sprint-3/rendimiento-2.json` (vigente) y `rendimiento.json` (anterior, con DELETE inválido); `sprint-3.md`, sección 5 |
| Estrés | Ninguna | — | — | — | **PROPUESTA.** No hay herramienta, script ni medición en el repo | — |
| Compilación | Ninguna en CI (`expo export` o build de EAS) | — | — | — | **PROPUESTA.** No existe paso de compilación en el workflow | — |

Medición local del 2026-10-27 sobre `develop` en `dbb922e` (SDK 58, Jest 30, Node 22.13.0, npm 11.12.1, tras `npm ci`). No es una ejecución de CI y la salida no se guardó en el repo:

| Verificación | Resultado |
|---|---|
| `npx expo lint --no-cache` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npx jest --ci --coverage` | exit 0; **119 suites y 1501 pruebas** pasan; cobertura 99.08 % sentencias (1955/1973), 97.5 % ramas (1370/1405), 98.53 % funciones (672/682) y 99.34 % líneas (1672/1683); el umbral global se cumple |
| `npm audit` | 0 críticas, **3 altas**, 0 moderadas (total 3); `npm audit --audit-level=critical` exit 0. Detalle en [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md) |

La última evidencia guardada en el repo es `docs/pruebas/evidencia/sprint-4/jest.txt` (118 suites y 1498 pruebas con SDK 57, `EXIT=0`); se conserva como historial de ese sprint.

---

## 4. Paralelo contra secuencial

### Por qué Análisis estático y Pruebas unitarias corren en paralelo

Ninguno de los dos jobs declara `needs`, así que GitHub Actions los lanza a la vez, cada uno en su propio runner (`ubuntu-24.04`) y con su propio `npm ci`. Es una decisión explícita del workflow (comentario al inicio del archivo):

- **Son independientes.** El lint y los tipos no necesitan el resultado de Jest y viceversa.
- **Se ve todo en una sola corrida.** Si uno falla, el otro termina igual y deja su resumen y sus artefactos; no hay que corregir y volver a lanzar para descubrir el segundo fallo.
- **El tiempo total lo marca el job más lento**, no la suma de ambos.
- Hay un caso real: en la ejecución 40166678826 (2026-10-25, PR de `feature/19-resenas-escritura`) "Pruebas unitarias" falló en 37 s mientras "Análisis estático" terminó en éxito en 51 s. Ambos jobs llegaron a su fin.

### Tiempos reales de ejecuciones recientes

Duración de cada job = `completedAt − startedAt` según la API de GitHub (`gh run view`). Incluye `npm ci` y la espera del runner dentro del job. No se midió por paso.

| Run | Fecha (UTC) | Evento y rama | Análisis estático | Pruebas unitarias | Job más lento (referencia del tiempo de pared) | Suma aritmética de ambos* |
|---|---|---|---|---|---|---|
| 40418493051 | 2026-10-26 | `push` `main` | 57 s | 58 s | 58 s | 115 s |
| 40418053554 | 2026-10-26 | `pull_request` `release/sprint-4` | 57 s | 54 s | 57 s | 111 s |
| 40416211437 | 2026-10-26 | `push` `develop` | 34 s | 46 s | 46 s | 80 s |
| 40412121949 | 2026-10-26 | `pull_request` `test/40-aceptacion-sprint4` | 53 s | 55 s | 55 s | 108 s |
| 40372986739 | 2026-10-26 | `push` `develop` | 44 s | 53 s | 53 s | 97 s |
| 40367775290 | 2026-10-26 | `pull_request` `test/39-integracion-sprint4` | 39 s | 55 s | 55 s | 94 s |
| 40362251500 | 2026-10-26 | `pull_request` `docs/137-audit-follow-redirects` | 54 s | 46 s | 54 s | 100 s |
| 40286807167 | 2026-10-26 | `pull_request` `fix/137-follow-redirects` | 57 s | 57 s | 57 s | 114 s |
| 40274698419 | 2026-10-26 | `pull_request` `test/37-38-unitarias-estatico-sprint4` | 50 s | 52 s | 52 s | 102 s |
| 40166678826 | 2026-10-25 | `pull_request` `feature/19-resenas-escritura` (Pruebas unitarias **falló**) | 51 s | 37 s (falla) | 51 s | 88 s |

\* La suma es solo aritmética de las duraciones observadas. **No es una ejecución secuencial real**: nunca se ejecutó el workflow con `needs` entre estos dos jobs, así que no hay medición secuencial y no se estima una.

Lectura honesta: en estas 10 ejecuciones, cada job dura entre 34 s y 58 s. Paralelo y secuencial difieren por la duración del job más corto (de 34 s a 54 s en estas ejecuciones). El beneficio es real pero pequeño en términos absolutos.

Las 10 ejecuciones son anteriores a la migración a SDK 58 (#148, fusionada el 2026-10-27 a las 15:35 UTC). Los tiempos de CI con SDK 58 **no se volvieron a medir en este PR: NO EJECUTADO**; en local, Jest tardó 20.13 s en la medición del 2026-10-27 (12 s en la evidencia del Sprint 4 con SDK 57), pero esa cifra no es de CI.

### Qué etapas futuras llevarían `needs` (todas PROPUESTA)

Ninguna existe hoy. Un job lleva `needs` cuando consume algo de otro o no tiene sentido si el anterior falló:

| Etapa futura | ¿Con `needs`? | Razón |
|---|---|---|
| Compilación (`expo export`) | Puede correr en paralelo con las dos actuales, o con `needs` de ambas si se quiere ahorrar minutos cuando falla el código | No depende del resultado de Jest para ejecutarse |
| Integración con servicios reales en entorno aislado | Sí: `needs: [analisis-estatico, pruebas-unitarias]` | Es más lenta y costosa; no tiene caso lanzarla si lo básico falla |
| Regresión como job propio | Sí: después de unitarias | Reutiliza la misma batería con selección explícita |
| Aceptación automatizada (por ejemplo con una herramienta E2E) | Sí: después de la compilación | Necesita un artefacto de la app compilada |
| Rendimiento y estrés | Sí, y solo en `workflow_dispatch` | Deben correr en entorno aislado y no bloquear cada PR |

---

## 5. Reglas del pipeline

Verificadas leyendo `.github/workflows/ci.yml` y la protección de ramas en GitHub el 2026-10-26.

| Regla | Estado real |
|---|---|
| Sin `continue-on-error` | **Cumple.** No aparece en el workflow |
| Sin `\|\| true` | **Cumple.** No aparece. Sí hay `\|\| echo "Jest no llegó a imprimir un resumen."` en el paso "Resumen de pruebas y cobertura", que solo escribe el resumen (`if: always()`); el paso que decide, "Pruebas unitarias (Jest)", no lo usa |
| `set +e` | Aparece en el paso de auditoría de nivel alto, pero captura el código de salida y el paso falla (`process.exit(1)`) si la auditoría no se pudo ejecutar. No oculta fallos |
| Un job fallido marca el workflow como fallido | **Cumple.** Observado: el run 40166678826 terminó con `conclusion: failure` por la falla de "Pruebas unitarias" |
| `pipefail` en Jest | Los pasos con `tee` usan `shell: bash`, así que el código de salida es el de Jest |
| Checks requeridos en `main` | **Sí.** "Análisis estático" y "Pruebas unitarias". `strict: false` (no exige que la rama esté al día con la base) |
| Checks requeridos en `develop` | **Sí.** Los mismos dos |
| Aprobación | 1 aprobación requerida en `main` y en `develop`; también aplica a administradores (`enforce_admins: true`). Regla del proyecto: Claude nunca aprueba ni fusiona |
| Umbral de cobertura | En `package.json` (`coverageThreshold.global`): **líneas 80 %, sentencias 80 %, funciones 80 %, ramas 70 %**. Si no se cumple, Jest sale con código distinto de 0 y el job falla. Solo mide los archivos de `collectCoverageFrom` |
| Auditoría | `npm audit --audit-level=critical` **bloquea** el job. Las vulnerabilidades de nivel alto son **informativas**: anotación de advertencia y tabla en el resumen del job. Un fallo de ejecución de la auditoría (red, registro, JSON inválido) **sí falla** el paso. Decisiones registradas en [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md) |

Límite conocido: `collectCoverageFrom` es una lista explícita. Una carpeta nueva con lógica que no se agregue a esa lista **no cuenta** en la cobertura (regla en [umbral-de-cobertura.md](umbral-de-cobertura.md)).

---

## 6. Criterios de aprobación por tipo de prueba

| Tipo | Criterio | ¿Existe hoy? |
|---|---|---|
| Unitarias | Todas las suites pasan (`npx jest --ci --coverage` con código 0) y se cumple el umbral global: líneas ≥ 80 %, sentencias ≥ 80 %, funciones ≥ 80 %, ramas ≥ 70 % | **Sí**, en `package.json` y en CI |
| Análisis estático | `npx expo lint` y `npx tsc --noEmit` terminan con código 0 | **Sí**, en CI |
| Auditoría de dependencias | 0 vulnerabilidades críticas. Las altas no bloquean y se documentan | **Sí**, en CI |
| Entorno | Node ≥ 22.13.0 y existe `package-lock.json` | **Sí**, `scripts/verificar-entorno.mjs --ci` |
| Integración (simulados) | Todas las pruebas de `src/__tests__/integration/` pasan | **Sí**, por estar dentro de Jest. No hay criterio propio |
| Integración real | Sin umbral definido; hoy se registra como PENDIENTE DE VALIDACIÓN MANUAL | **No.** PROPUESTA: listar escenarios y resultado esperado por servicio |
| Regresión | Sin umbral definido; el criterio práctico es que Jest completo pase y la pasada manual no encuentre fallos nuevos | **Parcial.** PROPUESTA: definir cuántos casos manuales y qué fallos bloquean el cierre |
| Aceptación | Cada criterio del issue se marca Cumple / No cumple / Parcial / NO PROBADO. Lo NO PROBADO no cuenta como aprobado | **Sí**, como práctica en `sprint-N.md`. No hay un porcentaje mínimo de criterios que deban cumplirse: PROPUESTA |
| Rendimiento | Umbrales por tipo de operación en `scripts/lib/perfGuard.js` (`UMBRALES_MS`): lectura 1000 ms, carrito 1500 ms, checkout 3000 ms, webhook 10000 ms | **Sí**, en el script. Aplican solo al backend local, y el veredicto es "cumple / no cumple" tal cual salga |
| Estrés | Sin criterio | **No.** PROPUESTA: definir carga máxima esperada, tasa de error aceptable y recuperación, antes de medir |
| Compilación | Sin criterio | **No.** PROPUESTA: que el paso de exportación termine con código 0 |

---

## 7. Evidencia y documentación

| Qué | Dónde |
|---|---|
| Reporte por sprint | `docs/pruebas/sprint-N.md` (existen `sprint-1.md` a `sprint-4.md`; el Sprint 5 aún no tiene reporte) |
| Plantilla de reporte | [PLANTILLA.md](PLANTILLA.md) |
| Evidencia (capturas, logs, mediciones) | `docs/pruebas/evidencia/sprint-N/` y `docs/pruebas/evidencia/regresion/` |
| Artefactos de CI | Artefacto `cobertura` (carpeta `coverage/`), conservado 14 días, subido por el job "Pruebas unitarias". Resumen de cada job en la pestaña de la ejecución (`GITHUB_STEP_SUMMARY`) |
| Plantilla de PR | `.github/pull_request_template.md` (incluye `Closes #n`) |
| Datos de prueba | [datos-de-prueba.md](datos-de-prueba.md) |

Documentos de soporte:
- [matriz-de-entornos.md](matriz-de-entornos.md): qué se verifica en local, en CI y en dispositivo.
- [umbral-de-cobertura.md](umbral-de-cobertura.md): umbral global y regla de `collectCoverageFrom`.
- [advertencias-y-vulnerabilidades.md](advertencias-y-vulnerabilidades.md): decisiones sobre `npm audit` y avisos de `npm ci`.
- [regresion-sprints-1-3.md](regresion-sprints-1-3.md): primera pasada de #45 (2026-10-19).

Regla del proyecto: lo que no se puede ejecutar desde el entorno de Claude (dispositivo, capturas) se deja como **PENDIENTE DE VALIDACIÓN MANUAL** con instrucciones para la persona que valida.

---

## 8. Calendario de pruebas por sprint

Estado de cada issue consultado en GitHub el 2026-10-26 (`gh issue view`). "Cerrado" es el estado del issue (`COMPLETED`); el detalle de qué se probó está en el reporte del sprint.

| Sprint | Historias | Unitarias | Est. código | Integración | Rendimiento | Aceptación |
|---|---|---|---|---|---|---|
| 1 | #1–#5 | #25 cerrado (2026-10-05) | #26 cerrado (2026-10-05) | — | — | #27 cerrado (2026-10-05) |
| 2 | #6–#10 | #28 cerrado (2026-10-11) | #29 cerrado (2026-10-11) | #30 cerrado (2026-10-11) | — | #31 cerrado (2026-10-11) |
| 3 | #11–#15 | #32 cerrado (2026-10-13) | #33 cerrado (2026-10-13) | #34 cerrado (2026-10-13) | #35 cerrado (2026-10-13) | #36 cerrado (2026-10-13) |
| 4 | #16–#18 | #37 cerrado (2026-10-26) | #38 cerrado (2026-10-26) | #39 **abierto** | — | #40 **abierto** |
| 5 | #19–#20 | #41 **abierto** | #42 **abierto** | — | — | #43 **abierto** |
| Cierre (S6) | Todas | — | — | #44 integración completa **abierto** | #46 rendimiento **abierto** | Regresión #45 **abierto** |

Observaciones del estado del Sprint 4:
- #39: `sprint-4.md` ya registra 58 pruebas de integración con servicios simulados que pasan; la integración real sigue PENDIENTE DE VALIDACIÓN MANUAL. Por eso el issue sigue abierto.
- #40: `sprint-4.md` registra los 24 criterios (de #16, #17, #18, #104, #105 y #115) como **NO PROBADO**: 0 Cumple, 0 No cumple, 0 Parcial.

Para el Sprint 5, solo #19 tiene capturas en `docs/pruebas/evidencia/sprint-5/`; no existe `sprint-5.md`.

---

## 9. Brecha y siguiente paso

Todo lo de esta tabla es **PROPUESTA**; se prioriza por el menor esfuerzo y el mayor valor, sin fechas comprometidas.

| Brecha | Estado hoy | Siguiente paso propuesto |
|---|---|---|
| Compilación en CI | No existe | Agregar un job que compruebe que la app compila/exporta, en paralelo con los dos actuales |
| Job propio de integración | Corre dentro de Jest, sin separar | Separar con un patrón de ruta (`src/__tests__/integration/`) para ver su resultado y tiempo por separado |
| Job propio de regresión | Solo Jest completo; la pasada manual es aparte | Definir el conjunto de regresión y cuándo corre (por ejemplo, en el PR de `release/sprint-N` hacia `main`) |
| Aceptación automatizada | 100 % manual; el Sprint 4 tiene 24 criterios NO PROBADO | Evaluar una herramienta E2E sobre una compilación de desarrollo; mientras tanto, completar la validación manual pendiente |
| Integración real (push, AR, chatbot, Stripe) | PENDIENTE DE VALIDACIÓN MANUAL | Ejecutar y registrar la validación en dispositivo físico |
| Rendimiento | Script manual, solo backend local; webhook NO MEDIDO | Medir el webhook y definir una medición de la app móvil (arranque, pantallas) |
| Estrés | No existe | Definir escenarios y umbrales, y ejecutarlos en `workflow_dispatch` |
| `workflow_dispatch` | No existe | Agregarlo para las pruebas pesadas, sin bloquear los PRs |

**Regla de seguridad para rendimiento y estrés:** las pruebas de estrés **NUNCA** se ejecutan contra el backend de producción (Railway). Solo contra un entorno aislado y desechable, con su propia base de datos y claves de prueba (nunca claves live de Stripe). El script de rendimiento actual ya aplica esa regla en `perfGuard.js` (solo acepta `localhost`, `127.0.0.1` y `[::1]`), y cualquier herramienta de estrés debería heredarla.

Cambiar el workflow o agregar herramientas requiere un issue propio y su PR; este documento no los incluye.
