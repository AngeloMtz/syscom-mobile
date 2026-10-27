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

## Documentación de Expo consultada (SDK 57)

La versión instalada es `expo` `~57.0.25` (`package.json`; `node_modules/expo` 57.0.25). Se consultó el 2026-10-26:

| Tema | Página |
|---|---|
| Índice general y correcciones de Expo | https://docs.expo.dev/llms.txt |
| Existencia de la documentación de SDK 57 | https://docs.expo.dev/versions/v57.0.0/ |
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

Según `build-reference/app-versions`: con `remote`, EAS guarda la versión de build y, con `autoIncrement`, la incrementa en cada build; el valor remoto parte del valor del proyecto local (su ejemplo: `versionCode` 1 pasa a 2). El proyecto **no define** `android.versionCode`; qué valor inicial toma EAS en ese caso no está en la documentación consultada. PENDIENTE DE CONFIRMAR POR ANGEL (`eas build:version:get` o el panel de EAS).

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

El backend lo despliega y administra Angel. Los datos de esta sección vienen de capturas de Railway y GitHub y del análisis del backend aportados por Angel el 2026-10-26; **no se reverificaron** desde este repositorio.

### 8.1 Estado actual

| Dato | Valor |
|---|---|
| Plataforma | Railway |
| Origen del despliegue | `AngeloMtz/syscom-backend` (fork privado de `LAHH18/syscom-backend`), rama `main` |
| Despliegue automático | Sí, al hacer push |
| "Wait for CI" | **Desactivado**: Railway despliega sin esperar a que pase el CI |
| Estado del fork | En el commit `b053447`; es un avance directo de `LAHH18/syscom-backend:main`, con 0 commits propios. A la fecha, el fork está **27 commits atrás** de `LAHH18/syscom-backend:main` |

### 8.2 RIESGO: producción puede estar desactualizada

Producción puede estar **desactualizada respecto del backend real**. Lo que lo hace delicado:

- **Faltan funciones que la app móvil usa:** el `schema.prisma` nuevo agrega tablas de push, chatbot, promociones y recomendaciones.
- **El schema nuevo también elimina `ventas_simuladas` y `restocks`.**
- **Solo hay una migración baseline y el despliegue no aplica cambios de schema.** Sincronizar el fork **no** actualiza la base de datos por sí solo.
- **Variables nuevas requeridas** (solo nombres): `GROQ_API_KEY`, `CHATBOT_MODEL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- **La ruta `/api/users` pasó a `/api/admin/users`.**
- **Con auto-deploy y sin "Wait for CI"**, un push al fork despliega de inmediato aunque el CI falle; si faltan variables o tablas, el servicio puede caer.

### 8.3 Procedimiento de actualización (PROPUESTA hasta que se ejecute)

El orden importa. Ningún paso se ha ejecutado.

| # | Paso | Detalle | Estado |
|---|---|---|---|
| 1 | **Respaldo de Neon** | Antes de tocar nada, respaldo de la base de datos. Cómo hacerlo (rama de Neon, volcado u otro): PENDIENTE DE CONFIRMAR POR ANGEL | PROPUESTA |
| 2 | **SQL aditivo primero** | Aplicar a mano, antes del código nuevo, solo los cambios que **agregan** (tablas de push, chatbot, promociones y recomendaciones). Así, el código viejo sigue funcionando y el nuevo encuentra las tablas | PROPUESTA |
| 3 | **Variables antes del despliegue** | Cargar en Railway las variables nuevas de 8.2 (solo nombres en la documentación; los valores nunca se escriben en el repo). | PROPUESTA |
| 4 | **Revisión de migraciones** | Revisar el diff de `schema.prisma` y confirmar qué cambios destructivos hay (`ventas_simuladas` y `restocks` se eliminan). Decidir si esas tablas se eliminan ahora, más tarde o nunca (la eliminación va **al final**, solo con respaldo y tras verificar). Como el despliegue no aplica cambios de schema, la eliminación es una acción manual aparte | PROPUESTA |
| 5 | **Sincronizar el fork** | Traer `LAHH18/syscom-backend:main` al fork (es un avance directo, sin conflictos esperados). Esto dispara el auto-deploy de Railway | PROPUESTA |
| 6 | **Verificación** | Comprobar el servicio arriba y los endpoints clave: autenticación, catálogo, pedidos, pago y webhook, push y chatbot. La ruta `/api/admin/users` sustituye a `/api/users`; confirmar que ningún cliente usa la ruta vieja. | PROPUESTA |
| 7 | **Plan de vuelta atrás** | Si falla: volver al despliegue anterior en Railway (revertir al despliegue previo); el SQL aditivo no afecta al código viejo, así que no hace falta deshacerlo. Si se eliminaron tablas, restaurar desde el respaldo del paso 1. Los detalles de reversión en Railway: PENDIENTE DE CONFIRMAR POR ANGEL | PROPUESTA |

Mejora relacionada (no se hace aquí): activar "Wait for CI" en Railway para que un CI en rojo impida el despliegue. PROPUESTA; decisión de Angel.

### 8.4 Suscripción pendiente

La suscripción de **[servicio]** está pendiente de renovar **[fecha por confirmar]**. Qué servicio es y la fecha: **PENDIENTE DE CONFIRMAR POR ANGEL.** Si vence antes de la liberación, afecta a la disponibilidad del backend o de la base de datos.

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
| 1 | Producción del backend puede estar desactualizada: el fork está 27 commits atrás | @AngeloMtz | Abierto; procedimiento de la sección 8.3 sin ejecutar |
| 2 | Railway despliega sin esperar al CI ("Wait for CI" desactivado) | @AngeloMtz | Abierto; PROPUESTA de activarlo |
| 3 | El despliegue no aplica cambios de schema; solo hay una migración baseline | @AngeloMtz | Abierto; SQL aditivo manual (PROPUESTA) |
| 4 | Variables nuevas del backend por cargar en Railway | @AngeloMtz | Abierto; PENDIENTE DE CONFIRMAR POR ANGEL |
| 5 | Cambio de ruta `/api/users` → `/api/admin/users` | @AngeloMtz y @LAHH18 | Abierto; verificar que ningún cliente use la ruta vieja |
| 6 | Suscripción de [servicio] pendiente de renovar [fecha por confirmar] | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL |
| 7 | Conflicto entre `version` 1.0.0 y el plan 0.x | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL (se decide en la entrega final) |
| 8 | No hay etiquetas ni releases en el repo | @AngeloMtz | Abierto |
| 9 | Builds de EAS y envíos a Google Play no verificados (sin login en EAS CLI) | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL |
| 10 | Cuenta de Google Play, ficha de la tienda y clave de la cuenta de servicio | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL |
| 11 | `submit.production` vacío y sin workflow de EAS en el repo | @AngeloMtz y @LAHH18 | Abierto; requiere issue y PR propios |
| 12 | Valor inicial de `versionCode` remoto sin confirmar (el proyecto no lo define) | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL |
| 13 | `GOOGLE_SERVICES_JSON` en EAS: existencia y entornos donde está cargada | @AngeloMtz | PENDIENTE DE CONFIRMAR POR ANGEL |
| 14 | Base de usuarios pequeña: los porcentajes del canary son poco significativos | @AngeloMtz | Abierto; tamaño de la base por confirmar |
