# Guía de regresión manual y validación — APK final Sprint 5

Oct 31, 2026 · @Angel

Esta guía reúne lo que falta probar a mano con el **APK final**: 3 validaciones de lo nuevo, 20 puntos prioritarios de regresión y 11 puntos restantes. Calcula unas 2 horas en total. La lista completa de 51 filas viene de `docs/pruebas/regresion-final.md`; aquí está reordenada por prioridad.

## Antes de empezar

| Dato | Valor |
| --- | --- |
| Commit de `develop` | `68a572c` (incluye #172, #174, #179, #180 y #181) |
| ID del build EAS del APK final | 5df5c1be-f073-4c20-8f68-384ede518e18 |
| Dispositivo y versión de Android | SAMSUNG A16 Android 16 |
| Fecha y hora de la prueba | 01/11/2026 10:00 p.m. |

**Preparación**

- [x] El APK se generó desde `develop` con el último commit `68a572c` y se instaló quitando antes la versión anterior.
- [x] Tienes una cuenta de prueba **ya verificada** y una cuenta **sin pedidos** (para el estado vacío).
- [x] Tienes acceso al panel de administración (para cambiar estados, aprobar reseñas y desactivar ofertas).
- [x] Stripe está en modo de prueba. La tarjeta rechazada de prueba está en `datos-de-prueba.md`.
- [x] Una carpeta para las capturas. Nómbralas con el número del punto, por ejemplo `B07-carrito.jpeg`.

**Reglas**

1. Marca cada punto como **Pasa** o **Falla** en la columna «Resultado». No dejes «Pasa» si no lo probaste: déjalo vacío o escribe «No probado».
2. Si algo falla, toma captura, anota qué viste y **no lo corrijas en esta pasada**. Luego abrimos un issue.
3. Tapa correos, teléfonos y direcciones reales antes de guardar cada captura.
4. Si usas cuentas de prueba, no pegues sus contraseñas en este documento.

## Parte A — Validar lo nuevo

Lo nuevo que las pruebas automáticas no pueden confirmar solo, porque usan un servidor falso. A1 es la única que **no** se hace con el APK: el APK apunta a producción y no conviene tocar su secreto ni su duración de token.

### A1 — Sesión caducada (#172)

**Se prueba en Expo Go con el backend local y la rama de pruebas de Neon. Nunca en producción.**

1. En el backend local revisa `DATABASE_URL`: debe apuntar a la rama de pruebas (`ml-dataset`), no a producción.
2. En el `.env` del backend pon `JWT_EXPIRES_IN=2m` (la variable existe en `src/utils/jwt.ts`; por defecto vale `7d`) y arranca el backend.
3. En la app, apunta `EXPO_PUBLIC_API_URL` a la IP de tu PC y al puerto del backend local (teléfono y PC en la misma red). Arranca con `npx expo start` y ábrela en Expo Go.
4. Inicia sesión y espera más de 2 minutos con la app abierta.
5. Ve a Carrito o a Perfil.
6. **Esperado:**** **la app vuelve a Login y no hay pantallas rotas.
7. Inicia sesión otra vez y confirma que todo carga.
8. Anota el texto exacto de la respuesta 403 del backend. La app solo cierra sesión si dice «Token inválido o expirado».
9. Al terminar, quita `JWT_EXPIRES_IN` del `.env` del backend.

- [x] Pasa
- [ ] Falla

Observaciones: No se si debe de aparecer un mensaje en el movil, pero pues cuando la sesion caduca y accedo a otro apartado me manda al login, entonces si funciona, no encontre el mensaje en el back porque se perdio al entrar a otro apartado. Pero funciona bien.

### A2 — Nombre de 3 a 40 letras (#174 y PR #6 del backend)

Se prueba con el APK final contra producción. Antes confirma que Railway ya desplegó el PR #6 (el commit `cc1177c`); si no, el backend sigue pidiendo 4 a 25 y la prueba fallará por eso y no por la app.

1. En **Registro**, escribe un nombre de 3 letras (por ejemplo «Ana»): debe aceptarse.
2. Nombre de 40 letras: debe aceptarse.
3. Nombre de 2 letras: muestra «El nombre debe tener al menos 3 caracteres».
4. Nombre de 41 letras: lo rechaza.
5. En **Perfil → datos personales**, guarda un nombre de 3 letras y otro de 40. Recarga el perfil y confirma que persiste.
6. Devuelve tu nombre original al terminar.
7. Si pruebas el mismo nombre en el registro de la web (que pide 4 a 25), anota la diferencia.

Usa correos de prueba para los registros: cada uno crea una cuenta real en producción.

- [x] Pasa
- [ ] Falla

Observaciones: Si me registro con 3 letras en el nombre lo hace sin problemas, al editarlo en el perfil, me deja editarlo a otro con 3 palabras, hay un maximo en la app, no deja colocar muchas letras en el nombre. Entonces la validación de las palabras funciona correctamente.&#32;

Permite registrar el nombre con un minimo de 3 letras, con un maximo de 40. Osea que 2 y 41  no esta permitido.

### A3 — Nombre e ícono de la app (#168)

1. En el cajón de aplicaciones, el nombre bajo el ícono es **SYSCOM**.
2. En Ajustes → Aplicaciones aparece como SYSCOM.
3. El ícono de la notificación de un pedido es el de SYSCOM.

- [x] Pasa
- [ ] Falla

Observaciones: S emuestra bien e todo momento, hasta en las notis.

### Lo que no se prueba en dispositivo

La validación de respuesta incompleta en login, 2FA y verificación de registro (#68, PR #180) solo está cubierta por pruebas automáticas: forzar esa respuesta del servidor exigiría alterar el backend. Queda documentado como cubierto solo por pruebas automáticas.

## Parte B — Regresión prioritaria (20 puntos)

Son los puntos que más riesgo tienen de haberse roto y que #43 no cubrió completos. Escribe **Pasa** o **Falla** en «Resultado» y anota el número de captura en «Obs.». Van en un orden que ahorra pasos: primero lo que necesita datos limpios, luego sesión, catálogo, compra y cierre.

| # | Punto | Pasos | Esperado | Resultado | Obs. |
| --- | --- | --- | --- | --- | --- |
| B01 | Onboarding aparece solo la primera vez | Borra los datos de la app (Ajustes → Aplicaciones → SYSCOM → Almacenamiento). Ábrela, tócame hasta terminar, ábrela de nuevo | Se ve el onboarding la primera vez y no vuelve | Pasa |  |
| B02 | Botón «Omitir» | Borra los datos otra vez. Ábrela y toca «Omitir». Reabre | Llega a la app y no reaparece | Pasa |  |
| B03 | Registro con código de verificación | Registra un usuario nuevo (correo de prueba) y confirma con el código | Entra a la app con la cuenta creada | Pasa |  |
| B04 | Inicio de sesión con 2FA | Cierra sesión. Inicia sesión con una cuenta con 2FA e ingresa el código | Entra a la app | Pasa |  |
| B05 | Errores de credenciales claros | Prueba contraseña incorrecta, correo inexistente y registro con contraseña débil. Lee cada mensaje | Cada caso da un mensaje claro y distinto, sin pantalla rota | Pasa |  |
| B06 | Recuperar contraseña | «Olvidé mi contraseña» → código y nueva contraseña → inicia con la nueva | Entra con la contraseña nueva | Pasa |  |
| B07 | Sesión se restaura y se cierra | Inicia sesión. Cierra y reabre la app. Después cierra sesión y reabre | Primero sigue iniciada; después pide login y Carrito/Perfil no son accesibles | Pasa |  |
| B08 | Perfil muestra y edita datos | Más → Perfil: revisa nombre, correo y teléfono. Cambia un dato, guarda, sal y vuelve. Prueba un dato inválido | Muestra los datos; el cambio persiste; el dato inválido da error | Pasa |  |
| B09 | Pestañas y transiciones | Toca Inicio, Catálogo, Carrito, Servicios y Más. Entra y sal de un producto y un servicio. Cambia de pestaña varias veces | Cada pestaña abre su pantalla; sin parpadeos, cierres ni pantallas en blanco | Pasa |  |
| B10 | Catálogo: carga y categoría | Abre Catálogo (con red lenta si puedes). Toca una categoría | Se ve el indicador de carga y después solo productos de esa categoría | Pasa |  |
| B11 | Paginación y estado vacío | Baja hasta el final de una categoría grande. Busca algo que no exista | Se cargan más productos sin duplicados; la búsqueda vacía muestra el mensaje de vacío | Pasa |  |
| B12 | Búsqueda y filtros de precio | Busca un producto conocido. Aplica mínimo y máximo; prueba mínimo mayor que máximo; quita los filtros | Los resultados corresponden y están en el rango; el rango inválido da error | Pasa |  |
| B13 | Variantes y stock | Abre un producto con variantes y elige una. Prueba una variante sin stock y un producto agotado | La sin stock aparece deshabilitada; el agotado no se puede agregar | Pasa |  |
| B14 | Favoritos | Marca 2 favoritos y quita uno (toca el corazón otra vez). Cierra sesión y vuelve a entrar | El corazón alterna; el favorito que dejaste sigue en la lista | Pasa |  |
| B15 | Carrito: cantidades y eliminar | Agrega 2 productos. Cambia cantidades con + y −. Elimina uno. Vacía el carrito | El total se actualiza al instante y coincide con precio × cantidad; el carrito vacío muestra el estado vacío | Pasa |  |
| B16 | Direcciones: validar y guardar | Desde el checkout, crea una dirección con campos vacíos o inválidos, luego con datos válidos. Edítala y elimínala | Errores por campo; la válida aparece al volver al checkout; editar y eliminar funcionan | Pasa |  |
| B17 | Pago rechazado | Paga con la tarjeta de prueba rechazada de Stripe. Después cancela la hoja de pago | Mensaje claro, el carrito se conserva y al cancelar no se crea ningún cobro | Pasa |  |
| B18 | Pedidos: vacío y detalle | Con la cuenta sin pedidos, abre el historial. Con la otra, abre el detalle de un pedido | Estado vacío en la primera; el detalle muestra productos, total y estado | Pasa |  |
| B19 | Chat conserva el historial | Envía 2 o más mensajes. Sal y vuelve al chat. Cierra sesión | Los mensajes siguen al volver; tras cerrar sesión el chat se borra | Pasa |  |
| B20 | Reseña aprobada visible | En el panel, aprueba una reseña. Con otra cuenta abre el detalle del producto. Prueba también una rechazada | La aprobada se ve con el autor abreviado y el promedio actualizado; la rechazada no aparece | Pasa |  |

## Parte C — Puntos restantes (11)

Menos riesgo o más rápidos de ver. C09 y C10 dependen del dispositivo: el AR dejó de funcionar en el Samsung Galaxy A16 y los reportes #40 y #43 se contradicen. Si no tienes otro teléfono compatible con ARCore, déjalos como «No probado» y se documentan así.

| # | Punto | Pasos | Esperado | Resultado | Obs. |
| --- | --- | --- | --- | --- | --- |
| C01 | Corre en Expo Go sin errores | `npx expo start`, ábrela en Expo Go (SDK 58) | Carga sin pantalla roja ni errores en consola | Pasa |  |
| C02 | Estructura documentada en el README | Abre `README.md` y busca «Estructura del proyecto» | Describe la estructura de carpetas | Pasa | Aqui falta actualizar el readme sobre algunos, apartados nuevos como el de promociones y servcios. Al igual que los cambios en los issues, como el de E2E. |
| C03 | URL base por variable de entorno | Revisa que `.env.example` tenga `EXPO_PUBLIC_API_URL`. Con el `.env` creado, abre el catálogo | El catálogo carga datos desde esa URL | Pasa |  |
| C04 | Perfil desde Más | Más → Perfil → volver con atrás | Abre el perfil y regresa a Más | Pasa |  |
| C05 | Tarjetas de producto | Abre una categoría con productos | Cada tarjeta muestra imagen, nombre y precio | Pasa |  |
| C06 | Filtro por categoría en la búsqueda | En el buscador filtra por una categoría | Solo salen productos de ella | Pasa |  |
| C07 | Carrusel de imágenes | Abre un producto con varias imágenes y desliza | Cambia entre las imágenes sin errores | Pasa |  |
| C08 | Volver al inicio tras la compra | Desde la confirmación de un pedido toca el botón de volver | Llega a Inicio | Pasa |  |
| C09 | AR en otro dispositivo | Con un teléfono compatible con ARCore: abre un producto con modelo 3D → «Ver en Realidad Aumentada» → «Ver en tu espacio» | El modelo se coloca en el espacio | No verificable | El Samsung A16 ya no es compatible con ARCore (Google Play Services para RA). No hay otro teléfono compatible para probarlo. |
| C10 | Producto sin modelo no muestra AR | Abre un producto sin modelo 3D | No aparece el botón de AR | Pasa |  |
| C11 | El APK instalado es el build final | Compara el ID del build de EAS con el anotado arriba y confirma que el enlace de instalación se compartió con los docentes | Coincide y el enlace se compartió | Pasa | El ID del build coincide. El enlace aún no se comparte con los docentes: lo verán desde mi dispositivo y después en Google Play. |

## Cierre

Cuando termines, llena este resumen y pégamelo (o pégaselo a Claude Code): con él se actualiza `docs/pruebas/regresion-final.md` y se cierra el #45 sin inventar resultados.

| Bloque | Puntos | Pasan | Fallan | No probados |
| --- | --- | --- | --- | --- |
| Parte A (lo nuevo) | 3 | 3 | 0 | 0 |
| Parte B (prioritarios) | 20 | 20 | 0 | 0 |
| Parte C (restantes) | 11 | 10 | 0 | 1 |

**Defectos encontrados**

| Punto | Qué pasó | Captura | Issue |
| --- | --- | --- | --- |
|  |  |  |  |

**Qué sigue según el resultado**

- Si todo pasa o los fallos son menores y documentados, el #45 se cierra con una nota honesta de lo que no se probó (por ejemplo, el AR).
- Si algo falla, se abre un issue por defecto. No se corrige dentro de la regresión; se decide si entra antes del congelamiento del 12/11/2026 o se documenta como limitación.
- Un cambio de código después de esta pasada obliga a generar otro APK y repetir los puntos afectados.

Probado por: Angel Uriel · Fecha: 01/11/2026
