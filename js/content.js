// Punto único de creación de preguntas: traduce una clave de fuente + tier en un ítem.
import { generateNumeric } from "./gen-numeric.js";
import { generateAbstract } from "./gen-abstract.js";
import { generateVerbal } from "./gen-verbal.js";
import { grammarItem, translateItem, listeningItem, errorItem } from "./gen-english.js";
import { SJT } from "../data/sjt.js";
import { REAL, FIGURE_CATEGORIES, CATEGORY_SOURCE } from "../data/real.js";
import { choice, shuffle } from "./rng.js";

// Fuente del curso -> categorías reales que puede servir (inverso de CATEGORY_SOURCE).
const SOURCE_CATEGORIES = {};
for (const [cat, src] of Object.entries(CATEGORY_SOURCE)) {
  (SOURCE_CATEGORIES[src] ??= []).push(cat);
}

// Probabilidad de que, al pedir un ítem de una fuente con banco real disponible, se
// sirva una pregunta REAL de examen en vez de una generada por procedimiento. Ambas
// se mezclan sin distinguir origen en el orden de la lección (ver curriculum.js).
const REAL_CHANCE = 0.35;

/* ============================== anti-repetición ============================== */
// Firma de un ítem, usada para no servir la misma pregunta dos veces dentro de una
// misma lección/sesión de práctica:
//  - preguntas con prompt de texto (reales y casi todos los generadores): el prompt
//    normalizado (minúsculas, sin tildes, sin puntuación) + la imagen si trae una,
//    para no confundir dos preguntas de figura real con el mismo prompt genérico.
//  - preguntas de figura generadas por procedimiento (kind "figure-series"/"matrix":
//    no tienen prompt de texto, ver gen-abstract.js): familia + nivel + los specs de
//    la figura, que es lo que de verdad las distingue entre sí.
function normalizeText(text) {
  return text
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
function itemSignature(item) {
  if (typeof item.prompt === "string" && item.prompt.length) {
    return `${normalizeText(item.prompt)}|${item.image ?? ""}`;
  }
  return `${item.family}|${item.tier}|${JSON.stringify(item.seq ?? item.cells ?? item.options)}`;
}

/** Estado de deduplicación de una lección/práctica: qué ids reales y qué firmas ya se han servido. */
function newDedupeSession() {
  return { usedIds: new Set(), usedSignatures: new Set(), realQueues: {} };
}

/**
 * Cola barajada (Fisher-Yates, vía shuffle()) de las preguntas reales elegibles para
 * una fuente+nivel, sin reemplazo: se construye UNA VEZ por lección y se consume en
 * orden, nunca se vuelve a barajar ni se repite un id ya servido. Prioriza el pool de
 * nivel cercano (±1) y solo baja al resto del pool si ese se agota.
 */
function buildRealQueue(cats, tier) {
  const pool = REAL.filter((r) => cats.includes(r.category) && r.status !== "revision");
  const near = pool.filter((r) => Math.abs(r.lvl - tier) <= 1);
  const rest = pool.filter((r) => Math.abs(r.lvl - tier) > 1);
  return [...shuffle(near), ...shuffle(rest)];
}

/**
 * Con probabilidad REAL_CHANCE, sirve una pregunta real de examen (categoría
 * correspondiente a `source`, nivel cercano al tier) en vez de generar una nueva.
 * Consume sin reemplazo de la cola barajada de esta sesión: nunca repite un id real
 * ya servido en la misma lección. Devuelve null si no hay banco real para esa fuente,
 * si toca generar, o si la cola de esta fuente ya se agotó en esta lección.
 */
function pickReal(source, tier, dedupe) {
  const cats = SOURCE_CATEGORIES[source];
  if (!cats || !cats.length) return null;
  if (Math.random() >= REAL_CHANCE) return null;

  const queue = (dedupe.realQueues[source] ??= buildRealQueue(cats, tier));
  let q = null;
  while (queue.length) {
    const candidate = queue.shift();
    if (!dedupe.usedIds.has(candidate.id)) { q = candidate; break; }
  }
  if (!q) return null; // pool agotado para esta fuente en esta lección -> toca generar

  dedupe.usedIds.add(q.id);
  // Una pregunta es "figura" si su categoría lo es por defecto (matrices, dominó...) o si
  // trae imagen propia aunque su categoría no esté en FIGURE_CATEGORIES (p. ej. las
  // preguntas numéricas que citan un gráfico de barras, o secuencia_num_letras).
  const isFigure = FIGURE_CATEGORIES.has(q.category) || Boolean(q.image);
  const explanation = q.explanation?.trim().length
    ? q.explanation
    : `Pregunta de examen real (confianza ${q.confidence}). Fuente: ${q.sourceFile}.`;
  return {
    id: q.id, kind: isFigure ? "figure-real" : "text", block: source, tier, family: `real-${q.category}`,
    prompt: q.prompt, image: q.image ?? null, requiresAsset: Boolean(q.requiresAsset),
    options: q.options, correctIndex: q.correctIndex, value: q.options[q.correctIndex],
    explanation,
    isReal: true, confidence: q.confidence, sourceFile: q.sourceFile,
  };
}

function sjtItem(tier = 3) {
  const near = SJT.filter((x) => Math.abs(x.lvl - tier) <= 1);
  const it = choice(near.length ? near : SJT);
  const tagged = it.options.map((t, i) => ({ t, ok: i === it.correctIndex }));
  const mixed = shuffle(tagged);
  return {
    kind: "sjt", block: "sjt", tier, family: it.competency,
    prompt: it.prompt,
    options: mixed.map((x) => x.t),
    correctIndex: mixed.findIndex((x) => x.ok),
    value: it.options[it.correctIndex],
    explanation: it.explanation,
  };
}

export const SOURCES = {
  verbal: generateVerbal,
  num: generateNumeric,
  abs: generateAbstract,
  sjt: sjtItem,
  grammar: grammarItem,
  translate: translateItem,
  listen: listeningItem,
  error: errorItem,
};

export const SOURCE_LABELS = {
  verbal: "Verbal", num: "Numérico", abs: "Abstracto", sjt: "Conductual",
  grammar: "Grammar", translate: "Writing", listen: "Listening", error: "Accuracy",
};

const GENERATE_RETRIES = 10;

/**
 * Llama al generador de `source` hasta que produzca un ítem cuya firma no se haya
 * servido ya en esta sesión (hasta GENERATE_RETRIES intentos). Si no lo consigue,
 * devuelve null: quien llama debe descartar esa pregunta, nunca repetirla.
 */
function generateUnique(fn, tier, dedupe) {
  for (let attempt = 0; attempt < GENERATE_RETRIES; attempt++) {
    const item = fn(tier);
    const sig = itemSignature(item);
    if (!dedupe.usedSignatures.has(sig)) {
      dedupe.usedSignatures.add(sig);
      return item;
    }
  }
  return null;
}

/**
 * Crea un ítem de la fuente indicada (real de examen si toca, si no generado), sin
 * repetir dentro de `dedupe` ningún id real ni firma ya servidos. `dedupe` es opcional
 * (una llamada suelta sin sesión, p. ej. el blindaje de runtime de app.js, se comporta
 * como antes: sin garantía de no-repetición entre llamadas independientes). Devuelve
 * null si no hay nada servible sin repetir (pool real agotado y generador sin salida
 * tras GENERATE_RETRIES intentos): quien llama debe descartar la pregunta, no rellenar
 * repitiendo.
 */
export function makeItem(source, tier, dedupe = newDedupeSession()) {
  const real = pickReal(source, tier, dedupe);
  if (real) {
    dedupe.usedSignatures.add(itemSignature(real));
    return { ...real, source };
  }
  const fn = SOURCES[source];
  if (!fn) throw new Error(`Fuente desconocida: ${source}`);
  const generated = generateUnique(fn, tier, dedupe);
  return generated ? { ...generated, source } : null;
}

/**
 * Construye una lección/práctica de hasta n preguntas repartidas entre las fuentes
 * dadas, sin repetir ni id real ni pregunta generada dentro de la misma lección. Si el
 * pool servible se agota antes de llegar a n (banco real corto + generador sin más
 * variantes nuevas), la lección sale más corta: nunca se repite una pregunta para
 * rellenar el hueco. Se baraja el orden final para que la lección no vaya por bloques.
 */
export function buildLesson(sources, tier, n = 10) {
  const dedupe = newDedupeSession();
  const out = [];
  for (let i = 0; i < n; i++) {
    const item = makeItem(sources[i % sources.length], tier, dedupe);
    if (item) out.push(item);
  }
  return shuffle(out);
}
