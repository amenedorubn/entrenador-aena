// Tarea 1 · El validador falla si algún ítem no tiene `origen`, o si un `variante` no
// trae un `origenId` que exista de verdad en REAL.
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GRAMMAR, TRANSLATE, ERROR_CORRECTION } from "../data/english.js";
import { LISTENING } from "../data/listening.js";
import { SJT } from "../data/sjt.js";
import { makeItem, SOURCES } from "../js/content.js";
import { loadReal, REAL as REAL_LIVE } from "../data/real.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "real.source.js");
const ORIGENES = ["oficial", "generada", "variante"];

function assertOrigenValido(items, label, { onlyOficial = false, neverOficial = false } = {}) {
  for (const it of items) {
    expect(it.origen, `${label} · ${it.id}: sin campo origen`).toBeDefined();
    expect(ORIGENES, `${label} · ${it.id}: origen "${it.origen}" no es válido`).toContain(it.origen);
    if (onlyOficial) expect(it.origen, `${label} · ${it.id}: debería ser "oficial"`).toBe("oficial");
    if (neverOficial) expect(it.origen, `${label} · ${it.id}: un ítem no transcrito no puede declararse "oficial"`).not.toBe("oficial");
    if (it.origen === "variante") {
      expect(it.origenId, `${label} · ${it.id}: origen "variante" sin origenId`).toBeTruthy();
    }
  }
}

describe("origen · bancos estáticos", () => {
  it("GRAMMAR / ERROR_CORRECTION / TRANSLATE / LISTENING / SJT: origen presente y válido, nunca 'oficial'", () => {
    assertOrigenValido(GRAMMAR, "GRAMMAR", { neverOficial: true });
    assertOrigenValido(ERROR_CORRECTION, "ERROR_CORRECTION", { neverOficial: true });
    assertOrigenValido(TRANSLATE, "TRANSLATE", { neverOficial: true });
    assertOrigenValido(LISTENING, "LISTENING", { neverOficial: true });
    assertOrigenValido(SJT, "SJT", { neverOficial: true });
  });

  it.skipIf(!existsSync(SOURCE_PATH))("data/real.source.js: todo ítem es origen:'oficial', y todo 'variante' referencia un id real existente", async () => {
    const { REAL } = await import("../data/real.source.js");
    assertOrigenValido(REAL, "REAL", { onlyOficial: true });
    const ids = new Set(REAL.map((q) => q.id));
    for (const q of REAL) {
      if (q.origen === "variante") {
        expect(ids.has(q.origenId), `REAL · ${q.id}: origenId "${q.origenId}" no existe en REAL`).toBe(true);
      }
    }
  });
});

describe("origen · recuento por tipo (data/real.source.js)", () => {
  it.skipIf(!existsSync(SOURCE_PATH))("informa cuántos ítems reales hay por origen", async () => {
    const { REAL } = await import("../data/real.source.js");
    const counts = REAL.reduce((acc, q) => { acc[q.origen] = (acc[q.origen] ?? 0) + 1; return acc; }, {});
    console.log("Recuento REAL por origen:", counts);
    expect(counts.oficial ?? 0, "REAL debería ser 100% oficial hoy").toBe(REAL.length);
  });
});

describe("origen · todo ítem servido por el curso lo trae", () => {
  it("makeItem(source, tier) siempre devuelve origen válido, para cada fuente y tier", () => {
    // REAL vive vacío hasta descifrarse en el navegador (ver data/real.js) -- para que
    // pickReal tenga algo que servir en este test, se carga un REAL mínimo de mentira.
    loadReal([
      { id: "t-origen-1", lvl: 3, prompt: "¿Cuánto es 2+2?", options: ["3", "4", "5", "6"], correctIndex: 1,
        correctText: "4", origen: "oficial", explanation: null, category: "razonamiento_numerico",
        difficulty: "media", isReal: true, confidence: "alta", sourceFile: "test" },
    ]);
    try {
      for (const source of Object.keys(SOURCES)) {
        for (const tier of [1, 2, 3, 4, 5]) {
          for (let i = 0; i < 15; i++) {
            const it = makeItem(source, tier);
            if (!it) continue; // pool agotado en este intento puntual, no es un fallo de esquema
            expect(ORIGENES, `${source} t${tier}: origen "${it.origen}" no es válido`).toContain(it.origen);
          }
        }
      }
    } finally {
      loadReal([]); // no contaminar otros tests con este REAL de mentira
    }
  });
});
