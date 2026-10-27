# Despliegue en Google Play — syscom-mobile

- **Fecha de elaboración:** 2026-10-26
- **Issue:** #145
- **Base:** `develop` en `faa8d77`
- **Responsable:** @AngeloMtz. Revisa: @LAHH18.
- **Alcance:** solo documentación. No se modificó código, `eas.json` ni `app.config.js`.

## Convenciones

| Marca | Significa |
|---|---|
| **Verificado** | Comprobado en el repositorio o en la documentación de Expo en la fecha indicada |
| **PROPUESTA** | No existe hoy; es una decisión sugerida, sin ejecutar |
| **PENDIENTE DE CONFIRMAR POR ANGEL** | Depende de una cuenta, acceso o decisión que no se pudo verificar desde el repositorio |

Este documento **no contiene valores** de secretos, variables ni cadenas de conexión, solo sus nombres. El repositorio es público.

## Documentación de Expo consultada (SDK 58)

La versión instalada es `expo` `~58.0.19` (`package.json`; `node_modules/expo` 58.0.19). La primera redacción (2026-10-26) se apoyó en la documentación del SDK 57; el 2026-10-27 (issue #150) se volvieron a consultar estas páginas y la de SDK 58. Las páginas de EAS (`eas/`, `build/`, `build-reference/`, `submit/`, `accounts/`) **no llevan versión de SDK en la dirección** (la de EAS Submit tampoco menciona ningún SDK en el texto); solo la referencia del SDK (`versions/v58.0.0/`) es por versión:

| Tema | Página |
|---|---|
| Índice general y correcciones de Expo | https://docs.expo.dev/llms.txt |
| Versiones y requisitos del SDK 58 | https://docs.expo.dev/versions/v58.0.0/ |
| Referencia de `app.config` del SDK 58 (`android.package`, `android.versionCode`, `version`, `android.googleServicesFile`, `owner`) | https://docs.expo.dev/versions/v58.0.0/config/app/ |
| EAS Submit para Android (primer envío, clave de cuenta de servicio, comandos, CI) | https://docs.expo.dev/submit/android/ |
| Envío manual a Google Play | https://docs.expo.dev/submit/android-manual/ |
| Opciones de `submit` en `eas.json` | https://docs.expo.dev/submit/eas-json/ |
| Referencia de `eas.json` (campos de build y de submit de Android) | https://docs.expo.dev/eas/json/ |
| Versiones de la app (`appVersionSource`, `autoIncrement`, `version` y `versionCode`) | https://docs.expo.dev/build-reference/app-versions/ |
| Formato AAB/APK | https://docs.expo.dev/build-reference/apk/ |
| Variables de entorno en EAS (uso y gestión) | https://docs.expo.dev/eas/environment-variables/usage/ y https://docs.expo.dev/eas/environment-variables/manage/ |
| Tokens de acceso (`EXPO_TOKEN`) | https://docs.expo.dev/accounts/programmatic-access/ |
| EAS Build en CI | https://docs.expo.dev/build/building-on-ci/ |

Limitaciones de la consulta: la página de la referencia de `eas.json` de build (`build/eas-json`) devolvió 404 y se usó `eas/json`. Varias páginas no indican valores por defecto (por ejemplo, de `buildType` o `track`); en esos casos este documento lo dice y no los asume. No se consultó documentación de Google Play Console: lo que se afirma de la consola queda marcado como pendiente de confirmar.

**Qué cambió al volver a consultar con SDK 58 (2026-10-27):**
- La versión instalada pasó de `~57.0.25` a `~58.0.19`.
- Las afirmaciones de este documento sobre EAS Submit (primer envío opcional a mano, pista interna por defecto, `releaseStatus: draft`, clave de la cuenta de servicio y `--non-interactive`), `eas.json` (`track`, `releaseStatus`, `rollout`, `autoIncrement`), AAB/APK, variables de entorno, `EXPO_TOKEN` y la compilación en CI **siguen vigentes**: las páginas coinciden con lo que se registró el 2026-10-26. La de la compilación en CI sigue usando `expo/expo-github-action@v8`.
- La referencia del SDK 58 confirma `android.package`, `android.versionCode` (entero positivo, "requerido por Google Play"), `version`, `android.googleServicesFile` y `owner`. **No indica si esas propiedades cambiaron respecto de SDK 57.**
- **Dato nuevo (SDK 58):** la tabla de versiones indica Node.js "22.13.x", React Native 0.88, React 19.3.0, `compileSdkVersion` 37 y `targetSdkVersion` 36. La página recomienda revisar los requisitos de nivel de API de Google Play; **esos requisitos actuales no se verificaron: PENDIENTE DE CONFIRMAR POR ANGEL.**
- La página `build/eas-json` (404 en la primera consulta) no se volvió a probar.

---

## 1. Objetivo y estado actual verificado

**Objetivo:** definir cómo liberar la app en Google Play de forma controlada y cómo mantener actualizado el backend de producción, sin ejecutar nada todavía.

### 1.1 `eas.json` (verificado en el repo)

| Elemento | Valor actual |
|---|---|
| `cli.version` | `>= 24.8.0` |
| `cli.appVersionSource` | `remote` |
| Perfil `development` | `developmentClient: true`, `distribution: internal` |
| Perfil `preview` | `distribution: internal` |
| Perfil `production` | `autoIncrement: true` |
| `submit.production` | `{}` (vacío: sin `track`, `releaseStatus`, `rollout` ni `serviceAccountKeyPath`) |

Ningún perfil declara `android.buildType`, y la documentación consultada no indica el valor por defecto de `buildType`. Sí dice que "el formato por defecto al compilar apps Android con EAS Build es un Android App Bundle" (`build-reference/apk`) y que `distribution: internal`, `buildType: apk` o `developmentClient: true` producen un APK. Consecuencia: `preview` y `development` generan APK y `production`, AAB. **PROPUESTA:** dejar el perfil `production` como está, y declarar `buildType` explícito solo si se quiere dejar constancia.

### 1.2 `app.config.js` (verificado en el repo)

| Elemento | Valor actual |
|---|---|
| `name` / `slug` | `syscom-mobile` |
| `version` | `1.0.0` |
| `android.package` | `com.syscom.mobile` |
| `android.versionCode` | **No está definido** en el repo (lo gestiona EAS en remoto, ver sección 6) |
| `android.googleServicesFile` | `process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json"` |
| `extra.eas.projectId` | definido |
| `owner` | `elea20` (cuenta de Expo propietaria) |
| Plugins | `expo-router`, `expo-secure-store`, `expo-font`, `expo-web-browser`, `expo-notifications` |

`google-services.json` está en `.gitignore` y no está en el repositorio (verificado con `git ls-files`). Por eso el build de EAS necesita `GOOGLE_SERVICES_JSON`; el comentario de cabecera de `app.config.js` lo explica.

### 1.3 Etiquetas y builds

| Elemento | Estado verificado |
|---|---|
| Etiquetas de Git | **Ninguna** (`git tag` vacío) |
| Releases de GitHub | **Ninguno** (`gh release list` vacío) |
| Builds de EAS registrados | **No se pudo verificar**: la sesión de EAS CLI no tiene login (`eas whoami` → "Not logged in"). PENDIENTE DE CONFIRMAR POR ANGEL (`eas build:list` con la cuenta propietaria) |
| Envíos a Google Play | No hay evidencia en el repo. PENDIENTE DE CONFIRMAR POR ANGEL |
| Workflow de EAS en `.github/workflows/` | **No existe**; solo `ci.yml` (lint, tipos, auditoría y pruebas) |

### 1.4 Pendientes de cuenta (no verificables desde el repo)

- Cuenta de Google Play Console y app creada con el identificador `com.syscom.mobile`: PENDIENTE DE CONFIRMAR POR ANGEL.
- Que la cuenta de Expo `elea20` sea la que usará el equipo para los builds: PENDIENTE DE CONFIRMAR POR ANGEL.

---

## 2. Estrategia de liberación

### 2.1 Comparativa de las 6 estrategias

| Estrategia | Cómo funciona | Ventaja | Inconveniente | ¿Encaja en móvil? |
|---|---|---|---|---|
| **Big bang** | Todos los usuarios reciben la nueva versión a la vez | Simple | Si falla, falla para todos y no hay reversión instantánea | Posible, pero arriesgado |
| **Rolling** | Se actualiza por tandas de servidores o instancias | Reduce el impacto | Pensada para servidores; en móvil el usuario decide cuándo actualizar | Poco |
| **Blue/green** | Dos entornos completos; se conmuta el tráfico | Reversión inmediata | Exige dos versiones de producción a la vez, algo que una tienda de apps no ofrece | No (aplica al backend, no a la app) |
| **Canary** | Se expone la nueva versión a un porcentaje pequeño y se amplía por etapas | Detecta fallos con poco alcance | Requiere observar y decidir en cada etapa | **Sí** (se elige) |
| **Feature flags** | El código se publica apagado y se activa por configuración | Apaga una función sin nueva versión | Requiere infraestructura de flags; no existe hoy | Complemento (no implementado) |
| **A/B** | Dos variantes a grupos distintos para comparar métricas | Decide con datos | Exige mucho tráfico y métricas; su fin es comparar, no reducir riesgo | No es el objetivo |

### 2.2 Estrategia elegida: canary con despliegue por etapas de Google Play

**Por qué en móvil:**
- **No hay reversión instantánea.** Una versión instalada no se puede "devolver" desde el servidor; la corrección es publicar una versión nueva con un `versionCode` mayor, y los usuarios deben actualizarla.
- **No hay dos versiones de producción a la vez.** En la tienda, cada pista (`track`) tiene su versión vigente; por eso blue/green no aplica a la app.
- **Lo que sí se controla es la exposición.** Un despliegue por etapas limita cuántos usuarios reciben la versión mientras se observa.

La documentación de Expo respalda el control de exposición desde EAS Submit: `rollout` es "la fracción inicial de usuarios elegibles para recibir la versión", de 0 a 1, y **solo funciona con `releaseStatus: inProgress`** (`eas/json`). Los valores de `releaseStatus` son `completed`, `draft`, `halted` e `inProgress`. La documentación consultada **no explica** cómo ampliar el porcentaje después de la primera etapa ni cómo pausar; eso se hace en Play Console (PENDIENTE DE CONFIRMAR POR ANGEL, no se consultó la documentación de Google).

### 2.3 Complementos no implementados

- **Feature flags:** no hay ninguno en la app. PROPUESTA, solo si se necesita apagar una función sin publicar una versión nueva.
- **EAS Update (actualizaciones por aire):** no está configurado (`app.config.js` no tiene `updates` ni `runtimeVersion`). Solo cambia código JavaScript; no sustituye una versión en la tienda. Existe una página de despliegues graduales de EAS Update (`https://docs.expo.dev/eas-update/rollouts/`), **que no se consultó a fondo**. No implementado.

---

## 3. Entornos y ramas

| Entorno | Rama | Dónde corre | Perfil de EAS | Estado |
|---|---|---|---|---|
| **Desarrollo** | `develop` (y ramas `feature/`, `fix/`, `test/`, `docs/`) | Expo Go o cliente de desarrollo | `development` | Existe (perfil definido); uso del cliente de desarrollo: verificar en cada equipo |
| **Staging** | `release/sprint-N` | Pista interna de Google Play (`track: internal`) | `production` (el AAB es el mismo que irá a producción) | **PROPUESTA** |
| **Producción** | `main` | Google Play, pista de producción | `production` | **PROPUESTA** |

Notas:
- El perfil `preview` genera un APK de distribución interna (instalable directamente); sirve para probar en dispositivos sin pasar por Google Play. No se usa para la tienda.
- La documentación de EAS Submit dice que `eas submit` crea la primera versión **por defecto en la pista de pruebas internas** (`submit/android`).
- Las variables de entorno de EAS dependen del perfil: si el perfil no declara `environment`, EAS usa `production` para distribución `store`, `development` si `developmentClient` es `true` y `preview` en otro caso (`eas/environment-variables/usage`). Hay que cargar `GOOGLE_SERVICES_JSON` en cada entorno que se vaya a compilar.
- El flujo de ramas del proyecto se mantiene: `release/sprint-N` desde `develop` → PR hacia `main`, con aprobación de la otra persona.

---

## 4. Pipeline de liberación propuesto

Todo lo de esta sección es **PROPUESTA**. No hay workflow de EAS en el repo.

### 4.1 Pasos

1. Se abre el PR de `release/sprint-N` hacia `main`; el CI actual (`Análisis estático`, `Pruebas unitarias`) debe estar en verde.
2. Se compila el AAB de producción con EAS Build:
   - `eas build --platform android --profile production` (la documentación de EAS en CI recomienda `--non-interactive --no-wait`; `build/building-on-ci`).
3. Se envía con EAS Submit:
   - `eas submit --platform android --profile production`, o `eas build --platform android --auto-submit` para enviar justo después del build (`submit/android`).
   - En CI, con `--non-interactive`, se requiere una clave asignada en EAS o `serviceAccountKeyPath` (`submit/android`).
4. La versión llega a la pista elegida; la exposición se amplía por etapas (sección 7).

### 4.2 Primer envío a la tienda

La documentación de Expo **no exige** que el primer envío sea manual. Lo que dice (`submit/android` y `submit/android-manual`):
- "Una subida manual es opcional" y `eas submit` "puede crear la primera versión de la app directamente y, por defecto, en la pista de pruebas internas".
- La app "permanece en estado borrador en Play Console hasta que completes la ficha de la tienda y las tareas de configuración".
- Alternativas: subir la primera versión a mano (guía manual) o poner `releaseStatus: draft` para subir sin desplegar.

**PROPUESTA:** como `submit.production` está vacío y la ficha de la tienda probablemente no está completa, hacer el primer envío con `releaseStatus: draft` o a mano desde Play Console, y automatizar los siguientes. Que la ficha esté completa y que la cuenta tenga los permisos necesarios: PENDIENTE DE CONFIRMAR POR ANGEL.

### 4.3 Cambios que requeriría el pipeline (no se hicieron)

- `eas.json`: completar `submit.production` (por ejemplo `track` y `releaseStatus`; valores permitidos según `eas/json`: `track` production/beta/alpha/internal).
- Workflow en `.github/workflows/` (por ejemplo, manual con `workflow_dispatch`) con `expo/expo-github-action@v8` y el secreto `EXPO_TOKEN`, como en el ejemplo de `build/building-on-ci`. También existen EAS Workflows (`.eas/workflows/`).

Cada cambio requiere su propio issue y PR.

---

## 5. Secretos y credenciales

**Solo nombres.** Nunca valores en el repo, en issues, en PR ni en capturas.

| Nombre | Para qué | Dónde se guarda | Estado |
|---|---|---|---|
| `EXPO_TOKEN` | Autenticar EAS CLI en CI (la documentación recomienda un token de acceso; para acceso limitado, un usuario "Robot" con rol restringido) | Secreto de GitHub (repositorio) | PROPUESTA; token: PENDIENTE DE CONFIRMAR POR ANGEL |
| Clave de la cuenta de servicio de Google Play (archivo JSON) | Que EAS Submit pueda subir a Google Play | En EAS (Credentials > Android > tu app > Service credentials, o `eas credentials --platform android`); alternativa `serviceAccountKeyPath` en CI, que exigiría guardar el archivo como secreto de GitHub y escribirlo en disco al ejecutar | PENDIENTE DE CONFIRMAR POR ANGEL |
| `GOOGLE_SERVICES_JSON` | Archivo de Firebase para Android (notificaciones push); lo lee `app.config.js` | Variable de entorno de EAS de tipo archivo. La documentación de gestión de variables (`eas/environment-variables/manage`) lo muestra creado desde el panel (Project settings > Environment variables); **no documenta un comando para variables de tipo archivo**, aunque el comentario de `app.config.js` menciona `eas env:set`. Verificar | Existencia en EAS: PENDIENTE DE CONFIRMAR POR ANGEL |

Notas:
- La documentación de EAS indica tres niveles de visibilidad para variables: plain text, sensitive y secret. "Secret" es para valores que no deben salir de los servidores de EAS (`eas/environment-variables/manage`).
- Tratar el token como una contraseña: si se filtra, se revoca desde la página de tokens de acceso (`accounts/programmatic-access`).
- `google-services.json` y `.env` ya están en `.gitignore`.
- La clave pública de Stripe (`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`) y `EXPO_PUBLIC_API_URL` se incluyen en el paquete de la app por ser `EXPO_PUBLIC_*`; **no** son secretos. La clave secreta de Stripe **no** debe ir nunca en la app (lo indica `.env.example`).

---

## 6. Versionado

**PROPUESTA:** SemVer (`MAJOR.MINOR.PATCH`) con etiqueta de Git `vX.Y.Z` en `main` al fusionar un release.

| Concepto | Dónde | Cómo se gestiona |
|---|---|---|
| `version` (versión visible, `versionName`) | `app.config.js` (`1.0.0` hoy) | A mano, en el PR del release. Las páginas consultadas no coinciden del todo: `build-reference/app-versions` dice que "`autoIncrement` no admite la opción `version`" y `eas/json` lista `"version"` como valor de `autoIncrement` en Android. Este plan no usa `autoIncrement` para `version` |
| `android.versionCode` | Remoto en EAS (`appVersionSource: remote`) | Automático por `autoIncrement: true` en el perfil `production` |
| Etiqueta de Git | `main` | `vX.Y.Z` coincidente con `version` |

Según `build-reference/app-versions`: con `remote`, EAS guarda la versión de build y, con `autoIncrement`, la incrementa en cada build; el valor remoto parte del valor del proyecto local (su ejemplo: `versionCode` 1 pasa a 2). El proyecto **no define** `android.versionCode`. La documentación (consulta del 2026-10-27) dice que, si app config no define versiones de build, **la versión remota empieza en 1**. El valor que hay hoy en EAS, si ya hubo builds: PENDIENTE DE CONFIRMAR POR ANGEL (`eas build:version:get` o el panel de EAS).

### Conflicto: versión 1.0.0 de la app contra el plan 0.x

- `app.config.js` declara `version: "1.0.0"`.
- `docs/pruebas/sprint-3.md` (línea 171) planea el release del Sprint 3 con la etiqueta `v0.3.0`, es decir, una numeración 0.x por sprint.
- Si se etiqueta `v0.N.0`, la etiqueta no coincide con la `version` de la app (`1.0.0`).

**Decisión: PENDIENTE DE CONFIRMAR POR ANGEL.** Se decide en la entrega final. Este documento no la resuelve ni propone una opción.

---

## 7. Canary por etapas

Todo es **PROPUESTA**. Ninguna etapa se ha ejecutado. Los porcentajes y tiempos son punto de partida para discutir, no mediciones.

| Etapa | Exposición | Permanencia | Criterio para avanzar | Criterio para pausar |
|---|---|---|---|---|
| 1. Interna | Pista interna (testers del equipo) | Hasta completar la lista de la sección 9 | Instalación y flujos principales probados en un dispositivo; lista de verificación completa | Fallo al instalar o abrir, o un flujo principal roto |
| 2. 5 % | `releaseStatus: inProgress`, `rollout: 0.05` | A definir (por ejemplo, 2–3 días) | Sin fallos graves reportados y sin cierres inesperados observados | Cierres inesperados, fallos de compra/pago o de inicio de sesión |
| 3. 20 % | Ampliar en Play Console | A definir | Mismo criterio | Mismo criterio |
| 4. 50 % | Ampliar en Play Console | A definir | Mismo criterio | Mismo criterio |
| 5. 100 % | Despliegue completo | — | Fin del canary | — |

Cómo se amplía el porcentaje y cómo se pausa: se hace en Play Console; PENDIENTE DE CONFIRMAR POR ANGEL (no se consultó la documentación de Google). Dónde se observan los cierres inesperados y los comentarios: PENDIENTE DE CONFIRMAR POR ANGEL; hoy el repo no integra ninguna herramienta de monitoreo de fallos.

**Si algo falla:**
1. **Pausar** el despliegue (no ampliar el porcentaje; marcarlo como detenido en Play Console).
2. **Corregir** en una rama `fix/<n°issue>-nombre` desde `develop`, con su prueba unitaria y PR aprobado por la otra persona.
3. **Publicar una versión nueva** con `versionCode` mayor (no se puede reemplazar una versión ya publicada) y reiniciar el canary desde la etapa 1.

**Límite de significancia:** con pocos usuarios, los porcentajes tienen poca significancia. El 5 % de una base pequeña puede ser una o dos personas, así que "sin fallos" puede significar solo que nadie lo usó. Si la base es chica, los criterios deberían apoyarse más en las pruebas de dispositivo y en la comunicación directa con los usuarios de prueba que en porcentajes. El tamaño actual de la base de usuarios: PENDIENTE DE CONFIRMAR POR ANGEL.

---

## 8. Backend en producción

El backend lo despliega y administra Angel. Los datos de esta sección vienen de capturas de Railway y GitHub y del análisis del backend aportados por Angel el 2026-10-26, y de la actualización que Angel dictó el 2026-10-27. **Nada se reverificó** desde este repositorio; lo no confirmado queda como PENDIENTE.

### 8.1 Estado actual

| Dato | Valor |
|---|---|
| Plataforma | Railway |
| Origen del despliegue | `AngeloMtz/syscom-backend` (fork privado de `LAHH18/syscom-backend`), rama `main` |
| Despliegue automático | Sí, al hacer push |
| "Wait for CI" | **Desactivado**: Railway despliega sin esperar a que pase el CI. Sigue pendiente activarlo |
| Estado del fork | El 2026-10-26 estaba en `b053447`, 27 commits atrás de `LAHH18/syscom-backend:main` y con 0 commits propios. **El 2026-10-27 se sincronizó** con `LAHH18/syscom-backend:main` (según Angel) |
| Despliegue en Railway | **Activo con el commit del chatbot (Groq)** (según Angel, 2026-10-27) |
| Base de datos (Neon) | Se creó un respaldo como rama de Neon; después se aplicaron `propuesta_aditiva.sql` y un script de permisos de secuencias (sección 8.3) |
| Suscripción de Railway | **Renovada** (según Angel, 2026-10-27) |
| Variables nuevas | **Ya estaban cargadas** (solo nombres en 8.2) |

### 8.2 Riesgo: producción desactualizada (estado al 2026-10-27)

El 2026-10-26 se identificó que producción podía estar **desactualizada respecto del backend real**. Qué lo hacía delicado y cómo está hoy:

| Punto | Situación original (2026-10-26) | Estado (2026-10-27, según Angel) |
|---|---|---|
| Tablas nuevas | El `schema.prisma` nuevo agrega tablas de push, chatbot, promociones y recomendaciones | `propuesta_aditiva.sql` aplicado en producción |
| Tablas eliminadas | El schema nuevo elimina `ventas_simuladas` y `restocks` | **Siguen abiertas**: el borrado queda para el final, con respaldo |
| Migraciones | Solo hay una migración baseline y el despliegue no aplica cambios de schema | Los cambios de schema se aplicaron a mano con SQL; el despliegue sigue sin aplicarlos |
| Variables nuevas (solo nombres) | `GROQ_API_KEY`, `CHATBOT_MODEL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Ya estaban cargadas |
| Ruta de usuarios | `/api/users` pasó a `/api/admin/users` | **Abierto**: confirmar `/users/activate` con Luis |
| Despliegue sin CI | Con auto-deploy y sin "Wait for CI", un push despliega aunque el CI falle | **Abierto**: activar "Wait for CI" |
| Verificación | — | **Pendiente**: pruebas de humo en producción |

**Nota sobre permisos por rol.** El backend usa un cliente de base de datos por rol: `dbPublic`, `dbCustomer`, `dbStaff`, `dbAdmin`, `dbReports` y el dueño. Las tablas y secuencias nuevas deben revisarse con permisos por rol: crear una tabla no basta si el rol que escribe no puede usar su secuencia. Ya se encontró un caso (paso 3 de 8.3).

Verificación (según Angel): tras aplicar los scripts en una **rama de prueba de Neon** (copia de producción), se corrió una consulta **de solo lectura** que comprueba los privilegios de tabla y de secuencia que necesita cada escritura del código nuevo (módulos de reseñas, chatbot, notificaciones, promociones y carrito). Resultado: **0 faltantes**. Precisión: **en producción solo se comprobaron directamente las dos secuencias de `syscom_admin`**; el resto de la comprobación se hizo en la copia.

Huecos anteriores a este despliegue: las secuencias de favoritos, `push_subscriptions` para staff y `suscriptores_boletin`. Según el análisis del código, ningún rol sin permiso las usa. **Se dejan como están; quedan fuera de alcance.**

### 8.3 Procedimiento de actualización

El orden importa. La columna "Estado" distingue lo ejecutado (según Angel) de lo que sigue como PROPUESTA.

| # | Paso | Detalle | Estado |
|---|---|---|---|
| 1 | **Respaldo de Neon** | Antes de tocar nada, respaldo de la base de datos. Se creó como **rama de Neon** | **Ejecutado el 2026-10-27** |
| 2 | **SQL aditivo primero** | Aplicar, antes del código nuevo, solo los cambios que **agregan** (tablas de push, chatbot, promociones y recomendaciones), con `propuesta_aditiva.sql`. Así el código viejo sigue funcionando y el nuevo encuentra las tablas. Se aplicó **con respaldo previo y confirmación explícita** | **Ejecutado el 2026-10-27** |
| 3 | **Permisos de secuencias** | Otorgar `USAGE` y `SELECT` sobre las secuencias de las tablas nuevas a los roles que escriben. En este caso, `syscom_admin` en `expo_push_tokens` y `promocion_segmentos`. Se aplicó con un script de permisos de secuencias, con respaldo previo y confirmación explícita | **Ejecutado el 2026-10-27** |
| 4 | **Variables antes del despliegue** | Cargar en Railway las variables nuevas de 8.2 (los valores nunca se escriben en el repo) | **Ya estaban cargadas** |
| 5 | **Revisión de migraciones y borrado** | Revisar el diff de `schema.prisma`. `ventas_simuladas` y `restocks` se eliminan en el schema nuevo; como el despliegue no aplica cambios de schema, el borrado es una acción manual aparte. Va **al final**, con respaldo y tras verificar | **Pendiente** |
| 6 | **Sincronizar el fork** | Traer `LAHH18/syscom-backend:main` al fork (avance directo). Esto dispara el auto-deploy de Railway | **Ejecutado el 2026-10-27**; despliegue activo |
| 7 | **Verificación** | Pruebas de humo en producción de los endpoints clave: autenticación, catálogo, pedidos, pago y webhook, push y chatbot. Confirmar `/users/activate` con Luis y que ningún cliente use `/api/users` | **Pendiente** |
| 8 | **Plan de vuelta atrás** | Si falla: volver al despliegue anterior en Railway; el SQL aditivo no afecta al código viejo, así que no hace falta deshacerlo. Si se eliminaron tablas, restaurar desde la rama de respaldo de Neon. Los detalles de reversión en Railway: PENDIENTE DE CONFIRMAR POR ANGEL | PROPUESTA (no se ha necesitado) |

Mejora relacionada: activar "Wait for CI" en Railway para que un CI en rojo impida el despliegue. Sigue **pendiente**; decisión de Angel.

### 8.4 Suscripción

La suscripción de Railway fue **renovada** (según Angel, 2026-10-27). Fecha del próximo vencimiento: PENDIENTE DE CONFIRMAR POR ANGEL.

---

## 9. Lista de verificación previa a cada release

- [ ] CI en verde en el PR de `release/sprint-N` hacia `main` ("Análisis estático" y "Pruebas unitarias").
- [ ] PR del release aprobado por la **otra** persona del equipo.
- [ ] Evidencia de pruebas en `docs/pruebas/sprint-N.md`, con la validación manual pendiente resuelta o declarada.
- [ ] `version` en `app.config.js` y etiqueta `vX.Y.Z` coherentes (según la decisión de la sección 6).
- [ ] Build de producción (AAB) generado con el perfil `production`.
- [ ] **Build de producción probado en un dispositivo** antes de ampliar el despliegue (el APK de `preview` no sustituye esta prueba).
- [ ] `GOOGLE_SERVICES_JSON` disponible en el entorno de EAS usado por el build.
- [ ] Backend de producción compatible con la versión de la app (sección 8).
- [ ] Sin secretos ni `.env` en los commits.

---

## 10. Riesgos y pendientes

| # | Riesgo o pendiente | Responsable | Estado |
|---|---|---|---|
| 1 | Producción del backend desactualizada (el fork estaba 27 commits atrás el 2026-10-26) | @AngeloMtz | Mitigado el 2026-10-27: fork sincronizado y despliegue activo con el commit del chatbot (Groq). Falta verificar con pruebas de humo (fila 15) |
| 2 | Railway despliega sin esperar al CI ("Wait for CI" desactivado) | @AngeloMtz | Abierto; PROPUESTA de activarlo |
| 3 | El despliegue no aplica cambios de schema; solo hay una migración baseline. Borrado de `restocks` y `ventas_simuladas` | @AngeloMtz | SQL aditivo aplicado el 2026-10-27 con respaldo previo. **Abierto:** el borrado va al final y con respaldo |
| 4 | Variables nuevas del backend | @AngeloMtz | Cerrado: ya estaban cargadas (según Angel, 2026-10-27) |
| 5 | Cambio de ruta `/api/users` → `/api/admin/users` | @AngeloMtz y @LAHH18 | Abierto: confirmar `/users/activate` con Luis; verificar que ningún cliente use la ruta vieja |
| 6 | Suscripción de Railway pendiente de renovar | @AngeloMtz | Cerrado: renovada (según Angel, 2026-10-27). Próximo vencimiento: PENDIENTE DE CONFIRMAR POR ANGEL |
| 7 | Conflicto entre `version` 1.0.0 y el plan 0.x | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL (se decide en la entrega final) |
| 8 | No hay etiquetas ni releases en el repo | @AngeloMtz | Abierto |
| 9 | Builds de EAS y envíos a Google Play no verificados (sin login en EAS CLI) | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL |
| 10 | Cuenta de Google Play, ficha de la tienda y clave de la cuenta de servicio | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL |
| 11 | `submit.production` vacío y sin workflow de EAS en el repo | @AngeloMtz y @LAHH18 | Abierto; requiere issue y PR propios |
| 12 | Valor actual de `versionCode` remoto en EAS (la documentación dice que empieza en 1 si app config no lo define; no se sabe si ya hubo builds) | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL |
| 13 | `GOOGLE_SERVICES_JSON` en EAS: existencia y entornos donde está cargada | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL |
| 14 | Base de usuarios pequeña: los porcentajes del canary son poco significativos | @AngeloMtz | Abierto; tamaño de la base por confirmar |
| 15 | Pruebas de humo en producción tras el despliegue | @AngeloMtz | Abierto |
| 16 | Permisos por rol de las tablas y secuencias nuevas (el backend usa un cliente de base de datos por rol) | @AngeloMtz | Cerrado (según Angel). Consulta de solo lectura en una rama de prueba de Neon (copia de producción): 0 faltantes. En producción solo se comprobaron directamente las dos secuencias de `syscom_admin`. Huecos anteriores (secuencias de favoritos, `push_subscriptions` para staff, `suscriptores_boletin`) no los usa ningún rol sin permiso según el análisis del código; se dejan como están, fuera de alcance |
