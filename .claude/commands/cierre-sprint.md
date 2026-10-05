---
description: Ejecuta las pruebas de cierre de un sprint, corrige fallas y genera el reporte
argument-hint: <número de sprint, ej. 1>
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
---

Cierre de pruebas del **Sprint $ARGUMENTS** de syscom-mobile. Usa el contexto de
`.claude/contexto-proyecto.md` (tabla de historias y de issues de prueba por sprint).

Sigue estos pasos en orden y no te saltes ninguno:

1. **Preparación**
   - `git fetch origin` y confirma que `develop` incluye las historias del sprint.
   - Crea la rama `test/sprint-$ARGUMENTS` desde `develop` actualizado.
   - Lee los issues de las historias del sprint (`gh issue view <n>`) y los de prueba
     que le tocan según la tabla del contexto.

2. **Análisis estático**
   - Ejecuta `npx expo lint` y `npx tsc --noEmit`. Guarda la salida completa.

3. **Pruebas unitarias**
   - Si no hay Jest configurado (script `test` en package.json), PROPÓN la instalación
     (`npx expo install jest-expo jest @types/jest`) y espera mi visto bueno antes de instalar.
   - Escribe pruebas unitarias para la lógica de las historias del sprint
     (validaciones, servicios, utilidades, hooks); no pruebes estilos ni detalles triviales.
   - Ejecuta `npm test -- --watchAll=false --coverage` y guarda el resultado.

4. **Pruebas de aceptación (manuales)**
   - De cada historia, extrae sus criterios de aceptación y arma una tabla:
     criterio | cómo probarlo paso a paso | resultado | evidencia.
   - Déjalos como "PENDIENTE DE VALIDACIÓN MANUAL": yo los recorro en la app y te paso el resultado.

5. **Correcciones**
   - Por cada falla real (lint, tipos o prueba), explícame la causa, corrige con el cambio
     mínimo y haz un commit `fix:` por cada una. Pregúntame antes de cambios grandes.

6. **Reporte**
   - Genera `docs/pruebas/sprint-$ARGUMENTS.md` con `docs/pruebas/PLANTILLA.md`:
     resultados por tipo de prueba, fallas encontradas, correcciones hechas (con commit)
     y pendientes manuales.

7. **Entrega**
   - Commit del reporte y las pruebas (`test:` / `docs:`), push SOLO de la rama `test/sprint-$ARGUMENTS`.
   - Muéstrame el resumen y pregúntame si abro el PR hacia `develop`. NO lo fusiones ni lo apruebes.
   - Dame un resumen final: qué pasó, qué falló, qué corregiste y qué debo documentar yo
     (capturas, validación en dispositivo).
