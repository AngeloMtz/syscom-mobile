// Verifica que los checks de CI requeridos de un commit estén en verde.
// Uso: gh api --paginate "repos/<repo>/commits/<sha>/check-runs?per_page=100" | node scripts/verificar-checks-ci.mjs
//      node scripts/verificar-checks-ci.mjs <archivo.json>
// Acepta una o varias páginas JSON concatenadas (salida de `--paginate`) o un arreglo de check-runs.
// Cada check requerido debe tener conclusion "success" (si hay reintentos, cuenta el más reciente).
// Pendiente, fallido o ausente es un error: sale con código 1 y mensajes en español.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const REQUERIDOS = ["Análisis estático", "Pruebas unitarias"];

// Separa valores JSON concatenados (objetos o arreglos) respetando cadenas y escapes.
function separarJson(texto) {
  const valores = [];
  let profundidad = 0;
  let inicio = -1;
  let enCadena = false;
  let escape = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enCadena) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') enCadena = false;
      continue;
    }
    if (c === '"') enCadena = true;
    else if (c === "{" || c === "[") {
      if (profundidad === 0) inicio = i;
      profundidad++;
    } else if (c === "}" || c === "]") {
      profundidad--;
      if (profundidad === 0) valores.push(JSON.parse(texto.slice(inicio, i + 1)));
    }
  }
  if (profundidad !== 0 || enCadena) throw new Error("JSON incompleto");
  return valores;
}

export function evaluarChecks(texto, requeridos = REQUERIDOS) {
  let runs;
  try {
    runs = separarJson(texto).flatMap((v) => (Array.isArray(v) ? v : (v.check_runs ?? [])));
  } catch (e) {
    return { ok: false, errores: [`No se pudo interpretar la respuesta de la API de checks (${e.message}).`] };
  }
  const errores = [];
  const ok = [];
  for (const nombre of requeridos) {
    const propios = runs
      .filter((r) => r.name === nombre)
      .sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)));
    const ultimo = propios[propios.length - 1];
    if (!ultimo) {
      errores.push(`El check "${nombre}" no existe en este commit (¿el CI aún no se ha iniciado?).`);
    } else if (ultimo.conclusion === "success") {
      ok.push(`OK: "${nombre}" en verde.`);
    } else {
      const estado = ultimo.conclusion ?? ultimo.status ?? "desconocido";
      errores.push(`El check "${nombre}" no está en verde (estado: ${estado}).`);
    }
  }
  return { ok: errores.length === 0, ok_msgs: ok, errores };
}

// Solo se ejecuta como script (no al importarlo).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const archivo = process.argv[2];
  const texto = readFileSync(archivo ?? 0, "utf8");
  const r = evaluarChecks(texto);
  for (const m of r.ok_msgs ?? []) console.log(m);
  for (const e of r.errores) console.log(`::error title=CI no está en verde::${e} No se construye ni se envía nada.`);
  process.exit(r.ok ? 0 : 1);
}
