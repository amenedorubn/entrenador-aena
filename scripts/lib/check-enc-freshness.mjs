// Compara el mtime de las fuentes en claro (gitignored) contra data/real.enc.json
// (el fichero cifrado que de verdad sirve la app, y que SÍ está en git). Si alguna
// fuente es más reciente que el cifrado, alguien tocó datos y no re-cifró todavía --
// exactamente lo que pasó el 2026-09-10 (corrección de wa-aptitudes-3 commiteada dos
// veces porque el primer cifrado se hizo antes de ese cambio).
//
// Usado por: test/enc-freshness.test.js (falla npm test si hay desfase, la fuente de
// verdad de la regla "npm test en verde antes de cada push") y
// scripts/validate-questions.mjs (aviso en rojo por stdout).
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const ENC_PATH = path.join(ROOT, "data", "real.enc.json");
const SOURCE_PATHS = [
  path.join(ROOT, "data", "real.source.js"),
  path.join(ROOT, "data", "variantes.source.js"),
];

/**
 * @returns {{ checked: boolean, stale: boolean, message: string, staleSources: string[] }}
 *   checked:false -> no había fuentes en claro en este checkout (nada que comparar,
 *   p. ej. CI o un checkout sin data/real.source.js), no es una situación de error.
 */
export function checkEncFreshness() {
  const existingSources = SOURCE_PATHS.filter((p) => existsSync(p));
  if (existingSources.length === 0) {
    return { checked: false, stale: false, message: "", staleSources: [] };
  }
  if (!existsSync(ENC_PATH)) {
    return {
      checked: true,
      stale: true,
      staleSources: existingSources.map((p) => path.relative(ROOT, p)),
      message: `${path.relative(ROOT, ENC_PATH)} no existe. Hay que cifrar: AENA_PW="..." node scripts/encrypt.mjs`,
    };
  }
  const encMtime = statSync(ENC_PATH).mtimeMs;
  const staleSources = existingSources.filter((p) => statSync(p).mtimeMs > encMtime);
  if (staleSources.length === 0) {
    return { checked: true, stale: false, message: "", staleSources: [] };
  }
  const rel = staleSources.map((p) => path.relative(ROOT, p));
  return {
    checked: true,
    stale: true,
    staleSources: rel,
    message:
      `real.enc.json está desactualizado, hay que re-cifrar. ` +
      `Más reciente(s) que el cifrado: ${rel.join(", ")}. ` +
      `Corre: AENA_PW="..." node scripts/encrypt.mjs`,
  };
}
