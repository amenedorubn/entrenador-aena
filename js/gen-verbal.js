// Fase 1 · Generadores VERBALES.
// Léxico: los distractores salen siempre de entradas con `sense` distinto, así que
// nunca pueden ser también correctos. Series de letras: correctas por construcción.
import { SYNONYMS, ANTONYMS, ANALOGY_RELATIONS, CATEGORIES } from "../data/lexicon.js";
import { randInt, choice, shuffle, sample, letterAt, letterIndex, buildOptions } from "./rng.js";

const item = (o) => ({ kind: "text", block: "verbal", ...o });
const S = (t) => `<span class="series">${t.join(", ")}, ?</span>`;
const byLvl = (arr, tier) => {
  const near = arr.filter((x) => Math.abs(x.lvl - tier) <= 1);
  return near.length >= 6 ? near : arr;
};

/* ------------------------------ léxico ------------------------------ */

export function synonymItem(tier = 2) {
  const pool = byLvl(SYNONYMS, tier);
  const e = choice(pool);
  // Distractores: sinónimos de OTRO campo semántico → nunca válidos para esta palabra.
  const others = shuffle(SYNONYMS.filter((x) => x.sense !== e.sense));
  let i = 0;
  const { options, correctIndex } = buildOptions(e.s, () => others[i++]?.s ?? null, (x) => x);
  return item({ family: "syn", tier, prompt: `¿Cuál es un <b>sinónimo</b> de <b>${e.w}</b>?`, options, correctIndex, value: e.s,
    explanation: `<b>${e.w}</b> significa «${e.s}».` });
}

export function antonymItem(tier = 2) {
  const pool = byLvl(ANTONYMS, tier);
  const e = choice(pool);
  const others = shuffle(ANTONYMS.filter((x) => x.sense !== e.sense));
  let i = 0;
  const { options, correctIndex } = buildOptions(e.a, () => others[i++]?.a ?? null, (x) => x);
  return item({ family: "ant", tier, prompt: `¿Cuál es un <b>antónimo</b> de <b>${e.w}</b>?`, options, correctIndex, value: e.a,
    explanation: `Lo contrario de <b>${e.w}</b> es <b>${e.a}</b>.` });
}

export function analogyItem(tier = 2) {
  const rels = ANALOGY_RELATIONS.filter((r) => Math.abs(r.lvl - tier) <= 1);
  const rel = choice(rels.length ? rels : ANALOGY_RELATIONS);
  const [p1, p2] = sample(rel.pairs, 2);
  // Distractores: términos "b" de OTRAS relaciones → no comparten el vínculo.
  const others = shuffle(ANALOGY_RELATIONS.filter((r) => r.rel !== rel.rel).flatMap((r) => r.pairs.map((p) => p[1])));
  let i = 0;
  const { options, correctIndex } = buildOptions(p2[1], () => others[i++] ?? null, (x) => x);
  return item({ family: "analogy", tier, prompt: `Analogía: <b>${p1[0]}</b> es a <b>${p1[1]}</b> como <b>${p2[0]}</b> es a…`,
    options, correctIndex, value: p2[1],
    explanation: `La relación es «${rel.rel}»: <b>${p2[0]} → ${p2[1]}</b>.` });
}

export function oddOneOut(tier = 2) {
  const pool = CATEGORIES.filter((c) => Math.abs(c.lvl - tier) <= 1 && c.items.length >= 3);
  const cats = pool.length >= 2 ? pool : CATEGORIES;
  const [main, other] = sample(cats, 2);
  const three = sample(main.items, 3);
  const intruder = choice(other.items);
  const mixed = shuffle([...three.map((t) => ({ t, ok: false })), { t: intruder, ok: true }]);
  return item({ family: "odd", tier, prompt: `¿Qué palabra <b>no encaja</b> con las demás?`,
    options: mixed.map((x) => x.t), correctIndex: mixed.findIndex((x) => x.ok), value: intruder,
    explanation: `${three.join(", ")} pertenecen a «<b>${main.name}</b>»; <b>${intruder}</b> pertenece a «${other.name}».` });
}

/* --------------------------- series de letras --------------------------- */

export function letterSeries(tier = 1) {
  const step = tier >= 3 ? choice([3, 4, 5, -2, -3]) : choice([1, 2, 3]);
  const i0 = randInt(Math.max(0, -5 * step), 25 - Math.max(0, 5 * step));
  const shown = [0, 1, 2, 3, 4].map((k) => letterAt(i0 + k * step));
  const v = letterAt(i0 + 5 * step);
  const { options, correctIndex } = buildOptions(v, () => letterAt(i0 + 5 * step + choice([-2, -1, 1, 2, 3])), (x) => x);
  return item({ family: "letterseries", tier, prompt: `Serie de letras: ${S(shown)}`, options, correctIndex, value: v,
    explanation: `Salto constante de <b>${step > 0 ? "+" : ""}${step}</b> en el alfabeto <b>sin Ñ</b> → <b>${v}</b>.` });
}

export function letterNumberSeries(tier = 3) {
  const ls = choice([1, 2, 3, -2]), ns = choice([1, 2, 3, -1, -2]);
  const i0 = randInt(Math.max(0, -4 * ls), 25 - Math.max(0, 4 * ls));
  const n0 = randInt(Math.max(1, 1 - 4 * ns), 20);
  const shown = [0, 1, 2, 3].map((k) => `${letterAt(i0 + k * ls)}${n0 + k * ns}`);
  const v = `${letterAt(i0 + 4 * ls)}${n0 + 4 * ns}`;
  const { options, correctIndex } = buildOptions(v, () => {
    const dl = choice([-1, 0, 1, 2]), dn = choice([-1, 0, 1, 2]);
    if (dl === 0 && dn === 0) return null;
    return `${letterAt(i0 + 4 * ls + dl)}${n0 + 4 * ns + dn}`;
  }, (x) => x);
  return item({ family: "letternum", tier, prompt: `Serie mixta: ${S(shown)}`, options, correctIndex, value: v,
    explanation: `Letras <b>${ls > 0 ? "+" : ""}${ls}</b> (alfabeto sin Ñ) y números <b>${ns > 0 ? "+" : ""}${ns}</b> → <b>${v}</b>.` });
}

export function interleavedLetterSeries(tier = 4) {
  const sa = choice([1, 2, 3]), sb = choice([-1, -2, 1, 2]);
  const ia = randInt(0, 12), ib = randInt(12, 25);
  const shown = [letterAt(ia), letterAt(ib), letterAt(ia + sa), letterAt(ib + sb), letterAt(ia + 2 * sa), letterAt(ib + 2 * sb)];
  const v = letterAt(ia + 3 * sa);
  const { options, correctIndex } = buildOptions(v, () => letterAt(ia + 3 * sa + choice([-2, -1, 1, 2, 3])), (x) => x);
  return item({ family: "letterinter", tier, prompt: `Serie intercalada: ${S(shown)}`, options, correctIndex, value: v,
    explanation: `Son <b>dos series alternas</b>: las de posición impar avanzan ${sa > 0 ? "+" : ""}${sa} y las de posición par ${sb > 0 ? "+" : ""}${sb}. Toca la primera → <b>${v}</b>.` });
}

/* ----------------------------- silogismos ----------------------------- */
// Formas lógicas con validez fijada y verificada; los términos se sustituyen al azar
// por categorías neutras (sin implicaciones del mundo real que interfieran).

const TERM_SETS = [
  ["los inspectores", "los titulados", "los interinos"],
  ["los técnicos", "los colegiados", "los eventuales"],
  ["los auditores", "los acreditados", "los suplentes"],
  ["los delegados", "los residentes", "los becarios"],
];

const SYLLOGISMS = [
  { tier: 2, valid: true,
    premises: (A, B, C) => `Todos ${A} son ${B}. Todos ${B} son ${C}.`,
    correct: (A, B, C) => `Todos ${A} son ${C}`,
    wrong: (A, B, C) => [`Todos ${C} son ${A}`, `Ningún ${A.replace("los ", "")} es ${C.replace("los ", "")}`, `Algunos ${C} no son ${A}`],
    why: (A, B, C) => `Silogismo válido (Barbara): si ${A} ⊆ ${B} y ${B} ⊆ ${C}, entonces ${A} ⊆ ${C}.` },

  { tier: 3, valid: false,
    premises: (A, B, C) => `Todos ${A} son ${B}. Algunos ${B} son ${C}.`,
    correct: () => `No se deduce con certeza ninguna relación entre ambos grupos`,
    wrong: (A, B, C) => [`Algunos ${A} son ${C}`, `Todos ${C} son ${A}`, `Ningún ${A.replace("los ", "")} es ${C.replace("los ", "")}`],
    why: (A, B, C) => `Falacia del <b>término medio no distribuido</b>: los ${B.replace("los ", "")} que son ${C.replace("los ", "")} pueden no ser ninguno de ${A}.` },

  { tier: 3, valid: true,
    premises: (A, B, C) => `Ningún ${A.replace("los ", "")} es ${B.replace("los ", "")}. Todos ${C} son ${B}.`,
    correct: (A, B, C) => `Ningún ${C.replace("los ", "")} es ${A.replace("los ", "")}`,
    wrong: (A, B, C) => [`Todos ${C} son ${A}`, `Algunos ${C} son ${A}`, `No se deduce nada con certeza`],
    why: (A, B, C) => `Válido: si ${C} está dentro de ${B} y ${A} no comparte nada con ${B}, ${C} y ${A} no pueden solaparse.` },

  { tier: 4, valid: true,
    premises: (A, B, C) => `Todos ${B} son ${C}. Algunos ${A} son ${B}.`,
    correct: (A, B, C) => `Algunos ${A} son ${C}`,
    wrong: (A, B, C) => [`Todos ${A} son ${C}`, `Ningún ${A.replace("los ", "")} es ${C.replace("los ", "")}`, `Algunos ${C} no son ${A}`],
    why: (A, B, C) => `Válido (Darii): esos ${A} que son ${B} están necesariamente dentro de ${C}.` },

  { tier: 4, valid: true,
    premises: (A, B, C) => `Algunos ${B} son ${A}. Todos ${B} son ${C}.`,
    correct: (A, B, C) => `Algunos ${C} son ${A}`,
    wrong: (A, B, C) => [`Todos ${C} son ${A}`, `Ningún ${C.replace("los ", "")} es ${A.replace("los ", "")}`, `Todos ${A} son ${C}`],
    why: (A, B, C) => `Válido (Disamis): los ${B.replace("los ", "")} que son ${A.replace("los ", "")} también son ${C.replace("los ", "")}.` },

  { tier: 5, valid: false,
    premises: (A, B) => `Todos ${A} son ${B}. Marta es ${B.replace("los ", "").replace(/s$/, "")}.`,
    correct: () => `No se deduce que Marta pertenezca al primer grupo`,
    wrong: (A) => [`Marta pertenece al primer grupo`, `Marta no pertenece al segundo grupo`, `Nadie del primer grupo es como Marta`],
    why: (A, B) => `Falacia de <b>afirmación del consecuente</b>: que todos ${A} sean ${B} no implica que todo ${B.replace("los ", "")} sea de ${A}.` },
];

const CONDITIONALS = [
  { tier: 3, premises: `Si hay niebla, se desvían los vuelos. Hoy hay niebla.`,
    correct: `Hoy se desvían los vuelos`,
    wrong: [`Hoy no se desvían los vuelos`, `No se deduce nada con certeza`, `Siempre que se desvían vuelos hay niebla`],
    why: `<b>Modus ponens</b>: afirmado el antecedente, se sigue el consecuente.` },
  { tier: 4, premises: `Si hay niebla, se desvían los vuelos. Hoy NO se han desviado los vuelos.`,
    correct: `Hoy no hay niebla`,
    wrong: [`Hoy hay niebla`, `No se deduce nada con certeza`, `La niebla no afecta a los vuelos`],
    why: `<b>Modus tollens</b>: negado el consecuente, se niega el antecedente.` },
  { tier: 4, premises: `Si hay niebla, se desvían los vuelos. Hoy NO hay niebla.`,
    correct: `No se deduce nada sobre si se desvían los vuelos`,
    wrong: [`Hoy no se desvían los vuelos`, `Hoy se desvían los vuelos`, `Nunca se desvían vuelos sin niebla`],
    why: `Falacia de <b>negación del antecedente</b>: los vuelos podrían desviarse por otras causas (viento, huelga…).` },
  { tier: 5, premises: `Si se desvían los vuelos, hay niebla o viento fuerte. Hoy se han desviado y no hay viento fuerte.`,
    correct: `Hoy hay niebla`,
    wrong: [`Hoy no hay niebla`, `No se deduce nada con certeza`, `Hoy hay viento fuerte`],
    why: `<b>Silogismo disyuntivo</b>: si se cumple «niebla o viento» y se descarta el viento, queda la niebla.` },
];

export function syllogismItem(tier = 3) {
  const useConditional = Math.random() < 0.4;
  if (useConditional) {
    const pool = CONDITIONALS.filter((c) => Math.abs(c.tier - tier) <= 1);
    const c = choice(pool.length ? pool : CONDITIONALS);
    const mixed = shuffle([{ t: c.correct, ok: true }, ...c.wrong.map((t) => ({ t, ok: false }))]);
    return item({ family: "logic", tier, prompt: `«${c.premises}» ¿Qué se deduce <b>con certeza</b>?`,
      options: mixed.map((x) => x.t), correctIndex: mixed.findIndex((x) => x.ok), value: c.correct, explanation: c.why });
  }
  const pool = SYLLOGISMS.filter((s) => Math.abs(s.tier - tier) <= 1);
  const f = choice(pool.length ? pool : SYLLOGISMS);
  const [A, B, C] = choice(TERM_SETS);
  const mixed = shuffle([{ t: f.correct(A, B, C), ok: true }, ...f.wrong(A, B, C).map((t) => ({ t, ok: false }))]);
  return item({ family: "logic", tier, prompt: `«${f.premises(A, B, C)}» ¿Qué se deduce <b>con certeza</b>?`,
    options: mixed.map((x) => x.t), correctIndex: mixed.findIndex((x) => x.ok), value: f.correct(A, B, C),
    explanation: f.why(A, B, C) });
}

/* --------------------------- registro por tier --------------------------- */
export const VERBAL_FAMILIES = {
  1: [synonymItem, antonymItem, oddOneOut, letterSeries],
  2: [synonymItem, antonymItem, analogyItem, oddOneOut, letterSeries, syllogismItem],
  3: [synonymItem, antonymItem, analogyItem, oddOneOut, letterNumberSeries, syllogismItem],
  4: [synonymItem, antonymItem, analogyItem, letterNumberSeries, interleavedLetterSeries, syllogismItem],
  5: [synonymItem, antonymItem, analogyItem, interleavedLetterSeries, syllogismItem, oddOneOut],
};

export function generateVerbal(tier) {
  const t = Math.min(5, Math.max(1, tier | 0));
  const pool = VERBAL_FAMILIES[t];
  return pool[Math.floor(Math.random() * pool.length)](t);
}
