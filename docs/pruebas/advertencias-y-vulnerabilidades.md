# Advertencias y vulnerabilidades de dependencias

- **Fecha de la verificación:** 2026-10-15 (issue #107)
- **Actualizado:** 2026-10-19 (issue #113): causa 3 corregida; (issue #114): ERESOLVE aceptado, con evidencia
- **Actualizado:** 2026-10-26 (issue #134): `npm audit` pasó de 66 a 13; ver la sección 1 ("Situación actual") y las filas marcadas en la sección 2. `develop` en `b824bd5`
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

### Situación actual (2026-10-26)

`npm audit` real sobre `develop` (`b824bd5`, tras `npm ci`):

| Severidad | Cantidad |
|---|---|
| Crítica | **0** |
| Alta | 7 |
| Moderada | 6 |
| Baja / info | 0 |
| **Total** | **13** |

Las 13 entradas son: **altas** `follow-redirects`, `node-forge`, `@expo/cli`, `@expo/code-signing-certificates`, `zod`, `expo` y `@stripe/stripe-react-native`; **moderadas** `decode-uri-component`, `query-string`, `expo-router`, `uuid`, `xcode` y `@expo/config-plugins`. Las **causas raíz** actuales son 5: `decode-uri-component`, `follow-redirects`, `node-forge`, `uuid` y `zod`; las demás son efecto en cadena (directas afectadas: `@stripe/stripe-react-native`, `expo` y `expo-router`).

#### Por qué se pasó de 66 a 13 (con evidencia)

- **El cambio no viene del lockfile.** Se auditó hoy el `package-lock.json` del commit del 19 de octubre (`7e78c26`) en una carpeta temporal y dio el mismo resultado que el actual: **13** (6 moderadas y 7 altas, mismas 5 causas raíz). El mismo lockfile daba 66 el 19 de octubre.
- **Versiones del lockfile en `7e78c26` y hoy:** `braces` 3.0.3 y 3.0.3, `sprintf-js` 1.0.3 y 1.0.3, `source-map-js` 1.2.2 y 1.2.2, además de `jest` 29.7.0, `expo` 57.0.25, `expo-router` 57.0.23 y `node-forge` 1.4.0, todas **iguales**.
- **`braces`:** el aviso GHSA-vfj7-8cjw-p6xm fue **retirado** el 2026-10-23 (campo `withdrawn_at` de la API de GitHub Advisories). Con el aviso retirado, `npm audit` ya no reporta `braces`.
- **`sprintf-js`:** el aviso GHSA-hp3w-g68c-fv3c fue **retirado** el 2026-10-22 (mismo campo de la API).
- **`source-map-js`:** salió con el PR #113 (lockfile 1.2.1 → 1.2.2, 2026-10-19) y sigue sin aparecer.
- **Lo que sí cambió en el lockfile desde el 19 de octubre:** los PR #127 (AR: `react-native-webview` y `expo-web-browser`), #132 (notificaciones: `expo-notifications`) y #133 (chatbot: `expo-crypto` y `socket.io-client`) añadieron dependencias nuevas (de 1078 a 1098 entradas) sin modificar los paquetes auditados.
- **No se pudo explicar con evidencia:** por qué `zod` (aviso GHSA-mrhx-c7xc-m3w5, publicado el 2026-10-01 según la API de GitHub) no aparecía en el reporte del 19 de octubre. La versión de `zod` (3.25.76) es la misma.
- **Sin explicar por completo:** el resto de la reducción (de 66 a 13 entradas) es consistente con el retiro de los dos avisos de arriba, pero no se contó entrada por entrada qué parte corresponde a cada uno.

## 2. Las 6 causas raíz

Todas son de **denegación de servicio** o similar; ninguna es crítica. "Ruta" es la cadena que trae el paquete al proyecto (`npm ls`).

| # | Paquete (versión instalada) | Severidad | Aviso | Ruta de dependencia | Qué exigiría corregirla | Decisión |
|---|---|---|---|---|---|---|
| 1 | `braces` 3.0.3 | Alta | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): agotamiento de pila con patrones muy anidados (CWE-674) | `jest` 29.7 → `@jest/core` → `micromatch` → `braces` | `jest` 30 (salto de versión mayor); `jest-expo` del SDK 57 usa Jest 29 | **Resuelto o ya no aparece (2026-10-26):** el aviso fue retirado el 2026-10-23 (API de GitHub Advisories) y la versión instalada no cambió (3.0.3). *Decisión original (2026-10-15):* **Justificar.** Solo corre en pruebas locales y en CI, sobre patrones de archivos propios; ningún atacante controla esa entrada. Se revisa al subir de SDK. |
| 2 | `node-forge` 1.4.0 | Alta | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): verificación de firma RSA PKCS#1 v1.5 acepta elementos extra (CWE-347) | `expo` → `@expo/cli` (y `@expo/code-signing-certificates`) → `node-forge` | `npm audit` propone `expo@44.0.6`, es decir, **un downgrade** de 13 versiones mayores: inválido | **Vigente: sigue en el reporte del 2026-10-26.** **Aceptar.** Es la CLI de desarrollo de Expo, no el bundle de la app. Se resuelve con la actualización del SDK o de `@expo/cli`. |
| 3 | `source-map-js` 1.2.1 → **1.2.2** | Alta | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q): DoS del event loop con offsets de source map indexados (CWE-1284) | `expo` → `@expo/metro-config` → `postcss` → `source-map-js` | Sin salto mayor: bastaba subir `source-map-js` a 1.2.2 (`postcss` 8.5.28 pide `^1.2.1`, que 1.2.2 cumple, por lo que `postcss` no se tocó) | **Resuelto (2026-10-19, #113); sigue sin aparecer el 2026-10-26.** **Corregida el 2026-10-19 (#113).** Actualización dirigida solo del lockfile (`npm update source-map-js --depth 9 --package-lock-only`): cambia únicamente `source-map-js`, `package.json` intacto y sin `npm audit fix`. Verificado: lint, tsc, 75 suites y 909 pruebas, `npm audit` sin `source-map-js`. |
| 4 | `decode-uri-component` 0.2.2 | Moderada | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr): DoS por decodificación exponencial de porcentajes mal formados (CWE-400) | `expo-router` 57 → `query-string` 7.1.3 → `decode-uri-component` | `expo-router@58` (salto de SDK) | **Vigente: sigue en el reporte del 2026-10-26.** **Aceptar** hasta actualizar de SDK. Es la única de las 6 que podría llegar al bundle de la app (expo-router parsea URLs); no se verificó el bundle. Impacto: entrada local mal formada (deep link) que bloquee la decodificación. |
| 5 | `sprintf-js` 1.0.3 | Moderada | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c): DoS por precisión sin límite (CWE-1284) | `jest`/`jest-expo` → `babel-plugin-istanbul` → `@istanbuljs/load-nyc-config` → `js-yaml` → `argparse` → `sprintf-js` | `jest` 30 (salto mayor) | **Resuelto o ya no aparece (2026-10-26):** el aviso fue retirado el 2026-10-22 (API de GitHub Advisories) y la versión instalada no cambió (1.0.3). *Decisión original (2026-10-15):* **Justificar.** Solo la usa la instrumentación de cobertura en pruebas, con configuración propia. |
| 6 | `uuid` 7.0.3 | Moderada | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq): falta de verificación de límites en v3/v5/v6 al pasar `buf` (CWE-787) | `expo` → `@expo/config-plugins` → `xcode` → `uuid` | `npm audit` propone `expo@44.0.6` (downgrade): inválido | **Vigente: sigue en el reporte del 2026-10-26.** **Aceptar.** Herramienta de configuración nativa en tiempo de build, no del bundle. No se verificó que `xcode` use las variantes afectadas. |

Las correcciones que sugiere `npm audit` para los paquetes directos (`expo`, `react-native`, `jest`, `jest-expo`, `@stripe/stripe-react-native`, `@testing-library/react-native`, `@types/jest`) son **todas saltos mayores o versiones anteriores**, fuera de lo que fija el SDK 57 de Expo. Por eso se descarta `npm audit fix --force`: instalaría versiones incompatibles con el SDK.

### Causas nuevas (2026-10-26)

| # | Paquete (versión instalada) | Severidad | Aviso | Ruta de dependencia | Qué exigiría corregirla | Decisión |
|---|---|---|---|---|---|---|
| 7 | `follow-redirects` 1.16.0 | Alta | [GHSA-q3jh-wrc6-jgq8](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8) y [GHSA-8r9p-f939-6h3c](https://github.com/advisories/GHSA-8r9p-f939-6h3c): cabeceras que evitan quitar credenciales entre orígenes y expresión regular de `sensitiveHeaders`; ambos publicados el 2026-10-20, versión corregida 1.16.1 | `axios` 1.20.0 → `follow-redirects` | `npm audit` indica que se corrige sin salto mayor (`fixAvailable: true`; la versión corregida es 1.16.1). No se aplicó ni se probó | **Pendiente de decisión.** Propuesta: corregir con una actualización dirigida del lockfile en un PR aparte, como se hizo con `source-map-js`. No se aplicó en este PR. Aparece desde el 2026-10-20, después del reporte del 19 de octubre |
| 8 | `zod` 3.25.76 | Alta | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): consumo de memoria al validar colecciones muy grandes con restricciones; afecta a `< 4.6.6` | `expo` → `@expo/cli` → `zod` | `zod` 4.6.6 o superior (salto de versión mayor); `npm audit` propone `expo@44.0.6` (downgrade): inválido | **Pendiente de decisión.** Llega por la CLI de desarrollo de Expo, no por el código de la app. No se verificó que la app o la CLI usen la parte afectada. No se explicó por qué no aparecía el 19 de octubre (ver arriba) |

## 3. Paquetes deprecados en `npm ci`

Se tomaron del `package-lock.json` (campo `deprecated`). Son 7, todos **transitivos** salvo `eslint`. **Verificado el 2026-10-26:** el `npm ci` de ese día sigue mostrando los 7 avisos.

| Paquete (versión) | Motivo del aviso | Quién lo trae | Decisión |
|---|---|---|---|
| `abab` 2.0.6 | Usar `atob()`/`btoa()` nativos | `jest-expo` → `jest-environment-jsdom` → `jsdom` 20 | **Aceptar.** Lo fija `jest-expo`; solo pruebas. |
| `domexception` 4.0.0 | Usar `DOMException` nativo | `jsdom` 20 (misma cadena) | **Aceptar.** Igual que el anterior. |
| `whatwg-encoding` 2.0.0 | Usar `@exodus/bytes` | `jsdom` 20 (misma cadena) | **Aceptar.** Igual que el anterior. |
| `glob` 7.2.3 | Versiones antiguas sin soporte | `jest-expo` / `jest` → `babel-plugin-istanbul` → `test-exclude` | **Aceptar.** Solo cobertura en pruebas; se actualiza con Jest 30. |
| `inflight` 1.0.6 | Sin soporte, fuga de memoria | `glob` 7.2.3 | **Aceptar.** Mismo origen que `glob`. |
| `uuid` 7.0.3 | `uuid@10` e inferiores sin soporte | `expo` → `@expo/config-plugins` → `xcode` | **Aceptar.** Es la causa raíz #6. |
| `eslint` 9.39.5 | "Esta versión ya no tiene soporte" | Dependencia directa de desarrollo (`"eslint": "^9.0.0"`), usada con `eslint-config-expo` ~57 | **Aceptar.** Es herramienta de desarrollo y lo fija el SDK; revisar al actualizar `eslint-config-expo`. |

## 4. Aviso ERESOLVE (`react-reconciler` y React 19.3)

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
| `test-renderer` (usado por `@testing-library/react-native` 14) trae `react-reconciler@0.34.0`, que pide `react ^19.3.0`, y el proyecto fija `react 19.2.3` (el del SDK 57). | `react` lo fija Expo SDK 57; no se debe subir por separado. `npm ci` solo avisa: la instalación y las pruebas funcionan (75 suites y 909 pruebas). | **ACEPTADO (2026-10-19, #114).** Se espera que desaparezca cuando el SDK de Expo suba React a 19.3. Evidencia abajo. |

**Verificado el 2026-10-26:** el aviso ERESOLVE sigue apareciendo en `npm ci`.

### Evidencia (#114, 2026-10-19)

La hipótesis del issue era que `test-renderer@1.3.1` eliminaría el aviso porque su peer es `react ^19.0.0`. **Resultó falsa**:

- **La causa real es `react-reconciler@0.34.0`** (peer `react ^19.3.0`), no el peer de `test-renderer`. Tanto `test-renderer@1.3.0` como `1.3.1` dependen de `react-reconciler ~0.34.0`; solo cambia `@types/react-reconciler` (`~0.33.0` → `~0.34.0`).
- **Se probó en un clon limpio de `develop`** (`732783c`), no en la carpeta de trabajo:
  1. Línea base: `npm ci` muestra el aviso.
  2. Con `test-renderer` actualizado a 1.3.1 en el lockfile (`npm update test-renderer --package-lock-only`, que además sube `@types/react-reconciler` de 0.33.1 a 0.34.0): `npm ci` **sigue mostrando el mismo aviso**, ahora "from test-renderer@1.3.1".
- Por eso no se subió `test-renderer` a 1.3.1: no resuelve el aviso y solo cambiaría el lockfile sin beneficio.

### Opciones descartadas

| Opción | Por qué se descartó |
|---|---|
| `overrides` de `react-reconciler` a `~0.33.0` (la rama que pide `react ^19.2.0`) | Fuerza un paquete con el que `test-renderer` no está compilado (usa la 0.34); podría romper las pruebas de componentes de forma silenciosa. Es forzar, y el proyecto no fuerza dependencias. |
| Subir `react` a 19.3.x | `react` lo fija el SDK 57 de Expo (19.2.3); subirlo por separado sale de las versiones que el SDK valida. |
| `npx expo install test-renderer@1.3.1` | No es aplicable aquí; ver la nota práctica de abajo. |

### Nota práctica: `npx expo install` con un paquete ya presente

Con `test-renderer` (ya declarado en `devDependencies`), `npx expo install test-renderer@1.3.1`:

- **duplicó** `test-renderer: 1.3.1` en `dependencies` (seguía también en `devDependencies`),
- **reescribió `package.json` completo** (finales de línea CRLF → LF), y
- **no cambió el lockfile**: `test-renderer` siguió en 1.3.0.

Para un paquete que **ya está** en `package.json` y solo se quiere subir dentro de su rango, usar `npm update <paquete> --package-lock-only` (cambia solo el lockfile; `package.json` queda intacto). Reservar `npx expo install` para agregar paquetes nuevos y para alinear versiones con el SDK.

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
| ~~Probar `test-renderer@1.3.1`~~ | **Resuelto por documentación el 2026-10-19 (#114):** el aviso queda aceptado; no desaparece con 1.3.1 y se espera que se resuelva cuando el SDK suba React a 19.3 |
| Revisar las causas aceptadas (1, 2, 4, 5, 6 y los deprecados) al actualizar el SDK de Expo | Siguiente cambio de SDK |
| `npx expo-doctor` reporta paquetes con versión de parche anterior a la que espera el SDK 57. El 2026-10-19 eran 5 (`expo`, `expo-constants`, `expo-linking`, `expo-router`, `jest-expo`); el 2026-10-26 son **4**: `expo-constants` ya no aparece. Está fuera del alcance de #113 y #134 | Aparte, con `npx expo install --check` (issue #121) |
| Decidir qué hacer con `follow-redirects` (propuesta: actualización dirigida) y con `zod` (exige salto mayor, llega por la CLI de Expo); causas nuevas del 2026-10-26 | Issue y PR aparte (por crear) |
