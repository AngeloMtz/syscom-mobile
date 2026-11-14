// Verifica que un tag de release sea "v" + la versión de la app.
// Uso: node scripts/verificar-tag-version.mjs <tag>   (p. ej. v1.1.0)
// La versión se lee de app.config.js (expo.version) y de package.json (version);
// las dos deben coincidir entre sí y con el tag. Sale con código 1 si algo no cuadra.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tag = process.argv[2];

if (!tag) {
  console.error("Falta el tag. Uso: node scripts/verificar-tag-version.mjs <tag>");
  process.exit(1);
}

const versionApp = require("../app.config.js").expo.version;
const versionPaquete = require("../package.json").version;

if (versionApp !== versionPaquete) {
  console.error(
    `La versión de app.config.js (${versionApp}) no coincide con la de package.json (${versionPaquete}).`,
  );
  process.exit(1);
}

const esperado = `v${versionApp}`;
if (tag !== esperado) {
  console.error(
    `El tag "${tag}" no coincide con la versión de la app: se esperaba "${esperado}".`,
  );
  process.exit(1);
}

console.log(`OK: el tag ${tag} coincide con la versión de la app (${versionApp}).`);
