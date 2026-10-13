/* eslint-disable @typescript-eslint/no-require-imports */
// Prueba de extremo a extremo del script scripts/medir-rendimiento.mjs contra un
// servidor HTTP FALSO en 127.0.0.1. Comprueba que se niega fuera de localhost,
// que no hace escrituras en modo lectura, que no imprime el token y que mide.
// No toca el backend real ni Stripe.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const SCRIPT = path.resolve(process.cwd(), "scripts/medir-rendimiento.mjs");
const TOKEN = "token-secreto-de-prueba-123";

type Peticion = { metodo: string; ruta: string; auth: string | undefined; cliente: string | undefined };

interface Req {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  resume(): void;
  on(evento: "end", fn: () => void): void;
}
interface Res {
  writeHead(status: number, headers: Record<string, string>): void;
  end(cuerpo: string): void;
}
interface Servidor {
  listen(puerto: number, host: string, fn: () => void): void;
  close(fn: () => void): void;
  address(): { port: number };
}

let server: Servidor;
let puerto = 0;
let peticiones: Peticion[] = [];
let fallarCart = false;
let sinDirecciones = false;
// El carrito falso solo tiene el ítem de prueba: un DELETE sin ítem responde 404, como el backend.
let itemEnCarrito = false;
const consultasPorPi: Record<string, number> = {};
let contadorPi = 0;

beforeAll(async () => {
  server = http.createServer((req: Req, res: Res) => {
    const ruta = (req.url ?? "").split("?")[0];
    peticiones.push({
      metodo: req.method ?? "",
      ruta,
      auth: String(req.headers.authorization),
      cliente: req.headers["x-client"] as string | undefined,
    });
    const json = (status: number, cuerpo: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(cuerpo));
    };
    req.resume();
    req.on("end", () => {
      if (ruta === "/api/cart" && req.method === "GET") {
        if (fallarCart) return json(500, { success: false, message: "boom" });
        return json(200, { success: true, data: [], meta: { total: 0, totalPrice: "0.00" } });
      }
      if (ruta === "/api/profile/addresses") {
        return json(200, { success: true, data: sinDirecciones ? [] : [{ id_direccion: 3 }] });
      }
      if (ruta === "/api/orders") return json(200, { success: true, data: [{ id_pedido: 8 }], meta: { total: 1 } });
      if (ruta === "/api/orders/8") return json(200, { success: true, data: { id_pedido: 8 } });
      if (/^\/api\/cart\/items\/\d+$/.test(ruta)) {
        if (req.method === "POST") itemEnCarrito = true;
        if (req.method === "DELETE") {
          if (!itemEnCarrito) return json(404, { success: false, message: "El producto no está en el carrito" });
          itemEnCarrito = false;
        }
        return json(200, { success: true });
      }
      if (ruta === "/api/payments/checkout") {
        contadorPi += 1;
        return json(200, { success: true, data: { clientSecret: `pi_t${contadorPi}_secret`, paymentIntentId: `pi_t${contadorPi}` } });
      }
      const estado = /^\/api\/payments\/order-status\/(.+)$/.exec(ruta);
      if (estado) {
        consultasPorPi[estado[1]] = (consultasPorPi[estado[1]] ?? 0) + 1;
        return json(200, {
          success: true,
          data: consultasPorPi[estado[1]] >= 2 ? { id_pedido: 9, estado: "confirmado" } : null,
        });
      }
      return json(404, { success: false, message: "no existe" });
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  puerto = server.address().port;
});

afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

beforeEach(() => {
  peticiones = [];
  fallarCart = false;
  sinDirecciones = false;
  itemEnCarrito = false;
  contadorPi = 0;
  for (const k of Object.keys(consultasPorPi)) delete consultasPorPi[k];
});

interface Salida {
  codigo: number | null;
  stdout: string;
  stderr: string;
}

function correr(env: Record<string, string>, args: string[] = [], stdin = ""): Promise<Salida> {
  // Entorno limpio: nada de PERF_* ni claves del equipo de quien corra la prueba.
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === "string" && !k.startsWith("PERF_") && !/STRIPE/i.test(k)) base[k] = v;
  }
  return new Promise((resolve) => {
    const hijo = spawn(process.execPath, [SCRIPT, ...args], { env: { ...base, ...env } });
    let stdout = "";
    let stderr = "";
    hijo.stdout.on("data", (d: unknown) => (stdout += String(d)));
    hijo.stderr.on("data", (d: unknown) => (stderr += String(d)));
    hijo.on("close", (codigo: number | null) => resolve({ codigo, stdout, stderr }));
    hijo.stdin.end(stdin);
  });
}

const local = () => `http://127.0.0.1:${puerto}/api`;
const salidaJson = () => path.join(os.tmpdir(), `perf-${process.pid}-${Date.now()}.json`);

describe("scripts/medir-rendimiento.mjs: guardas", () => {
  it("se niega contra Railway/producción y no hace ninguna petición", async () => {
    const r = await correr({
      PERF_API_URL: "https://syscom-backend-production-dced.up.railway.app/api",
      PERF_TOKEN: TOKEN,
    });

    expect(r.codigo).toBe(2);
    expect(r.stderr).toMatch(/localhost/);
    expect(r.stdout + r.stderr).not.toContain(TOKEN);
    expect(peticiones).toHaveLength(0);
  });

  it("se niega con una clave live de Stripe en el entorno", async () => {
    const r = await correr({ PERF_API_URL: local(), PERF_TOKEN: TOKEN, MI_CLAVE: "sk_live_abc123" });

    expect(r.codigo).toBe(2);
    expect(r.stderr).toMatch(/live/i);
    expect(r.stderr).not.toContain("abc123");
    expect(peticiones).toHaveLength(0);
  });

  it("se niega a escribir sin PERF_DB_ES_RAMA=si", async () => {
    const r = await correr({ PERF_API_URL: local(), PERF_TOKEN: TOKEN, PERF_PRODUCT_ID: "7" }, ["--con-escrituras"]);

    expect(r.codigo).toBe(2);
    expect(r.stderr).toMatch(/PERF_DB_ES_RAMA/);
    expect(peticiones).toHaveLength(0);
  });
});

describe("scripts/medir-rendimiento.mjs: medición", () => {
  it("modo lectura: solo GET, con token como Bearer, sin imprimirlo, y escribe el JSON", async () => {
    const salida = salidaJson();
    const r = await correr({ PERF_API_URL: local(), PERF_TOKEN: TOKEN, PERF_N: "3" }, [`--salida=${salida}`]);

    expect(r.codigo).toBe(0);
    expect(r.stdout).toMatch(/GET \/cart/);
    expect(r.stdout).toMatch(/cumple/);
    expect(r.stdout + r.stderr).not.toContain(TOKEN);
    expect(peticiones.length).toBeGreaterThan(0);
    expect(peticiones.every((p) => p.metodo === "GET")).toBe(true);
    expect(peticiones.every((p) => p.auth === `Bearer ${TOKEN}` && p.cliente === "mobile")).toBe(true);

    const contenido = fs.readFileSync(salida, "utf8");
    expect(contenido).not.toContain(TOKEN);
    const datos = JSON.parse(contenido);
    expect(datos.modo).toBe("lectura");
    expect(datos.aviso).toMatch(/backend local/i);
    const cart = datos.mediciones.find((m: { nombre: string }) => m.nombre === "GET /cart");
    expect(cart).toMatchObject({ n: 3, errores: 0, umbralMs: 1000 });
    expect(["cumple", "no cumple"]).toContain(cart.veredicto);
    fs.unlinkSync(salida);
  });

  it("si un endpoint responde 500 lo cuenta como error y termina con código 1", async () => {
    fallarCart = true;
    const salida = salidaJson();
    const r = await correr({ PERF_API_URL: local(), PERF_TOKEN: TOKEN, PERF_N: "3" }, [`--salida=${salida}`]);

    expect(r.codigo).toBe(1);
    const datos = JSON.parse(fs.readFileSync(salida, "utf8"));
    const cart = datos.mediciones.find((m: { nombre: string }) => m.nombre === "GET /cart");
    expect(cart.errores).toBe(3);
    expect(cart.veredicto).toBe("sin datos");
    fs.unlinkSync(salida);
  });

  it("modo escritura: mide carrito y checkout contra el servidor local", async () => {
    const salida = salidaJson();
    const r = await correr(
      { PERF_API_URL: local(), PERF_TOKEN: TOKEN, PERF_N: "3", PERF_DB_ES_RAMA: "si", PERF_PRODUCT_ID: "7" },
      ["--con-escrituras", `--salida=${salida}`],
    );

    expect(r.codigo).toBe(0);
    const metodos = new Set(peticiones.map((p) => p.metodo));
    expect(metodos).toEqual(new Set(["GET", "POST", "PATCH", "DELETE"]));
    expect(peticiones.some((p) => p.metodo === "POST" && p.ruta === "/api/payments/checkout")).toBe(true);
    const datos = JSON.parse(fs.readFileSync(salida, "utf8"));
    expect(datos.modo).toBe("escritura");
    const nombres = datos.mediciones.map((m: { nombre: string }) => m.nombre);
    expect(nombres).toEqual(
      expect.arrayContaining([
        "POST /cart/items/:id",
        "PATCH /cart/items/:id",
        "DELETE /cart/items/:id",
        "POST /payments/checkout",
      ]),
    );
    expect(r.stdout + r.stderr).not.toContain(TOKEN);
    fs.unlinkSync(salida);
  });

  it("DELETE se mide sobre un ítem presente en cada repetición (sin errores 404 por borrar dos veces)", async () => {
    const salida = salidaJson();
    const r = await correr(
      { PERF_API_URL: local(), PERF_TOKEN: TOKEN, PERF_N: "4", PERF_DB_ES_RAMA: "si", PERF_PRODUCT_ID: "7" },
      ["--con-escrituras", `--salida=${salida}`],
    );

    expect(r.codigo).toBe(0);
    const datos = JSON.parse(fs.readFileSync(salida, "utf8"));
    const borrar = datos.mediciones.find((m: { nombre: string }) => m.nombre === "DELETE /cart/items/:id");
    expect(borrar).toMatchObject({ n: 4, errores: 0 });
    fs.unlinkSync(salida);
  });

  it("deja registrado en el JSON lo que se omitió y por qué (cuenta sin direcciones)", async () => {
    sinDirecciones = true;
    const salida = salidaJson();
    const r = await correr(
      { PERF_API_URL: local(), PERF_TOKEN: TOKEN, PERF_N: "2", PERF_DB_ES_RAMA: "si", PERF_PRODUCT_ID: "7" },
      ["--con-escrituras", `--salida=${salida}`],
    );

    expect(r.codigo).toBe(0);
    const datos = JSON.parse(fs.readFileSync(salida, "utf8"));
    expect(datos.omitidas).toEqual(
      expect.arrayContaining([expect.objectContaining({ nombre: "POST /payments/checkout", motivo: expect.stringMatching(/direcci/) })]),
    );
    fs.unlinkSync(salida);
  });

  it("--webhook=2: espera Enter, imprime el comando de Stripe y mide pedido por PaymentIntent", async () => {
    const salida = salidaJson();
    const r = await correr(
      { PERF_API_URL: local(), PERF_TOKEN: TOKEN, PERF_N: "1", PERF_DB_ES_RAMA: "si", PERF_PRODUCT_ID: "7" },
      ["--con-escrituras", "--webhook=2", `--salida=${salida}`],
      "\n\n",
    );

    expect(r.codigo).toBe(0);
    expect(r.stdout).toMatch(/stripe payment_intents confirm pi_t\d+ --payment-method=pm_card_visa/);
    const datos = JSON.parse(fs.readFileSync(salida, "utf8"));
    expect(datos.webhook.mediciones).toHaveLength(2);
    expect(datos.webhook.mediciones.every((m: { ms: number | null }) => typeof m.ms === "number")).toBe(true);
    expect(datos.webhook.umbralMs).toBe(10000);
    expect(datos.webhook.nota).toMatch(/Enter/);
    fs.unlinkSync(salida);
  });
});
