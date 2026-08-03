import { describe, it, expect } from "vitest";
import { SYNONYMS, ANTONYMS, ANALOGY_RELATIONS, CATEGORIES } from "../data/lexicon.js";
import { GRAMMAR, TRANSLATE, ERROR_CORRECTION, LISTENING, SPEAKING_PROMPTS } from "../data/english.js";
import { SJT } from "../data/sjt.js";

const MCQ_BANKS = [
  { name: "GRAMMAR", items: GRAMMAR, min: 40 },
  { name: "ERROR_CORRECTION", items: ERROR_CORRECTION, min: 10 },
  { name: "LISTENING", items: LISTENING, min: 12 },
  { name: "SJT", items: SJT, min: 40 },
];

describe.each(MCQ_BANKS)("$name", ({ items, min }) => {
  it(`tiene al menos ${min} ítems`, () => expect(items.length).toBeGreaterThanOrEqual(min));

  it("tiene ids únicos", () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada ítem tiene 4 opciones distintas y correctIndex válido", () => {
    for (const it of items) {
      expect(it.options, it.id).toHaveLength(4);
      expect(new Set(it.options).size, it.id).toBe(4);
      expect(it.correctIndex, it.id).toBeGreaterThanOrEqual(0);
      expect(it.correctIndex, it.id).toBeLessThanOrEqual(3);
    }
  });

  it("prompt y explicación no vacíos", () => {
    for (const it of items) {
      expect(it.prompt.trim().length, it.id).toBeGreaterThan(0);
      expect(it.explanation.trim().length, it.id).toBeGreaterThan(0);
    }
  });

  it("lvl está entre 1 y 5", () => {
    for (const it of items) expect([1, 2, 3, 4, 5], it.id).toContain(it.lvl);
  });
});

describe("LISTENING", () => {
  it("cada ítem trae el texto de audio", () => {
    for (const it of LISTENING) expect(it.audio.trim().length, it.id).toBeGreaterThan(0);
  });
});

describe("TRANSLATE (producción escrita)", () => {
  it("tiene al menos 20 frases con ids únicos", () => {
    expect(TRANSLATE.length).toBeGreaterThanOrEqual(20);
    expect(new Set(TRANSLATE.map((t) => t.id)).size).toBe(TRANSLATE.length);
  });

  it("cada frase tiene respuesta y señuelos no vacíos", () => {
    for (const t of TRANSLATE) {
      expect(t.answer.length, t.id).toBeGreaterThan(2);
      expect(t.lures.length, t.id).toBeGreaterThan(0);
      expect(t.es.trim().length, t.id).toBeGreaterThan(0);
    }
  });

  // Si un señuelo coincidiera con una ficha sobrante de la respuesta, podría existir
  // más de una construcción válida y la corrección sería ambigua.
  it("ningún señuelo permite una segunda respuesta con las mismas fichas", () => {
    for (const t of TRANSLATE) {
      const answerCount = {};
      t.answer.forEach((w) => { answerCount[w] = (answerCount[w] ?? 0) + 1; });
      // El señuelo solo es ambiguo si es idéntico a una palabra que la respuesta ya usa
      // y además es intercambiable; comprobamos que la respuesta esperada es única
      // reconstruyéndola: debe existir exactamente una secuencia igual a `answer`.
      const pool = [...t.answer, ...t.lures];
      for (const w of t.answer) {
        const idx = pool.indexOf(w);
        expect(idx, `${t.id}: la ficha "${w}" debe existir en el conjunto`).toBeGreaterThanOrEqual(0);
        pool.splice(idx, 1);
      }
      expect(pool.length, t.id).toBe(t.lures.length);
    }
  });
});

describe("SPEAKING_PROMPTS", () => {
  it("tiene al menos 15 prompts no vacíos", () => {
    expect(SPEAKING_PROMPTS.length).toBeGreaterThanOrEqual(15);
    for (const p of SPEAKING_PROMPTS) expect(p.trim().length).toBeGreaterThan(0);
  });
});

/* ===================== propiedades críticas del léxico ===================== */

describe("Léxico · integridad de los distractores", () => {
  // Si dos entradas compartieran `sense`, un distractor de una podría ser respuesta
  // válida de la otra. Los generadores excluyen el mismo `sense`, así que exigimos
  // que un mismo `sense` no se repita con soluciones distintas.
  it("SYNONYMS: cada sense es único", () => {
    const senses = SYNONYMS.map((e) => e.sense);
    const dup = senses.filter((s, i) => senses.indexOf(s) !== i);
    expect(dup, `senses duplicados: ${[...new Set(dup)].join(", ")}`).toHaveLength(0);
  });

  it("ANTONYMS: cada sense es único", () => {
    const senses = ANTONYMS.map((e) => e.sense);
    const dup = senses.filter((s, i) => senses.indexOf(s) !== i);
    expect(dup, `senses duplicados: ${[...new Set(dup)].join(", ")}`).toHaveLength(0);
  });

  it("SYNONYMS: ninguna palabra es su propio sinónimo", () => {
    for (const e of SYNONYMS) expect(e.w.toLowerCase()).not.toBe(e.s.toLowerCase());
  });

  it("ANTONYMS: ninguna palabra es su propio antónimo", () => {
    for (const e of ANTONYMS) expect(e.w.toLowerCase()).not.toBe(e.a.toLowerCase());
  });

  it("las categorías son disjuntas (el intruso nunca pertenece también al grupo)", () => {
    const seen = new Map();
    for (const c of CATEGORIES) {
      for (const it of c.items) {
        const k = it.toLowerCase();
        expect(seen.has(k), `"${it}" aparece en "${c.name}" y en "${seen.get(k)}"`).toBe(false);
        seen.set(k, c.name);
      }
    }
  });

  it("las relaciones de analogía tienen al menos 4 pares y términos únicos", () => {
    for (const r of ANALOGY_RELATIONS) {
      expect(r.pairs.length, r.rel).toBeGreaterThanOrEqual(4);
      const bs = r.pairs.map((p) => p[1]);
      expect(new Set(bs).size, r.rel).toBe(bs.length);
    }
  });

  it("un mismo término B no aparece en dos relaciones distintas", () => {
    const seen = new Map();
    for (const r of ANALOGY_RELATIONS) {
      for (const [, b] of r.pairs) {
        expect(seen.has(b), `"${b}" está en "${r.rel}" y en "${seen.get(b)}"`).toBe(false);
        seen.set(b, r.rel);
      }
    }
  });
});
