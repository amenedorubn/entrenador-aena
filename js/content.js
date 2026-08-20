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

/**
 * Con probabilidad REAL_CHANCE, sirve una pregunta real de examen (categoría
 * correspondiente a `source`, nivel cercano al tier) en vez de generar una nueva.
 * Devuelve null si no hay banco real para esa fuente o si toca generar.
 */
function pickReal(source, tier) {
  const cats = SOURCE_CATEGORIES[source];
  if (!cats || !cats.length) return null;
  // status: "revision" = ítem marcado por scripts/validate-questions.mjs (respuesta
  // dudosa, gráfico citado sin imagen válida, etc.) — nunca se sirve, pero se conserva
  // en real.source.js para no perder el trabajo de extracción. Ver reports/questions-audit.md.
  const pool = REAL.filter((r) => cats.includes(r.category) && r.status !== "revision");
  if (!pool.length || Math.random() >= REAL_CHANCE) return null;
  const near = pool.filter((r) => Math.abs(r.lvl - tier) <= 1);
  const q = choice(near.length ? near : pool);
  // Una pregunta es "figura" si su categoría lo es por defecto (matrices, dominó...) o si
  // trae imagen propia aunque su categoría no esté en FIGURE_CATEGORIES (p. ej. las
  // preguntas numéricas que citan un gráfico de barras, o secuencia_num_letras).
  const isFigure = FIGURE_CATEGORIES.has(q.category) || Boolean(q.image);
  const explanation = q.explanation?.trim().length
    ? q.explanation
    : `Pregunta de examen real (confianza ${q.confidence}). Fuente: ${q.sourceFile}.`;
  return {
    kind: isFigure ? "figure-real" : "text", block: source, tier, family: `real-${q.category}`,
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

/** Crea un ítem de la fuente indicada (real de examen si toca, si no generado). */
export function makeItem(source, tier) {
  const real = pickReal(source, tier);
  if (real) return { ...real, source };
  const fn = SOURCES[source];
  if (!fn) throw new Error(`Fuente desconocida: ${source}`);
  return { ...fn(tier), source };
}

/**
 * Construye una lección de n preguntas repartidas entre las fuentes dadas.
 * Se baraja el orden para que la sesión no vaya por bloques.
 */
export function buildLesson(sources, tier, n = 10) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(makeItem(sources[i % sources.length], tier));
  return shuffle(out);
}
