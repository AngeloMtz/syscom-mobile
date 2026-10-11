# Reporte de pruebas — Sprint N

- **Fecha:** AAAA-MM-DD
- **Rama:** `test/sprint-N`
- **Historias cubiertas:** #a–#b
- **Responsable de pruebas:** nombre

## Planeación: trazabilidad historia → funciones → pruebas
Llenar al planear cada sprint y actualizar al cerrarlo. Una fila por grupo de funciones.
Si una función no tendrá prueba unitaria, escribir "—" y explicar por qué.

| Historia | Funciones (archivo fuente) | Prueba unitaria (`src/__tests__/`) | Estado |
|---|---|---|---|
| #n | `función` (`ruta/archivo.ts`) | `archivo.test.ts` | Con prueba / Sin prueba |

### Ejemplo: Sprint 1 (HU #1–#5)
Se llenó con las pruebas que existen hoy en `src/__tests__/`. El reporte `sprint-1.md` registra solo tres archivos de pruebas al cierre del sprint (`validation`, `errorMessage` y `session`, 39 pruebas) y aclara que hooks, pantallas y repositories no estaban cubiertos. El resto de las pruebas se agregó después, en issues posteriores (#60 a #73).

| Historia | Funciones (archivo fuente) | Prueba unitaria | Estado |
|---|---|---|---|
| #1 Proyecto base | Cliente HTTP: baseURL, timeout e interceptor Bearer (`shared/api/client.ts`) | `apiClient.test.ts` | Con prueba |
| #1 | `queryClient` (`shared/api/queryClient.ts`) | `queryClient.test.ts` | Con prueba |
| #1 | `useColors` (`shared/theme/useColors.ts`) | — | Sin prueba (solo lee el tema) |
| #2 Navegación | Solo pantallas y layouts de `src/app/` | — | Sin funciones con lógica; se valida en aceptación manual |
| #3 Registro y login | `authRepository`: login, register, confirm2FA, verifyRegistration, resendCode, forgotPassword, verifyRecovery, resetPassword, logout, getMe | `authRepository.test.ts` | Con prueba |
| #3 | Hooks: useLogin, useRegister, useConfirm2FA, useVerifyRegistration, useResendCode, usePasswordRecovery, useMe | `useLogin.test.tsx`, `useRegister.test.tsx`, `useConfirm2FA.test.tsx`, `useVerifyRegistration.test.tsx`, `useResendCode.test.tsx`, `usePasswordRecovery.test.tsx`, `useMe.test.tsx` | Con prueba |
| #3 | `validateEmail`, `passwordIsValid`, `PASSWORD_RULES` (`auth/validation.ts`) | `validation.test.ts` | Con prueba |
| #3 | `apiErrorMessage` (`shared/api/errorMessage.ts`) | `errorMessage.test.ts` | Con prueba |
| #3 | `saveToken`, `getToken`, `restoreToken`, `clearToken` (`shared/api/secureToken.ts`) | `session.test.ts` | Con prueba |
| #3 | `authStore`: setSession, logout, hydrate | `session.test.ts` | Con prueba |
| #3 | `authStore.setUser` | — (se ejercita en `useMe.test.tsx` y `useUpdateProfile.test.tsx`) | Sin prueba directa |
| #4 Perfil | `validateProfile` (`profile/validation.ts`) | `validation.test.ts` | Con prueba |
| #4 | `profileRepository`: get, update | `profileRepository.test.ts` | Con prueba |
| #4 | Hooks: useProfile, useUpdateProfile | `useProfile.test.tsx`, `useUpdateProfile.test.tsx` | Con prueba |
| #5 Onboarding | `isOnboardingCompleted`, `setOnboardingCompleted` (`shared/storage/onboarding.ts`) y `onboardingStore` (hydrate, complete) | `session.test.ts` | Con prueba |
| #5 | `resetOnboarding` | — | Sin prueba (solo apoyo para pruebas manuales) |
| #5 | `slides.ts` (datos) y componentes `OnboardingFlow` y `OnboardingSlide` | — | Sin prueba (datos y pantalla; aceptación manual) |

## 1. Resumen

| Tipo de prueba | Resultado | Issue |
|---|---|---|
| Análisis estático (lint + tsc) | OK / FALLA | #n |
| Unitarias | X/Y pasan, cobertura Z % | #n |
| Integración | OK / FALLA / No aplica | #n |
| Rendimiento | OK / FALLA / No aplica | #n |
| Aceptación (manual) | X/Y criterios OK | #n |

## 2. Análisis estático
Comandos ejecutados, resultado y enlace a la evidencia.

## 3. Pruebas unitarias
Qué se probó, resultado y cobertura. Qué quedó fuera y por qué.

## 4. Pruebas de aceptación (manuales)

| Historia | Criterio | Pasos | Resultado | Evidencia |
|---|---|---|---|---|
| #n | criterio | 1. … 2. … | PENDIENTE / OK / FALLA | captura |

## 5. Fallas encontradas y correcciones

| # | Falla | Causa | Corrección | Commit |
|---|---|---|---|---|

## 6. Pendientes
Lo que no se pudo ejecutar o validar, y quién lo hace.

## 7. Evidencia
Archivos en `docs/pruebas/evidencia/sprint-N/`.
