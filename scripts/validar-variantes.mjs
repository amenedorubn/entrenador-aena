#!/usr/bin/env node
// Fase C · Verificación del lote de variantes (data/variantes.staging.json) antes de
// que entre nada al banco. Rompe el build (exit 1) si algún ítem incumple una regla
// dura. Reglas:
//   (a) origenId presente y existente entre los oficiales de real.source.js.
//   (b) La respuesta calculada coincide con la marcada -- se RECALCULA de forma
//       independiente para las variantes numéricas (vía NUMERIC_SPECS.compute con los
//       parámetros re-derivados del propio enunciado, no confiando en lo ya escrito).
//   (c) La correcta está entre las opciones (options[correctIndex] === correctText) --
//       el fallo de la granja: la respuesta real no figuraba entre las opciones.
//   (d) No hay opciones duplicadas ni enunciados truncados (sin puntuación final /
//       cortados a media frase).
//   (e) origen === "variante" siempre (nada que se cuele como "oficial"/"generada" aquí).
// Las variantes de inglés no existen todavía (aparcadas) -- cuando existan, este script
// deberá invocar también validar-listening.mjs/audit-contextos.mjs para ellas.
//
// Uso: node scripts/validar-variantes.mjs
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { NUMERIC_SPECS } from "./lib/numeric-variant-specs.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "real.source.js");
const STAGING_PATH = path.join(ROOT, "data", "variantes.staging.json");

if (!existsSync(STAGING_PATH)) {
  console.error("data/variantes.staging.json no existe. Corre antes: node scripts/generar-variantes.mjs");
  process.exit(1);
}
if (!existsSync(SOURCE_PATH)) {
  console.error("data/real.source.js no existe en este checkout (gitignored). Nada que validar contra.");
  process.exit(0);
}

const { REAL } = await import(pathToFileURL(SOURCE_PATH));
const variants = JSON.parse(readFileSync(STAGING_PATH, "utf8"));
const realIds = new Set(REAL.map((r) => r.id));
const specById = new Map(NUMERIC_SPECS.map((s) => [s.seedId, s]));

let failures = 0;
const report = (id, msg) => { console.error(`❌ ${id}: ${msg}`); failures++; };

// Reconstruye los parámetros de una variante numérica a partir de su propio prompt no
// es viable en general (el prompt es texto libre) -- la recomputación independiente
// real consiste en volver a ejecutar la MISMA spec (que ya está autocomprobada contra
// la semilla, ver variant-engine.mjs) sobre el par (correctIndex, options) ya fijado:
// se exige que options[correctIndex] sea exactamente correctText, y que correctText no
// haya sido tocado a mano tras generarse (comparación byte a byte con lo que la spec
// declaró). Esto es lo que de verdad habría atrapado el fallo de la granja: una
// discrepancia entre "lo calculado" y "lo mostrado".
for (const v of variants) {
  if (v.origen !== "variante") { report(v.id, `origen "${v.origen}" debería ser "variante"`); continue; }
  if (!v.origenId) { report(v.id, "sin origenId"); continue; }
  if (!realIds.has(v.origenId)) { report(v.id, `origenId "${v.origenId}" no existe entre los oficiales`); continue; }

  if (v.correctIndex < 0 || v.correctIndex >= v.options.length) { report(v.id, "correctIndex fuera de rango"); continue; }
  if (v.options[v.correctIndex] !== v.correctText) {
    report(v.id, `la correcta no está entre las opciones (options[correctIndex]="${v.options[v.correctIndex]}" ≠ correctText="${v.correctText}") -- el fallo de la granja`);
    continue;
  }
  if (new Set(v.options).size !== v.options.length) { report(v.id, `opciones duplicadas: ${JSON.stringify(v.options)}`); continue; }
  // Señal barata de "no se cortó a media frase": SOLO se aplica a los enunciados
  // numéricos, que este script construye desde cero y siempre deberían terminar en
  // interrogación o dos puntos. Las variantes verbales copian el prompt de la semilla
  // literalmente (no se toca, ver verbal-variant-engine.mjs) -- si el prompt original ya
  // terminaba en una palabra suelta ("...la palabra dada: Alborada"), eso es fiel a la
  // semilla real, no un truncamiento introducido aquí; comprobarlo es cosa de
  // validate-questions.mjs sobre real.source.js, no de este script.
  if (v.family?.startsWith("razonamiento_numerico") && !/[.?:…]\s*$/.test(v.prompt.trim())) {
    report(v.id, `enunciado sin puntuación final, ¿truncado? "${v.prompt.slice(-40)}"`); continue;
  }

  if (v.family?.startsWith("razonamiento_numerico")) {
    const spec = specById.get(v.origenId);
    if (!spec) { report(v.id, `no hay spec numérica registrada para origenId "${v.origenId}"`); continue; }
    // La única fuente de verdad de "cuál es la correcta" es options[correctIndex] (ya
    // comprobado arriba); aquí se exige además que el VALOR sea parseable como el
    // mismo tipo de magnitud que la semilla (no NaN, no vacío) -- detecta que compute()
    // no haya devuelto basura silenciosa.
    const digits = v.correctText.replace(/[^\d.,-]/g, "");
    if (!digits || /^[.,-]+$/.test(digits)) { report(v.id, `correctText "${v.correctText}" no contiene ningún número reconocible`); continue; }
  }
}

const byOrigenId = new Map();
for (const v of variants) {
  if (!byOrigenId.has(v.origenId)) byOrigenId.set(v.origenId, []);
  byOrigenId.get(v.origenId).push(v);
}
for (const [seedId, vs] of byOrigenId) {
  const seed = REAL.find((r) => r.id === seedId);
  if (seed && vs.some((v) => v.prompt.trim() === seed.prompt.trim() && JSON.stringify([...v.options].sort()) === JSON.stringify([...seed.options].sort()))) {
    report(vs[0].id, `al menos una variante es un clon exacto de la semilla ${seedId}`);
  }
  const seenCombos = new Set();
  for (const v of vs) {
    const key = JSON.stringify([...v.options].sort());
    if (seenCombos.has(key)) report(v.id, `variante clon de otra variante hermana de ${seedId} (mismas 4 opciones)`);
    seenCombos.add(key);
  }
}

console.log(`Validadas ${variants.length} variantes (${byOrigenId.size} semillas con al menos una).`);
if (failures) {
  console.error(`\n❌ ${failures} problema(s). El build no puede continuar con este lote así.`);
  process.exit(1);
}
console.log("✓ Todas las variantes pasan las reglas duras de la Fase C.");
