// scripts/medir-produccion-lectura.mjs — Mide tiempos de la API de PRODUCCIÓN, solo lectura (Actividad 6, #225).
// Sin dependencias: Node >= 22 (fetch). Es independiente de scripts/medir-rendimiento.mjs (que solo corre en localhost).
//
// Solo hace peticiones GET a una lista fija de rutas (ver scripts/lib/perfProduccion.js). No escribe nada.
//
// Variables:
//   PERF_API_URL  OBLIGATORIA, sin valor por defecto, https (p. ej. https://<servidor>/api).
//   PERF_TOKEN    opcional. Con él se miden también /cart, /profile/addresses, /orders y /orders/:id.
// Nunca imprime ni guarda el token ni la URL. Detalles y comandos: docs/pruebas/rendimiento-produccion.md
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { release } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as dormirMs } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  MAX_PETICIONES,
  PAUSA_MS,
  REPETICIONES,
  UMBRAL_LECTURA_MS,
  evaluarEntornoProduccion,
  medirRutas,
  redactar,
  validarPeticion,
} = require("./lib/perfProduccion.js");

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const CARPETA_SALIDA = join(raiz, "docs", "pruebas", "evidencia", "actividad-6");
const TIMEOUT_PETICION_MS = 15_000;

const entorno = evaluarEntornoProduccion(process.env);
if (!entorno.ok) {
  console.error("Medición rechazada por la guarda:");
  for (const m of entorno.motivos) console.error(`  - ${m}`);
  process.exit(2);
}

const { url, conToken } = entorno;
const token = process.env.PERF_TOKEN?.trim();
// Se redactan token y URL de cualquier texto que se muestre o se guarde.
const seguro = (texto) => redactar(texto, [token, url, process.env.PERF_PASSWORD]);

/** GET con medición. Solo envía el token a las rutas autenticadas. Nunca lanza. */
async function pedir(ruta, { auth }) {
  validarPeticion("GET", ruta, { conToken }); // defensa en profundidad: la lib ya validó.
  const inicio = performance.now();
  try {
    const r = await fetch(`${url}${ruta}`, {
      method: "GET",
      headers: { "X-Client": "mobile", ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
      signal: AbortSignal.timeout(TIMEOUT_PETICION_MS),
    });
    const texto = await r.text();
    const ms = performance.now() - inicio;
    let cuerpo = null;
    try {
      cuerpo = texto ? JSON.parse(texto) : null;
    } catch {
      /* cuerpo no JSON */
    }
    return { ok: r.ok, status: r.status, ms, cuerpo };
  } catch (e) {
    return { ok: false, status: 0, ms: performance.now() - inicio, cuerpo: null, error: seguro(e?.message ?? e) };
  }
}

const f = (v) => (v === null ? "-" : v.toFixed(0));
console.log(
  `Medición de SOLO LECTURA contra producción · ${conToken ? "rutas públicas y autenticadas" : "solo rutas públicas (sin PERF_TOKEN)"}`,
);
console.log(`${REPETICIONES} repeticiones por ruta, ${PAUSA_MS} ms de pausa, máximo ${MAX_PETICIONES} peticiones.\n`);

const inicioUtc = new Date();
const resultado = await medirRutas({
  pedir,
  dormir: (ms) => dormirMs(ms),
  conToken,
  alMedir: (m) =>
    console.log(
      `${m.nombre.padEnd(26)} n=${m.n} err=${m.errores} 1ª=${f(m.muestras[0].ms)}ms p50=${f(m.p50)}ms ` +
        `p95=${f(m.p95)}ms max=${f(m.max)}ms (umbral p95 < ${m.umbralMs}ms) → ${m.veredicto}`,
    ),
});

for (const o of resultado.omitidas) console.log(`${o.nombre.padEnd(26)} omitida: ${o.motivo}`);
if (resultado.detenida) console.error(`\nMEDICIÓN DETENIDA: ${resultado.detenida}.`);
console.log(`\nPeticiones realizadas: ${resultado.totalPeticiones}.`);

const sello = inicioUtc.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const archivo = join(CARPETA_SALIDA, `rendimiento-produccion-${sello}.json`);
const informe = {
  actividad: "6 · rendimiento de producción, solo lectura (#225)",
  fecha_utc: inicioUtc.toISOString(),
  node: process.version,
  sistema_operativo: `${process.platform} ${release()}`,
  destino: "producción (URL no guardada)",
  origen: "computadora de Angel (Huejutla, Hidalgo); los tiempos incluyen latencia de red real",
  modo: conToken ? "publico+autenticado" : "publico",
  umbral_lectura_p95_ms: UMBRAL_LECTURA_MS,
  repeticiones_por_ruta: REPETICIONES,
  pausa_ms: PAUSA_MS,
  peticiones_realizadas: resultado.totalPeticiones,
  detenida: resultado.detenida,
  mediciones: resultado.mediciones,
  omitidas: resultado.omitidas,
};
mkdirSync(CARPETA_SALIDA, { recursive: true });
writeFileSync(archivo, seguro(JSON.stringify(informe, null, 2)) + "\n", "utf8");
console.log(`Resultados guardados en ${archivo.replace(raiz, ".")}`);

process.exit(resultado.detenida ? 3 : 0);
