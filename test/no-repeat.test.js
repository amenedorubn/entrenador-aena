// Bug: la misma pregunta podía salir dos veces en una lección (content.js elegía cada
// ítem con Math.random() independiente, sin memoria de lo ya servido). Este test cubre
// las dos mitades del fix:
//  (A) generadores por procedimiento: una lección completa de cada unidad del curso no
//      repite ni id real ni firma de pregunta generada.
//  (B) banco real: con REAL_CHANCE forzando muchas preguntas reales por lección y un
//      pool real deliberadamente pequeño, ningún id real se repite dentro de una misma
//      lección (se agota y pasa a generar, nunca repite).
//
// Nota: REAL empieza vacío hasta que loadReal() descifra el banco (ver js/app.js), así
// que (A) corre contra los generadores por procedimiento tal cual en CI/local sin el
// banco real; (B) inyecta un banco real de prueba con loadReal() para ejercitar
// también esa mitad del fix sin depender de data/real.source.js (gitignored).
import { describe, it, expect } from "vitest";
import { WORLDS } from "../js/curriculum.js";
import { buildLesson } from "../js/content.js";
import { loadReal } from "../data/real.js";

function normalizeText(text) {
  return text
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
/** Misma lógica de firma que content.js (duplicada a propósito: el test no debe
 * depender de detalles internos no exportados, solo de la garantía observable). */
function signatureOf(item) {
  if (typeof item.prompt === "string" && item.prompt.length) {
    return `${normalizeText(item.prompt)}|${item.image ?? ""}`;
  }
  return `${item.family}|${item.tier}|${JSON.stringify(item.seq ?? item.cells ?? item.options)}`;
}

function assertNoRepeats(items, label) {
  const ids = items.filter((it) => it.isReal).map((it) => it.id);
  expect(new Set(ids).size, `${label}: id real repetido`).toBe(ids.length);
  const sigs = items.map(signatureOf);
  expect(new Set(sigs).size, `${label}: pregunta repetida (misma firma)`).toBe(sigs.length);
}

describe("sin repeticiones dentro de una lección", () => {
  it("(A) una lección completa de cada unidad no repite id ni firma", () => {
    const QUESTIONS_PER_LESSON = 10;
    const units = WORLDS.flatMap((w) => w.units.map((u) => ({ ...u, tier: w.tier })));
    for (const u of units) {
      const items = buildLesson(u.sources, u.tier, QUESTIONS_PER_LESSON);
      // Nunca se rellena repitiendo: la lección puede salir más corta, nunca más larga.
      expect(items.length, u.id).toBeLessThanOrEqual(QUESTIONS_PER_LESSON);
      assertNoRepeats(items, u.id);
    }
  });

  it("(B) con un banco real pequeño, ningún id real se repite en una misma lección", () => {
    const fakeReal = Array.from({ length: 5 }, (_, i) => ({
      id: `test-num-${i}`, lvl: 3, prompt: `Pregunta de prueba número ${i} ¿cuánto es 1+${i}?`,
      options: ["a", "b", "c", "d"], correctIndex: i % 4, explanation: null,
      category: "razonamiento_numerico", difficulty: "media", isReal: true, confidence: "alta",
      sourceFile: "test",
    }));
    loadReal(fakeReal);
    try {
      // Muchas tiradas: con solo 5 ítems reales elegibles y 10 preguntas por lección,
      // si el bug de repetición siguiera ahí, saldría casi seguro en alguna de estas.
      for (let trial = 0; trial < 60; trial++) {
        const items = buildLesson(["num"], 3, 10);
        assertNoRepeats(items, `banco real pequeño, tirada ${trial}`);
      }
    } finally {
      loadReal([]); // no dejar el banco de prueba puesto para otros tests del proceso
    }
  });
});
