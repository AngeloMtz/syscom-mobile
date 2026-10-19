# Advertencias y vulnerabilidades de dependencias

- **Fecha de la verificación:** 2026-10-15 (issue #107)
- **Actualizado:** 2026-10-19, rama `fix/113-source-map-js` (issue #113): causa 3 corregida
- **Sobre:** `package-lock.json` de `develop` en `4580272` (sin cambios de dependencias en esta rama)
- **Herramientas:** `npm audit`, `npm ci` y `npm ls`, ejecutados en local (npm con Node 22). Nada de esto se obtuvo con `npm audit fix --force`.

Este documento registra qué avisos aparecen y qué decisión se tomó para cada uno: **corregir**, **justificar** o **aceptar**. No hay vulnerabilidades críticas; el CI sigue bloqueando por nivel crítico y muestra las altas como advertencia.

## 1. Resumen de `npm audit`

### Corrida de referencia del 2026-10-15 (antes de #113)

| Severidad | Cantidad |
|---|---|
| Crítica | 0 |
| Alta | 53 |
| Moderada | 15 |
| Baja / info | 0 |
| **Total** | **68** |

Casi todas son efecto en cadena de **6 causas raíz** (sección 2): el resto son paquetes que dependen de ellas.

### Después de #113 (2026-10-19)

Con `source-map-js` en 1.2.2 y todo lo demás igual, `npm audit` real (3 corridas seguidas, tras `npm ci`) da:

| Severidad | Cantidad |
|---|---|
| Crítica | 0 |
| Alta | 51 |
| Moderada | 15 |
| Baja / info | 0 |
| **Total** | **66** |

`source-map-js` ya no aparece en el reporte. Quedan **5 causas raíz** (braces, node-forge, decode-uri-component, sprintf-js, uuid).

> **El total fluctúa entre 66 y 67 (antes, entre 67 y 68) con el mismo `package-lock.json`.** La causa es `@testing-library/react-native`, que `npm audit` marca de forma intermitente como "alta" por depender de `react-native`; no es una vulnerabilidad propia de ese paquete. En las 3 corridas del 2026-10-19 no apareció (total 66); si aparece, el total será 67.

> **Nota sobre la cifra (2026-10-15):** el total es **68** en la corrida de referencia. En otras corridas del mismo día, con el mismo `package-lock.json`, salió **67** (52 altas): la diferencia es `@testing-library/react-native`, que aparece de forma intermitente como "alta" por depender de `react-native`. No es una vulnerabilidad propia de ese paquete ni cambió el lockfile. No se atribuye esa diferencia a ninguna corrección: `npm audit fix --dry-run` (sin `--force`) también termina en 67, pero cambiaría 33 paquetes, añadiría 14 y eliminaría 8, por lo que **no se recomienda usarlo tal cual**.

## 2. Las 6 causas raíz

Todas son de **denegación de servicio** o similar; ninguna es crítica. "Ruta" es la cadena que trae el paquete al proyecto (`npm ls`).

| # | Paquete (versión instalada) | Severidad | Aviso | Ruta de dependencia | Qué exigiría corregirla | Decisión |
|---|---|---|---|---|---|---|
| 1 | `braces` 3.0.3 | Alta | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): agotamiento de pila con patrones muy anidados (CWE-674) | `jest` 29.7 → `@jest/core` → `micromatch` → `braces` | `jest` 30 (salto de versión mayor); `jest-expo` del SDK 57 usa Jest 29 | **Justificar.** Solo corre en pruebas locales y en CI, sobre patrones de archivos propios; ningún atacante controla esa entrada. Se revisa al subir de SDK. |
| 2 | `node-forge` 1.4.0 | Alta | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): verificación de firma RSA PKCS#1 v1.5 acepta elementos extra (CWE-347) | `expo` → `@expo/cli` (y `@expo/code-signing-certificates`) → `node-forge` | `npm audit` propone `expo@44.0.6`, es decir, **un downgrade** de 13 versiones mayores: inválido | **Aceptar.** Es la CLI de desarrollo de Expo, no el bundle de la app. Se resuelve con la actualización del SDK o de `@expo/cli`. |
| 3 | `source-map-js` 1.2.1 → **1.2.2** | Alta | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q): DoS del event loop con offsets de source map indexados (CWE-1284) | `expo` → `@expo/metro-config` → `postcss` → `source-map-js` | Sin salto mayor: bastaba subir `source-map-js` a 1.2.2 (`postcss` 8.5.28 pide `^1.2.1`, que 1.2.2 cumple, por lo que `postcss` no se tocó) | **Corregida el 2026-10-19 (#113).** Actualización dirigida solo del lockfile (`npm update source-map-js --depth 9 --package-lock-only`): cambia únicamente `source-map-js`, `package.json` intacto y sin `npm audit fix`. Verificado: lint, tsc, 75 suites y 909 pruebas, `npm audit` sin `source-map-js`. |
| 4 | `decode-uri-component` 0.2.2 | Moderada | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr): DoS por decodificación exponencial de porcentajes mal formados (CWE-400) | `expo-router` 57 → `query-string` 7.1.3 → `decode-uri-component` | `expo-router@58` (salto de SDK) | **Aceptar** hasta actualizar de SDK. Es la única de las 6 que podría llegar al bundle de la app (expo-router parsea URLs); no se verificó el bundle. Impacto: entrada local mal formada (deep link) que bloquee la decodificación. |
| 5 | `sprintf-js` 1.0.3 | Moderada | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c): DoS por precisión sin límite (CWE-1284) | `jest`/`jest-expo` → `babel-plugin-istanbul` → `@istanbuljs/load-nyc-config` → `js-yaml` → `argparse` → `sprintf-js` | `jest` 30 (salto mayor) | **Justificar.** Solo la usa la instrumentación de cobertura en pruebas, con configuración propia. |
| 6 | `uuid` 7.0.3 | Moderada | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq): falta de verificación de límites en v3/v5/v6 al pasar `buf` (CWE-787) | `expo` → `@expo/config-plugins` → `xcode` → `uuid` | `npm audit` propone `expo@44.0.6` (downgrade): inválido | **Aceptar.** Herramienta de configuración nativa en tiempo de build, no del bundle. No se verificó que `xcode` use las variantes afectadas. |

Las correcciones que sugiere `npm audit` para los paquetes directos (`expo`, `react-native`, `jest`, `jest-expo`, `@stripe/stripe-react-native`, `@testing-library/react-native`, `@types/jest`) son **todas saltos mayores o versiones anteriores**, fuera de lo que fija el SDK 57 de Expo. Por eso se descarta `npm audit fix --force`: instalaría versiones incompatibles con el SDK.

## 3. Paquetes deprecados en `npm ci`

Se tomaron del `package-lock.json` (campo `deprecated`). Son 7, todos **transitivos** salvo `eslint`.

| Paquete (versión) | Motivo del aviso | Quién lo trae | Decisión |
|---|---|---|---|
| `abab` 2.0.6 | Usar `atob()`/`btoa()` nativos | `jest-expo` → `jest-environment-jsdom` → `jsdom` 20 | **Aceptar.** Lo fija `jest-expo`; solo pruebas. |
| `domexception` 4.0.0 | Usar `DOMException` nativo | `jsdom` 20 (misma cadena) | **Aceptar.** Igual que el anterior. |
| `whatwg-encoding` 2.0.0 | Usar `@exodus/bytes` | `jsdom` 20 (misma cadena) | **Aceptar.** Igual que el anterior. |
| `glob` 7.2.3 | Versiones antiguas sin soporte | `jest-expo` / `jest` → `babel-plugin-istanbul` → `test-exclude` | **Aceptar.** Solo cobertura en pruebas; se actualiza con Jest 30. |
| `inflight` 1.0.6 | Sin soporte, fuga de memoria | `glob` 7.2.3 | **Aceptar.** Mismo origen que `glob`. |
| `uuid` 7.0.3 | `uuid@10` e inferiores sin soporte | `expo` → `@expo/config-plugins` → `xcode` | **Aceptar.** Es la causa raíz #6. |
| `eslint` 9.39.5 | "Esta versión ya no tiene soporte" | Dependencia directa de desarrollo (`"eslint": "^9.0.0"`), usada con `eslint-config-expo` ~57 | **Aceptar.** Es herramienta de desarrollo y lo fija el SDK; revisar al actualizar `eslint-config-expo`. |

## 4. Aviso ERESOLVE (`test-renderer` y React 19.3)

```
npm warn ERESOLVE overriding peer dependency
npm warn While resolving: react-reconciler@0.34.0
npm warn Found: react@19.2.3
npm warn Could not resolve dependency:
npm warn peer react@"^19.3.0" from react-reconciler@0.34.0
npm warn   react-reconciler@"~0.34.0" from test-renderer@1.3.0
npm warn Conflicting peer dependency: react@19.3.1
```

| Qué pasa | Por qué | Decisión |
|---|---|---|
| `test-renderer@1.3.0` (usado por `@testing-library/react-native` 14) trae `react-reconciler@0.34.0`, que pide `react ^19.3.0`, y el proyecto fija `react 19.2.3` (el del SDK 57). | `react` lo fija Expo SDK 57; no se debe subir por separado. `npm ci` solo avisa: la instalación y las 834 pruebas funcionan. | **Pendiente de PR aparte (#114)**: `npm view test-renderer@1.3.1` muestra peer `react ^19.0.0`, lo que podría eliminar el aviso. Se hará con `npx expo install` y corriendo las 834 pruebas. Mientras tanto, **aceptar**. |

## 5. Cómo se muestra esto en el CI

- **Crítico (bloqueante):** paso `npm audit --audit-level=critical`; si hay una crítica, el job "Análisis estático" falla.
- **Alto (informativo):** paso propio que ejecuta `npm audit --json` y escribe la tabla por severidad en el resumen del job. Si hay altas o críticas, emite una **advertencia** (`::warning::`), no un error: el job sigue en verde.
- **Error de ejecución:** si `npm audit` no puede ejecutarse (red, registro, salida no interpretable), ese paso **falla** con una anotación de error. No es lo mismo que "hay vulnerabilidades".
- Este documento se enlaza desde esa advertencia.

## 6. Los dos jobs corren en paralelo

Los jobs **"Análisis estático"** y **"Pruebas unitarias"** de `.github/workflows/ci.yml` no declaran `needs`, así que GitHub Actions los ejecuta **en paralelo**, cada uno en su propio runner (`ubuntu-24.04`) y con su propia instalación de dependencias (`npm ci`).

- Ninguno espera al otro; si uno falla, el otro termina igual y deja su resumen y sus artefactos.
- Los dos son checks requeridos para fusionar un PR.
- El reporte de cobertura (`coverage/`) se sube como artefacto `cobertura` del job de pruebas, con retención de 14 días.

## 7. Pendientes

| Pendiente | Dónde |
|---|---|
| ~~Actualizar `source-map-js`~~ | **Hecho el 2026-10-19 (#113)** |
| Probar `test-renderer@1.3.1` con `npx expo install` y la suite completa | PR aparte (#114) |
| Revisar las causas aceptadas (1, 2, 4, 5, 6 y los deprecados) al actualizar el SDK de Expo | Siguiente cambio de SDK |
| `npx expo-doctor` reporta 5 paquetes con versión de parche anterior a la que espera el SDK 57 (`expo`, `expo-constants`, `expo-linking`, `expo-router`, `jest-expo`). Existía antes de #113 y está fuera de su alcance | Aparte, con `npx expo install --check` |
