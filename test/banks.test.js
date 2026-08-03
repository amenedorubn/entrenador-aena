import { describe, it, expect } from "vitest";
import { VERBAL } from "../data/verbal.js";
import { GRAMMAR } from "../data/grammar.js";
import { SJT } from "../data/sjt.js";
import { LISTENING } from "../data/listening.js";
import { SPEAKING_PROMPTS } from "../data/speaking.js";

// Requisito no negociable del prompt: en todos los ítems curados, el índice de
// respuesta correcta apunta a la opción esperada, y los bancos cumplen las
// cuotas mínimas para que casi nunca se repita una sesión.
const BANKS = [
  { name: "VERBAL", items: VERBAL, min: 30, hasDifficulty: true },
  { name: "GRAMMAR", items: GRAMMAR, min: 30, hasDifficulty: false },
  { name: "SJT", items: SJT, min: 25, hasDifficulty: false },
  { name: "LISTENING", items: LISTENING, min: 15, hasDifficulty: false },
];

describe.each(BANKS)("$name", ({ items, min, hasDifficulty }) => {
  it(`tiene al menos ${min} ítems`, () => {
    expect(items.length).toBeGreaterThanOrEqual(min);
  });

  it("tiene ids únicos", () => {
    const ids = items.map((it) => it.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada ítem tiene 4 opciones, sin duplicados", () => {
    for (const it of items) {
      expect(it.options).toHaveLength(4);
      expect(new Set(it.options).size).toBe(4);
    }
  });

  it("correctIndex apunta a una opción válida (0-3)", () => {
    for (const it of items) {
      expect(Number.isInteger(it.correctIndex)).toBe(true);
      expect(it.correctIndex).toBeGreaterThanOrEqual(0);
      expect(it.correctIndex).toBeLessThanOrEqual(3);
    }
  });

  it("prompt y explanation no están vacíos", () => {
    for (const it of items) {
      expect(it.prompt.trim().length).toBeGreaterThan(0);
      expect(it.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  if (hasDifficulty) {
    it("difficulty es uno de facil/medio/dificil", () => {
      for (const it of items) {
        expect(["facil", "medio", "dificil"]).toContain(it.difficulty);
      }
    });
  }
});

describe("LISTENING", () => {
  it("cada ítem trae el audio (texto para SpeechSynthesis)", () => {
    for (const it of LISTENING) expect(it.audio.trim().length).toBeGreaterThan(0);
  });
});

describe("SPEAKING_PROMPTS", () => {
  it("tiene varios prompts no vacíos", () => {
    expect(SPEAKING_PROMPTS.length).toBeGreaterThanOrEqual(6);
    for (const p of SPEAKING_PROMPTS) expect(p.trim().length).toBeGreaterThan(0);
  });
});
