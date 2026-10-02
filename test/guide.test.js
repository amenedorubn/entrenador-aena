// La guía de estudio se genera desde el banco descifrado: agrupa por `tema`, cuenta por
// bloque y no inventa nada si el banco no está cargado.
import { describe, it, expect } from "vitest";
import { guideHtml } from "../js/guide.js";

const q = (id, category, tema) => ({ id, category, tema, prompt: "Pregunta ___", options: ["a", "b", "c", "d"], correctIndex: 1, explanation: "Regla." });
const items = [q("wa-b1-140", "ingles_b1", "Collocations"), q("wa-b1-141", "ingles_b1", "Phrasal verbs"), q("wa-b2-1", "ingles_b2", "Preposiciones")];

describe("guideHtml", () => {
  it("B1 solo incluye B1, con el recuento por bloque", () => {
    const h = guideHtml("b1", items);
    expect(h).toContain("Inglés B1");
    expect(h).not.toContain("Inglés B2");
    expect(h).toContain("2 de 2");
  });
  it("Ambos incluye los dos bancos", () => {
    const h = guideHtml("all", items);
    expect(h).toContain("Inglés B1");
    expect(h).toContain("Inglés B2");
  });
  it("sin banco cargado avisa en vez de renderizar vacío", () => {
    expect(guideHtml("b1", [])).toContain("desbloquéalas");
  });
});
