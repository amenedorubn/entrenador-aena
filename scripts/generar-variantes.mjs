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
const numericCounts = {};
const verbalCounts = {};
const discardReasons = new Map(); // motivo -> nº de semillas
const bump = (reason) => discardReasons.set(reason, (discardReasons.get(reason) ?? 0) + 1);

/* ------------------------------- numérico (29 semillas, "sí") ------------------------------- */
// status:"revision" (semilla marcada como dudosa tras auditoría manual, ver
// notaRevision) nunca genera variante -- si la clave real está en duda, cualquier
// variante heredaría la misma duda.
for (const spec of NUMERIC_SPECS) {
  const seed = byId.get(spec.seedId);
  if (!seed) { console.warn(`[aviso] semilla "${spec.seedId}" no encontrada en REAL, se omite.`); continue; }
  if (seed.status === "revision") { bump("semilla en status:revision"); continue; }
  const variants = runNumericSpec(spec, seed, NUMERIC_PER_SEED); // lanza si el autocheck falla
  out.push(...variants);
  numericCounts[spec.seedId] = variants.length;
}

/* -------------------------- verbal (sinónimos/antónimos + analogías elegibles) -------------------------- */
const verbalSeeds = REAL.filter((it) => (it.category === "sinonimos_antonimos" || it.category === "analogias") && it.status !== "revision");
let sinAntSeeds = 0, sinAntGenerated = 0, analogiaSeeds = 0, analogiaGenerated = 0;
for (const seed of verbalSeeds) {
  if (seed.category === "sinonimos_antonimos") sinAntSeeds++; else analogiaSeeds++;
  const { variants, discarded, reason } = generateVerbalVariants(seed, VERBAL_PER_SEED);
  if (discarded) { bump(reason ?? "léxico insuficiente para 3 distractores limpios"); continue; }
  out.push(...variants);
  verbalCounts[seed.id] = variants.length;
  if (seed.category === "sinonimos_antonimos") sinAntGenerated++; else analogiaGenerated++;
}

writeFileSync(STAGING_PATH, JSON.stringify(out, null, 2), "utf8");

const numericTotal = Object.values(numericCounts).reduce((a, b) => a + b, 0);
const verbalTotal = Object.values(verbalCounts).reduce((a, b) => a + b, 0);
console.log(`Numérico: ${Object.keys(numericCounts).length} semillas generaron -> ${numericTotal} variantes.`);
console.log(`Verbal: sinónimos/antónimos ${sinAntGenerated}/${sinAntSeeds} generaron, analogías ${analogiaGenerated}/${analogiaSeeds} generaron -> ${verbalTotal} variantes.`);
console.log(`\nDescartes por motivo:`);
for (const [reason, n] of [...discardReasons.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n}: ${reason}`);
console.log(`\nTotal variantes generadas: ${out.length}`);
console.log(`Staging: ${path.relative(ROOT, STAGING_PATH)} (gitignored)`);
