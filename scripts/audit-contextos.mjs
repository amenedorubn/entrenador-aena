#!/usr/bin/env node
// Tarea 2 · Audita qué % de las preguntas NO oficiales (generadas/variante) queda
// ambientado en un aeropuerto -- aptitudes e inglés, banco estático y generador por
// procedimiento. Cuota dura: 15 %. Por encima, este script termina con exit(1) (falla
// el build/CI); por debajo, exit(0). Imprime el desglose por fuente siempre, para poder
// pedir "el número antes de tocar nada" (ver encargo) sin más que ejecutar:
//   node scripts/audit-contextos.mjs
import { AIRPORT_LEXICON } from "../data/contextos.js";
import { GRAMMAR, TRANSLATE, ERROR_CORRECTION } from "../data/english.js";
import { LISTENING } from "../data/listening.js";
import { SJT } from "../data/sjt.js";
import { syllogismItem } from "../js/gen-verbal.js";
import { grammarItem, errorItem, translateItem, listeningItem } from "../js/gen-english.js";

const QUOTA = 0.15;
const SAMPLE = 4000; // por generador por procedimiento, para estabilizar el % con margen

// Palabra completa, insensible a mayúsculas/tildes -- evita falsos positivos como
// "pasajero" dentro de otra palabra más larga.
const escaped = AIRPORT_LEXICON.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const RE = new RegExp(`\\b(${escaped.join("|")})\\b`, "i");
function normalize(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
export function hasAirportContext(text) {
  return RE.test(normalize(text ?? ""));
}

function pctStatic(items, getText, label) {
  const hits = items.filter((it) => hasAirportContext(getText(it)));
  return report(label, items.length, hits.length, hits.map((it) => it.id));
}

function pctSampled(genFn, getText, label, n = SAMPLE) {
  let hits = 0;
  const examples = [];
  for (let i = 0; i < n; i++) {
    const it = genFn(3);
    if (hasAirportContext(getText(it))) { hits++; if (examples.length < 5) examples.push(getText(it).slice(0, 90)); }
  }
  return report(label, n, hits, examples);
}

function report(label, total, hits, sample) {
  const pct = Math.round((hits / total) * 1000) / 10;
  return { label, total, hits, pct, sample };
}

const rows = [
  pctStatic(GRAMMAR, (x) => x.prompt, "Inglés · GRAMMAR (banco)"),
  pctStatic(TRANSLATE, (x) => `${x.es} ${x.answer.join(" ")}`, "Inglés · TRANSLATE (banco)"),
  pctStatic(ERROR_CORRECTION, (x) => x.options.join(" "), "Inglés · ERROR_CORRECTION (banco)"),
  pctStatic(LISTENING, (x) => x.audio, "Inglés · LISTENING (banco)"),
  pctStatic(SJT, (x) => x.prompt, "Aptitudes · SJT/competencias (banco)"),
  pctSampled(syllogismItem, (it) => it.prompt, "Aptitudes · verbal (silogismos/condicionales, generado)"),
  pctSampled(grammarItem, (it) => it.prompt, "Inglés · grammarItem (generado, mezcla banco)"),
  pctSampled(errorItem, (it) => it.prompt, "Inglés · errorItem (generado, mezcla banco)"),
  pctSampled(translateItem, (it) => it.prompt, "Inglés · translateItem (generado, mezcla banco)"),
  pctSampled(listeningItem, (it) => it.audio, "Inglés · listeningItem (generado, mezcla banco+procedimiento)"),
];

console.log("\nContexto aeroportuario por fuente (cuota dura: ≤ 15 %)\n");
let worstOver = null;
for (const r of rows) {
  const flag = r.pct > QUOTA * 100 ? " ❌ SUPERA LA CUOTA" : " ✓";
  console.log(`  ${r.label.padEnd(58)} ${String(r.hits).padStart(4)}/${r.total}  ${String(r.pct).padStart(5)} %${flag}`);
  if (r.pct > QUOTA * 100 && (!worstOver || r.pct > worstOver.pct)) worstOver = r;
}

if (worstOver) {
  console.error(`\n❌ Cuota de contexto aeroportuario superada en "${worstOver.label}": ${worstOver.pct} % > 15 %.`);
  if (worstOver.sample?.length) {
    console.error("   Ejemplos:");
    for (const s of worstOver.sample) console.error(`   - ${s}`);
  }
  process.exit(1);
}
console.log("\n✓ Todas las fuentes por debajo del 15 %.\n");
