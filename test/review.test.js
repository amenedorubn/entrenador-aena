// "Repasar fallos": buildReviewLesson(ids) debe servir EXACTAMENTE esos ids (sin la
// aleatoriedad de REAL_CHANCE ni el filtro por nivel/categoría de buildLesson), saltarse
// los que ya no existan o estén en status:"revision", y no depender de deduplicación de
// sesión (a diferencia de buildLesson).
import { describe, it, expect } from "vitest";
import { buildReviewLesson } from "../js/content.js";
import { loadReal } from "../data/real.js";

const fakeReal = [
  { id: "rev-1", lvl: 2, prompt: "¿Cuánto es 2+2?", options: ["3", "4", "5", "6"], correctIndex: 1,
    explanation: null, category: "razonamiento_numerico", difficulty: "facil", isReal: true, confidence: "alta", sourceFile: "test" },
  { id: "rev-2", lvl: 4, prompt: "¿Cuánto es 3+3?", options: ["5", "6", "7", "8"], correctIndex: 1,
    explanation: null, category: "razonamiento_numerico", difficulty: "media", isReal: true, confidence: "alta", sourceFile: "test" },
  { id: "rev-3", lvl: 3, prompt: "Pregunta sin resolver.", options: ["a", "b", "c", "d"], correctIndex: 0,
    explanation: null, category: "razonamiento_numerico", difficulty: "media", isReal: true, confidence: "baja",
    sourceFile: "test", status: "revision" },
];

describe("buildReviewLesson", () => {
  it("sirve exactamente los ids pedidos, en cualquier nivel, ignorando REAL_CHANCE", () => {
    loadReal(fakeReal);
    try {
      const items = buildReviewLesson(["rev-1", "rev-2"]);
      expect(items.map((it) => it.id).sort()).toEqual(["rev-1", "rev-2"]);
      for (const it of items) expect(it.isReal).toBe(true);
    } finally {
      loadReal([]);
    }
  });

  it("descarta ids en status:'revision' y ids que ya no existen en REAL", () => {
    loadReal(fakeReal);
    try {
      const items = buildReviewLesson(["rev-1", "rev-3", "id-borrado"]);
      expect(items.map((it) => it.id)).toEqual(["rev-1"]);
    } finally {
      loadReal([]);
    }
  });

  it("lista vacía -> lección vacía, sin lanzar", () => {
    loadReal(fakeReal);
    try {
      expect(buildReviewLesson([])).toEqual([]);
    } finally {
      loadReal([]);
    }
  });
});
