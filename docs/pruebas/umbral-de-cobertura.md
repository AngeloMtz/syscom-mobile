# Umbral de cobertura

## Qué es
Jest mide qué porcentaje del código tiene pruebas y el pipeline lo revisa solo. Si la cobertura baja del umbral, `npx jest --ci --coverage` termina con código de salida distinto de 0, el job "Pruebas unitarias" falla y el PR no se puede fusionar.

El umbral está en `package.json`, dentro de la configuración de Jest (`coverageThreshold`, global):

| Métrica | Mínimo |
|---|---|
| Líneas | 80 % |
| Sentencias | 80 % |
| Funciones | 80 % |
| Ramas | 70 % |

Es un mínimo de seguridad, no una meta: la cobertura real es mucho más alta. Medición local del 2026-10-27 sobre `develop` en `dbb922e` (SDK 58, Jest 30): 99.34 % en líneas, 99.08 % en sentencias, 98.53 % en funciones y 97.5 % en ramas, con 119 suites y 1501 pruebas que pasan (`npx jest --ci --coverage`, exit 0). No es una ejecución de CI. El umbral (80/80/80/70) no cambió con la migración a SDK 58.

## A qué archivos se aplica
Solo a los archivos de `collectCoverageFrom` (también en `package.json`). Un archivo que no está en esa lista **no cuenta**: ni sube ni baja el porcentaje.

## Regla: carpeta nueva con lógica
Al crear una carpeta nueva con lógica (hooks, repositories, validaciones, stores, utilidades), hay que:

1. Escribir sus pruebas unitarias en el mismo PR.
2. Agregarla a `collectCoverageFrom`, por ejemplo `"src/features/<feature>/hooks/*.ts"`.

Si se olvida el paso 2, el código nuevo queda fuera de la medición y el umbral no lo protege.

## Cómo comprobarlo en local
```
npx jest --ci --coverage
```
Si la cobertura queda por debajo, Jest muestra líneas como `"global" coverage threshold for lines (80%) not met` y el código de salida es 1 (`echo $?` en bash, `$LASTEXITCODE` en PowerShell).
