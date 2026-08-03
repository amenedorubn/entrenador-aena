import { describe, it, expect } from "vitest";
import { generateNumeric, generateAbstract, _internal } from "../js/generators.js";

const N = 150; // repeticiones por dificultad para cazar casos límite

function parseSeries(prompt) {
  const m = prompt.match(/<span class="series">(.+?)<\/span>/);
  const raw = m[1].replace(/,\s*\?$/, "");
  return raw.split(",").map((s) => Number(s.trim()));
}

/* ============================== NUMÉRICO — genérico ============================== */
describe.each(["facil", "medio", "dificil", "mix"])("generateNumeric(%s)", (difficulty) => {
  it(`devuelve ${N} ítems bien formados y con el índice correcto apuntando al valor calculado`, () => {
    for (let i = 0; i < N; i++) {
      const item = generateNumeric(difficulty);
      expect(item.kind).toBe("text");
      expect(item.options).toHaveLength(4);
      expect(new Set(item.options).size).toBe(4); // sin distractores duplicados
      expect(item.correctIndex).toBeGreaterThanOrEqual(0);
      expect(item.correctIndex).toBeLessThanOrEqual(3);
      expect(item.explanation.trim().length).toBeGreaterThan(0);
      // La opción marcada como correcta contiene el valor que el propio generador calculó.
      expect(String(item.options[item.correctIndex])).toContain(String(item.value));
    }
  });
});

/* ============================== ABSTRACTO — genérico ============================== */
describe.each(["facil", "medio", "dificil", "mix"])("generateAbstract(%s)", (difficulty) => {
  it(`devuelve ${N} ítems bien formados, con figuras de opción únicas`, () => {
    for (let i = 0; i < N; i++) {
      const item = generateAbstract(difficulty);
      expect(["figure-series", "matrix"]).toContain(item.kind);
      expect(item.options).toHaveLength(4);
      expect(new Set(item.options.map((o) => JSON.stringify(o))).size).toBe(4);
      expect(item.correctIndex).toBeGreaterThanOrEqual(0);
      expect(item.correctIndex).toBeLessThanOrEqual(3);
      expect(item.explanation.trim().length).toBeGreaterThan(0);
    }
  });
});

/* ============================== recomputaciones independientes por regla ============================== */
describe("reglas numéricas — recomputación independiente a partir del enunciado", () => {
  it("arithSeries: razón constante y valor = último + razón", () => {
    for (let i = 0; i < N; i++) {
      const item = _internal.genArithSeries("facil");
      const terms = parseSeries(item.prompt);
      const d = terms[1] - terms[0];
      for (let k = 1; k < terms.length; k++) expect(terms[k] - terms[k - 1]).toBe(d);
      expect(item.value).toBe(terms[terms.length - 1] + d);
      expect(Number(item.options[item.correctIndex])).toBe(item.value);
    }
  });

  it("geometricSeries: razón constante y valor = último × razón", () => {
    for (let i = 0; i < N; i++) {
      const item = _internal.genGeometricSeries("medio");
      const terms = parseSeries(item.prompt);
      const r = terms[1] / terms[0];
      for (let k = 1; k < terms.length; k++) expect(terms[k] / terms[k - 1]).toBeCloseTo(r);
      expect(item.value).toBeCloseTo(terms[terms.length - 1] * r);
      expect(Number(item.options[item.correctIndex])).toBe(item.value);
    }
  });

  it("multiplyAddSeries: ×n+k consistente resuelto por álgebra a partir de 3 términos", () => {
    for (let i = 0; i < N; i++) {
      const item = _internal.genMultiplyAddSeries("dificil");
      const terms = parseSeries(item.prompt);
      const [a0, a1, a2] = terms;
      const n = (a2 - a1) / (a1 - a0);
      const k = a1 - a0 * n;
      const last = terms[terms.length - 1];
      const expected = last * n + k;
      expect(item.value).toBeCloseTo(expected);
      expect(Number(item.options[item.correctIndex])).toBe(item.value);
    }
  });

  it("increasingDiffSeries: las diferencias entre términos suben +1 cada vez", () => {
    for (let i = 0; i < N; i++) {
      const item = _internal.genIncreasingDiffSeries("medio");
      const terms = parseSeries(item.prompt);
      const diffs = [];
      for (let k = 1; k < terms.length; k++) diffs.push(terms[k] - terms[k - 1]);
      for (let k = 1; k < diffs.length; k++) expect(diffs[k] - diffs[k - 1]).toBe(1);
      const nextDiff = diffs[diffs.length - 1] + 1;
      expect(item.value).toBe(terms[terms.length - 1] + nextDiff);
    }
  });
});

describe("reglas abstractas — recomputación independiente", () => {
  it("genRotationSeries: gira siempre el mismo paso, mod 360", () => {
    for (const step of [90, 45]) {
      for (let i = 0; i < N; i++) {
        const item = _internal.genRotationSeries("x", step);
        const last = item.seq[item.seq.length - 1].a;
        const expected = (last + step) % 360;
        expect(item.options[item.correctIndex]).toEqual({ k: "arrow", a: expected });
      }
    }
  });

  it("genCountSeries: el número de puntos avanza siempre el mismo paso", () => {
    for (const step of [1, -2]) {
      for (let i = 0; i < N; i++) {
        const item = _internal.genCountSeries("x", step);
        const last = item.seq[item.seq.length - 1].n;
        expect(item.options[item.correctIndex]).toEqual({ k: "dots", n: last + step });
      }
    }
  });

  it("genPolySides: el número de lados sube +1 por paso", () => {
    for (let i = 0; i < N; i++) {
      const item = _internal.genPolySides("medio");
      const last = item.seq[item.seq.length - 1].n;
      expect(item.options[item.correctIndex]).toEqual({ k: "poly", n: last + 1 });
    }
  });

  it("genMatrix3x3: la fila incompleta respeta el mismo incremento por columna que las filas completas", () => {
    for (let i = 0; i < N; i++) {
      const item = _internal.genMatrix3x3("dificil");
      const field = "n";
      const row0 = [item.cells[0][field], item.cells[1][field], item.cells[2][field]];
      const row1 = [item.cells[3][field], item.cells[4][field], item.cells[5][field]];
      const stepCol = row0[1] - row0[0];
      expect(row0[2] - row0[1]).toBe(stepCol);
      expect(row1[1] - row1[0]).toBe(stepCol);
      expect(row1[2] - row1[1]).toBe(stepCol);
      const row2Partial = [item.cells[6][field], item.cells[7][field]];
      expect(row2Partial[1] - row2Partial[0]).toBe(stepCol);
      const expected = row2Partial[1] + stepCol;
      expect(item.options[item.correctIndex][field]).toBe(expected);
    }
  });

  it("genDoubleTransform: posición +1 módulo 4 y relleno alternado respecto al último término", () => {
    for (let i = 0; i < N; i++) {
      const item = _internal.genDoubleTransform("dificil");
      const lastTerm = item.seq[item.seq.length - 1];
      const expected = { k: "sqfill", p: (lastTerm.p + 1) % 4, fill: !lastTerm.fill };
      expect(item.options[item.correctIndex]).toEqual(expected);
    }
  });
});
