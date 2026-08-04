import { describe, it, expect } from "vitest";
import { NUM_FAMILIES, generateNumeric } from "../js/gen-numeric.js";
import { ABS_FAMILIES, generateAbstract } from "../js/gen-abstract.js";
import { VERBAL_FAMILIES, generateVerbal } from "../js/gen-verbal.js";
import { generateEnglish, numberWords } from "../js/gen-english.js";
import { makeItem, SOURCES } from "../js/content.js";
import * as N from "../js/gen-numeric.js";
import * as A from "../js/gen-abstract.js";

const N_REPS = 120;
const TIERS = [1, 2, 3, 4, 5];

function parseSeries(prompt) {
  const m = prompt.match(/<span class="series">(.+?)<\/span>/);
  return m[1].replace(/,\s*\?$/, "").split(",").map((s) => Number(s.trim()));
}

/* ===================== forma común de todos los ítems ===================== */

function assertWellFormed(it, label) {
  expect(it.explanation?.trim().length, label).toBeGreaterThan(0);
  if (it.kind === "wordbank") {
    expect(it.answer.length, label).toBeGreaterThan(0);
    // Todas las fichas de la respuesta deben estar disponibles en el pool.
    const pool = [...it.tokens];
    for (const w of it.answer) {
      const i = pool.indexOf(w);
      expect(i, `${label}: falta la ficha "${w}"`).toBeGreaterThanOrEqual(0);
      pool.splice(i, 1);
    }
    return;
  }
  // Los generadores procedurales siempre dan 4 opciones; los ítems reales de examen
  // pueden traer entre 2 y 6 (la UI las soporta todas, ver engine.js KEYS).
  expect(it.options.length, label).toBeGreaterThanOrEqual(2);
  expect(it.options.length, label).toBeLessThanOrEqual(6);
  const keys = it.options.map((o) => (typeof o === "object" ? JSON.stringify(o) : String(o)));
  expect(new Set(keys).size, `${label}: opciones duplicadas → ${keys.join(" | ")}`).toBe(it.options.length);
  expect(it.correctIndex, label).toBeGreaterThanOrEqual(0);
  expect(it.correctIndex, label).toBeLessThanOrEqual(it.options.length - 1);
  if (it.value !== undefined && typeof it.options[it.correctIndex] === "string") {
    expect(String(it.options[it.correctIndex]), label).toContain(String(it.value));
  }
}

describe.each(TIERS)("generateNumeric(tier %i)", (tier) => {
  it("devuelve ítems bien formados con la opción correcta apuntando al valor calculado", () => {
    for (let i = 0; i < N_REPS; i++) assertWellFormed(generateNumeric(tier), `num t${tier}`);
  });
});

describe.each(TIERS)("generateAbstract(tier %i)", (tier) => {
  it("devuelve ítems bien formados con figuras de opción distintas", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = generateAbstract(tier);
      expect(["figure-series", "matrix"]).toContain(it.kind);
      assertWellFormed(it, `abs t${tier}`);
    }
  });
});

describe.each(TIERS)("generateVerbal(tier %i)", (tier) => {
  it("devuelve ítems bien formados", () => {
    for (let i = 0; i < N_REPS; i++) assertWellFormed(generateVerbal(tier), `verbal t${tier}`);
  });
});

describe.each(TIERS)("generateEnglish(tier %i)", (tier) => {
  it("devuelve ítems bien formados (test, listening y producción escrita)", () => {
    for (let i = 0; i < N_REPS; i++) assertWellFormed(generateEnglish(tier), `en t${tier}`);
  });
});

describe("todas las fuentes del curso", () => {
  it("cada fuente produce ítems válidos en todos los niveles", () => {
    for (const source of Object.keys(SOURCES)) {
      for (const tier of TIERS) {
        for (let i = 0; i < 30; i++) assertWellFormed(makeItem(source, tier), `${source} t${tier}`);
      }
    }
  });

  it("cada familia declarada se puede invocar sin error", () => {
    for (const t of TIERS) {
      NUM_FAMILIES[t].forEach((f) => assertWellFormed(f(t), `NUM_FAMILIES[${t}]`));
      ABS_FAMILIES[t].forEach((f) => assertWellFormed(f(t), `ABS_FAMILIES[${t}]`));
      VERBAL_FAMILIES[t].forEach((f) => assertWellFormed(f(t), `VERBAL_FAMILIES[${t}]`));
    }
  });
});

/* ============ recomputación independiente de la regla del enunciado ============ */

describe("reglas numéricas recomputadas desde el propio enunciado", () => {
  it("arithSeries: diferencia constante", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = N.arithSeries(1);
      const t = parseSeries(it.prompt);
      const d = t[1] - t[0];
      for (let k = 1; k < t.length; k++) expect(t[k] - t[k - 1]).toBe(d);
      expect(it.value).toBe(t.at(-1) + d);
    }
  });

  it("geomSeries: razón constante", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = N.geomSeries(2);
      const t = parseSeries(it.prompt);
      const r = t[1] / t[0];
      for (let k = 1; k < t.length; k++) expect(t[k] / t[k - 1]).toBeCloseTo(r);
      expect(it.value).toBeCloseTo(t.at(-1) * r);
    }
  });

  it("mulAddSeries: ×n+k resuelto por álgebra desde 3 términos", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = N.mulAddSeries(3);
      const t = parseSeries(it.prompt);
      const n = (t[2] - t[1]) / (t[1] - t[0]);
      const k = t[1] - t[0] * n;
      expect(it.value).toBeCloseTo(t.at(-1) * n + k);
    }
  });

  it("increasingDiff: la segunda diferencia es constante", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = N.increasingDiff(2);
      const t = parseSeries(it.prompt);
      const d = t.slice(1).map((x, k) => x - t[k]);
      const dd = d[1] - d[0];
      for (let k = 1; k < d.length; k++) expect(d[k] - d[k - 1]).toBe(dd);
      expect(it.value).toBe(t.at(-1) + d.at(-1) + dd);
    }
  });

  it("secondDiffSeries: la segunda diferencia es constante", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = N.secondDiffSeries(4);
      const t = parseSeries(it.prompt);
      const d = t.slice(1).map((x, k) => x - t[k]);
      const dd = d[1] - d[0];
      for (let k = 1; k < d.length; k++) expect(d[k] - d[k - 1]).toBe(dd);
      expect(it.value).toBe(t.at(-1) + d.at(-1) + dd);
    }
  });

  it("fibonacciSeries: cada término es la suma de los dos anteriores", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = N.fibonacciSeries(3);
      const t = parseSeries(it.prompt);
      for (let k = 2; k < t.length; k++) expect(t[k]).toBe(t[k - 1] + t[k - 2]);
      expect(it.value).toBe(t.at(-1) + t.at(-2));
    }
  });

  it("primeSeries: todos los términos y la solución son primos consecutivos", () => {
    const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
    for (let i = 0; i < N_REPS; i++) {
      const it = N.primeSeries(4);
      const t = parseSeries(it.prompt);
      t.forEach((x) => expect(isPrime(x)).toBe(true));
      expect(isPrime(it.value)).toBe(true);
      for (let n = t.at(-1) + 1; n < it.value; n++) expect(isPrime(n)).toBe(false);
    }
  });

  it("clockAngle: el ángulo coincide con la fórmula |30H − 5,5M|", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = N.clockAngle(5);
      const m = it.prompt.match(/<b>(\d+):(\d+)<\/b>/);
      const h = Number(m[1]) % 12, min = Number(m[2]);
      const raw = Math.abs(30 * h - 5.5 * min);
      expect(it.value).toBe(`${Math.round(Math.min(raw, 360 - raw))}°`);
    }
  });

  it("numericMatrix: filas y columnas mantienen un paso constante", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = N.numericMatrix(5);
      const nums = [...it.prompt.matchAll(/<span>([^<]+)<\/span>/g)].map((x) => x[1]);
      const g = nums.map((x) => (x === "?" ? null : Number(x)));
      const cs = g[1] - g[0];
      expect(g[2] - g[1]).toBe(cs);
      expect(g[4] - g[3]).toBe(cs);
      expect(g[7] - g[6]).toBe(cs);
      const rs = g[3] - g[0];
      expect(g[6] - g[3]).toBe(rs);
      expect(it.value).toBe(g[7] + cs);
    }
  });
});

describe("reglas abstractas recomputadas", () => {
  it("rotationSeries: paso de giro constante", () => {
    for (const step of [90, 45]) {
      for (let i = 0; i < N_REPS; i++) {
        const it = A.rotationSeries(1, step);
        const last = it.seq.at(-1).a;
        expect(it.options[it.correctIndex]).toEqual({ k: "arrow", a: (last + step) % 360 });
      }
    }
  });

  it("countSeries: paso de conteo constante", () => {
    for (const step of [1, -2]) {
      for (let i = 0; i < N_REPS; i++) {
        const it = A.countSeries(1, step);
        expect(it.options[it.correctIndex]).toEqual({ k: "dots", n: it.seq.at(-1).n + step });
      }
    }
  });

  it("polySides: los lados suben +1", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = A.polySides(2);
      expect(it.options[it.correctIndex]).toEqual({ k: "poly", n: it.seq.at(-1).n + 1 });
    }
  });

  it("matrix3x3: la celda que falta respeta el paso de fila y columna", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = A.matrix3x3(3);
      const v = (c) => c.n;
      const cs = v(it.cells[1]) - v(it.cells[0]);
      expect(v(it.cells[2]) - v(it.cells[1])).toBe(cs);
      expect(v(it.cells[7]) - v(it.cells[6])).toBe(cs);
      expect(it.options[it.correctIndex].n).toBe(v(it.cells[7]) + cs);
    }
  });

  it("doubleTransform: posición +1 mod 4 y relleno alternado", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = A.doubleTransform(3);
      const last = it.seq.at(-1);
      expect(it.options[it.correctIndex]).toEqual({ k: "sqfill", p: (last.p + 1) % 4, fill: !last.fill });
    }
  });

  it("comboSeries: los tres atributos avanzan a la vez", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = A.comboSeries(4);
      const last = it.seq.at(-1);
      const ans = it.options[it.correctIndex];
      expect(ans.n).toBe(last.n + 1);
      expect(ans.dots).toBe(last.dots + 1);
      expect(ans.fill).toBe(!last.fill);
    }
  });

  it("matrixTwoAttr: lados por fila y relleno por columna", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = A.matrixTwoAttr(4);
      const ans = it.options[it.correctIndex];
      expect(ans.n).toBe(it.cells[6].n);          // misma fila que la celda que falta
      expect(ans.fill).toBe(it.cells[2].fill);    // misma columna
    }
  });

  it("logicGrid: la tercera columna es la operación booleana de las dos primeras", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = A.logicGrid(5);
      const ops = { XOR: (a, b) => a !== b, AND: (a, b) => a && b, OR: (a, b) => a || b };
      const rowFits = (k, r) => it.cells[r * 3].cells.every((x, j) => ops[k](x, it.cells[r * 3 + 1].cells[j]) === it.cells[r * 3 + 2].cells[j]);
      // Las dos filas visibles deben identificar UNA sola operación: si encajara más
      // de una, el enunciado sería ambiguo y la respuesta no estaría determinada.
      const fits = Object.keys(ops).filter((k) => rowFits(k, 0) && rowFits(k, 1));
      expect(fits, "la regla debe quedar unívocamente determinada").toHaveLength(1);
      const name = fits[0];
      const a2 = it.cells[6].cells, b2 = it.cells[7].cells;
      expect(it.options[it.correctIndex].cells).toEqual(a2.map((x, j) => ops[name](x, b2[j])));
    }
  });

  it("rotationPlusCount: gira y gana un punto en cada paso", () => {
    for (let i = 0; i < N_REPS; i++) {
      const it = A.rotationPlusCount(5);
      const last = it.seq.at(-1);
      const step = (it.seq[1].rot - it.seq[0].rot + 360) % 360;
      const ans = it.options[it.correctIndex];
      expect(ans.dots).toBe(last.dots + 1);
      expect(ans.rot).toBe((last.rot + step) % 360);
    }
  });
});

describe("gen-english · números a palabras", () => {
  it("convierte correctamente los números que usan los avisos", () => {
    expect(numberWords(0)).toBe("zero");
    expect(numberWords(7)).toBe("seven");
    expect(numberWords(15)).toBe("fifteen");
    expect(numberWords(20)).toBe("twenty");
    expect(numberWords(22)).toBe("twenty-two");
    expect(numberWords(40)).toBe("forty");
    expect(numberWords(99)).toBe("ninety-nine");
  });
});
