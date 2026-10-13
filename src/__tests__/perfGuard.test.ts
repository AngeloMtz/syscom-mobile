/* eslint-disable @typescript-eslint/no-require-imports */
// Guarda del script de rendimiento (scripts/lib/perfGuard.js, CommonJS para que
// lo carguen el script .mjs y Jest). El script SOLO puede correr contra el
// backend local: nunca contra Railway/producción ni con claves live.
const {
  UMBRALES_MS,
  estadisticas,
  evaluarEntorno,
  redactar,
  veredicto,
} = require("../../scripts/lib/perfGuard.js");

const base = { PERF_TOKEN: "token-de-prueba" };

describe("evaluarEntorno: URL", () => {
  it.each([
    "http://localhost:4000/api",
    "http://127.0.0.1:4000/api",
    "http://[::1]:4000/api",
    "http://localhost/api",
    "https://localhost:4443/api",
  ])("permite %s", (url) => {
    const r = evaluarEntorno({ ...base, PERF_API_URL: url }, []);
    expect(r.ok).toBe(true);
    expect(r.motivos).toEqual([]);
  });

  it("sin PERF_API_URL usa localhost:4000", () => {
    const r = evaluarEntorno(base, []);
    expect(r.ok).toBe(true);
    expect(r.url).toBe("http://localhost:4000/api");
  });

  it.each([
    ["Railway (producción)", "https://syscom-backend-production-dced.up.railway.app/api"],
    ["IP de la red local", "http://192.168.1.10:4000/api"],
    ["dominio que empieza con localhost", "http://localhost.evil.com/api"],
    ["truco de usuario@host", "https://localhost@evil.com/api"],
    ["otro puerto en un host remoto", "http://example.com:4000/api"],
    ["protocolo no http", "ftp://localhost/api"],
    ["texto que no es URL", "no-es-una-url"],
    ["cadena vacía", ""],
  ])("rechaza %s", (_nombre, url) => {
    const r = evaluarEntorno({ ...base, PERF_API_URL: url }, []);
    expect(r.ok).toBe(false);
    expect(r.motivos.length).toBeGreaterThan(0);
  });
});

describe("evaluarEntorno: claves live", () => {
  it.each([
    ["EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_live_abc123"],
    ["STRIPE_SECRET_KEY", "sk_live_abc123"],
    ["OTRA_VARIABLE", "rk_live_abc123"],
  ])("rechaza si %s es una clave live", (nombre, valor) => {
    const r = evaluarEntorno({ ...base, [nombre]: valor }, []);
    expect(r.ok).toBe(false);
    expect(r.motivos.join(" ")).toMatch(/live/i);
  });

  it("no imprime el valor de la clave en el motivo", () => {
    const r = evaluarEntorno({ ...base, STRIPE_SECRET_KEY: "sk_live_SECRETO123" }, []);
    expect(JSON.stringify(r)).not.toContain("SECRETO123");
  });

  it("acepta claves de prueba", () => {
    const r = evaluarEntorno(
      { ...base, EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_abc", STRIPE_SECRET_KEY: "sk_test_abc" },
      [],
    );
    expect(r.ok).toBe(true);
  });
});

describe("evaluarEntorno: modo y credenciales", () => {
  it("por defecto es solo lectura", () => {
    expect(evaluarEntorno(base, []).modo).toBe("lectura");
  });

  it("con escrituras exige PERF_DB_ES_RAMA=si", () => {
    expect(evaluarEntorno(base, ["--con-escrituras"]).ok).toBe(false);
    expect(evaluarEntorno({ ...base, PERF_DB_ES_RAMA: "yes" }, ["--con-escrituras"]).ok).toBe(false);
    expect(evaluarEntorno({ ...base, PERF_DB_ES_RAMA: "no" }, ["--con-escrituras"]).ok).toBe(false);
  });

  it("con PERF_DB_ES_RAMA=si permite las escrituras", () => {
    const r = evaluarEntorno({ ...base, PERF_DB_ES_RAMA: "si", PERF_PRODUCT_ID: "7" }, ["--con-escrituras"]);
    expect(r.ok).toBe(true);
    expect(r.modo).toBe("escritura");
  });

  it("las escrituras exigen un producto explícito (PERF_PRODUCT_ID)", () => {
    const r = evaluarEntorno({ ...base, PERF_DB_ES_RAMA: "si" }, ["--con-escrituras"]);
    expect(r.ok).toBe(false);
    expect(r.motivos.join(" ")).toMatch(/PERF_PRODUCT_ID/);
  });

  it("PERF_DB_ES_RAMA=si sin --con-escrituras no activa las escrituras", () => {
    expect(evaluarEntorno({ ...base, PERF_DB_ES_RAMA: "si" }, []).modo).toBe("lectura");
  });

  it("--webhook exige el modo con escrituras y un número de 1 a 10", () => {
    const env = { ...base, PERF_DB_ES_RAMA: "si", PERF_PRODUCT_ID: "7" };
    expect(evaluarEntorno(base, ["--webhook=3"]).ok).toBe(false);
    expect(evaluarEntorno(env, ["--con-escrituras", "--webhook=0"]).ok).toBe(false);
    expect(evaluarEntorno(env, ["--con-escrituras", "--webhook=11"]).ok).toBe(false);
    const r = evaluarEntorno(env, ["--con-escrituras", "--webhook=4"]);
    expect(r.ok).toBe(true);
    expect(r.webhook).toBe(4);
  });

  it("sin credenciales se rechaza; con token o con correo y contraseña se acepta", () => {
    expect(evaluarEntorno({}, []).ok).toBe(false);
    expect(evaluarEntorno({ PERF_CORREO: "a@b.c" }, []).ok).toBe(false);
    expect(evaluarEntorno({ PERF_CORREO: "a@b.c", PERF_PASSWORD: "x" }, []).ok).toBe(true);
    expect(evaluarEntorno({ PERF_TOKEN: "t" }, []).ok).toBe(true);
  });

  it("usa 20 mediciones por defecto y respeta PERF_N entre 1 y 100", () => {
    expect(evaluarEntorno(base, []).repeticiones).toBe(20);
    expect(evaluarEntorno({ ...base, PERF_N: "5" }, []).repeticiones).toBe(5);
    expect(evaluarEntorno({ ...base, PERF_N: "0" }, []).ok).toBe(false);
    expect(evaluarEntorno({ ...base, PERF_N: "abc" }, []).ok).toBe(false);
  });

  it("acumula todos los motivos en lugar de parar en el primero", () => {
    const r = evaluarEntorno(
      { PERF_API_URL: "https://example.com/api", STRIPE_SECRET_KEY: "sk_live_x" },
      ["--con-escrituras"],
    );
    expect(r.ok).toBe(false);
    expect(r.motivos.length).toBeGreaterThanOrEqual(3);
  });
});

describe("estadisticas", () => {
  it("calcula p50, p95, mínimo, máximo y media por rango más cercano", () => {
    const valores = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(estadisticas(valores)).toEqual({ n: 20, min: 1, p50: 10, p95: 19, max: 20, media: 10.5 });
  });

  it("no depende del orden de entrada", () => {
    expect(estadisticas([5, 1, 3]).p50).toBe(3);
  });

  it("con un solo valor", () => {
    expect(estadisticas([42])).toEqual({ n: 1, min: 42, p50: 42, p95: 42, max: 42, media: 42 });
  });

  it("sin valores devuelve nulos", () => {
    expect(estadisticas([])).toEqual({ n: 0, min: null, p50: null, p95: null, max: null, media: null });
  });
});

describe("veredicto y umbrales", () => {
  it("umbrales acordados", () => {
    expect(UMBRALES_MS).toEqual({ lectura: 1000, carrito: 1500, checkout: 3000, webhook: 10000 });
  });

  it("cumple por debajo del umbral y no cumple en o por encima", () => {
    expect(veredicto(999, 1000)).toBe("cumple");
    expect(veredicto(1000, 1000)).toBe("no cumple");
    expect(veredicto(1500, 1000)).toBe("no cumple");
  });

  it("sin datos no se declara cumplimiento", () => {
    expect(veredicto(null, 1000)).toBe("sin datos");
  });
});

describe("redactar", () => {
  it("quita tokens y contraseñas del texto", () => {
    const texto = "Authorization: Bearer abc.def.ghi y password=hunter2";
    expect(redactar(texto, ["abc.def.ghi", "hunter2"])).toBe("Authorization: Bearer *** y password=***");
  });

  it("ignora secretos vacíos o indefinidos", () => {
    expect(redactar("sin cambios", ["", undefined])).toBe("sin cambios");
  });
});
