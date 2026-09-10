#!/usr/bin/env node
// Fase D · Muestra de 20 pares semilla -> variante lado a lado, cubriendo todas las
// familias, más la capacidad real del léxico verbal. Gitignored (cita texto literal de
// preguntas reales), se enseña en la conversación en vez de publicarse.
//
// Uso: node scripts/muestra-variantes.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SYNONYMS, ANTONYMS } from "../data/lexicon.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "real.source.js");
const STAGING_PATH = path.join(ROOT, "data", "variantes.staging.json");
const REPORT_PATH = path.join(ROOT, "reports", "MUESTRA_VARIANTES.md");

if (!existsSync(STAGING_PATH) || !existsSync(SOURCE_PATH)) {
  console.error("Falta data/variantes.staging.json o data/real.source.js. Corre antes: node scripts/generar-variantes.mjs");
  process.exit(1);
}

const { REAL } = await import(pathToFileURL(SOURCE_PATH));
const variants = JSON.parse(readFileSync(STAGING_PATH, "utf8"));
const byId = new Map(REAL.map((r) => [r.id, r]));

/* --------------------------- capacidad real del léxico verbal --------------------------- */
const POOL = [
  ...SYNONYMS.flatMap((e, i) => [{ word: e.w, key: `syn${i}`, lvl: e.lvl }, { word: e.s, key: `syn${i}`, lvl: e.lvl }]),
  ...ANTONYMS.flatMap((e, i) => [{ word: e.w, key: `ant${i}`, lvl: e.lvl }, { word: e.a, key: `ant${i}`, lvl: e.lvl }]),
];
const DIFF_LVL = { facil: 1.5, media: 2.5, dificil: 4 };
const normWord = (w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const combinations = (n, k) => { if (k > n || k < 0) return 0; let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return Math.round(r); };
const PROMPT_STOP = new Set(["Elija", "Señale", "Cuál", "Cual", "De", "Las", "Los", "Si", "El", "La", "Un", "Una"]);
const promptOwnWords = (p) => (p.match(/\b\p{Lu}[\p{Ll}]+\b/gu) ?? []).filter((w) => !PROMPT_STOP.has(w));

const verbalSeeds = REAL.filter((it) => byId.has(it.id) && (it.category === "sinonimos_antonimos" || it.category === "analogias") && variants.some((v) => v.origenId === it.id));
const capacity = verbalSeeds.map((seed) => {
  const exclude = new Set([...seed.options.map((o) => (typeof o === "string" ? o : o.text)), ...promptOwnWords(seed.prompt)].map(normWord));
  const wantLvl = DIFF_LVL[seed.difficulty] ?? 2.5;
  const byKey = new Map();
  for (const c of POOL) {
    if (exclude.has(normWord(c.word)) || Math.abs(c.lvl - wantLvl) > 1) continue;
    if (!byKey.has(c.key)) byKey.set(c.key, c);
  }
  return { id: seed.id, tier: byKey.size, capacity: combinations(byKey.size, 3) };
}).sort((a, b) => a.tier - b.tier);
const worst = capacity[0], best = capacity[capacity.length - 1];
const median = capacity[Math.floor(capacity.length / 2)];

/* --------------------------------- selección de la muestra --------------------------------- */
const byFamily = new Map();
for (const v of variants) { if (!byFamily.has(v.family)) byFamily.set(v.family, []); byFamily.get(v.family).push(v); }

const PICKS_PER_FAMILY = { // sube a 20 en total, repartido para cubrir TODAS las familias
  razonamiento_numerico_aritmetica_general: 3,
  razonamiento_numerico_porcentajes: 2,
  razonamiento_numerico_proporciones: 2,
  razonamiento_numerico_edades: 2,
  razonamiento_numerico_algebraico: 2,
  razonamiento_numerico_trabajo_velocidad: 2,
  razonamiento_numerico_probabilidad: 1,
  sinonimos_antonimos: 4,
  analogias: 2,
};

let md = `# Muestra de variantes (Fase D)\n\n`;
md += `20 pares semilla -> variante, uno o dos por familia, para revisar a ojo antes de generar en masa. **No se ha guardado nada en el banco todavía.**\n\n`;

let shown = 0;
for (const [family, n] of Object.entries(PICKS_PER_FAMILY)) {
  const pool = byFamily.get(family) ?? [];
  const seedIdsInFamily = [...new Set(pool.map((v) => v.origenId))];
  const chosenSeedIds = seedIdsInFamily.slice(0, n);
  md += `## ${family} (${pool.length} variantes generadas de ${seedIdsInFamily.length} semilla${seedIdsInFamily.length === 1 ? "" : "s"})\n\n`;
  for (const seedId of chosenSeedIds) {
    const seed = byId.get(seedId);
    const v = pool.find((x) => x.origenId === seedId);
    md += `**Semilla \`${seedId}\`:** ${seed.prompt}\n`;
    md += `Opciones: ${JSON.stringify(seed.options)} — correcta: **${seed.correctText}**\n\n`;
    md += `**Variante \`${v.id}\`:** ${v.prompt}\n`;
    md += `Opciones: ${JSON.stringify(v.options)} — correcta: **${v.correctText}**\n`;
    md += `_Explicación:_ ${v.explanation}\n\n---\n\n`;
    shown++;
  }
}

md += `## Capacidad real del léxico verbal (antes de repetir combinaciones)\n\n`;
md += `Para cada una de las ${capacity.length} semillas verbales con variante, se cuenta cuántas palabras del léxico (\`data/lexicon.js\`) pasan el filtro de radio de dificultad ±1 y las exclusiones anti-ambigüedad -- ese es el "banco de candidatos" real del que salen los tríos de distractores. C(n,3) es cuántos tríos DISTINTOS se pueden formar con ese banco antes de que una combinación se repita.\n\n`;
md += `- Peor caso: \`${worst.id}\` -- ${worst.tier} candidatos -> ${worst.capacity.toLocaleString("es-ES")} combinaciones posibles.\n`;
md += `- Mediana: \`${median.id}\` -- ${median.tier} candidatos -> ${median.capacity.toLocaleString("es-ES")} combinaciones posibles.\n`;
md += `- Mejor caso: \`${best.id}\` -- ${best.tier} candidatos -> ${best.capacity.toLocaleString("es-ES")} combinaciones posibles.\n\n`;
md += `Con 3 variantes por semilla (lo generado en este lote) no hay ningún riesgo real de agotar combinaciones -- **el límite práctico no es el léxico, es cuántas variantes por semilla merece la pena generar** antes de que dejen de aportar (repasar la misma pregunta 40 veces con distractores distintos no enseña nada nuevo a partir de cierto punto, aunque el léxico diera para miles).\n`;

writeFileSync(REPORT_PATH, md, "utf8");
console.log(`Muestra: ${shown} pares mostrados.`);
console.log(`Capacidad del léxico: peor caso ${worst.capacity.toLocaleString("es-ES")} combinaciones (semilla ${worst.id}), mediana ${median.capacity.toLocaleString("es-ES")}.`);
console.log(`Informe: ${path.relative(ROOT, REPORT_PATH)} (gitignored)`);
