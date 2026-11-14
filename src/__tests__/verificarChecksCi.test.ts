/* eslint-disable @typescript-eslint/no-require-imports */
// Prueba de extremo a extremo de scripts/verificar-checks-ci.mjs con fixtures JSON
// (forma de la respuesta de `gh api repos/<repo>/commits/<sha>/check-runs`).
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const SCRIPT = path.resolve(process.cwd(), "scripts/verificar-checks-ci.mjs");
const fixture = (n: string) => path.resolve(process.cwd(), "scripts/fixtures-checks-ci", `${n}.json`);

function correr(args: string[], entrada?: string) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", input: entrada });
}

describe("scripts/verificar-checks-ci.mjs", () => {
  it.each(["verdes", "reintento-verde", "paginas"])("%s: pasa (código 0)", (caso) => {
    const r = correr([fixture(caso)]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('OK: "Análisis estático" en verde.');
    expect(r.stdout).toContain('OK: "Pruebas unitarias" en verde.');
  });

  it("rojo: falla e indica el estado failure", () => {
    const r = correr([fixture("rojo")]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('El check "Pruebas unitarias" no está en verde (estado: failure)');
  });

  it("en progreso: falla e indica el estado in_progress", () => {
    const r = correr([fixture("en-progreso")]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("(estado: in_progress)");
  });

  it("ausente: falla indicando que el check no existe", () => {
    const r = correr([fixture("ausente")]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('El check "Pruebas unitarias" no existe en este commit');
  });

  it("lee de stdin cuando no se pasa archivo", () => {
    const r = correr([], '{"check_runs":[]}');
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('El check "Análisis estático" no existe');
  });

  it("JSON incompleto: falla con mensaje en español", () => {
    const r = correr([], '{"check_runs":[');
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("No se pudo interpretar la respuesta de la API de checks");
  });
});
