// Fase E del motor de variantes: cuota del 60%/lección, una variante nunca junto a su
// semilla, y el filtro de origen de 4 vías (oficial/variante/generada/todas) respeta
// cada caso (oficial/variante nunca generan de relleno).
import { describe, it, expect } from "vitest";
import { buildLesson, makeItem } from "../js/content.js";
import { loadReal } from "../data/real.js";

// 10 semillas oficiales de razonamiento_numerico + 3 variantes por semilla (30 en
// total) -- suficiente pool para que una lección de 10 preguntas pueda, en teoría,
// salir toda de variantes si no hubiera cuota.
function buildFixture() {
  const oficiales = Array.from({ length: 10 }, (_, i) => ({
    id: `fx-${i}`, origen: "oficial", lvl: 3,
    prompt: `Semilla ${i}: ¿cuánto es 1+${i}?`,
    options: ["a", "b", "c", "d"], correctIndex: i % 4, explanation: null,
    category: "razonamiento_numerico", difficulty: "media", isReal: true, confidence: "alta", sourceFile: "test",
  }));
  const variantes = oficiales.flatMap((seed, i) =>
    Array.from({ length: 3 }, (_, v) => ({
      id: `fx-${i}-v${v}`, origen: "variante", origenId: seed.id, lvl: 3,
      prompt: `Variante ${v} de la semilla ${i}: ¿cuánto es 1+${i}+${v}?`,
      options: ["a", "b", "c", "d"], correctIndex: v % 4, explanation: null,
      category: "razonamiento_numerico", difficulty: "media", isReal: true, confidence: "alta", sourceFile: "test",
    }))
  );
  return [...oficiales, ...variantes];
}

describe("motor de variantes · Fase E", () => {
  it("una lección mixta nunca supera el 60% de variantes", () => {
    loadReal(buildFixture());
    try {
      for (let trial = 0; trial < 40; trial++) {
        const items = buildLesson(["num"], 3, 10);
        const real = items.filter((it) => it.isReal);
        if (real.length === 0) continue;
        const variantShare = real.filter((it) => it.origen === "variante").length / real.length;
        expect(variantShare, `tirada ${trial}: ${JSON.stringify(real.map((r) => r.origen))}`).toBeLessThanOrEqual(0.6 + 1e-9);
      }
    } finally {
      loadReal([]);
    }
  });

  it("una variante nunca aparece en la misma lección que su semilla (ni con una hermana)", () => {
    loadReal(buildFixture());
    try {
      for (let trial = 0; trial < 40; trial++) {
        const items = buildLesson(["num"], 3, 10);
        const real = items.filter((it) => it.isReal);
        const familyIds = real.map((it) => (it.origen === "variante" ? it.origenId : it.id));
        expect(new Set(familyIds).size, `tirada ${trial}`).toBe(familyIds.length);
      }
    } finally {
      loadReal([]);
    }
  });

  it('origenFilter:"oficial" solo sirve oficiales, nunca genera de relleno', () => {
    loadReal(buildFixture());
    try {
      for (let i = 0; i < 30; i++) {
        const it = makeItem("num", 3, undefined, { origenFilter: "oficial" });
        if (it) expect(it.origen, JSON.stringify(it)).toBe("oficial");
      }
    } finally {
      loadReal([]);
    }
  });

  it('origenFilter:"variante" solo sirve variantes, sin cuota (puede ser el 100% de la lección)', () => {
    loadReal(buildFixture());
    try {
      const items = buildLesson(["num"], 3, 10, { origenFilter: "variante" });
      const real = items.filter((it) => it.isReal);
      expect(real.length, "debería poder llenar la lección solo con variantes").toBeGreaterThan(6);
      for (const it of real) expect(it.origen).toBe("variante");
    } finally {
      loadReal([]);
    }
  });

  it('origenFilter:"generada" nunca sirve REAL (ni oficial ni variante)', () => {
    loadReal(buildFixture());
    try {
      for (let i = 0; i < 30; i++) {
        const it = makeItem("num", 3, undefined, { origenFilter: "generada" });
        if (it) expect(it.isReal, JSON.stringify(it)).toBeFalsy();
      }
    } finally {
      loadReal([]);
    }
  });
});
