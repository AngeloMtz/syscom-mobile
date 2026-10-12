// scripts/medir-rendimiento.mjs — Mide tiempos de respuesta del flujo de compra (Sprint 3, #35).
// Sin dependencias: Node >= 22 (fetch). SOLO corre contra el backend LOCAL; ver scripts/lib/perfGuard.js.
//
// Uso (desde la raíz del repo):
//   # Solo lectura (GET /cart, /profile/addresses, /orders, /orders/:id):
//   PERF_TOKEN=<jwt> node scripts/medir-rendimiento.mjs
//   # Con escrituras (carrito y checkout; el backend local DEBE apuntar a la rama de Neon):
//   PERF_TOKEN=<jwt> PERF_DB_ES_RAMA=si PERF_PRODUCT_ID=<id> node scripts/medir-rendimiento.mjs --con-escrituras
//   # Más, N mediciones webhook -> pedido (cada una pide confirmar un PaymentIntent a mano):
//   ... node scripts/medir-rendimiento.mjs --con-escrituras --webhook=3
//
// Variables: PERF_API_URL (default http://localhost:4000/api), PERF_TOKEN o PERF_CORREO + PERF_PASSWORD
// (cuenta de prueba sin 2FA), PERF_N (repeticiones, default 20), PERF_DB_ES_RAMA, PERF_PRODUCT_ID.
// Opciones: --con-escrituras, --webhook=N (1 a 10), --salida=<ruta del JSON>.
// Nunca imprime ni guarda el token ni la contraseña.
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { UMBRALES_MS, estadisticas, evaluarEntorno, redactar, veredicto } = require("./lib/perfGuard.js");

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const SALIDA_POR_DEFECTO = join(raiz, "docs", "pruebas", "evidencia", "sprint-3", "rendimiento.json");
const TIMEOUT_PETICION_MS = 30_000;
const TIMEOUT_WEBHOOK_MS = 60_000;
const INTERVALO_WEBHOOK_MS = 250;
const AVISO =
  "Tiempos medidos contra el backend local con la base en una rama de Neon. No representan producción (Railway).";

const entorno = evaluarEntorno(process.env, argv);
if (!entorno.ok) {
  console.error("Medición rechazada por la guarda:");
  for (const m of entorno.motivos) console.error(`  - ${m}`);
  process.exit(2);
}

const secretos = [process.env.PERF_TOKEN, process.env.PERF_PASSWORD];
const seguro = (texto) => redactar(texto, secretos);
const { url, modo, repeticiones, webhook } = entorno;
const base = url.replace(/\/+$/, "");
const salida = resolve(argv.find((a) => a.startsWith("--salida="))?.slice("--salida=".length) ?? SALIDA_POR_DEFECTO);
let token = process.env.PERF_TOKEN;

/** Petición con medición. Devuelve { ok, status, ms, cuerpo }. Nunca lanza. */
async function pedir(metodo, ruta, cuerpo) {
  const inicio = performance.now();
  try {
    const r = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        "X-Client": "mobile",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIMEOUT_PETICION_MS),
    });
    const texto = await r.text();
    const ms = performance.now() - inicio;
    let datos = null;
    try {
      datos = texto ? JSON.parse(texto) : null;
    } catch {
      /* cuerpo no JSON */
    }
    return { ok: r.ok, status: r.status, ms, cuerpo: datos };
  } catch (e) {
    return { ok: false, status: 0, ms: performance.now() - inicio, cuerpo: null, error: seguro(e?.message ?? e) };
  }
}

const mediciones = [];

/** Repite `n` veces una petición y registra estadísticas + veredicto contra el umbral. */
async function medir(nombre, umbralMs, n, hacer) {
  const tiempos = [];
  let errores = 0;
  for (let i = 0; i < n; i++) {
    const r = await hacer(i);
    if (r.ok) tiempos.push(r.ms);
    else errores += 1;
  }
  const est = estadisticas(tiempos);
  const m = {
    nombre,
    umbralMs,
    ...est,
    errores,
    veredicto: errores > 0 && est.n === 0 ? "sin datos" : veredicto(est.p95, umbralMs),
  };
  mediciones.push(m);
  const f = (v) => (v === null ? "-" : v.toFixed(0));
  console.log(
    `${nombre.padEnd(26)} n=${m.n} err=${errores} p50=${f(m.p50)}ms p95=${f(m.p95)}ms max=${f(m.max)}ms ` +
      `(umbral p95 < ${umbralMs}ms) → ${m.veredicto}`,
  );
  return m;
}

/** Espera una línea de stdin. El iterador encola las líneas, así que no se pierde ninguna. */
async function esperarEnter(lineas, mensaje) {
  console.log(mensaje);
  await lineas.next();
}

async function medirWebhook(cantidad) {
  const rl = createInterface({ input: process.stdin });
  const lineas = rl[Symbol.asyncIterator]();
  const lista = [];
  console.log("\n— Webhook → pedido —");
  console.log("Requiere `stripe listen --forward-to localhost:4000/api/webhooks/stripe` corriendo en otra terminal.");
  for (let i = 1; i <= cantidad; i++) {
    const agregar = await pedir("POST", `/cart/items/${process.env.PERF_PRODUCT_ID}`);
    const dir = await pedir("GET", "/profile/addresses");
    const idDireccion = dir.cuerpo?.data?.[0]?.id_direccion;
    const co = agregar.ok && idDireccion !== undefined ? await pedir("POST", "/payments/checkout", { id_direccion: idDireccion }) : null;
    const pi = co?.cuerpo?.data?.paymentIntentId;
    if (!pi) {
      console.log(`[${i}/${cantidad}] No se pudo crear el PaymentIntent (estado ${co?.status ?? agregar.status}).`);
      lista.push({ ms: null, motivo: "no se creó el PaymentIntent" });
      continue;
    }
    await esperarEnter(
      lineas,
      `[${i}/${cantidad}] Ejecuta en otra terminal:\n  stripe payment_intents confirm ${pi} --payment-method=pm_card_visa\n` +
        "Presiona Enter y lanza el comando de inmediato (el cronómetro arranca al presionar Enter).",
    );
    const inicio = performance.now();
    let ms = null;
    while (performance.now() - inicio < TIMEOUT_WEBHOOK_MS) {
      const r = await pedir("GET", `/payments/order-status/${encodeURIComponent(pi)}`);
      if (r.ok && r.cuerpo?.data) {
        ms = performance.now() - inicio;
        break;
      }
      await new Promise((res) => setTimeout(res, INTERVALO_WEBHOOK_MS));
    }
    lista.push(ms === null ? { ms: null, motivo: "tiempo agotado sin pedido" } : { ms: Math.round(ms) });
    console.log(`[${i}/${cantidad}] ${ms === null ? "sin pedido (60 s)" : `pedido creado en ${ms.toFixed(0)} ms`}`);
  }
  rl.close();
  const validos = lista.filter((x) => typeof x.ms === "number").map((x) => x.ms);
  const est = estadisticas(validos);
  const peor = est.max;
  const resultado = {
    umbralMs: UMBRALES_MS.webhook,
    mediciones: lista,
    ...est,
    veredicto: lista.length > validos.length ? "no cumple" : veredicto(peor, UMBRALES_MS.webhook),
    nota:
      "El cronómetro arranca al presionar Enter, que se hace justo al lanzar el comando de Stripe: " +
      "incluye ese pequeño retraso humano y el sondeo cada 250 ms (sobreestima ligeramente).",
  };
  console.log(`Webhook → pedido: peor caso=${peor ?? "-"}ms (umbral < ${UMBRALES_MS.webhook}ms) → ${resultado.veredicto}`);
  return resultado;
}

async function principal() {
  console.log(`Medición en modo ${modo} contra ${base} (${repeticiones} repeticiones)`);
  console.log(AVISO);

  if (!token) {
    const r = await pedir("POST", "/auth/login", {
      correo: process.env.PERF_CORREO,
      password: process.env.PERF_PASSWORD,
    });
    token = r.cuerpo?.data?.token;
    if (!r.ok || typeof token !== "string") {
      console.error(`No se pudo iniciar sesión (estado ${r.status}). ¿La cuenta tiene 2FA? Usa PERF_TOKEN.`);
      process.exit(2);
    }
    secretos.push(token);
  }

  // — Lectura —
  await medir("GET /cart", UMBRALES_MS.lectura, repeticiones, () => pedir("GET", "/cart"));
  await medir("GET /profile/addresses", UMBRALES_MS.lectura, repeticiones, () => pedir("GET", "/profile/addresses"));
  let idPedido = null;
  await medir("GET /orders", UMBRALES_MS.lectura, repeticiones, async (i) => {
    const r = await pedir("GET", "/orders?page=1&limit=10");
    if (i === 0) idPedido = r.cuerpo?.data?.[0]?.id_pedido ?? null;
    return r;
  });
  if (idPedido !== null) {
    await medir("GET /orders/:id", UMBRALES_MS.lectura, repeticiones, () => pedir("GET", `/orders/${idPedido}`));
  } else {
    console.log("GET /orders/:id             omitido: la cuenta no tiene pedidos.");
  }

  // — Escrituras —
  let resultadoWebhook;
  if (modo === "escritura") {
    const id = process.env.PERF_PRODUCT_ID;
    const item = `/cart/items/${id}`;
    await medir("POST /cart/items/:id", UMBRALES_MS.carrito, repeticiones, () => pedir("POST", item));
    await medir("PATCH /cart/items/:id", UMBRALES_MS.carrito, repeticiones, () => pedir("PATCH", item, { cantidad: 1 }));
    await medir("DELETE /cart/items/:id", UMBRALES_MS.carrito, repeticiones, () => pedir("DELETE", item));

    // Checkout: necesita carrito con el producto y una dirección. Crea PaymentIntents de prueba sin confirmar.
    await pedir("POST", item);
    const dir = await pedir("GET", "/profile/addresses");
    const idDireccion = dir.cuerpo?.data?.[0]?.id_direccion;
    if (idDireccion === undefined) {
      console.log("POST /payments/checkout     omitido: la cuenta de prueba no tiene direcciones.");
    } else {
      await medir("POST /payments/checkout", UMBRALES_MS.checkout, repeticiones, () =>
        pedir("POST", "/payments/checkout", { id_direccion: idDireccion }),
      );
    }
    await pedir("DELETE", item); // deja el carrito como estaba

    if (webhook !== null) resultadoWebhook = await medirWebhook(webhook);
  }

  const reporte = {
    fecha: new Date().toISOString(),
    modo,
    aviso: AVISO,
    api: base,
    repeticiones,
    umbralesMs: UMBRALES_MS,
    mediciones,
    ...(resultadoWebhook ? { webhook: resultadoWebhook } : {}),
  };
  mkdirSync(dirname(salida), { recursive: true });
  writeFileSync(salida, seguro(JSON.stringify(reporte, null, 2)) + "\n");
  console.log(`\nResultado guardado en ${salida}`);

  const hayErrores = mediciones.some((m) => m.errores > 0);
  process.exit(hayErrores ? 1 : 0);
}

principal().catch((e) => {
  console.error(`Error inesperado: ${seguro(e?.message ?? e)}`);
  process.exit(1);
});
