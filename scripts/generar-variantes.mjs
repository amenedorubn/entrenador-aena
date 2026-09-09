#!/usr/bin/env node
// Fase B · Motor de variantes. Genera el lote completo (numérico + verbal -- inglés
// aparcado, ver conversación) y lo escribe en data/variantes.staging.json (gitignored,
// NO es el banco final: eso es data/variantes.source.js, que solo se crea en la Fase E
// tras aprobar la muestra de la Fase D). scripts/validar-variantes.mjs y
// scripts/muestra-variantes.mjs leen este mismo staging.
//
// Uso: node scripts/generar-variantes.mjs [--numeric-per-seed=6] [--verbal-per-seed=3]
import { writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { NUMERIC_SPECS } from "./lib/numeric-variant-specs.mjs";
import { runNumericSpec } from "./lib/variant-engine.mjs";
import { generateVerbalVariants } from "./lib/verbal-variant-engine.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "real.source.js");
const STAGING_PATH = path.join(ROOT, "data", "variantes.staging.json");

if (!existsSync(SOURCE_PATH)) {
  console.error("data/real.source.js no existe en este checkout (gitignored). Nada que generar.");
  process.exit(0);
}

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const NUMERIC_PER_SEED = Number(args["numeric-per-seed"] ?? 6);
const VERBAL_PER_SEED = Number(args["verbal-per-seed"] ?? 3);

const { REAL } = await import(pathToFileURL(SOURCE_PATH));
const byId = new Map(REAL.map((r) => [r.id, r]));

const out = [];
const summary = { numeric: {}, verbal: {}, discardedVerbal: { sinonimos_antonimos: 0, analogias: 0, analogiasNoElegibles: 0 } };

/* ------------------------------- numérico (29 semillas, "sí") ------------------------------- */
for (const spec of NUMERIC_SPECS) {
  const seed = byId.get(spec.seedId);
  if (!seed) { console.warn(`[aviso] semilla "${spec.seedId}" no encontrada en REAL, se omite.`); continue; }
  const variants = runNumericSpec(spec, seed, NUMERIC_PER_SEED); // lanza si el autocheck falla
  out.push(...variants);
  summary.numeric[spec.seedId] = variants.length;
}

/* -------------------------- verbal (sinónimos/antónimos + analogías elegibles) -------------------------- */
const verbalSeeds = REAL.filter((it) => it.category === "sinonimos_antonimos" || it.category === "analogias");
for (const seed of verbalSeeds) {
  const { variants, discarded, reason } = generateVerbalVariants(seed, VERBAL_PER_SEED);
  if (discarded) {
    if (seed.category === "analogias") {
      summary.discardedVerbal.analogias++;
      if (reason) summary.discardedVerbal.analogiasNoElegibles++;
    } else {
      summary.discardedVerbal.sinonimos_antonimos++;
    }
    continue;
  }
  out.push(...variants);
  summary.verbal[seed.id] = variants.length;
}

writeFileSync(STAGING_PATH, JSON.stringify(out, null, 2), "utf8");

const numericTotal = Object.values(summary.numeric).reduce((a, b) => a + b, 0);
const verbalTotal = Object.values(summary.verbal).reduce((a, b) => a + b, 0);
console.log(`Numérico: ${NUMERIC_SPECS.length} semillas -> ${numericTotal} variantes (objetivo ${NUMERIC_SPECS.length * NUMERIC_PER_SEED}).`);
console.log(`Verbal: ${verbalSeeds.length} semillas evaluadas -> ${verbalTotal} variantes.`);
console.log(`  sinónimos/antónimos: ${92 - summary.discardedVerbal.sinonimos_antonimos}/92 generaron, ${summary.discardedVerbal.sinonimos_antonimos} descartadas por léxico insuficiente.`);
console.log(`  analogías: ${summary.discardedVerbal.analogias === 0 ? 0 : Object.keys(summary.verbal).length - (92 - summary.discardedVerbal.sinonimos_antonimos)} generaron, ${summary.discardedVerbal.analogiasNoElegibles} descartadas por no ser relación léxica pura (cultura general / formato de dos huecos), ${summary.discardedVerbal.analogias - summary.discardedVerbal.analogiasNoElegibles} descartadas por léxico insuficiente.`);
console.log(`\nTotal variantes generadas: ${out.length}`);
console.log(`Staging: ${path.relative(ROOT, STAGING_PATH)} (gitignored)`);
