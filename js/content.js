// Punto único de creación de preguntas: traduce una clave de fuente + tier en un ítem.
import { generateNumeric } from "./gen-numeric.js";
import { generateAbstract } from "./gen-abstract.js";
import { generateVerbal } from "./gen-verbal.js";
import { grammarItem, translateItem, listeningItem, errorItem } from "./gen-english.js";
import { SJT } from "../data/sjt.js";
import { choice, shuffle } from "./rng.js";

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

/** Crea un ítem de la fuente indicada. */
export function makeItem(source, tier) {
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
