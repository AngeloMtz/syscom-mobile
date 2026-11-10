# Política de privacidad de la app SYSCOM

> **BORRADOR — no publicar todavía.** Se redactó solo con lo que consta en el código de la app (`syscom-mobile`) y del backend (`syscom-backend`). Los puntos marcados **[PENDIENTE]** no constan en el código y los debe confirmar el equipo antes de publicar. La evidencia (archivo y línea) de cada afirmación está en [google-play-datos-y-ficha.md](google-play-datos-y-ficha.md).

**Última actualización:** <FECHA>
**Aplicación:** SYSCOM (identificador Android `com.syscom.mobile`)
**Contacto en materia de privacidad:** <CORREO_DE_CONTACTO>

## 1. Quién es responsable de tus datos

SYSCOM es la responsable del tratamiento de los datos personales que se recogen a través de esta app. **[PENDIENTE: razón social y domicilio del responsable.]** Puedes escribirnos a <CORREO_DE_CONTACTO>.

Esta política explica qué datos recogemos, para qué los usamos, con quién los compartimos y qué puedes hacer con ellos.

## 2. Qué datos recogemos y para qué

| Cuándo | Datos | Para qué |
|---|---|---|
| Al crear tu cuenta | Nombre, apellido paterno, apellido materno, correo electrónico, teléfono y contraseña | Crear y verificar tu cuenta (te enviamos un código por correo) y permitirte iniciar sesión |
| Al iniciar sesión | Correo y contraseña; si tu cuenta tiene verificación en dos pasos, el código que recibes por correo | Identificarte y proteger tu cuenta |
| Mientras usas la app con sesión | Un identificador de sesión (token), guardado en el almacén seguro de tu teléfono | Mantener tu sesión abierta hasta que cierres sesión |
| En tu perfil | Los mismos datos de tu cuenta, que puedes consultar y corregir (el correo no se puede modificar) | Mantener tus datos al día |
| Al guardar direcciones | Calle, colonia, ciudad, estado, código postal y referencias (opcional) | Enviar tus pedidos |
| Al usar carrito y favoritos | Los productos y cantidades que agregas | Armar tu compra y recordar lo que te interesa |
| Al comprar | La dirección de envío elegida. Los datos de tu tarjeta los captura directamente Stripe en su hoja de pago | Procesar el pago y crear tu pedido |
| Tus pedidos | Productos, montos, estado, método de pago y el identificador del pago en Stripe | Mostrarte tu historial y dar seguimiento |
| Al escribir una reseña | Calificación, título (opcional) y comentario, ligados al producto y a tu pedido. Si se aprueba, otros usuarios ven tu nombre, tu apellido paterno y tu foto (si la tienes) junto a la reseña | Publicar opiniones de clientes que compraron el producto |
| Si activas las notificaciones | El token de notificaciones push de tu dispositivo | Enviarte avisos de pedidos y promociones |
| Con el asistente virtual (chatbot) | El texto de tus mensajes, un identificador aleatorio de la conversación y, si tienes sesión, tu nombre | Responder tus dudas sobre productos, servicios y la empresa |
| Con el chat en vivo | Tus mensajes y, si no tienes sesión, el nombre y el correo que escribas | Atenderte con un asesor |
| Si te suscribes al boletín | Nombre y correo | Enviarte comunicaciones del boletín |
| Al abrir la vista 3D o realidad aumentada | Al cargar el visor, los servidores de Google reciben datos técnicos de tu conexión (como la dirección IP) y la dirección del modelo 3D que quieres ver | Mostrar el producto en 3D y en tu espacio |

## 3. Datos que la app no recoge

Según el código de esta versión de la app:

- **No** solicita permiso de ubicación ni recoge tu ubicación.
- **No** solicita permiso de cámara ni de micrófono. La realidad aumentada la abre el visor de Google (Scene Viewer) en Android o Quick Look en iOS, fuera de nuestra app.
- **No** accede a tus contactos, fotos ni archivos.
- **No** incluye herramientas de analítica ni de publicidad, y no usa el identificador de publicidad.
- **No** guarda ni procesa los datos de tu tarjeta: los maneja Stripe.

## 4. Con quién compartimos tus datos

Usamos proveedores que tratan datos en nuestro nombre o para prestar una función concreta:

| Proveedor | Qué recibe | Para qué |
|---|---|---|
| **Stripe** | Los datos de tu tarjeta (los captura Stripe directamente), el monto del pedido y un identificador interno de usuario y de dirección | Cobrar el pago |
| **Groq** (proveedor del modelo de lenguaje del asistente virtual) | Los mensajes que escribes al chatbot y, si tienes sesión, tu nombre | Generar las respuestas del asistente |
| **Expo y Google (Firebase Cloud Messaging)** | El token de tu dispositivo y el contenido de la notificación | Entregar notificaciones push en Android |
| **Google** (componente `model-viewer`, Scene Viewer) | Datos técnicos de la conexión y la dirección del modelo 3D | Mostrar el visor 3D y la realidad aumentada |
| **Cloudinary** | Imágenes de productos y servicios, y las fotos de perfil que se hayan subido | Almacenar y servir imágenes |
| **Brevo** | Tu correo y el contenido del mensaje (códigos de verificación, de acceso y de recuperación de contraseña) | Enviar correos de la cuenta |
| **Neon y Railway** | Todos los datos que se guardan en nuestro servidor | Alojar la base de datos y el servidor (**[PENDIENTE: confirmar proveedores de producción]**) |

No vendemos tus datos. Los asesores de SYSCOM pueden ver tus mensajes del chat en vivo para atenderte. Las reseñas aprobadas son visibles para otros usuarios (sección 2).

## 5. Cuánto tiempo conservamos tus datos

- **El token de sesión** se conserva en tu teléfono hasta que cierras sesión o la sesión caduca.
- **La conversación con el chatbot** se muestra en tu teléfono solo mientras la app está abierta; al cerrar sesión se borra del dispositivo. En nuestro servidor se guarda el historial de cada conversación.
- **El token de notificaciones** se da de baja al cerrar sesión, si el teléfono tiene conexión en ese momento.
- **Una dirección** que elimines desde la app deja de mostrarse en tu cuenta.
- **Plazos de conservación** de la cuenta, pedidos, conversaciones del chatbot y del chat en vivo, y suscripciones al boletín: **[PENDIENTE: definir plazos con el equipo del backend]**.

## 6. Cómo protegemos tus datos

- Tu sesión se guarda en el almacén seguro del sistema (Keychain en iOS, Keystore en Android).
- Tu contraseña se guarda en nuestro servidor transformada con un *hash*, no en texto legible.
- La cuenta ofrece verificación en dos pasos por correo, y el servidor bloquea temporalmente los accesos tras varios intentos fallidos.
- La app se comunica con nuestro servidor mediante conexión cifrada. **[PENDIENTE: confirmar que la dirección de producción usa `https://`.]**

Ningún sistema es totalmente seguro; si detectamos un incidente que te afecte, te lo informaremos por los medios de contacto que nos diste. **[PENDIENTE: confirmar el procedimiento.]**

## 7. Tus derechos

Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición (ARCO):

- **Acceso y rectificación:** desde la app, en tu perfil ("Mis datos"), puedes consultar y corregir tu nombre, apellidos y teléfono, y administrar tus direcciones.
- **Oposición:** en Notificaciones puedes activar o desactivar los avisos por correo y por push. Puedes retirar el permiso de notificaciones en los ajustes de tu teléfono.
- **Cancelación (eliminar tu cuenta y tus datos):** desde la app, en Mi cuenta > Datos personales > Eliminar cuenta, confirmando tu contraseña. Se borran tus datos personales, direcciones guardadas, favoritos, carrito, reseñas y notificaciones. Tus pedidos se conservan como registro de venta, sin tu nombre, correo ni teléfono. Si tienes pedidos o servicios en curso, podrás eliminarla cuando terminen. **[PENDIENTE: agregar el enlace web de eliminación que pide Google Play.]**
- **Boletín:** **[PENDIENTE: confirmar cómo darse de baja.]**

## 8. Menores de edad

**[PENDIENTE: definir si la app está dirigida a menores de edad. Hoy no consta en el código ninguna restricción de edad.]**

## 9. Cambios a esta política

Si cambiamos esta política, publicaremos la versión nueva en este mismo enlace y actualizaremos la fecha de "Última actualización".

## 10. Contacto

Para dudas o solicitudes sobre tus datos: <CORREO_DE_CONTACTO>.
