// scripts/verificar-entorno.mjs — Comprueba que el entorno sirve para correr el proyecto.
// Sin dependencias: solo módulos de Node. Uso: npm run verificar-entorno [-- --ci]
//
// Revisa:
//   1. Versión de Node >= la mínima de Expo SDK 57 (debe coincidir con .nvmrc y engines).
//   2. Que exista package-lock.json (el CI instala con `npm ci`, que lo exige).
//   3. Solo fuera de CI: que exista .env o la variable EXPO_PUBLIC_API_URL.
// Termina con código 1 si algo falla.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const NODE_MINIMO = [22, 13, 0];

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const enCI = process.argv.includes("--ci") || process.env.CI === "true";

/** "22.13.1" -> [22, 13, 1] */
const partes = (version) => version.split(".").map((n) => Number.parseInt(n, 10) || 0);

function esMenor(actual, minimo) {
  for (let i = 0; i < 3; i++) {
    if (actual[i] !== minimo[i]) return actual[i] < minimo[i];
  }
  return false;
}

const resultados = [];
const revisar = (nombre, ok, detalle, solucion) => resultados.push({ nombre, ok, detalle, solucion });

// 1. Versión de Node
const nodeActual = process.versions.node;
const nodeMinimo = NODE_MINIMO.join(".");
revisar(
  "Versión de Node",
  !esMenor(partes(nodeActual), NODE_MINIMO),
  `se usa ${nodeActual}, se requiere ${nodeMinimo} o superior`,
  `Instala Node ${nodeMinimo}+ (con nvm: "nvm install" y "nvm use" leen .nvmrc).`,
);

// 2. package-lock.json
const hayLock = existsSync(join(raiz, "package-lock.json"));
revisar(
  "package-lock.json",
  hayLock,
  hayLock ? "encontrado" : "no existe y `npm ci` lo necesita para instalar versiones exactas",
  'Ejecuta "npm install" para generarlo y súbelo al repositorio.',
);

// 3. Variable de la API (solo fuera de CI)
if (enCI) {
  console.log("Modo CI: se omite la revisión de .env y EXPO_PUBLIC_API_URL.\n");
} else {
  const hayEnv = existsSync(join(raiz, ".env"));
  const hayVariable = Boolean(process.env.EXPO_PUBLIC_API_URL);
  revisar(
    "URL de la API",
    hayEnv || hayVariable,
    hayEnv ? "se encontró .env" : hayVariable ? "EXPO_PUBLIC_API_URL está definida" : "no hay .env ni EXPO_PUBLIC_API_URL",
    'Copia .env.example a .env y ajusta EXPO_PUBLIC_API_URL (en dispositivo físico, usa la IP de tu PC).',
  );
}

console.log("Verificación del entorno");
for (const r of resultados) {
  console.log(`  [${r.ok ? "OK" : "FALLO"}] ${r.nombre}: ${r.detalle}`);
  if (!r.ok) console.log(`          -> ${r.solucion}`);
}

const fallos = resultados.filter((r) => !r.ok).length;
if (fallos > 0) {
  console.error(`\nEl entorno no es válido: ${fallos} comprobación(es) fallaron.`);
  process.exit(1);
}
console.log("\nEntorno correcto.");
