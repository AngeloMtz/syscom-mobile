# Reporte de pruebas de aceptación — Sprint 5 (#43)

- **Fecha de las pruebas:** 2026-10-31
- **Rama:** `test/43-aceptacion-sprint-5` (desde `origin/develop`)
- **Historias cubiertas:** #19 y #20 (más los cambios del sprint que el equipo decidió validar en el APK final)
- **Responsable de pruebas:** @AngeloMtz
- **Origen de los datos:** Angel ejecutó las pruebas en su Samsung Galaxy A16 (Android 16) el 2026-10-31 y dictó los resultados. Claude no ejecutó nada en el dispositivo. Todo lo que no se dictó está marcado como no probado o sin captura. Las capturas del repositorio llevan hora de entre las 2:01 y las 2:11 a. m.

Este reporte complementa [sprint-5.md](sprint-5.md): allí están el análisis estático, las pruebas unitarias y la lista de criterios que quedó como PENDIENTE DE VALIDACIÓN MANUAL; aquí están los resultados de esa validación. La guía de 15 pasos del #20 es la de [e2e-apk.md](e2e-apk.md), repetida con el APK final.

## Planeación: trazabilidad historia → funciones → pruebas
No aplica a este reporte: es solo de aceptación manual. La trazabilidad de las funciones del Sprint 5 está en [sprint-5.md](sprint-5.md).

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | No aplica en este reporte (ver [sprint-5.md](sprint-5.md)) | #42 |
| Unitarias | No aplica en este reporte (ver [sprint-5.md](sprint-5.md)) | #41 |
| Integración | No aplica | — |
| Rendimiento | No aplica | — |
| Aceptación (manual) | #19: 5/5 OK. #20: 14/15 pasos OK (4 de ellos solo según Angel, sin captura) y 1 que no funciona (AR). Cambios del sprint: 10/10 OK (3 con reservas, ver sección 4.3) | #43 |

Conteo del #20 (15 pasos): 10 con captura (1, 2, 3, 4, 6, 7, 10, 13, 14 y 15), 4 OK según Angel sin captura publicada (5, 8, 9 y 11), 1 que no funciona (12).

## 2. Build probado

| Dato | Valor |
|---|---|
| ID del build | `b4efc5c0-e687-4902-b04d-ccfa8be63785` |
| Plataforma, perfil | Android, `preview`, SDK 58.0.0, versión 1.0.0, código de versión 1 |
| Estado | finished |
| Commit | `726b0b86582f257d04ea7abf9329211f0f495b6f` (merge del PR #168, nombre de la app) |
| Compilado | 2026-10-31, 12:58 a. m. a 1:15 a. m. (hora que reporta EAS) |
| Enlace | https://expo.dev/accounts/imangeloos-team/projects/syscom-mobile/builds/b4efc5c0-e687-4902-b04d-ccfa8be63785 |

Es el build FINISHED más reciente que devolvió `eas build:list --platform android --limit 3`; se toma como el APK probado porque Angel así lo indicó. No se comparó la huella del APK instalado contra la del build: lo que se verificó es el ID y el commit que reporta EAS. Los dos anteriores son `86979ee6` (commit `8ea7359`) y `eea67925` (commit `d78afdc`, el de la prueba E2E del 2026-10-28).

## 3. Dispositivo

- Samsung Galaxy A16, Android 16.
- APK instalado desde Chrome ("Descargada desde Chrome" en la información de la aplicación, [e43-15](evidencia/sprint-5/e43/e43-15-info-app.jpeg)).
- Cliente de prueba. Pago con Stripe en modo prueba.

## 4. Resultados

### 4.1 Historia #19: reseñas

| Paso | Qué se probó | Resultado | Evidencia | Observaciones |
|---|---|---|---|---|
| 1.1 | Sin compra del producto no aparece "Escribir reseña" | OK | [e43-01](evidencia/sprint-5/e43/e43-01-sin-compra.jpeg) | |
| 1.2 | Con compra, aparece el formulario de reseña | OK | [e43-02](evidencia/sprint-5/e43/e43-02-formulario-resena.jpeg) | |
| 1.3 | La reseña enviada aparece en Mis reseñas | OK | [e43-03](evidencia/sprint-5/e43/e43-03-mis-resenas.jpeg) | Queda en estado Pendiente |
| 1.4 | La reseña se muestra en el detalle del producto | OK | [e43-04](evidencia/sprint-5/e43/e43-04-detalle-con-resenas.jpeg) | Mostró la reseña propia, aún pendiente, con el aviso "Ya dejaste una reseña para este producto". No se probó con una reseña aprobada por el administrador (ver limitaciones) |
| 1.5 | Detalle de un producto sin reseñas | OK | [e43-05](evidencia/sprint-5/e43/e43-05-detalle-sin-resenas.jpeg) | |

### 4.2 Historia #20: flujo login → compra → notificación y guía de 15 pasos

| Paso | Qué se hizo | Resultado | Evidencia | Observaciones |
|---|---|---|---|---|
| 1 | Permiso de notificaciones | OK | [e43-06](evidencia/sprint-5/e43/e43-06-permiso-notificaciones.jpeg) | |
| 2 | Inicio de sesión | OK | [e43-13](evidencia/sprint-5/e43/e43-13-inicio-sesion-iniciada.jpeg) | La sesión iniciada se ve en esa captura (Inicio con el avatar del usuario) |
| 3 | Detalle de producto | OK | [e43-08](evidencia/sprint-5/e43/e43-08-detalle-producto.jpeg) | |
| 4 | Carrito | OK | [e43-09](evidencia/sprint-5/e43/e43-09-carrito.jpeg) | |
| 5 | Pago con Stripe | OK según Angel | Sin captura publicada | Stripe en modo prueba. La captura no se publica por datos personales |
| 6 | Pedido confirmado | OK | [e43-10](evidencia/sprint-5/e43/e43-10-pedido-confirmado.jpeg) | Folio SYS-000015, $7,500.00 |
| 7 | Mis pedidos | OK | [e43-11](evidencia/sprint-5/e43/e43-11-mis-pedidos.jpeg) | |
| 8 | App cerrada | OK según Angel | Sin captura | Es preparación del paso 9 |
| 9 | Acción en el panel de administración | OK según Angel | Sin captura publicada | La captura no se publica por datos personales |
| 10 | Notificación recibida | OK | [e43-12](evidencia/sprint-5/e43/e43-12-notificacion.jpeg) | "Pedido #15: En preparación", 2:07 a. m. |
| 11 | Tocar la notificación | OK según Angel | [e43-13](evidencia/sprint-5/e43/e43-13-inicio-sesion-iniciada.jpeg) (no concluyente) | Angel confirma que al tocar la notificación la app abre en Inicio. e43-13 es la pantalla de Inicio (2:08 a. m.), pero por sí sola no demuestra que se llegó ahí desde la notificación |
| 12 | AR ("Ver en tu espacio") | **NO FUNCIONA en este dispositivo** | Sin captura | Según Angel, los servicios de Google Play para RA indican que el teléfono ya no es compatible. Es una limitación del dispositivo, no verificada por Claude. La AR no es uno de los 3 flujos críticos del #20 |
| 13 | Reseña | OK | Cubierto por 1.2 y 1.3 | |
| 14 | Chatbot | OK | [e43-14](evidencia/sprint-5/e43/e43-14-chatbot.jpeg) | |
| 15 | Información de la app | OK | [e43-15](evidencia/sprint-5/e43/e43-15-info-app.jpeg) | Nombre SYSCOM, versión 1.0.0, instalada desde Chrome |

Entrega del APK a los docentes: Angel compartió el APK con los docentes (dictado por Angel el 2026-10-31; no hay evidencia en el repositorio). El cierre del issue #20 lo hace Angel.

### 4.3 Cambios del sprint validados en el APK final

| Paso | Qué se probó | Resultado | Evidencia | Observaciones |
|---|---|---|---|---|
| 3.1 | Sección Ofertas en Inicio y pantalla "Ver todas" | OK | [e43-16](evidencia/sprint-5/e43/e43-16-ofertas-inicio.jpeg), [e43-17](evidencia/sprint-5/e43/e43-17-ofertas-ver-todas.jpeg) | |
| 3.2 | Al desactivar las promociones desde el panel, el cambio se refleja en la app | OK según Angel | Sin captura | Según Angel, el cambio se refleja en toda la app móvil, incluido el carrito |
| 3.3 | Descuento en el carrito | OK | [e43-18](evidencia/sprint-5/e43/e43-18-carrito-descuento.jpeg) | $7,200.00 tachado, $6,480.00 c/u, "-10 %", total $6,480.00 |
| 3.4 | Línea sin descuento queda como antes | OK | [e43-19](evidencia/sprint-5/e43/e43-19-carrito-con-y-sin-descuento.jpeg) | La línea sin promoción no tiene tachado ni etiqueta. Total $12,980.00 |
| 3.5 | Diseño del descuento en pantalla (desborde, pantalla angosta) | OK según Angel | Sin captura | Angel dijo que "quedó bien". **TalkBack NO se probó**: no se dictó que se haya probado |
| 3.6 | Mi cuenta sin las seis opciones sin desarrollar | OK | [e43-20](evidencia/sprint-5/e43/e43-20-mi-cuenta.jpeg) | |
| 3.7 | Nombre bajo el icono del lanzador | OK | [e43-21](evidencia/sprint-5/e43/e43-21-icono-app.jpeg) | El nombre es SYSCOM |
| 3.8 | Icono de notificaciones | OK | [e43-22](evidencia/sprint-5/e43/e43-22-icono-notificacion.jpeg) | |
| 3.9 | El APK conecta con el backend de producción (#78) | OK implícito | — | La app abrió, inició sesión y cargó datos reales. **Sin prueba específica con un build sin la variable `EXPO_PUBLIC_API_URL`** |
| 3.10 | El build `preview` termina (#154) | OK | Sección 2 de este reporte | Build `b4efc5c0`, commit `726b0b8` |

## 5. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| 1 | La AR (paso 12 del #20) no abre en el Samsung Galaxy A16 | Según Angel, los servicios de Google Play para RA indican que el teléfono ya no es compatible. No verificado por Claude | Ninguna: limitación del dispositivo, no hay cambio de código | — |

Sin fallas de la app en los demás pasos.

## 6. Pendientes y limitaciones

Pendientes:

- Cierre del issue #20: lo hace Angel.
- Crear `EXPO_PUBLIC_API_URL` en el entorno `production` de EAS antes de compilar para Play Store (hoy solo existe en `preview`).

Limitaciones:

- No se probó en iOS (no hay build de iOS).
- La AR no funciona en este Samsung (paso 12). No se probó en otro dispositivo Android.
- Los cupones no se pueden aplicar desde la app, así que no se probó el carrito con cupón.
- El perfil `production` de EAS necesita `EXPO_PUBLIC_API_URL`; hoy solo existe en `preview`. Un build `production` sin la variable falla al abrir (comportamiento del #78, probado solo con pruebas unitarias).
- TalkBack no se probó (paso 3.5).
- No se probó una reseña aprobada por el administrador: el detalle (paso 1.4) mostró la reseña propia aún pendiente.
- Los pasos 5, 8, 9 y 11 del #20 y los pasos 3.2 y 3.5 se registran según Angel, sin captura que los respalde.
- Las capturas de Stripe, del panel de administración y de la pantalla Más no se publican por datos personales.
- No se verificó que el APK instalado sea el del build `b4efc5c0`; se tomó por indicación de Angel.

## 7. Evidencia

Archivos en `docs/pruebas/evidencia/sprint-5/e43/` (21 capturas, `e43-01` a `e43-22`, sin `e43-07`). La captura 12 es un recorte de la notificación. No se publican las capturas originales `e43-07` y `e43-12` por mostrar restos de datos personales.

Revisión de privacidad de las capturas publicadas: las imágenes muestran el nombre de pila del cliente de prueba (`e43-04`: nombre y una inicial; `e43-20`: saludo) y una dirección de prueba (`e43-09`, `e43-10`, `e43-19`). No muestran correo, nombre completo ni identificadores de pago.
