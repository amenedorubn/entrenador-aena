// "Inglés oficial": buildEnglishBankLesson sirve un banco entero (B1, B2 o ambos) o solo
// sus fallos, y englishBankCounts cuenta total/fallados por banco.
import { describe, it, expect } from "vitest";
import { buildEnglishBankLesson, englishBankCounts } from "../js/content.js";
import { loadReal } from "../data/real.js";

const q = (id, category, extra = {}) => ({
  id, lvl: 2, prompt: `Pregunta ${id} ___`, options: ["a", "b", "c", "d"], correctIndex: 1, correctText: "b",
  explanation: null, category, difficulty: "facil", isReal: true, confidence: "alta", sourceFile: "test", origen: "oficial", ...extra,
});
const fake = [
  q("b1-1", "ingles_b1"), q("b1-2", "ingles_b1"), q("b1-rev", "ingles_b1", { status: "revision" }),
  q("b2-1", "ingles_b2"), q("b2-2", "ingles_b2"), q("b2-3", "ingles_b2"),
  q("num-1", "razonamiento_numerico"),
];
const withReal = (fn) => { loadReal(fake); try { fn(); } finally { loadReal([]); } };
const ids = (items) => items.map((i) => i.id).sort();

describe("banco de Inglés oficial", () => {
  it("cada banco sirve solo sus preguntas servibles", () => withReal(() => {
    expect(ids(buildEnglishBankLesson("b1"))).toEqual(["b1-1", "b1-2"]);
    expect(ids(buildEnglishBankLesson("b2"))).toEqual(["b2-1", "b2-2", "b2-3"]);
    expect(ids(buildEnglishBankLesson("all"))).toEqual(["b1-1", "b1-2", "b2-1", "b2-2", "b2-3"]);
  }));

  it("onlyMissed limita a los fallos del banco elegido", () => withReal(() => {
    const missedIds = ["b1-2", "b2-3", "num-1"];
    expect(ids(buildEnglishBankLesson("b1", { onlyMissed: true, missedIds }))).toEqual(["b1-2"]);
    expect(ids(buildEnglishBankLesson("b2", { onlyMissed: true, missedIds }))).toEqual(["b2-3"]);
    expect(ids(buildEnglishBankLesson("all", { onlyMissed: true, missedIds }))).toEqual(["b1-2", "b2-3"]);
    expect(buildEnglishBankLesson("b1", { onlyMissed: true, missedIds: [] })).toEqual([]);
  }));

  it("englishBankCounts cuenta total y fallados por banco", () => withReal(() => {
    expect(englishBankCounts("b1", ["b1-1", "b2-1"])).toEqual({ total: 2, missed: 1 });
    expect(englishBankCounts("b2", ["b1-1", "b2-1"])).toEqual({ total: 3, missed: 1 });
    expect(englishBankCounts("all", [])).toEqual({ total: 5, missed: 0 });
  }));
});
