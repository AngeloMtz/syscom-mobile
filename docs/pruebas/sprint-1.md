# Reporte de pruebas — Sprint 1

- **Fecha:** 2026-10-05
- **Rama:** `test/sprint-1`
- **Historias cubiertas:** #1–#5
- **Responsable de pruebas:** @AngeloMtz

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK | #26 |
| Unitarias | 39/39 pasan, cobertura 94 % de líneas (sobre la lógica probada) | #25 |
| Integración | No aplica en este sprint | — |
| Rendimiento | No aplica en este sprint | — |
| Aceptación (manual) | PENDIENTE DE VALIDACIÓN MANUAL | #27 |

## 2. Análisis estático
- `npx expo lint --no-cache` → 0 errores, 0 advertencias (`evidencia/sprint-1/lint.txt`).
- `npx tsc --noEmit` → 0 errores (`evidencia/sprint-1/tsc.txt`).
- Nota: antes de instalar dependencias, lint y tsc fallaban por `@react-native-async-storage/async-storage` ausente en `node_modules`. No era un defecto del código: se resolvió con `npm install`. Una caché vieja de ESLint siguió reportándolo hasta usar `--no-cache`.

## 3. Pruebas unitarias
Jest (`jest-expo`) en `src/__tests__/`, resultado en `evidencia/sprint-1/jest.txt`.

| Archivo | Cubre | Pruebas |
|---|---|---|
| `validation.test.ts` | Validación de correo, reglas de contraseña y datos de perfil | 22 |
| `errorMessage.test.ts` | Mapeo de errores de la API a mensajes (mensaje, errores, 429, red, fallback) | 5 |
| `session.test.ts` | Guardado/restauración/borrado del JWT (SecureStore simulado), `authStore`, flag de onboarding (AsyncStorage simulado) | 12 |

Cobertura sobre los módulos probados: 94.18 % sentencias, 91.42 % ramas, 95.83 % líneas.
No se cubren hooks, pantallas ni repositories (requieren React Native Testing Library o el backend; se validan en la prueba de aceptación manual).

## 4. Pruebas de aceptación (manuales) — PENDIENTE DE VALIDACIÓN MANUAL

Dispositivo: Expo Go (`npx expo start -c`), con `.env` apuntando al backend.

| Historia | Criterio | Pasos | Resultado | Evidencia |
|---|---|---|---|---|
| #1 | Corre en Expo Go sin errores | Abrir la app en Expo Go y revisar que no haya pantalla roja ni errores en consola | PENDIENTE | captura |
| #1 | Estructura de carpetas documentada en el README | Revisar la sección de estructura en `README.md` | PENDIENTE | captura |
| #1 | Variable de entorno con la URL de la API | Confirmar `EXPO_PUBLIC_API_URL` en `.env` y que el login llega al backend | PENDIENTE | captura |
| #2 | Las 4 pestañas navegan sin errores | Tocar Inicio, Catálogo, Carrito y Perfil | PENDIENTE | captura |
| #2 | Transiciones fluidas | Navegar entre pestañas y a "Datos personales" y regresar | PENDIENTE | video/nota |
| #3 | Usuario puede registrarse | Registro con datos válidos → ingresar código de 6 dígitos del correo → queda con sesión | PENDIENTE | captura |
| #3 | Usuario puede loguearse | Login con cuenta existente (y con 2FA si aplica) | PENDIENTE | captura |
| #3 | Token guardado de forma segura | Cerrar y reabrir la app: la sesión persiste (token en SecureStore) | PENDIENTE | nota |
| #3 | Mensajes de error claros | Login con contraseña incorrecta, correo mal formado y sin internet | PENDIENTE | captura |
| #4 | Muestra nombre, correo y contacto | Iniciar sesión y abrir Perfil / Datos personales | PENDIENTE | captura |
| #4 | Permite editar y guardar contra la API | Cambiar nombre/teléfono, guardar y reabrir la pantalla | PENDIENTE | captura |
| #4 | Botón de cerrar sesión funcional | Tocar "Cerrar sesión" y comprobar que Perfil pide iniciar sesión | PENDIENTE | captura |
| #5 | No vuelve a aparecer tras la primera apertura | Completar la bienvenida, cerrar y reabrir la app | PENDIENTE | nota |
| #5 | Botón "Omitir" funcional | En una lámina, tocar "Omitir" | PENDIENTE | captura |

Para ver la bienvenida otra vez: borrar los datos de Expo Go o reinstalarlo.

Hallazgos a vigilar durante la validación (no son fallas confirmadas):
- `getMe` llama a `/auth/me`, que el código marca como inexistente en el backend: tras reabrir la app puede haber token pero no datos de usuario.
- El token no se valida al arrancar y no hay manejo global de 401: un token vencido se tratará como sesión válida hasta la primera petición fallida.

## 5. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|
| 1 | `tsc` no reconocía `describe`/`it`/`expect` en las pruebas | TypeScript 6 ya no carga automáticamente los tipos de `@types/*` | Agregar `"types": ["jest"]` en `tsconfig.json` | commit `fix:` de esta rama |

## 6. Pendientes
- Validación manual en dispositivo y capturas en `docs/pruebas/evidencia/sprint-1/` (a cargo de @AngeloMtz).
- Pruebas de hooks y pantallas con React Native Testing Library, si se decide automatizarlas en sprints siguientes.

## 7. Evidencia
`docs/pruebas/evidencia/sprint-1/`: `lint.txt`, `tsc.txt`, `jest.txt`.
