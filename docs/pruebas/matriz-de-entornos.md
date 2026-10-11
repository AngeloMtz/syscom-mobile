# Matriz de entornos

El proyecto se prueba en tres entornos. Cada uno tiene su propia verificación y su responsable.

| | Local (PC de desarrollo) | CI (GitHub Actions) | Dispositivo o emulador |
|---|---|---|---|
| **Para qué sirve** | Programar y correr lint, tipos y pruebas antes del PR | Decidir automáticamente si el PR pasa | Probar la app real y los criterios de aceptación |
| **Node** | 22.13 o superior (`.nvmrc` y `engines`) | Lee `.nvmrc` con `node-version-file` | No aplica |
| **Instalación** | `npm install` | `npm ci` (exige `package-lock.json`) | Expo Go o build de desarrollo |
| **`EXPO_PUBLIC_API_URL`** | En `.env` (copiar de `.env.example`) | No se necesita: las pruebas simulan Axios y no llaman a la API | `.env` con la IP de la PC (dispositivo físico) o la URL del backend |
| **Qué se verifica** | `npm run verificar-entorno` | Paso "Verificar entorno" con `--ci`, lint, tsc, auditoría y Jest | Manual, contra los criterios de cada issue |
| **Quién decide** | La persona que desarrolla | El pipeline: si falla, el PR no se fusiona | Quien valida, y queda en `docs/pruebas/sprint-N.md` |
| **¿Bloquea el PR?** | No | Sí ("Análisis estático" y "Pruebas unitarias") | No automáticamente; se registra como "PENDIENTE DE VALIDACIÓN MANUAL" si no se pudo ejecutar |

## Qué revisa `npm run verificar-entorno`
Script: `scripts/verificar-entorno.mjs` (sin dependencias; solo módulos de Node). Termina con código 1 si algo falla.

| Comprobación | Local | CI (`--ci` o `CI=true`) |
|---|---|---|
| Versión de Node mínima (22.13.0) | Sí | Sí |
| Existe `package-lock.json` | Sí | Sí |
| Existe `.env` o `EXPO_PUBLIC_API_URL` | Sí | No se revisa |

## Una sola fuente para la versión de Node
La versión mínima está escrita en tres sitios que deben coincidir. Si cambia (por ejemplo, al subir de SDK de Expo), se actualizan los tres:

1. `.nvmrc`: la que usan nvm y el CI.
2. `engines` en `package.json`: la que usa npm para avisar.
3. `NODE_MINIMO` en `scripts/verificar-entorno.mjs`: la que valida el script.

El mínimo actual (22.13) viene de la documentación de Expo SDK 57.

## Pendiente (no automatizado)
- Comprobar que el backend responde (la URL de `EXPO_PUBLIC_API_URL` está viva) se hace a mano al probar en dispositivo; no forma parte del CI porque depende de un servicio externo.
