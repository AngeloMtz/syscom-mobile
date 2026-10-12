// scripts/lib/perfGuard.js — Guarda y utilidades del script de rendimiento.
// CommonJS a propósito: lo cargan el script (.mjs) y las pruebas de Jest.
//
// Regla de oro: la medición SOLO corre contra el backend LOCAL (localhost). Nunca
// contra Railway/producción ni con claves live de Stripe. Nada de esto imprime
// tokens, contraseñas ni claves.

"use strict";

const URL_POR_DEFECTO = "http://localhost:4000/api";
const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Umbrales acordados (milisegundos). El reporte dice "cumple / no cumple" tal cual salga. */
const UMBRALES_MS = { lectura: 1000, carrito: 1500, checkout: 3000, webhook: 10000 };

/**
 * Decide si la medición puede correr. No lanza: acumula TODOS los motivos.
 * @param {Record<string, string | undefined>} env variables de entorno
 * @param {string[]} argv argumentos del script (sin node ni la ruta)
 */
function evaluarEntorno(env, argv) {
  const motivos = [];

  // 1. URL: solo localhost.
  const url = env.PERF_API_URL === undefined ? URL_POR_DEFECTO : env.PERF_API_URL;
  let parsed = null;
  try {
    parsed = new URL(url);
  } catch {
    motivos.push("PERF_API_URL no es una URL válida.");
  }
  if (parsed) {
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      motivos.push("PERF_API_URL debe usar http o https.");
    }
    if (!HOSTS_LOCALES.has(parsed.hostname) || parsed.username || parsed.password) {
      motivos.push(
        `PERF_API_URL debe apuntar a localhost, 127.0.0.1 o [::1] (recibido: ${parsed.hostname || "vacío"}). ` +
          "El script nunca se ejecuta contra Railway ni producción.",
      );
    }
  }

  // 2. Claves live de Stripe en cualquier variable (sin imprimir su valor).
  for (const [nombre, valor] of Object.entries(env)) {
    if (typeof valor === "string" && /(?:^|[^A-Za-z0-9])(?:pk|sk|rk)_live_/.test(valor)) {
      motivos.push(`La variable ${nombre} contiene una clave live de Stripe. Usa solo claves de prueba.`);
    }
  }

  // 3. Modo.
  const conEscrituras = argv.includes("--con-escrituras");
  const modo = conEscrituras ? "escritura" : "lectura";
  if (conEscrituras) {
    if (env.PERF_DB_ES_RAMA !== "si") {
      motivos.push(
        "El modo con escrituras exige PERF_DB_ES_RAMA=si (confirma que el backend local apunta a la rama de Neon, no a producción).",
      );
    }
    if (!/^\d+$/.test(env.PERF_PRODUCT_ID ?? "")) {
      motivos.push("El modo con escrituras exige PERF_PRODUCT_ID (id numérico de un producto de prueba con stock).");
    }
  }

  // 4. Webhook.
  let webhook = null;
  const argWebhook = argv.find((a) => a.startsWith("--webhook"));
  if (argWebhook !== undefined) {
    const n = Number(argWebhook.split("=")[1]);
    if (!conEscrituras) motivos.push("--webhook requiere --con-escrituras (crea pagos de prueba).");
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      motivos.push("--webhook=N debe ser un entero de 1 a 10.");
    } else {
      webhook = n;
    }
  }

  // 5. Credenciales (token o correo y contraseña de una cuenta de prueba).
  if (!env.PERF_TOKEN && !(env.PERF_CORREO && env.PERF_PASSWORD)) {
    motivos.push("Falta PERF_TOKEN (o PERF_CORREO y PERF_PASSWORD) de una cuenta de prueba.");
  }

  // 6. Repeticiones.
  let repeticiones = 20;
  if (env.PERF_N !== undefined) {
    const n = Number(env.PERF_N);
    if (!Number.isInteger(n) || n < 1 || n > 100) motivos.push("PERF_N debe ser un entero de 1 a 100.");
    else repeticiones = n;
  }

  return { ok: motivos.length === 0, motivos, modo, url, webhook, repeticiones };
}

/** Percentil por rango más cercano sobre valores ordenados. */
function percentil(ordenados, q) {
  return ordenados[Math.max(0, Math.ceil(q * ordenados.length) - 1)];
}

function estadisticas(valores) {
  if (valores.length === 0) return { n: 0, min: null, p50: null, p95: null, max: null, media: null };
  const o = [...valores].sort((a, b) => a - b);
  const suma = o.reduce((s, v) => s + v, 0);
  return {
    n: o.length,
    min: o[0],
    p50: percentil(o, 0.5),
    p95: percentil(o, 0.95),
    max: o[o.length - 1],
    media: Math.round((suma / o.length) * 100) / 100,
  };
}

/** "cumple" solo si el valor está estrictamente por debajo del umbral. */
function veredicto(valor, umbral) {
  if (valor === null || valor === undefined) return "sin datos";
  return valor < umbral ? "cumple" : "no cumple";
}

/** Quita secretos (token, contraseña) de un texto antes de mostrarlo o guardarlo. */
function redactar(texto, secretos) {
  let salida = String(texto);
  for (const s of secretos) {
    if (typeof s === "string" && s.length > 0) salida = salida.split(s).join("***");
  }
  return salida;
}

module.exports = { UMBRALES_MS, URL_POR_DEFECTO, estadisticas, evaluarEntorno, redactar, veredicto };
