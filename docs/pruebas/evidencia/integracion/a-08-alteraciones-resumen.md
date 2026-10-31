# Alteraciones a propósito (PR A de #44)

Se cambió el código de producción a propósito, una alteración a la vez; se corrió el archivo de integración correspondiente y se restauró el archivo con `git checkout`. Al final `git status` no mostró ningún archivo de producción modificado. La salida cruda está en [a-07-alteraciones-salida.txt](a-07-alteraciones-salida.txt).

| # | Archivo de producción | Alteración | Archivo de pruebas | Resultado | Prueba(s) que fallaron |
|---|---|---|---|---|---|
| A | `src/shared/api/secureToken.ts` | `restoreToken` ya no copia el token a la memoria | `arranqueDeLaApp` | Detectada (1 de 7) | con un token guardado reconoce la sesión al abrir y el Bearer viaja en la primera petición |
| B | `src/shared/store/authStore.ts` | `setSession` ya no guarda el token | `autenticacion` | Detectada (3 de 12) | login sin 2FA; login con 2FA → pantalla de código → sesión; registro → código → sesión |
| C | `src/features/auth/hooks/useLogout.ts` | el cierre de sesión borra la sesión antes de desregistrar el token push | `perfilYMiCuenta` | Detectada (1 de 9) | cerrar sesión: desregistra el token del dispositivo con la sesión aún vigente y luego la borra |
| D | `src/features/profile/hooks/useUpdateProfile.ts` | guardar el perfil ya no actualiza el usuario de la sesión | `perfilYMiCuenta` | **Primero NO detectada; detectada tras corregir las pruebas** (1 de 9) | editar y guardar: PUT con los campos nuevos, el servidor, la caché y el usuario de la sesión quedan al día |
| E | `src/shared/storage/onboarding.ts` | si falla la lectura de la bandera asume que NO vio la bienvenida | `arranqueDeLaApp` | Detectada (1 de 7) | si el almacenamiento de la bandera falla, asume que ya la vio y no deja al usuario atrapado en la bienvenida |
| F | `src/features/auth/hooks/useVerifyRegistration.ts` | verificar el registro ya no inicia la sesión | `autenticacion` | Detectada (2 de 12) | registro → código del correo → sesión; reenviar el código |

## La alteración D no se detectó al principio
Con la alteración D las 9 pruebas pasaban (se corrió dos veces). Había dos causas, ambas de las pruebas y del servidor falso, no del código de la app:

1. `servidorAuth` devolvía en sus respuestas el mismo objeto `user` que guarda en memoria, y el servidor falso lo modificaba al guardar el perfil. El store de la app compartía ese objeto, así que veía el cambio aunque la app no lo guardara. Corrección: las respuestas del servidor falso se serializan (`JSON.parse(JSON.stringify(...))`), como por HTTP.
2. El ayudante `conSesion` de la prueba metía en el store el objeto del servidor sin copiarlo. Corrección: se le pasa una copia.

Con ambas correcciones, la alteración D hace fallar la prueba. Después se repitieron las 6 alteraciones con las pruebas finales (la salida de [a-07](a-07-alteraciones-salida.txt) es de esa segunda corrida) y las 6 se detectan. La tabla de arriba refleja esa corrida.
