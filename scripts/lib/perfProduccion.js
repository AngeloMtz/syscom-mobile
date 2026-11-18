// scripts/lib/perfProduccion.js — Lógica pura de la medición de SOLO LECTURA contra producción.
// CommonJS a propósito: la cargan el script (.mjs) y las pruebas de Jest.
//
// Es independiente de scripts/lib/perfGuard.js (la guarda "solo localhost" no se toca).
// Reglas, todas aplicadas en código:
//   - Solo GET, a una lista fija de rutas (RUTAS_PERMITIDAS). Cualquier otra cosa se rechaza.
//   - PERF_API_URL es obligatoria, sin valor por defecto, y debe ser https.
//   - N = 20 por ruta, 250 ms de pausa, máximo 200 peticiones, alto ante 429/5xx repetidos.
//   - Nunca se imprime ni se guarda el token, la contraseña ni la URL.

"use strict";

const { estadisticas, redactar, veredicto } = require("./perfGuard.js");

const UMBRAL_LECTURA_MS = 1000; // Mismo valor que UMBRALES_MS.lectura; fijado en docs/pruebas/rendimiento-produccion.md.
const REPETICIONES = 20;
const PAUSA_MS = 250;
const MAX_PETICIONES = 200;
const MAX_FALLOS_SEGUIDOS = 3; // 429 o 5xx consecutivos antes de detenerse.

/**
 * Lista fija de rutas permitidas (solo GET). La app las llama así (ver src/features/*\/repositories).
 * `auth` indica que la app las pide con sesión y que por eso exigen PERF_TOKEN.
 */
const RUTAS_PERMITIDAS = [
  { patron: /^\/catalog\/products$/, auth: false },
  { patron: /^\/catalog\/products\/\d+$/, auth: false },
  { patron: /^\/catalog\/featured$/, auth: false },
  { patron: /^\/catalog\/categories$/, auth: false },
  { patron: /^\/catalog\/services$/, auth: false },
  { patron: /^\/reviews\/product\/\d+$/, auth: false },
  { patron: /^\/cart$/, auth: true },
  { patron: /^\/profile\/addresses$/, auth: true },
  { patron: /^\/orders$/, auth: true },
  { patron: /^\/orders\/\d+$/, auth: true },
];

/** Únicos parámetros de consulta que se aceptan, y solo con valor numérico. */
const PARAMETROS_PERMITIDOS = new Set(["page", "limit"]);

/**
 * Rutas que se miden, en orden. `ruta` puede ser una función del contexto (ids descubiertos en
 * respuestas anteriores); si devuelve null la ruta se omite. `capturar` guarda un id del cuerpo
 * de la PRIMERA muestra, sin hacer peticiones extra.
 */
const PLAN = [
  {
    nombre: "GET /catalog/products",
    ruta: () => "/catalog/products?page=1&limit=20",
    auth: false,
    capturar: (cuerpo, ctx) => {
      const id = cuerpo?.data?.[0]?.id;
      if (Number.isInteger(id)) ctx.idProducto = id;
    },
  },
  {
    nombre: "GET /catalog/products/:id",
    ruta: (ctx) => (ctx.idProducto === undefined ? null : `/catalog/products/${ctx.idProducto}`),
    auth: false,
    motivoOmision: "el catálogo no devolvió ningún producto",
  },
  { nombre: "GET /catalog/featured", ruta: () => "/catalog/featured?limit=8", auth: false },
  { nombre: "GET /catalog/categories", ruta: () => "/catalog/categories", auth: false },
  { nombre: "GET /catalog/services", ruta: () => "/catalog/services?page=1&limit=12", auth: false },
  {
    nombre: "GET /reviews/product/:id",
    ruta: (ctx) => (ctx.idProducto === undefined ? null : `/reviews/product/${ctx.idProducto}?page=1&limit=5`),
    auth: false,
    motivoOmision: "el catálogo no devolvió ningún producto",
  },
  { nombre: "GET /cart", ruta: () => "/cart", auth: true },
  { nombre: "GET /profile/addresses", ruta: () => "/profile/addresses", auth: true },
  {
    nombre: "GET /orders",
    ruta: () => "/orders?page=1&limit=10",
    auth: true,
    capturar: (cuerpo, ctx) => {
      const id = cuerpo?.data?.[0]?.id_pedido;
      if (Number.isInteger(id)) ctx.idPedido = id;
    },
  },
  {
    nombre: "GET /orders/:id",
    ruta: (ctx) => (ctx.idPedido === undefined ? null : `/orders/${ctx.idPedido}`),
    auth: true,
    motivoOmision: "la cuenta no tiene pedidos",
  },
];

/**
 * Decide si la medición puede correr. No lanza: acumula TODOS los motivos.
 * @param {Record<string, string | undefined>} env variables de entorno
 */
function evaluarEntornoProduccion(env) {
  const motivos = [];
  const crudo = env.PERF_API_URL;

  // 1. URL obligatoria, sin valor por defecto, solo https y sin credenciales incrustadas.
  let url = null;
  if (crudo === undefined || String(crudo).trim() === "") {
    motivos.push("Falta PERF_API_URL (obligatoria, sin valor por defecto). Ejemplo de forma: https://<servidor>/api");
  } else {
    try {
      const parsed = new URL(String(crudo).trim());
      if (parsed.protocol !== "https:") motivos.push("PERF_API_URL debe usar https.");
      else if (parsed.username || parsed.password) motivos.push("PERF_API_URL no debe llevar usuario ni contraseña.");
      else if (parsed.search || parsed.hash) motivos.push("PERF_API_URL no debe llevar parámetros ni fragmento.");
      else url = String(crudo).trim().replace(/\/+$/, "");
    } catch {
      motivos.push("PERF_API_URL no es una URL válida.");
    }
  }

  // 2. Token opcional: con él se miden también las rutas autenticadas.
  const conToken = typeof env.PERF_TOKEN === "string" && env.PERF_TOKEN.trim() !== "";

  return { ok: motivos.length === 0, motivos, url, conToken };
}

/**
 * Valida una petición ANTES de enviarla. Solo GET, solo rutas de la lista fija, solo los
 * parámetros `page` y `limit` con valor numérico. Lanza Error con un mensaje en español.
 * @param {string} metodo
 * @param {string} rutaConConsulta p. ej. "/catalog/products?page=1&limit=20"
 * @param {{ conToken: boolean }} opciones
 */
function validarPeticion(metodo, rutaConConsulta, { conToken }) {
  if (String(metodo).toUpperCase() !== "GET") {
    throw new Error(`Método rechazado: solo se permite GET (recibido: ${metodo}).`);
  }
  const texto = String(rutaConConsulta);
  if (!texto.startsWith("/") || texto.startsWith("//") || /[\s\\]/.test(texto) || texto.includes("..")) {
    throw new Error("Ruta rechazada: formato no permitido.");
  }
  const indice = texto.indexOf("?");
  const camino = indice === -1 ? texto : texto.slice(0, indice);
  const consulta = indice === -1 ? "" : texto.slice(indice + 1);

  const regla = RUTAS_PERMITIDAS.find((r) => r.patron.test(camino));
  if (!regla) throw new Error(`Ruta rechazada: ${camino} no está en la lista de rutas permitidas.`);
  if (regla.auth && !conToken) throw new Error(`Ruta rechazada: ${camino} requiere PERF_TOKEN.`);

  if (consulta !== "") {
    for (const par of consulta.split("&")) {
      const [clave, valor, ...resto] = par.split("=");
      if (resto.length > 0 || !PARAMETROS_PERMITIDOS.has(clave) || !/^\d{1,3}$/.test(valor ?? "")) {
        throw new Error(`Ruta rechazada: el parámetro de consulta "${clave}" no está permitido.`);
      }
    }
  }
  return { camino, consulta, auth: regla.auth };
}

/** Un fallo "grave" para detener la medición: 429 o 5xx. */
const esFalloGrave = (status) => status === 429 || (status >= 500 && status <= 599);

/**
 * Resume las muestras de una ruta. Conserva TODAS las muestras en orden y marca la primera.
 * Las estadísticas usan solo las peticiones correctas; con errores no se declara "cumple".
 * @param {string} nombre
 * @param {{ ok: boolean, status: number, ms: number }[]} muestras en el orden en que se hicieron
 * @param {number} umbralMs
 */
function resumirRuta(nombre, muestras, umbralMs) {
  const correctas = muestras.filter((m) => m.ok).map((m) => m.ms);
  const est = estadisticas(correctas);
  const errores = muestras.length - correctas.length;
  const redondear = (v) => (v === null ? null : Math.round(v * 100) / 100);
  return {
    nombre,
    umbralMs,
    n: est.n,
    min: redondear(est.min),
    p50: redondear(est.p50),
    p95: redondear(est.p95),
    max: redondear(est.max),
    media: redondear(est.media),
    errores,
    muestras: muestras.map((m, i) => ({
      orden: i + 1,
      primera: i === 0,
      ms: Math.round(m.ms * 100) / 100,
      status: m.status,
      ok: m.ok,
    })),
    veredicto: est.n === 0 ? "sin datos" : errores > 0 ? "con errores" : veredicto(est.p95, umbralMs),
  };
}

/**
 * Ejecuta el plan de mediciones. Toda la E/S va inyectada (`pedir`, `dormir`) para probarla sin red.
 * @param {{
 *   pedir: (ruta: string, opciones: { auth: boolean }) => Promise<{ ok: boolean, status: number, ms: number, cuerpo?: any }>,
 *   dormir: (ms: number) => Promise<void>,
 *   conToken: boolean,
 *   repeticiones?: number,
 *   maxPeticiones?: number,
 *   alMedir?: (m: object) => void,
 * }} deps
 */
async function medirRutas({ pedir, dormir, conToken, repeticiones = REPETICIONES, maxPeticiones = MAX_PETICIONES, alMedir }) {
  const mediciones = [];
  const omitidas = [];
  const ctx = {};
  let total = 0;
  let seguidos = 0;
  let detenida = null;
  let tokenInvalido = false;

  for (const paso of PLAN) {
    if (detenida) break;
    if (paso.auth && !conToken) {
      omitidas.push({ nombre: paso.nombre, motivo: "no hay PERF_TOKEN" });
      continue;
    }
    if (paso.auth && tokenInvalido) {
      omitidas.push({ nombre: paso.nombre, motivo: "el servidor rechazó el token (401/403)" });
      continue;
    }
    const ruta = paso.ruta(ctx);
    if (ruta === null) {
      omitidas.push({ nombre: paso.nombre, motivo: paso.motivoOmision ?? "dependía de un dato que no se obtuvo" });
      continue;
    }
    // La guarda se aplica a CADA petición, no solo a la primera.
    validarPeticion("GET", ruta, { conToken });

    const muestras = [];
    for (let i = 0; i < repeticiones; i++) {
      if (total >= maxPeticiones) {
        detenida = `se alcanzó el máximo de ${maxPeticiones} peticiones`;
        break;
      }
      if (total > 0) await dormir(PAUSA_MS);
      const r = await pedir(ruta, { auth: paso.auth });
      total += 1;
      muestras.push({ ok: r.ok, status: r.status, ms: r.ms });
      if (i === 0 && r.ok && paso.capturar) paso.capturar(r.cuerpo, ctx);

      if (esFalloGrave(r.status)) seguidos += 1;
      else seguidos = 0;
      if (seguidos >= MAX_FALLOS_SEGUIDOS) {
        detenida = `${MAX_FALLOS_SEGUIDOS} respuestas seguidas 429/5xx (última: ${r.status}) en ${paso.nombre}`;
        break;
      }
      if (paso.auth && (r.status === 401 || r.status === 403)) {
        tokenInvalido = true;
        break;
      }
    }
    if (muestras.length > 0) {
      const m = resumirRuta(paso.nombre, muestras, UMBRAL_LECTURA_MS);
      mediciones.push(m);
      if (alMedir) alMedir(m);
    }
  }
  return { mediciones, omitidas, totalPeticiones: total, detenida, tokenInvalido };
}

module.exports = {
  MAX_FALLOS_SEGUIDOS,
  MAX_PETICIONES,
  PAUSA_MS,
  PLAN,
  REPETICIONES,
  RUTAS_PERMITIDAS,
  UMBRAL_LECTURA_MS,
  esFalloGrave,
  evaluarEntornoProduccion,
  medirRutas,
  redactar,
  resumirRuta,
  validarPeticion,
};
