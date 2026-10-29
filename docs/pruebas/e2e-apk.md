# Reporte de pruebas end-to-end del APK (#20)

- **Fecha de las pruebas:** 2026-10-28
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
| 2 | Inicio de sesión | OK | Sin captura publicada | La captura `e20-02-login-exitoso` aún muestra datos personales; no se sube hasta que se corrija |
| 3 | Detalle de producto | OK | [detalle](evidencia/sprint-5/e20/e20-03-detalle-producto.jpeg) | |
| 4 | Carrito | OK | [carrito](evidencia/sprint-5/e20/e20-04-carrito.jpeg) | |
| 5 | Pago con Stripe | OK con observación (ver sección de observaciones) | [pago](evidencia/sprint-5/e20/e20-05-pago-stripe.jpeg) | Stripe en modo prueba, tarjeta `4242 4242 4242 4242`. Se cobraron $8,200.00 (ver observación a) |
| 6 | Pedido confirmado | OK con observación (ver sección de observaciones) | [pedido](evidencia/sprint-5/e20/e20-06-pedido-confirmado.jpeg) | Pedido #13 (folio SYS-000013). La captura de la notificación de confirmación (`e20-06-pedido-confirmado-notificacion`) no se publica todavía (ver sección 7) |
| 7 | Mis pedidos | OK | [mis pedidos](evidencia/sprint-5/e20/e20-07-mis-pedidos.jpeg) | |
| 8 | App cerrada | OK | Sin captura | Es preparación del paso 9, no lleva captura |
| 9 | Acción en el panel de administración | OK | Sin captura publicada | Angel marcó el pedido #13 como Entregado desde el panel de administración. La captura `e20-08-accion-admin` no se publica todavía (ver sección 7) |
| 10 | Notificación recibida | OK | [notificación](evidencia/sprint-5/e20/e20-09-notificacion-recibida.jpeg) | "Pedido #13: Entregado" a las 11:10 p. m. La notificación llegó con la app cerrada y con la app abierta |
| 11 | Tocar la notificación | OK según Angel; captura no concluyente | Sin captura publicada | Angel confirma que al tocar la notificación la app abre. No hay captura que lo demuestre: `e20-10-notificacion-abre-app` muestra Inicio a las 10:58 y la notificación del paso 10 es de las 11:10 |
| 12 | AR ("Ver en tu espacio") | **FALLÓ** | Sin captura (`e20-11` no existe) | Ver sección 5 |
| 13 | Reseña | OK | [reseña](evidencia/sprint-5/e20/e20-12-resena.jpeg) | La captura es el formulario "Escribir reseña" de Lenovo ThinkPad X1 Carbon; no muestra el envío |
| 14 | Chatbot | OK | [chatbot](evidencia/sprint-5/e20/e20-13-chatbot.jpeg) | Consulta sobre productos de la marca HP |
| 15 | Información de la app | OK | [info de la app](evidencia/sprint-5/e20/e20-00-info-app.jpeg) | Versión 1.0.0 |

Resumen: 11 pasos OK (1, 2, 3, 4, 7, 8, 9, 10, 13, 14 y 15), 2 OK con observación (5 y 6), 1 OK según Angel con captura no concluyente (11), 1 FALLÓ (12) y 0 NO PROBADO.

## 5. Fallo del paso 12: AR

- **Síntoma (dictado por Angel):** en el Samsung Galaxy A16 de Angel, al tocar "Ver en tu espacio" la pantalla no abre y la app regresa a la pantalla anterior.
- **Dato adicional (dictado por Angel):** a Luis, que usa iPhone, le funcionó. Ese dato no lo verificó Angel ni Claude, y no se conoce el método de prueba ni el modelo.
- **Causa:** NO identificada.
- **Hipótesis NO verificada:** en Android el visor depende de Google Scene Viewer / servicios de Google para RA ([selectors.ts:46](../../src/features/ar/selectors.ts#L46)). Angel está revisando si esos servicios están en su teléfono.

## 6. Observaciones

Hechos dictados por Angel. La causa NO se ha analizado; se abrirá un issue aparte.

- **a) Precio con promoción en la compra.** En el detalle del producto (Lenovo ThinkPad X1 Carbon) se mostró el precio con la promoción vigente (10 %, $7,380.00), pero el carrito, el pago de Stripe y el pedido confirmado cobraron $8,200.00 (precio base). Capturas: [detalle](evidencia/sprint-5/e20/e20-03-detalle-producto.jpeg), [carrito](evidencia/sprint-5/e20/e20-04-carrito.jpeg), [pago](evidencia/sprint-5/e20/e20-05-pago-stripe.jpeg) y [pedido](evidencia/sprint-5/e20/e20-06-pedido-confirmado.jpeg).
- **b) Repetición con otra promoción vigente.** Angel lo repitió después con otra promoción vigente: en web y móvil se ve en el catálogo y el detalle, pero no en el carrito ni en el pago. Sin captura.
- **c) Promoción vencida con el interruptor activo.** Una promoción vencida por fecha pero con el interruptor activo sigue apareciendo en el catálogo y el detalle (web y móvil), mientras el panel de administración la marca "Expirada". Sin captura.

## 7. Capturas retenidas

Estas capturas no se incluyen en el commit de evidencia:

| Archivo | Motivo |
|---|---|
| `e20-02-login-exitoso` | Todavía muestra el nombre completo y parte del correo |
| `e20-06-pedido-confirmado-notificacion` | Quedan restos legibles a medias del correo en la notificación de Gmail |
| `e20-08-accion-admin` | Muestra nombre, correo y teléfono del cliente, el nombre del administrador y el identificador del pago de Stripe; además el estado del pedido sigue en "En camino" con "Entregado" solo seleccionado en la lista, es decir, antes de pulsar "Actualizar" |
| `e20-10-notificacion-abre-app` | No es evidencia de que la app abra al tocar la notificación: es de otra hora que la notificación (ver paso 11) |

## 8. Limitaciones conocidas

Dictadas por Angel:

- iOS no se probó: no hay build de iOS y requiere cuenta de pago de Apple. El criterio del #20 dice APK/TestFlight y el APK cumple.
- La AR falla en el dispositivo de Angel (sección 5).
- La app no trae icono propio (se ve el predeterminado).
- En Mi cuenta hay secciones sin desarrollar: Cambio de contraseña, Autenticación 2FA y Ayuda (faltan por desarrollar), y Métodos de pago/Facturación y Aportaciones (también sin desarrollar, no necesarias).

Comportamiento en el código de esas seis opciones: están declaradas con `disabled` en [profile/index.tsx](../../src/app/profile/index.tsx) (Cambiar contraseña, línea 78; Autenticación 2FA, 79; Métodos de pago, 109; Facturación, 110; Aportaciones, 128; Ayuda, 129). Al tocarlas no pasa nada: no abren una pantalla "Próximamente" ni fallan. El botón queda deshabilitado, atenuado, y el lector de pantalla anuncia "Esta sección estará disponible próximamente" ([DashboardOption.tsx:25-36](../../src/features/profile/components/DashboardOption.tsx#L25-L36)).

Criterios de aceptación: ninguna de las seis aparece como criterio en el cuerpo de los issues #1 a #20 (revisado con `gh issue view`; no se revisaron comentarios ni el tablero). El #3 habla de pantallas de login y registro, no de cambio de contraseña ni 2FA en el perfil.

## 9. Pendiente

- Compartir el APK con los docentes: lo decide y hace Angel. El segundo criterio del #20 no está completo hasta entonces.
- PR del issue #154 (build): en espera de que se fusione el #153.
- Pasos opcionales sin probar.
- Capturas retenidas de la sección 7, a reemplazar o confirmar.
