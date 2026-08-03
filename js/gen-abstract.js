// Fase 1 · Generadores ABSTRACTOS por procedimiento.
// Specs de figura soportadas por engine.js:
//   {k:"arrow", a}                      flecha rotada a grados
//   {k:"dots", n}                       n puntos (1-9)
//   {k:"poly", n}                       polígono de n lados
//   {k:"sqfill", p, fill}               cuadrado, punto en esquina p, relleno sí/no
//   {k:"combo", n, fill, dots}          polígono n lados + relleno + nº de puntos interiores
//   {k:"grid", cells:[9 booleanos]}     rejilla 3×3 de celdas llenas/vacías
import { randInt, choice, buildFigureOptions } from "./rng.js";

const series = (o) => ({ kind: "figure-series", block: "abs", ...o });
const matrix = (o) => ({ kind: "matrix", block: "abs", ...o });

/* ------------------------------- TIER 1-2 ------------------------------- */

export function rotationSeries(tier = 1, step = 90) {
  const a0 = randInt(0, 3) * step;
  const seq = [0, 1, 2].map((k) => ({ k: "arrow", a: (a0 + k * step) % 360 }));
  const ans = { k: "arrow", a: (a0 + 3 * step) % 360 };
  const { options, correctIndex } = buildFigureOptions(ans, () => ({ k: "arrow", a: choice([0, 45, 90, 135, 180, 225, 270, 315]) }));
  return series({ family: "rot" + step, tier, seq, options, correctIndex,
    explanation: `Giro horario constante de <b>${step}°</b> en cada paso → ${ans.a}°.` });
}

export function countSeries(tier = 1, step = 1) {
  const lo = step > 0 ? 1 : 1 - 3 * step, hi = step > 0 ? 9 - 3 * step : 9;
  const start = randInt(lo, hi);
  const seq = [0, 1, 2].map((k) => ({ k: "dots", n: start + k * step }));
  const ans = { k: "dots", n: start + 3 * step };
  const { options, correctIndex } = buildFigureOptions(ans, () => ({ k: "dots", n: randInt(1, 9) }));
  return series({ family: "count", tier, seq, options, correctIndex,
    explanation: `El número de puntos cambia <b>${step > 0 ? "+" : ""}${step}</b> en cada paso → <b>${ans.n}</b>.` });
}

export function polySides(tier = 2) {
  const start = randInt(3, 5);
  const seq = [0, 1, 2].map((k) => ({ k: "poly", n: start + k }));
  const ans = { k: "poly", n: start + 3 };
  const { options, correctIndex } = buildFigureOptions(ans, () => ({ k: "poly", n: randInt(3, 9) }));
  return series({ family: "poly", tier, seq, options, correctIndex,
    explanation: `El número de lados sube <b>+1</b> en cada paso → <b>${ans.n} lados</b>.` });
}

/* ------------------------------- TIER 3 ------------------------------- */

export function matrix3x3(tier = 3) {
  const useDots = Math.random() < 0.5;
  const vMax = useDots ? 9 : 7;
  let base, rs, cs, guard = 0;
  do { base = randInt(1, 2); rs = randInt(1, 2); cs = randInt(1, 2); guard++; }
  while (base + 2 * rs + 2 * cs > vMax && guard < 60);
  if (base + 2 * rs + 2 * cs > vMax) { base = 1; rs = 1; cs = 1; }
  const make = (r, c) => {
    const v = base + r * rs + c * cs;
    return useDots ? { k: "dots", n: v } : { k: "poly", n: v + 2 };
  };
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(r === 2 && c === 2 ? null : make(r, c));
  const ans = make(2, 2);
  const { options, correctIndex } = buildFigureOptions(ans, () =>
    useDots ? { k: "dots", n: randInt(1, 9) } : { k: "poly", n: randInt(3, 9) });
  return matrix({ family: "matrix1", tier, cells, options, correctIndex,
    explanation: `Cada fila crece <b>+${cs}</b> por columna y cada columna <b>+${rs}</b> por fila → la celda que falta tiene <b>${useDots ? `${ans.n} puntos` : `${ans.n} lados`}</b>.` });
}

export function doubleTransform(tier = 3) {
  const p0 = randInt(0, 3), f0 = Math.random() < 0.5;
  const seq = [0, 1, 2].map((k) => ({ k: "sqfill", p: (p0 + k) % 4, fill: k % 2 === 0 ? f0 : !f0 }));
  const ans = { k: "sqfill", p: (p0 + 3) % 4, fill: !f0 };
  const { options, correctIndex } = buildFigureOptions(ans, () => ({ k: "sqfill", p: randInt(0, 3), fill: Math.random() < 0.5 }));
  return series({ family: "double", tier, seq, options, correctIndex,
    explanation: `Dos reglas simultáneas: el punto <b>rota en sentido horario</b> por las esquinas y el <b>relleno alterna</b> en cada paso.` });
}

/* ------------------------------- TIER 4 ------------------------------- */

export function comboSeries(tier = 4) {
  // Tres atributos avanzando a la vez: lados +1, relleno alterna, puntos +1.
  const s0 = randInt(3, 5), f0 = Math.random() < 0.5, d0 = randInt(0, 2);
  const at = (k) => ({ k: "combo", n: s0 + k, fill: k % 2 === 0 ? f0 : !f0, dots: d0 + k });
  const seq = [0, 1, 2].map(at);
  const ans = at(3);
  const { options, correctIndex } = buildFigureOptions(ans, () => ({
    k: "combo", n: randInt(3, 8), fill: Math.random() < 0.5, dots: randInt(0, 5),
  }));
  return series({ family: "combo", tier, seq, options, correctIndex,
    explanation: `Tres reglas a la vez: <b>lados +1</b>, <b>relleno alterna</b> y <b>puntos interiores +1</b> → ${ans.n} lados, ${ans.fill ? "relleno" : "sin relleno"}, ${ans.dots} puntos.` });
}

export function acceleratingRotation(tier = 4) {
  const step = choice([45, 90]);
  const a0 = randInt(0, 7) * 45;
  // El giro se acelera: +step, +2·step, +3·step…
  const angles = [a0];
  for (let k = 1; k <= 3; k++) angles.push((angles.at(-1) + k * step) % 360);
  const seq = angles.slice(0, 3).map((a) => ({ k: "arrow", a }));
  const ans = { k: "arrow", a: angles[3] };
  const { options, correctIndex } = buildFigureOptions(ans, () => ({ k: "arrow", a: choice([0, 45, 90, 135, 180, 225, 270, 315]) }));
  return series({ family: "accelrot", tier, seq, options, correctIndex,
    explanation: `El giro <b>se acelera</b>: +${step}°, +${2 * step}°, +${3 * step}° → ${ans.a}°.` });
}

export function matrixTwoAttr(tier = 4) {
  // Los lados dependen de la fila; el relleno, de la columna.
  const sideBase = randInt(3, 5);
  const fillCol = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5];
  if (fillCol[0] === fillCol[1] && fillCol[1] === fillCol[2]) fillCol[1] = !fillCol[1];
  const make = (r, c) => ({ k: "combo", n: sideBase + r, fill: fillCol[c], dots: 0 });
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(r === 2 && c === 2 ? null : make(r, c));
  const ans = make(2, 2);
  const { options, correctIndex } = buildFigureOptions(ans, () => ({
    k: "combo", n: randInt(3, 8), fill: Math.random() < 0.5, dots: 0,
  }));
  return matrix({ family: "matrix2", tier, cells, options, correctIndex,
    explanation: `Dos reglas independientes: el <b>número de lados</b> lo marca la <b>fila</b> (${sideBase}, ${sideBase + 1}, ${sideBase + 2}) y el <b>relleno</b> lo marca la <b>columna</b> → ${ans.n} lados, ${ans.fill ? "relleno" : "sin relleno"}.` });
}

/* ------------------------------- TIER 5 ------------------------------- */

const OPS = {
  XOR: { label: "solo en una de las dos", fn: (a, b) => a !== b },
  AND: { label: "en las dos a la vez", fn: (a, b) => a && b },
  OR: { label: "en al menos una", fn: (a, b) => a || b },
};

export function logicGrid(tier = 5) {
  const opName = choice(Object.keys(OPS));
  const op = OPS[opName];
  const others = Object.keys(OPS).filter((k) => k !== opName);
  const rnd = () => Array.from({ length: 9 }, () => Math.random() < 0.45);

  // Las dos primeras filas deben DESCARTAR todas las demás operaciones; si no,
  // el enunciado admitiría más de una regla y la respuesta no sería única.
  const rulesOut = (rows) =>
    others.every((k) =>
      rows.slice(0, 2).some(([A, B, C]) => A.some((x, i) => OPS[k].fn(x, B[i]) !== C[i])));

  let rows, guard = 0;
  do {
    rows = [];
    for (let r = 0; r < 3; r++) {
      const A = rnd(), B = rnd();
      rows.push([A, B, A.map((x, i) => op.fn(x, B[i]))]);
    }
    guard++;
  } while (!rulesOut(rows) && guard < 200);
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    cells.push(r === 2 && c === 2 ? null : { k: "grid", cells: rows[r][c] });
  }
  const ans = { k: "grid", cells: rows[2][2] };
  const { options, correctIndex } = buildFigureOptions(ans, () => {
    // Distractores plausibles: el resultado de aplicar OTRA operación a la misma pareja.
    const other = choice(Object.keys(OPS).filter((k) => k !== opName));
    const alt = rows[2][0].map((x, i) => OPS[other].fn(x, rows[2][1][i]));
    return Math.random() < 0.6 ? { k: "grid", cells: alt } : { k: "grid", cells: rnd() };
  });
  return matrix({ family: "logic", tier, cells, options, correctIndex,
    explanation: `La <b>tercera columna</b> se obtiene combinando las dos primeras: se pinta la casilla si está pintada <b>${op.label}</b> (operación ${opName}).` });
}

export function matrixThreeAttr(tier = 5) {
  const sideBase = randInt(3, 5);
  const dotsBase = randInt(0, 1);
  const make = (r, c) => ({ k: "combo", n: sideBase + r, fill: (r + c) % 2 === 0, dots: dotsBase + c });
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(r === 2 && c === 2 ? null : make(r, c));
  const ans = make(2, 2);
  const { options, correctIndex } = buildFigureOptions(ans, () => ({
    k: "combo", n: randInt(3, 8), fill: Math.random() < 0.5, dots: randInt(0, 4),
  }));
  return matrix({ family: "matrix3", tier, cells, options, correctIndex,
    explanation: `Tres reglas: <b>lados</b> según la fila, <b>puntos</b> según la columna y <b>relleno</b> en tablero de ajedrez → ${ans.n} lados, ${ans.dots} puntos, ${ans.fill ? "relleno" : "sin relleno"}.` });
}

export function rotationPlusCount(tier = 5) {
  const step = choice([45, 90]);
  const a0 = randInt(0, 7) * 45, d0 = randInt(1, 3);
  const at = (k) => ({ k: "combo", n: 4, fill: false, dots: d0 + k, rot: (a0 + k * step) % 360 });
  const seq = [0, 1, 2].map(at);
  const ans = at(3);
  const { options, correctIndex } = buildFigureOptions(ans, () => ({
    k: "combo", n: 4, fill: false, dots: randInt(1, 7), rot: choice([0, 45, 90, 135, 180, 225, 270, 315]),
  }));
  return series({ family: "rotcount", tier, seq, options, correctIndex,
    explanation: `La figura <b>gira ${step}°</b> y además <b>gana un punto</b> en cada paso → ${ans.rot}° con ${ans.dots} puntos.` });
}

/* --------------------------- registro por tier --------------------------- */
export const ABS_FAMILIES = {
  1: [(t) => rotationSeries(t, 90), (t) => countSeries(t, 1)],
  2: [(t) => rotationSeries(t, 45), (t) => countSeries(t, -2), polySides],
  3: [matrix3x3, doubleTransform],
  4: [comboSeries, acceleratingRotation, matrixTwoAttr],
  5: [logicGrid, matrixThreeAttr, rotationPlusCount],
};

export function generateAbstract(tier) {
  const t = Math.min(5, Math.max(1, tier | 0));
  const pool = ABS_FAMILIES[t];
  return pool[Math.floor(Math.random() * pool.length)](t);
}
