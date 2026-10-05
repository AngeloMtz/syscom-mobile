# Contexto del proyecto: syscom-mobile

App móvil de SYSCOM (React Native + Expo + TypeScript), proyecto de la materia
*Gestión del Proceso de Desarrollo de Software* (UTHH). Repo: `AngeloMtz/syscom-mobile`.
Backend reutilizado de SYSCOM (Express + PostgreSQL). Tablero: GitHub Projects #3 de AngeloMtz.

## Equipo
- Angel (@AngeloMtz): catálogo, compra y reseñas (issues #6–#15 y #19)
- Luis Ángel (@LAHH18): base, auth, perfil, AR, push, chatbot, E2E (issues #1–#5, #16–#18, #20)
- Docentes: supervisión (no desarrollan)

## Metodología
Scrumban, 5 sprints de 2 semanas. Historias de usuario por sprint:

| Sprint | Historias |
|---|---|
| 1 | #1–#5 |
| 2 | #6–#10 |
| 3 | #11–#15 |
| 4 | #16–#18 |
| 5 | #19–#20 |

## Flujo de ramas (GitFlow) — REGLAS OBLIGATORIAS
1. NUNCA hacer push directo a `main` ni `develop` (están protegidas).
2. Cada trabajo va en su rama creada desde `develop`:
   - historias: `feature/<n°issue>-nombre`
   - pruebas: `test/<n°issue>-nombre`
   - correcciones: `fix/<n°issue>-nombre`
3. Los cambios entran por Pull Request hacia `develop`, con `Closes #n` en la descripción.
4. Cada PR requiere aprobación de la OTRA persona. Claude NUNCA aprueba ni fusiona PRs.
5. Al cerrar un sprint: `release/sprint-N` (desde `develop`) → PR hacia `main`.
6. Se borra la rama después de fusionar.
7. Commits con prefijo: `feat:`, `fix:`, `docs:`, `chore:`, `test:`.

## Plan de pruebas (issues ya creados, label `pruebas-qa`)
Los issues de prueba son sub-issues de la última historia de su bloque. Títulos en MAYÚSCULAS.

| Sprint | Unitarias | Est. código | Integración | Rendimiento | Aceptación |
|---|---|---|---|---|---|
| 1 (HU#1–#5) | #25 | #26 | — | — | #27 |
| 2 (HU#6–#10) | #28 | #29 | #30 | — | #31 |
| 3 (HU#11–#15) | #32 | #33 | #34 | #35 | #36 |
| 4 (HU#16–#18) | #37 | #38 | #39 | — | #40 |
| 5 (HU#19–#20) | #41 | #42 | — | — | #43 |
| Cierre | Integración completa #44 · Regresión #45 · Rendimiento #46 |||||

## Herramientas de prueba
- Análisis estático: `npx expo lint` y `npx tsc --noEmit`
- Unitarias: Jest con `jest-expo` + React Native Testing Library (instalar con `npx expo install`)
- Aceptación: manual contra los criterios de aceptación de cada issue (Expo Go / emulador)
- CI: `.github/workflows/ci.yml` (lint, tsc, audit, tests) corre en cada PR

## Documentación de pruebas
- Reporte por sprint en `docs/pruebas/sprint-N.md` (usar `docs/pruebas/PLANTILLA.md`)
- Evidencia (capturas, logs) en `docs/pruebas/evidencia/sprint-N/`
- Lo que Claude no pueda ejecutar (probar en dispositivo, capturas) se deja como
  "PENDIENTE DE VALIDACIÓN MANUAL" con instrucciones claras para el usuario.

## Reglas de trabajo para Claude
- Antes de cualquier cambio de código de producción, explicar qué se va a corregir y por qué.
- Correcciones mínimas y en commits separados (`fix:`); no refactorizar de más.
- Consultar la documentación de Expo de la versión instalada antes de tocar APIs de Expo.
- No inventar resultados: si una prueba no se pudo correr, decirlo.
- No incluir secretos ni `.env` en commits.
- Responder en español.
