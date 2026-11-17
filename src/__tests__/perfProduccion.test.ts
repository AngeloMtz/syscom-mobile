/* eslint-disable @typescript-eslint/no-require-imports */
// Lógica pura de la medición de SOLO LECTURA contra producción (scripts/lib/perfProduccion.js).
// Toda la E/S va simulada: estas pruebas no hacen ninguna petición de red.
const {
  MAX_PETICIONES,
  PLAN,
  RUTAS_PERMITIDAS,
  evaluarEntornoProduccion,
  medirRutas,
  redactar,
  resumirRuta,
  validarPeticion,
} = require("../../scripts/lib/perfProduccion.js");

const conToken = { conToken: true };
const sinToken = { conToken: false };

describe("evaluarEntornoProduccion", () => {
  it("rechaza si falta PERF_API_URL (no hay valor por defecto)", () => {
    const r = evaluarEntornoProduccion({});
    expect(r.ok).toBe(false);
    expect(r.motivos.join(" ")).toContain("Falta PERF_API_URL");
  });

  it.each(["http://servidor.ejemplo/api", "ftp://servidor.ejemplo/api", "no es una url"])("rechaza %s", (url) => {
    expect(evaluarEntornoProduccion({ PERF_API_URL: url }).ok).toBe(false);
  });

  it("rechaza URL con credenciales o parámetros incrustados", () => {
    expect(evaluarEntornoProduccion({ PERF_API_URL: "https://u:p@servidor.ejemplo/api" }).ok).toBe(false);
    expect(evaluarEntornoProduccion({ PERF_API_URL: "https://servidor.ejemplo/api?x=1" }).ok).toBe(false);
  });

  it("acepta https, quita la barra final y detecta el token", () => {
    const r = evaluarEntornoProduccion({ PERF_API_URL: "https://servidor.ejemplo/api/", PERF_TOKEN: "abc" });
    expect(r).toMatchObject({ ok: true, url: "https://servidor.ejemplo/api", conToken: true });
    expect(evaluarEntornoProduccion({ PERF_API_URL: "https://servidor.ejemplo/api" }).conToken).toBe(false);
  });
});

describe("validarPeticion: solo GET y solo rutas permitidas", () => {
  it.each(["POST", "PATCH", "PUT", "DELETE", "HEAD"])("rechaza el método %s", (metodo) => {
    expect(() => validarPeticion(metodo, "/catalog/products", conToken)).toThrow(/solo se permite GET/);
  });

  it("acepta get en minúsculas", () => {
    expect(() => validarPeticion("get", "/catalog/categories", sinToken)).not.toThrow();
  });

  it.each([
    "/payments/checkout",
    "/cart/items/1",
    "/auth/login",
    "/profile",
    "/admin/users",
    "/catalog/products/abc",
    "/orders/1/cancel",
    "/catalog/../admin",
    "//otro-host/cart",
    "https://otro-host/cart",
    "/catalog/products ",
  ])("rechaza la ruta %s", (ruta) => {
    expect(() => validarPeticion("GET", ruta, conToken)).toThrow(/Ruta rechazada/);
  });

  it("solo acepta los parámetros page y limit con valor numérico", () => {
    expect(() => validarPeticion("GET", "/catalog/products?page=1&limit=20", sinToken)).not.toThrow();
    expect(() => validarPeticion("GET", "/catalog/products?search=x", sinToken)).toThrow(/no está permitido/);
    expect(() => validarPeticion("GET", "/catalog/products?page=1;drop", sinToken)).toThrow(/no está permitido/);
    expect(() => validarPeticion("GET", "/catalog/products?page=", sinToken)).toThrow(/no está permitido/);
  });

  it("las rutas autenticadas exigen token", () => {
    for (const ruta of ["/cart", "/profile/addresses", "/orders?page=1&limit=10", "/orders/5"]) {
      expect(() => validarPeticion("GET", ruta, sinToken)).toThrow(/requiere PERF_TOKEN/);
      expect(() => validarPeticion("GET", ruta, conToken)).not.toThrow();
    }
  });

  it("todas las rutas del plan están en la lista permitida", () => {
    const ctx = { idProducto: 1, idPedido: 2 };
    for (const paso of PLAN) {
      expect(() => validarPeticion("GET", paso.ruta(ctx), conToken)).not.toThrow();
    }
    expect(RUTAS_PERMITIDAS).toHaveLength(10);
  });

  it("el plan completo cabe en el máximo de peticiones", () => {
    expect(PLAN.length * 20).toBeLessThanOrEqual(MAX_PETICIONES);
  });
});

describe("redactar", () => {
  it("quita token, contraseña y URL de un texto", () => {
    const txt = "fallo en https://servidor.ejemplo/api con Bearer tok123 y clave s3cr3t";
    const limpio = redactar(txt, ["tok123", "s3cr3t", "https://servidor.ejemplo/api", undefined, ""]);
    expect(limpio).not.toMatch(/tok123|s3cr3t|servidor\.ejemplo/);
    expect(limpio).toContain("***");
  });
});

describe("resumirRuta", () => {
  it("conserva las muestras EN ORDEN y marca la primera", () => {
    const m = resumirRuta(
      "GET /x",
      [
        { ok: true, status: 200, ms: 900 },
        { ok: true, status: 200, ms: 100 },
        { ok: true, status: 200, ms: 300 },
      ],
      1000,
    );
    expect(m.muestras.map((s: { ms: number }) => s.ms)).toEqual([900, 100, 300]);
    expect(m.muestras.map((s: { primera: boolean }) => s.primera)).toEqual([true, false, false]);
    expect(m.muestras.map((s: { orden: number }) => s.orden)).toEqual([1, 2, 3]);
  });

  it("calcula n, mín., p50, p95, máx. y media con las muestras correctas", () => {
    const muestras = Array.from({ length: 20 }, (_, i) => ({ ok: true, status: 200, ms: (i + 1) * 10 }));
    const m = resumirRuta("GET /x", muestras, 1000);
    expect(m).toMatchObject({ n: 20, min: 10, p50: 100, p95: 190, max: 200, media: 105, errores: 0, veredicto: "cumple" });
  });

  it("el veredicto es no cumple si el p95 llega al umbral", () => {
    const muestras = Array.from({ length: 20 }, () => ({ ok: true, status: 200, ms: 1000 }));
    expect(resumirRuta("GET /x", muestras, 1000).veredicto).toBe("no cumple");
  });

  it("con errores no declara cumple y no cuenta los tiempos fallidos", () => {
    const m = resumirRuta(
      "GET /x",
      [
        { ok: true, status: 200, ms: 50 },
        { ok: false, status: 500, ms: 20000 },
      ],
      1000,
    );
    expect(m).toMatchObject({ n: 1, errores: 1, max: 50, veredicto: "con errores" });
    expect(m.muestras).toHaveLength(2);
  });

  it("sin ninguna muestra correcta: sin datos", () => {
    expect(resumirRuta("GET /x", [{ ok: false, status: 0, ms: 5 }], 1000).veredicto).toBe("sin datos");
  });
});

/** Simula la API: responde según la ruta y registra cada petición. */
function falsa(responder: (ruta: string, n: number) => { ok: boolean; status: number; cuerpo?: unknown }) {
  const llamadas: { ruta: string; auth: boolean }[] = [];
  const dormir = jest.fn(async (_ms: number) => undefined);
  const pedir = jest.fn(async (ruta: string, { auth }: { auth: boolean }) => {
    llamadas.push({ ruta, auth });
    const r = responder(ruta, llamadas.length);
    return { ms: 100 + llamadas.length, ...r };
  });
  return { llamadas, dormir, pedir };
}

const sano = (ruta: string) => {
  if (ruta.startsWith("/catalog/products?")) return { ok: true, status: 200, cuerpo: { data: [{ id: 7 }] } };
  if (ruta.startsWith("/orders?")) return { ok: true, status: 200, cuerpo: { data: [{ id_pedido: 42 }] } };
  return { ok: true, status: 200, cuerpo: { data: [] } };
};

describe("medirRutas", () => {
  it("sin token mide solo las 6 públicas, solo con GET a rutas permitidas, y omite las autenticadas", async () => {
    const api = falsa(sano);
    const r = await medirRutas({ pedir: api.pedir, dormir: api.dormir, conToken: false });
    expect(r.mediciones).toHaveLength(6);
    expect(r.totalPeticiones).toBe(120);
    expect(api.llamadas.every((l) => !l.auth)).toBe(true);
    expect(r.omitidas.map((o: { nombre: string }) => o.nombre)).toEqual([
      "GET /cart",
      "GET /profile/addresses",
      "GET /orders",
      "GET /orders/:id",
    ]);
    expect(r.detenida).toBeNull();
  });

  it("con token mide las 10 rutas, llega a 200 peticiones y reutiliza los ids descubiertos", async () => {
    const api = falsa(sano);
    const r = await medirRutas({ pedir: api.pedir, dormir: api.dormir, conToken: true });
    expect(r.mediciones).toHaveLength(10);
    expect(r.totalPeticiones).toBe(200);
    const rutas = api.llamadas.map((l) => l.ruta);
    expect(rutas).toContain("/catalog/products/7");
    expect(rutas).toContain("/reviews/product/7?page=1&limit=5");
    expect(rutas).toContain("/orders/42");
    expect(api.llamadas.filter((l) => l.auth)).toHaveLength(80);
  });

  it("pausa 250 ms entre peticiones (no antes de la primera)", async () => {
    const api = falsa(sano);
    await medirRutas({ pedir: api.pedir, dormir: api.dormir, conToken: false, repeticiones: 2 });
    expect(api.dormir).toHaveBeenCalledTimes(api.pedir.mock.calls.length - 1);
    expect(api.dormir).toHaveBeenCalledWith(250);
  });

  it("no excede el máximo de peticiones", async () => {
    const api = falsa(sano);
    const r = await medirRutas({ pedir: api.pedir, dormir: api.dormir, conToken: true, maxPeticiones: 30 });
    expect(r.totalPeticiones).toBe(30);
    expect(r.detenida).toMatch(/máximo de 30/);
  });

  it("se detiene tras 3 respuestas seguidas 429/5xx", async () => {
    const api = falsa((ruta) => (ruta.startsWith("/catalog/featured") ? { ok: false, status: 503 } : sano(ruta)));
    const r = await medirRutas({ pedir: api.pedir, dormir: api.dormir, conToken: true });
    expect(r.detenida).toMatch(/3 respuestas seguidas 429\/5xx \(última: 503\)/);
    const destacados = r.mediciones.find((m: { nombre: string }) => m.nombre === "GET /catalog/featured");
    expect(destacados.errores).toBe(3);
    expect(destacados.veredicto).toBe("sin datos");
    // No se midió nada después de detenerse.
    expect(r.mediciones.map((m: { nombre: string }) => m.nombre)).not.toContain("GET /cart");
    expect(api.llamadas.some((l) => l.ruta === "/cart")).toBe(false);
  });

  it("un 429 aislado no detiene la medición", async () => {
    const api = falsa((ruta, n) => (n === 5 ? { ok: false, status: 429 } : sano(ruta)));
    const r = await medirRutas({ pedir: api.pedir, dormir: api.dormir, conToken: false });
    expect(r.detenida).toBeNull();
    expect(r.mediciones[0]).toMatchObject({ errores: 1, veredicto: "con errores" });
  });

  it("si el servidor rechaza el token (401) omite el resto de rutas autenticadas", async () => {
    const api = falsa((ruta) => (ruta === "/cart" ? { ok: false, status: 401 } : sano(ruta)));
    const r = await medirRutas({ pedir: api.pedir, dormir: api.dormir, conToken: true });
    expect(r.tokenInvalido).toBe(true);
    expect(api.llamadas.filter((l) => l.auth)).toHaveLength(1);
    expect(r.omitidas.map((o: { motivo: string }) => o.motivo)).toContain("el servidor rechazó el token (401/403)");
  });

  it("omite rutas con id si no se pudo descubrir (catálogo vacío o sin pedidos)", async () => {
    const api = falsa(() => ({ ok: true, status: 200, cuerpo: { data: [] } }));
    const r = await medirRutas({ pedir: api.pedir, dormir: api.dormir, conToken: true });
    const omitidas = r.omitidas.map((o: { nombre: string }) => o.nombre);
    expect(omitidas).toEqual(["GET /catalog/products/:id", "GET /reviews/product/:id", "GET /orders/:id"]);
  });

  it("la primera muestra de cada ruta queda marcada en el resultado", async () => {
    const api = falsa(sano);
    const r = await medirRutas({ pedir: api.pedir, dormir: api.dormir, conToken: false, repeticiones: 3 });
    for (const m of r.mediciones) {
      expect(m.muestras.map((s: { primera: boolean }) => s.primera)).toEqual([true, false, false]);
    }
  });
});
