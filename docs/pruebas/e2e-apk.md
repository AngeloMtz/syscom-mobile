# Reporte de pruebas end-to-end del APK (#20)

- **Fecha de las pruebas:** 2026-10-28
- **Re-prueba:** 2026-11-24, con el APK 1.1.1. El equipo confirmó que los pasos que habían fallado o quedado sin concluir (11 y 12) ya funcionan.
- **Rama:** `test/20-e2e-apk` (desde `develop`)
- **Historia cubierta:** #20 (Pruebas end-to-end y build final)
- **Responsable de pruebas:** @AngeloMtz
- **Origen de los datos:** los resultados los dictó Angel; Claude no ejecutó las pruebas en el dispositivo. Lo que no se dictó está marcado como no probado o sin captura.

## 1. Objetivo

Criterios de aceptación del issue #20:

- Los 3 flujos críticos funcionan sin errores en un dispositivo real.
- Build de APK/TestFlight generado y compartido con los docentes.

Este reporte documenta la prueba del APK de Android en un dispositivo real. El issue no enumera cuáles son los 3 flujos críticos; la guía de 15 pasos de la sección 4 es la que se siguió.

## 2. Build probado

El APK probado viene del build `eea67925` (perfil `preview`, SDK 58.0.0, versión 1.0.0, Android), compilado en el commit `d78afdc`. Ese commit existe en la rama local `fix/154-apk-stripe-r8`, que aún no se fusiona. EAS no reporta la rama del build; se deduce del commit.

Builds de Android que devolvió `eas build:list` (los tres, todos del 2026-10-28):

| Build | Perfil | Estado | Fecha (UTC) | Commit | Causa del fallo (ya conocida) |
|---|---|---|---|---|---|
| `76bda621` | preview | FALLÓ | 10:16 | `7e023ce` | En la tarea de Gradle `lintVitalAnalyzeRelease` del módulo de Stripe no se resolvía `play-services-tapandpay`, que arrastra la dependencia `compileOnly` `stripe-android-issuing-push-provisioning` |
| `9f763743` | preview | FALLÓ | 10:30 | `7e023ce` | `:app:minifyReleaseWithR8` falló por clases ausentes `com.stripe.android.pushProvisioning.*` (dependencia `compileOnly` de `@stripe/stripe-react-native` 0.81.0, función que el proyecto no usa). Ya excluía el lint con `-x lintVitalAnalyzeRelease`, pero ese cambio de `eas.json` estaba solo en el árbol de trabajo, sin commit |
| `eea67925` | preview | OK (FINISHED) | 18:27 | `d78afdc` | — |

El commit `d78afdc` (issue #154) añade la regla `-dontwarn com.stripe.android.pushProvisioning.**` mediante `expo-build-properties` y deja en `eas.json` el `gradleCommand` con `-x lintVitalAnalyzeRelease` para el perfil `preview`. EAS no indica cuál de los dos cambios fue decisivo para que el build terminara.

## 3. Dispositivo

- Samsung Galaxy A16, Android 16.
- APK instalado desde el archivo (aparece como "Descargada desde Mis archivos" en la información de la aplicación, [e20-00-info-app](evidencia/sprint-5/e20/e20-00-info-app.jpeg)).
- Cliente de prueba (cuenta de prueba de Angel). Pago con Stripe en modo prueba y la tarjeta de prueba `4242 4242 4242 4242`.

## 4. Pasos y resultados

| Paso | Qué se hizo | Resultado | Captura | Observaciones |
|---|---|---|---|---|
| 1 | Primer arranque y permiso de notificaciones | OK | [primer arranque](evidencia/sprint-5/e20/e20-01-primer-arranque.jpeg), [permiso](evidencia/sprint-5/e20/e20-01-primer-arranque-notificacion.jpeg) | |
| 2 | Inicio de sesión | OK | [login](evidencia/sprint-5/e20/e20-02-login-exitoso.jpeg) | |
| 3 | Detalle de producto | OK | [detalle](evidencia/sprint-5/e20/e20-03-detalle-producto.jpeg) | |
| 4 | Carrito | OK | [carrito](evidencia/sprint-5/e20/e20-04-carrito.jpeg) | |
| 5 | Pago con Stripe | OK con observación (corregida después en el backend; ver sección de observaciones) | [pago](evidencia/sprint-5/e20/e20-05-pago-stripe.jpeg) | Stripe en modo prueba, tarjeta `4242 4242 4242 4242`. Se cobraron $8,200.00 (ver observación a) |
| 6 | Pedido confirmado | OK con observación (corregida después en el backend; ver sección de observaciones) | [pedido](evidencia/sprint-5/e20/e20-06-pedido-confirmado.jpeg), [notificación](evidencia/sprint-5/e20/e20-06-pedido-confirmado-notificacion.jpeg) | Pedido #13 (folio SYS-000013) |
| 7 | Mis pedidos | OK | [mis pedidos](evidencia/sprint-5/e20/e20-07-mis-pedidos.jpeg) | |
| 8 | App cerrada | OK | Sin captura | Es preparación del paso 9, no lleva captura |
| 9 | Acción en el panel de administración | OK | [panel](evidencia/sprint-5/e20/e20-08-accion-admin.png) | Angel marcó el pedido #13 como Entregado desde el panel de administración |
| 10 | Notificación recibida | OK | [notificación](evidencia/sprint-5/e20/e20-09-notificacion-recibida.jpeg) | "Pedido #13: Entregado" a las 11:10 p. m. La notificación llegó con la app cerrada y con la app abierta |
| 11 | Tocar la notificación | **OK** (re-prueba 2026-11-24) | [app abierta](evidencia/sprint-5/e20/e20-10-notificacion-abre-app.jpeg) | El 2026-10-28 la captura no era concluyente (la app a las 10:58 y la notificación a las 11:10). En la re-prueba se confirmó que al tocar la notificación la app abre |
| 12 | AR ("Ver en tu espacio") | **OK** (re-prueba 2026-11-24) | Sin captura | El 2026-10-28 falló en el Galaxy A16. En la re-prueba ya funciona (sección 5) |
| 13 | Reseña | OK | [reseña](evidencia/sprint-5/e20/e20-12-resena.jpeg) | La captura es el formulario "Escribir reseña" de Lenovo ThinkPad X1 Carbon; no muestra el envío |
| 14 | Chatbot | OK | [chatbot](evidencia/sprint-5/e20/e20-13-chatbot.jpeg) | Consulta sobre productos de la marca HP |
| 15 | Información de la app | OK | [info de la app](evidencia/sprint-5/e20/e20-00-info-app.jpeg) | Versión 1.0.0 |

Resumen de la prueba del 2026-10-28: 11 pasos OK, 2 OK con observación (5 y 6, corregidas después en el backend), 1 OK sin captura concluyente (11) y 1 FALLÓ (12).

**Resumen tras la re-prueba del 2026-11-24: los 15 pasos OK.**

## 5. Paso 12: AR (falló el 2026-10-28, corregido)

- **Síntoma (dictado por Angel):** en el Samsung Galaxy A16 de Angel, al tocar "Ver en tu espacio" la pantalla no abre y la app regresa a la pantalla anterior.
- **Dato adicional (dictado por Angel):** a Luis, que usa iPhone, le funcionó. Ese dato no lo verificó Angel ni Claude, y no se conoce el método de prueba ni el modelo.
- **Estado (actualizado el 2026-11-12): limitación del dispositivo.** En Android, "Ver en tu espacio" abre el servicio de realidad aumentada de Google (Scene Viewer, [selectors.ts:46](../../src/features/ar/selectors.ts#L46)), y ese servicio se cierra ("Google continúa fallando") al abrir el modelo. En una prueba posterior (2026-11-09, app de Google 17.70.11) también ocurrió con los modelos de ejemplo de Google, así que no dependía de SYSCOM.
- **Estado (actualizado el 2026-11-24): funciona.** En la re-prueba con el APK 1.1.1, "Ver en tu espacio" abre la realidad aumentada correctamente.

## 6. Observaciones

Hechos dictados por Angel. Las observaciones a) y b) se vieron durante la prueba del 2026-10-28; el estado actual lo dictó Angel el 2026-10-29.

- **a) Precio con promoción en la compra: CORREGIDO.** En el detalle del producto (Lenovo ThinkPad X1 Carbon) se mostró el precio con la promoción vigente (10 %, $7,380.00), pero el carrito, el pago de Stripe y el pedido confirmado cobraron $8,200.00 (precio base). Capturas de la prueba original: [detalle](evidencia/sprint-5/e20/e20-03-detalle-producto.jpeg), [carrito](evidencia/sprint-5/e20/e20-04-carrito.jpeg), [pago](evidencia/sprint-5/e20/e20-05-pago-stripe.jpeg) y [pedido](evidencia/sprint-5/e20/e20-06-pedido-confirmado.jpeg). Se corrigió en el backend y el arreglo está desplegado en producción. Angel verificó con el APK que el carrito, el pago de Stripe y el pedido coinciden. Sin captura de la verificación.
- **b) Repetición con otra promoción vigente: CORREGIDO.** Con otra promoción vigente, en web y móvil se veía en el catálogo y el detalle, pero no en el carrito ni en el pago. Con el mismo arreglo, Angel verificó que al activar o desactivar una promoción en el panel el cambio se refleja en el carrito y en el pago. Sin captura.
- **c) Promoción vencida con el interruptor activo: CORREGIDO.** Una promoción vencida por fecha pero con el interruptor activo seguía apareciendo en el catálogo y el detalle (web y móvil), mientras el panel de administración la marcaba "Expirada". El equipo confirmó la corrección el 2026-11-12. Sin captura.
- **d) Descuento en el carrito de la app móvil: CORREGIDO.** El carrito no mostraba la etiqueta de descuento ni el precio original tachado. Se agregó en #163 (PR #164).

## 7. Capturas

Las capturas que al principio se retuvieron (`e20-02-login-exitoso`, `e20-06-pedido-confirmado-notificacion`, `e20-08-accion-admin` y `e20-10-notificacion-abre-app`) ya están publicadas en `evidencia/sprint-5/e20/` y enlazadas en la sección 4.

## 8. Limitaciones conocidas

- iOS no se probó: no hay build de iOS y requiere cuenta de pago de Apple. El criterio del #20 dice APK/TestFlight y el APK cumple.

Resueltas desde la prueba del 2026-10-28:
- La AR en Android ya funciona (sección 5).
- La app ya trae ícono propio (#158).
- Mi cuenta ya no muestra las opciones sin desarrollar (Cambio de contraseña, 2FA, Métodos de pago, Facturación, Aportaciones y Ayuda): solo aparecen las que funcionan ([profile/index.tsx](../../src/app/profile/index.tsx)).

## 9. Pendiente

Nada pendiente de esta prueba. El APK firmado de la versión 1.1.1 está disponible en EAS y en la pista de pruebas internas de Google Play.

## 10. Seguimiento de errores en Release

Errores encontrados en el APK Release (perfil `preview`, compilado con `assembleRelease`) y en sus builds, con su estado al 2026-11-24. Todos están corregidos.

| ID | Encontrado | Hallazgo | Dónde | Estado | Corrección |
|---|---|---|---|---|---|
| E1 | 2026-10-28 | El build Release fallaba en `lintVitalAnalyzeRelease` por una dependencia `compileOnly` de Stripe | Build | **Corregido** | `-x lintVitalAnalyzeRelease` en `eas.json`: #154 (PR #160) para `preview` y #192 (PR #193) para producción |
| E2 | 2026-10-28 | El build Release fallaba en R8 (`minifyReleaseWithR8`) por clases ausentes de Stripe | Build | **Corregido** | Regla `-dontwarn com.stripe.android.pushProvisioning.**` en `app.config.js`: #154 (PR #160) |
| E3 | 2026-10-28 | El detalle mostraba el precio con promoción, pero el carrito, el pago y el pedido cobraban el precio base (paso 5 y 6) | Backend | **Corregido** | Arreglo en el backend; Angel lo verificó con el APK (observación a) |
| E4 | 2026-10-28 | Con otra promoción vigente, el descuento no llegaba al carrito ni al pago | Backend | **Corregido** | Mismo arreglo que E3 (observación b) |
| E5 | 2026-10-28 | Una promoción vencida con el interruptor activo seguía apareciendo en el catálogo | Backend / panel | **Corregido** | Confirmado por el equipo el 2026-11-12 (observación c) |
| E6 | 2026-10-28 | El carrito no mostraba la etiqueta de descuento ni el precio original | App | **Corregido** | #163 (PR #164) (observación d) |
| E7 | 2026-10-28 | "Ver en tu espacio" no abre la RA en el Samsung Galaxy A16 (paso 12) | Dispositivo | **Corregido** | Funciona en la re-prueba del 2026-11-24 con el APK 1.1.1 (sección 5) |
