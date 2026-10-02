// Pantalla de estudio de Inglés oficial: agrupación por tema (studyBlocks) y recorrido
// completo inicio → tema → tarjetas → examen, con un DOM mínimo simulado.
import { describe, it, expect } from "vitest";
import { studyBlocks } from "../js/guide.js";
import { createStudy } from "../js/study.js";

const q = (id, category, tema, extra = {}) => ({
  id, category, tema, prompt: "Pregunta ___ ?", options: ["a", "b", "c", "d"], correctIndex: 1,
  explanation: "Regla.", optionNotes: ["n1", "Correcto", "n3", "n4"], ...extra,
});
const items = [
  q("wa-b1-140", "ingles_b1", "Collocations"), q("wa-b1-141", "ingles_b1", "Phrasal verbs"),
  q("wa-b1-142", "ingles_b1", "Vocabulario por campos"), q("wa-b1-143", "ingles_b1", "Voz pasiva"),
  q("wa-b2-1", "ingles_b2", "Preposiciones"), q("wa-b1-9", "ingles_b1", undefined),
];

describe("studyBlocks", () => {
  it("agrupa por bloque, ordena de más a menos preguntas y descarta ítems sin tema", () => {
    const b = studyBlocks("b1", items);
    expect(b.map((x) => x.name)).toEqual(["Vocabulario: collocations, phrasal verbs y palabras", "Voz pasiva"]);
    expect(b[0].items.map((x) => x.id)).toEqual(["wa-b1-140", "wa-b1-141", "wa-b1-142"]);
    expect(b[0].rules.length).toBeGreaterThan(0);
  });
  it("cada banco solo trae lo suyo", () => {
    expect(studyBlocks("b2", items).flatMap((x) => x.items.map((i) => i.id))).toEqual(["wa-b2-1"]);
  });
});

function fakeRoot() {
  const root = { innerHTML: "", handler: null, closest: () => null };
  root.addEventListener = (_t, h) => { root.handler = h; };
  // Simula un clic en un elemento con atributos data-*
  root.click = (attrs) => root.handler({
    target: { closest: (sel) => {
      const key = sel.match(/\[data-(\w+)\]/)?.[1];
      return key && attrs[key] !== undefined ? { dataset: attrs } : null;
    } },
  });
  return root;
}

describe("createStudy", () => {
  it("recorre inicio → tema → tarjetas → examen", () => {
    const root = fakeRoot();
    const started = [];
    let bank = "b1";
    const study = createStudy(root, {
      items: () => items, seen: () => ["wa-b1-140"], missed: () => ["wa-b1-141"],
      bank: () => bank, setBank: (b) => { bank = b; },
      startBlock: (ids, label) => started.push({ ids, label }),
    });
    study.open();
    expect(root.innerHTML).toContain("Vocabulario: collocations");
    expect(root.innerHTML).toContain("Dominadas 1 de 3");

    root.click({ block: "Vocabulario: collocations, phrasal verbs y palabras" });
    expect(root.innerHTML).toContain("Aprende lo esencial");
    expect(root.innerHTML).toContain("Solo mis 1 fallo");

    root.click({ act: "cards" });
    expect(root.innerHTML).toContain("Mostrar respuesta");
    root.click({ act: "reveal" });
    expect(root.innerHTML).toContain("¿Por qué las otras no?");
    root.click({ grade: "known" });
    root.click({ act: "reveal" });
    root.click({ grade: "again" }); // vuelve a salir
    expect(root.innerHTML).toContain("quedan 2");

    root.click({ act: "block" });
    root.click({ act: "exam-missed" });
    expect(started).toEqual([{ ids: ["wa-b1-141"], label: "Vocabulario: collocations, phrasal verbs y palabras · solo fallos" }]);
  });

  it("cambiar de banco vuelve al inicio con los temas del otro banco", () => {
    const root = fakeRoot();
    let bank = "b1";
    const study = createStudy(root, {
      items: () => items, seen: () => [], missed: () => [],
      bank: () => bank, setBank: (b) => { bank = b; }, startBlock: () => {},
    });
    study.open();
    root.click({ bank: "b2" });
    expect(root.innerHTML).toContain("Preposiciones");
    expect(root.innerHTML).not.toContain("Voz pasiva");
  });
});
