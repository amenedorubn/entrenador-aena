import { describe, it, expect, afterEach } from "vitest";
import { loadReal } from "../data/real.js";
import { realCoverage, buildUnseenLesson, setSeenIds, buildLesson } from "../js/content.js";

const q = (id, extra = {}) => ({
  id, origen: "oficial", lvl: 3, prompt: `Pregunta ${id}`, options: ["A", "B", "C", "D"], correctIndex: 0,
  correctText: "A", category: "analogias", confidence: "alta", sourceFile: "x.pdf", ...extra,
});

afterEach(() => { loadReal([]); setSeenIds([]); });

describe("cobertura de reales", () => {
  it("cuenta solo oficiales servibles (no variantes ni revision)", () => {
    loadReal([q("a"), q("b"), q("c", { origen: "variante", origenId: "a" }), q("d", { status: "revision" })]);
    expect(realCoverage()).toEqual({ seen: 0, total: 2, unseen: 2 });
    setSeenIds(["a", "c", "d"]);
    expect(realCoverage()).toEqual({ seen: 1, total: 2, unseen: 1 });
  });

  it("buildUnseenLesson solo devuelve las no vistas, sin repetir, y llega al 100 %", () => {
    loadReal(Array.from({ length: 25 }, (_, i) => q(`r${i}`)));
    const seen = new Set();
    for (let round = 0; round < 10; round++) {
      setSeenIds([...seen]);
      const items = buildUnseenLesson(10);
      for (const it of items) { expect(seen.has(it.id)).toBe(false); seen.add(it.id); }
      if (!items.length) break;
    }
    expect(seen.size).toBe(25);
    setSeenIds([...seen]);
    expect(realCoverage().unseen).toBe(0);
    expect(buildUnseenLesson(10)).toEqual([]);
  });

  it("las lecciones sirven primero las reales no vistas", () => {
    loadReal(Array.from({ length: 12 }, (_, i) => q(`v${i}`)));
    setSeenIds(Array.from({ length: 6 }, (_, i) => `v${i}`)); // las 6 primeras ya vistas
    const served = new Set();
    for (let k = 0; k < 40; k++) {
      for (const it of buildLesson(["verbal"], 3, 6, { origenFilter: "oficial" })) served.add(it.id);
    }
    // en una lección de 6 con 12 reales (6 no vistas), las 6 no vistas salen SIEMPRE antes que las vistas
    const first = buildLesson(["verbal"], 3, 6, { origenFilter: "oficial" }).map((i) => i.id).sort();
    expect(first).toEqual(["v10", "v11", "v6", "v7", "v8", "v9"]);
  });
});
