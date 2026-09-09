#!/usr/bin/env node
// Tarea 3 · Gate de calidad del banco de listening (data/listening.js). Rompe el build
// (exit 1) si algún ítem incumple una regla dura:
//   (a) la opción correcta comparte 3+ palabras de contenido consecutivas con el
//       transcript -- se acertaría por solape léxico sin escuchar.
//   (b) la duración estimada (ver estimateDurationSec) no encaja en su nivel:
//       A/B (B1) 40-70s, C/D (B2) 90-150s.
//   (c) cuota de contexto aeroportuario > 15 % del banco.
// Además informa (no rompe el build, es una señal de autoría) cuántos distractores por
// ítem se detectan mencionados en el propio audio -- el patrón "aparece pero no
// responde" es deseable pero no siempre verificable por texto.
//
// Uso: node scripts/validar-listening.mjs
import { LISTENING, estimateDurationSec } from "../data/listening.js";
import { AIRPORT_LEXICON } from "../data/contextos.js";
import { literalOverlap, mentionedDistractorCount } from "./lib/listening-checks.mjs";

const DURATION_RANGE = { A: [40, 70], B: [40, 70], C: [90, 150], D: [90, 150] };
const AIRPORT_RE = new RegExp(`\\b(${AIRPORT_LEXICON.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i");

let failures = 0;
console.log(`Validando ${LISTENING.length} ítems de listening...\n`);

for (const it of LISTENING) {
  const problems = [];

  const overlap = literalOverlap(it.correctText ?? it.options[it.correctIndex], it.audio);
  if (overlap) problems.push(`solape literal con el transcript ("${overlap}")`);

  const [min, max] = DURATION_RANGE[it.level] ?? [0, Infinity];
  const dur = estimateDurationSec(it);
  if (dur < min || dur > max) problems.push(`duración estimada ${dur}s fuera de rango [${min}-${max}]s para nivel ${it.level}`);

  if (new Set(it.options).size !== it.options.length) problems.push("opciones duplicadas");
  if (it.correctIndex < 0 || it.correctIndex >= it.options.length) problems.push("correctIndex fuera de rango");
  if (it.options[it.correctIndex] !== it.correctText) problems.push("correctText no coincide con options[correctIndex]");

  const mentioned = mentionedDistractorCount(it.options, it.correctIndex, it.audio);
  const status = problems.length ? "❌" : "✓";
  console.log(`${status} ${it.id} (nivel ${it.level}, ~${dur}s, ${mentioned}/${it.options.length - 1} distractores mencionados en el audio)`);
  for (const p of problems) console.log(`   - ${p}`);
  if (problems.length) failures++;
}

const airportHits = LISTENING.filter((it) => AIRPORT_RE.test(it.audio.normalize("NFD").replace(/[̀-ͯ]/g, "")));
const airportPct = Math.round((airportHits.length / LISTENING.length) * 1000) / 10;
console.log(`\nContexto aeroportuario: ${airportHits.length}/${LISTENING.length} (${airportPct} %)`);
if (airportPct > 15) {
  console.error(`❌ Supera la cuota del 15 % (ítems: ${airportHits.map((it) => it.id).join(", ")}).`);
  failures++;
}

if (failures) {
  console.error(`\n❌ ${failures} problema(s). El build no puede continuar con estos ítems así.`);
  process.exit(1);
}
console.log(`\n✓ Los ${LISTENING.length} ítems pasan todas las reglas duras de la Tarea 3.`);
