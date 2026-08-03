// Fase 1 · Generadores NUMÉRICOS por procedimiento.
// Cada familia declara su tier (1 = más fácil … 5 = nivel élite). El enunciado y la
// solución se calculan con la misma regla → la respuesta correcta lo es por construcción.
import { randInt, choice, gcd, primesFrom, factorial, frac, buildOptions } from "./rng.js";

const S = (terms) => `<span class="series">${terms.join(", ")}, ?</span>`;
const item = (o) => ({ kind: "text", block: "num", ...o });

/* ------------------------------- TIER 1 ------------------------------- */

export function arithSeries(tier = 1) {
  const d = randInt(2, 12), a = randInt(1, 25);
  const terms = [0, 1, 2, 3, 4].map((k) => a + k * d);
  const v = a + 5 * d;
  const { options, correctIndex } = buildOptions(v, () => v + choice([-2, -1, 1, 2, d, -d]) * randInt(1, 2));
  return item({ family: "arith", tier, prompt: `Serie: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Serie aritmética de razón <b>+${d}</b> → ${terms[4]} + ${d} = <b>${v}</b>.` });
}

export function simplePercent(tier = 1) {
  const pct = choice([5, 10, 15, 20, 25, 40, 50, 75]);
  const base = randInt(2, 40) * 20;
  const v = (base * pct) / 100;
  const { options, correctIndex } = buildOptions(v, () => Math.max(1, v + choice([-20, -10, -5, 5, 10, 20])));
  return item({ family: "percent", tier, prompt: `¿Cuánto es el <b>${pct}%</b> de <b>${base}</b>?`, options, correctIndex, value: v,
    explanation: `${base} × ${pct}/100 = <b>${v}</b>.` });
}

export function reverseDiscount(tier = 1) {
  const pct = choice([10, 20, 25, 40, 50]);
  const original = randInt(3, 30) * 20;
  const v = original - (original * pct) / 100;
  const { options, correctIndex } = buildOptions(v, () => Math.max(5, v + choice([-30, -20, -10, 10, 20, 30])), (x) => `${x} €`);
  return item({ family: "discount", tier, prompt: `Un artículo de <b>${original} €</b> tiene un descuento del <b>${pct}%</b>. ¿Precio final?`,
    options, correctIndex, value: `${v} €`,
    explanation: `${original} × ${(100 - pct) / 100} = <b>${v} €</b>.` });
}

export function speedTime(tier = 1) {
  const speed = randInt(4, 18) * 10, time = randInt(2, 7);
  const dist = speed * time;
  const { options, correctIndex } = buildOptions(speed, () => Math.max(10, speed + choice([-30, -20, -10, 10, 20, 30])), (x) => `${x} km/h`);
  return item({ family: "speed", tier, prompt: `Un vehículo recorre <b>${dist} km</b> en <b>${time} h</b>. ¿Velocidad media?`,
    options, correctIndex, value: `${speed} km/h`,
    explanation: `${dist} ÷ ${time} = <b>${speed} km/h</b>.` });
}

export function fractionOf(tier = 1) {
  const den = choice([2, 3, 4, 5, 8]), num = randInt(1, den - 1);
  const base = den * randInt(4, 30);
  const v = (base * num) / den;
  const { options, correctIndex } = buildOptions(v, () => Math.max(1, v + choice([-base / den, base / den, -5, 5, 10])));
  return item({ family: "fraction", tier, prompt: `¿Cuánto es <b>${num}/${den}</b> de <b>${base}</b>?`, options, correctIndex, value: v,
    explanation: `${base} ÷ ${den} = ${base / den}; ${base / den} × ${num} = <b>${v}</b>.` });
}

/* ------------------------------- TIER 2 ------------------------------- */

export function geomSeries(tier = 2) {
  const r = choice([2, 3, 4]), a = randInt(1, 6);
  const terms = [0, 1, 2, 3].map((k) => a * r ** k);
  const v = a * r ** 4;
  const { options, correctIndex } = buildOptions(v, () => v + choice([-r, r, -2 * r, 2 * r, -1, 1]) * randInt(1, 3));
  return item({ family: "geom", tier, prompt: `Serie: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Serie geométrica de razón <b>×${r}</b> → ${terms[3]} × ${r} = <b>${v}</b>.` });
}

export function increasingDiff(tier = 2) {
  const a = randInt(1, 12), d0 = randInt(1, 5), acc = randInt(1, 3);
  const terms = [a]; let d = d0;
  for (let i = 0; i < 5; i++) { terms.push(terms.at(-1) + d); d += acc; }
  const v = terms.pop();
  const { options, correctIndex } = buildOptions(v, () => v + choice([-4, -3, -2, -1, 1, 2, 3, 4]));
  return item({ family: "incdiff", tier, prompt: `Serie: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Las diferencias crecen de ${acc} en ${acc} (${d0}, ${d0 + acc}, ${d0 + 2 * acc}…) → última diferencia +${d - acc} → <b>${v}</b>.` });
}

export function chainedPercent(tier = 2) {
  const up = choice([10, 20, 25, 50]), down = choice([10, 20, 25, 50]);
  const f = ((100 + up) * (100 - down)) / 10000;
  const net = Math.round((f - 1) * 10000) / 100;
  const v = net === 0 ? "queda igual" : net > 0 ? `sube un ${net}%` : `baja un ${Math.abs(net)}%`;
  const pool = [`sube un ${up}%`, `baja un ${down}%`, "queda igual", `baja un ${up}%`, `sube un ${down}%`].filter((x) => x !== v);
  let i = 0;
  const { options, correctIndex } = buildOptions(v, () => pool[i++ % pool.length], (x) => x);
  return item({ family: "chainpct", tier, prompt: `Un precio sube un <b>${up}%</b> y después baja un <b>${down}%</b>. Respecto al inicial:`,
    options, correctIndex, value: v,
    explanation: `${(100 + up) / 100} × ${(100 - down) / 100} = ${f.toFixed(4)} → <b>${v}</b>. Los porcentajes encadenados no se suman.` });
}

export function mixture(tier = 2) {
  let n, c1, c2, x, guard = 0;
  do {
    n = randInt(2, 12) * 5; c1 = choice([20, 30, 40, 50, 60, 80]); c2 = choice([10, 20, 25, 30, 40]);
    x = c2 < c1 ? (n * c1) / c2 - n : NaN; guard++;
  } while ((!Number.isInteger(x) || x <= 0) && guard < 400);
  if (!Number.isInteger(x) || x <= 0) { n = 20; c1 = 30; c2 = 20; x = 10; }
  const { options, correctIndex } = buildOptions(x, () => Math.max(1, x + choice([-10, -5, -2, 2, 5, 10])), (y) => `${y} L`);
  return item({ family: "mixture", tier, prompt: `Tienes <b>${n} L</b> de disolución al <b>${c1}%</b>. ¿Cuánta agua añadir para bajarla al <b>${c2}%</b>?`,
    options, correctIndex, value: `${x} L`,
    explanation: `Soluto = ${(n * c1) / 100} L (no cambia). ${(n * c1) / 100} ÷ (${n}+x) = ${c2 / 100} → x = <b>${x} L</b>.` });
}

export function agesProblem(tier = 2) {
  let m, k, y, b, guard = 0;
  do {
    m = randInt(2, 5); k = randInt(2, m); y = randInt(2, 12) * Math.max(1, m - k);
    b = m === k ? NaN : (y * (k - 1)) / (m - k); guard++;
  } while ((!Number.isInteger(b) || b <= 0) && guard < 400);
  if (!Number.isInteger(b) || b <= 0) { m = 3; k = 2; y = 10; b = 10; }
  const word = (n) => (n === 2 ? "el doble de" : n === 3 ? "el triple de" : `${n} veces`);
  const { options, correctIndex } = buildOptions(b, () => Math.max(1, b + choice([-6, -4, -2, 2, 4, 6])));
  return item({ family: "ages", tier, prompt: `Ana tiene ${word(m)} la edad de Beto. Dentro de <b>${y} años</b> tendrá ${word(k)} la edad de Beto. ¿Edad actual de Beto?`,
    options, correctIndex, value: b,
    explanation: `${m}B + ${y} = ${k}(B + ${y}) → ${m}B + ${y} = ${k}B + ${k * y} → B = <b>${b}</b>.` });
}

export function workRate(tier = 2) {
  const t1 = randInt(3, 12), t2 = randInt(3, 12);
  const v = frac(t1 * t2, t1 + t2);
  const { options, correctIndex } = buildOptions(v, () => {
    const a = t1 + choice([-2, -1, 1, 2]), b = t2 + choice([-2, -1, 1, 2]);
    return a > 0 && b > 0 ? frac(a * b, a + b) : null;
  }, (x) => `${x} h`);
  return item({ family: "work", tier, prompt: `Dos operarios tardan <b>${t1} h</b> y <b>${t2} h</b> por separado en la misma tarea. Juntos tardan:`,
    options, correctIndex, value: `${v} h`,
    explanation: `Ritmos 1/${t1} + 1/${t2} por hora → tiempo = ${t1}×${t2}/(${t1}+${t2}) = <b>${v} h</b>.` });
}

/* ------------------------------- TIER 3 ------------------------------- */

export function mulAddSeries(tier = 3) {
  const n = randInt(2, 4), k = randInt(1, 9), a = randInt(1, 7);
  const terms = [a];
  for (let i = 0; i < 4; i++) terms.push(terms.at(-1) * n + k);
  const v = terms.pop();
  const { options, correctIndex } = buildOptions(v, () => v + choice([-k, k, -n, n, -1, 1]) * randInt(1, 5));
  return item({ family: "muladd", tier, prompt: `Serie: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Regla <b>×${n} + ${k}</b> → ${terms.at(-1)} × ${n} + ${k} = <b>${v}</b>.` });
}

export function interleavedSeries(tier = 3) {
  const a0 = randInt(1, 12), da = randInt(2, 7), b0 = randInt(1, 12), db = randInt(2, 7);
  const A = [0, 1, 2, 3].map((i) => a0 + i * da);
  const B = [0, 1, 2].map((i) => b0 + i * db);
  const terms = [A[0], B[0], A[1], B[1], A[2], B[2]];
  const v = A[3];
  const { options, correctIndex } = buildOptions(v, () => v + choice([-da, da, -db, db, -1, 1, 2]));
  return item({ family: "interleaved", tier, prompt: `Serie intercalada: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Dos series alternas: posiciones impares +${da} (${A.join(", ")}) y pares +${db} (${B.join(", ")}). Toca la primera → <b>${v}</b>.` });
}

export function squaresSeries(tier = 3) {
  const start = randInt(1, 6), k = choice([0, 0, 1, -1, 2]);
  const terms = [0, 1, 2, 3, 4].map((i) => (start + i) ** 2 + k);
  const v = (start + 5) ** 2 + k;
  const { options, correctIndex } = buildOptions(v, () => v + choice([-9, -5, -2, 2, 5, 9, 11]));
  return item({ family: "squares", tier, prompt: `Serie: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Son cuadrados perfectos${k ? ` ${k > 0 ? "+" : "−"} ${Math.abs(k)}` : ""}: ${start}², ${start + 1}²… → ${start + 5}²${k ? (k > 0 ? ` + ${k}` : ` − ${-k}`) : ""} = <b>${v}</b>.` });
}

export function fibonacciSeries(tier = 3) {
  const a = randInt(1, 8), b = randInt(a, a + 9);
  const terms = [a, b];
  for (let i = 0; i < 4; i++) terms.push(terms.at(-1) + terms.at(-2));
  const v = terms.pop();
  const { options, correctIndex } = buildOptions(v, () => v + choice([-5, -3, -2, 2, 3, 5]));
  return item({ family: "fibo", tier, prompt: `Serie: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Cada término es la <b>suma de los dos anteriores</b> → ${terms.at(-2)} + ${terms.at(-1)} = <b>${v}</b>.` });
}

export function combinatorics(tier = 3) {
  const mode = choice(["perm", "pairs", "comb"]);
  if (mode === "perm") {
    const n = randInt(4, 7), v = factorial(n);
    const { options, correctIndex } = buildOptions(v, () => Math.max(2, v + choice([-120, -24, -6, 6, 24, 120])));
    return item({ family: "combi", tier, prompt: `¿De cuántas formas distintas se pueden ordenar <b>${n}</b> personas en fila?`, options, correctIndex, value: v,
      explanation: `Permutaciones: ${n}! = <b>${v}</b>.` });
  }
  if (mode === "pairs") {
    const n = randInt(5, 12), v = (n * (n - 1)) / 2;
    const { options, correctIndex } = buildOptions(v, () => Math.max(1, v + choice([-6, -3, -1, 1, 3, 6])));
    return item({ family: "combi", tier, prompt: `¿Cuántos apretones de manos hay si <b>${n}</b> personas se saludan todas entre sí una vez?`, options, correctIndex, value: v,
      explanation: `C(${n},2) = ${n}×${n - 1}/2 = <b>${v}</b>.` });
  }
  const n = randInt(5, 8), k = randInt(2, 3);
  const v = factorial(n) / (factorial(k) * factorial(n - k));
  const { options, correctIndex } = buildOptions(v, () => Math.max(1, v + choice([-10, -5, -2, 2, 5, 10])));
  return item({ family: "combi", tier, prompt: `¿Cuántos grupos de <b>${k}</b> se pueden formar con <b>${n}</b> personas (el orden no importa)?`, options, correctIndex, value: v,
    explanation: `C(${n},${k}) = ${n}!/(${k}!·${n - k}!) = <b>${v}</b>.` });
}

export function simpleProbability(tier = 3) {
  const r = randInt(2, 9), b = randInt(2, 9);
  const v = frac(r, r + b);
  const { options, correctIndex } = buildOptions(v, () => {
    const rr = r + choice([-2, -1, 1, 2]), bb = b + choice([-2, -1, 1, 2]);
    return rr > 0 && bb > 0 ? frac(rr, rr + bb) : null;
  }, (x) => x);
  return item({ family: "prob", tier, prompt: `Una urna tiene <b>${r} bolas rojas</b> y <b>${b} azules</b>. ¿Probabilidad de sacar una roja?`,
    options, correctIndex, value: v,
    explanation: `Casos favorables / posibles = ${r}/${r + b} = <b>${v}</b>.` });
}

export function averageProblem(tier = 3) {
  const n = randInt(4, 9), avg = randInt(5, 20);
  const extra = randInt(1, 12) * (n + 1) - n * avg;
  const v = (n * avg + extra) / (n + 1);
  const { options, correctIndex } = buildOptions(v, () => Math.max(1, v + choice([-4, -3, -2, -1, 1, 2, 3, 4])));
  return item({ family: "average", tier, prompt: `La media de <b>${n}</b> números es <b>${avg}</b>. Si se añade el número <b>${extra}</b>, la nueva media es:`,
    options, correctIndex, value: v,
    explanation: `Suma = ${n}×${avg} = ${n * avg}; nueva suma = ${n * avg + extra}; ÷ ${n + 1} = <b>${v}</b>.` });
}

/* ------------------------------- TIER 4 ------------------------------- */

export function primeSeries(tier = 4) {
  const start = choice([2, 3, 5, 7, 11, 13, 17]);
  const p = primesFrom(start, 6);
  const v = p[5];
  const { options, correctIndex } = buildOptions(v, () => v + choice([-6, -4, -2, 1, 2, 4, 6]));
  return item({ family: "primes", tier, prompt: `Serie: ${S(p.slice(0, 5))}`, options, correctIndex, value: v,
    explanation: `Son <b>números primos consecutivos</b> → el siguiente primo tras ${p[4]} es <b>${v}</b>.` });
}

export function alternatingOps(tier = 4) {
  const mul = randInt(2, 4), sub = randInt(1, 9), a = randInt(3, 12);
  const terms = [a];
  for (let i = 0; i < 5; i++) terms.push(i % 2 === 0 ? terms.at(-1) * mul : terms.at(-1) - sub);
  const v = terms.pop();
  const nextOp = terms.length % 2 === 1 ? `×${mul}` : `−${sub}`;
  const { options, correctIndex } = buildOptions(v, () => v + choice([-mul, mul, -sub, sub, -2, 2]) * randInt(1, 3));
  return item({ family: "altops", tier, prompt: `Serie: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Las operaciones se alternan: <b>×${mul}</b>, <b>−${sub}</b>, ×${mul}, −${sub}… Ahora toca ${nextOp} → <b>${v}</b>.` });
}

export function secondDiffSeries(tier = 4) {
  const a = randInt(2, 15), d0 = randInt(2, 6), dd = randInt(2, 5);
  const terms = [a]; let d = d0;
  for (let i = 0; i < 5; i++) { terms.push(terms.at(-1) + d); d += dd; }
  const v = terms.pop();
  const { options, correctIndex } = buildOptions(v, () => v + choice([-dd, dd, -3, -1, 1, 3]));
  return item({ family: "secdiff", tier, prompt: `Serie: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Diferencias: ${d0}, ${d0 + dd}, ${d0 + 2 * dd}… (segunda diferencia constante <b>+${dd}</b>) → última diferencia +${d - dd} → <b>${v}</b>.` });
}

export function compoundInterest(tier = 4) {
  const base = randInt(1, 30) * 100, r = choice([10, 20, 50]), n = 2;
  const v = (base * (100 + r) ** n) / 100 ** n;
  const { options, correctIndex } = buildOptions(v, () => v + choice([-100, -50, -20, 20, 50, 100]), (x) => `${x} €`);
  return item({ family: "compound", tier, prompt: `Un capital de <b>${base} €</b> crece un <b>${r}%</b> anual durante <b>${n} años</b>. ¿Capital final?`,
    options, correctIndex, value: `${v} €`,
    explanation: `${base} × ${(100 + r) / 100}² = <b>${v} €</b>. Ojo: no es ${base} + ${2 * r}% (el interés se acumula).` });
}

export function weightedAverage(tier = 4) {
  let n1, n2, a1, a2, v, guard = 0;
  do {
    n1 = randInt(2, 12); n2 = randInt(2, 12); a1 = randInt(3, 20); a2 = randInt(3, 20);
    v = (n1 * a1 + n2 * a2) / (n1 + n2); guard++;
  } while (!Number.isInteger(v) && guard < 400);
  if (!Number.isInteger(v)) { n1 = 2; n2 = 2; a1 = 4; a2 = 6; v = 5; }
  const { options, correctIndex } = buildOptions(v, () => Math.max(1, v + choice([-3, -2, -1, 1, 2, 3])));
  return item({ family: "wavg", tier, prompt: `Un grupo de <b>${n1}</b> personas tiene una media de <b>${a1}</b> y otro de <b>${n2}</b> personas una media de <b>${a2}</b>. ¿Media conjunta?`,
    options, correctIndex, value: v,
    explanation: `(${n1}×${a1} + ${n2}×${a2}) ÷ ${n1 + n2} = ${n1 * a1 + n2 * a2} ÷ ${n1 + n2} = <b>${v}</b>. No es la media de las medias.` });
}

export function twoDrawProbability(tier = 4) {
  const r = randInt(3, 8), b = randInt(2, 8), n = r + b;
  const v = frac(r * (r - 1), n * (n - 1));
  const { options, correctIndex } = buildOptions(v, () => {
    const rr = r + choice([-1, 1]);
    return rr > 1 ? frac(rr * (rr - 1), n * (n - 1)) : frac(r * r, n * n);
  }, (x) => x);
  return item({ family: "prob2", tier, prompt: `Urna con <b>${r} rojas</b> y <b>${b} azules</b>. Se sacan <b>2 bolas sin reposición</b>. ¿Probabilidad de que ambas sean rojas?`,
    options, correctIndex, value: v,
    explanation: `${r}/${n} × ${r - 1}/${n - 1} = <b>${v}</b>. La segunda extracción tiene una bola menos.` });
}

export function ratioSharing(tier = 4) {
  const a = randInt(1, 6), b = randInt(1, 6), c = randInt(1, 6);
  const unit = randInt(5, 40), total = (a + b + c) * unit;
  const v = a * unit;
  const { options, correctIndex } = buildOptions(v, () => Math.max(1, choice([b, c]) * unit + choice([-5, 0, 5])), (x) => `${x} €`);
  return item({ family: "ratio", tier, prompt: `Se reparten <b>${total} €</b> en la proporción <b>${a}:${b}:${c}</b>. ¿Cuánto recibe el primero?`,
    options, correctIndex, value: `${v} €`,
    explanation: `${a}+${b}+${c} = ${a + b + c} partes; ${total} ÷ ${a + b + c} = ${unit} € por parte; ${a} × ${unit} = <b>${v} €</b>.` });
}

/* ------------------------------- TIER 5 ------------------------------- */

export function mixedRuleSeries(tier = 5) {
  const mul = randInt(2, 3), add = randInt(2, 9), a = randInt(2, 8);
  const terms = [a];
  for (let i = 0; i < 5; i++) terms.push(i % 2 === 0 ? terms.at(-1) * mul + add : terms.at(-1) - add);
  const v = terms.pop();
  const nextIsMul = terms.length % 2 === 1;
  const { options, correctIndex } = buildOptions(v, () => v + choice([-add, add, -mul, mul, -3, 3]) * randInt(1, 3));
  return item({ family: "mixedrule", tier, prompt: `Serie: ${S(terms)}`, options, correctIndex, value: v,
    explanation: `Alterna <b>×${mul}+${add}</b> y <b>−${add}</b>. Ahora toca ${nextIsMul ? `×${mul}+${add}` : `−${add}`} → <b>${v}</b>.` });
}

export function numericMatrix(tier = 5) {
  const base = randInt(1, 9), rs = randInt(2, 7), cs = randInt(2, 7);
  const val = (r, c) => base + r * rs + c * cs;
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(r === 2 && c === 2 ? null : val(r, c));
  const v = val(2, 2);
  const { options, correctIndex } = buildOptions(v, () => v + choice([-cs, cs, -rs, rs, -1, 1]) * randInt(1, 2));
  const grid = `<div class="numgrid">${cells.map((x) => `<span>${x === null ? "?" : x}</span>`).join("")}</div>`;
  return item({ family: "nummatrix", tier, prompt: `¿Qué número completa la matriz?${grid}`, options, correctIndex, value: v,
    explanation: `Cada fila avanza <b>+${cs}</b> por columna y cada columna <b>+${rs}</b> por fila → ${val(2, 1)} + ${cs} = <b>${v}</b>.` });
}

export function clockAngle(tier = 5) {
  const h = randInt(1, 12), m = choice([0, 10, 20, 30, 40, 50]);
  const raw = Math.abs(30 * (h % 12) - 5.5 * m);
  const v = Math.round(Math.min(raw, 360 - raw));
  const { options, correctIndex } = buildOptions(v, () => {
    const d = v + choice([-30, -15, -5, 5, 15, 30]);
    return d >= 0 && d <= 180 ? d : null;
  }, (x) => `${x}°`);
  return item({ family: "clock", tier, prompt: `¿Qué ángulo forman las agujas de un reloj a las <b>${h}:${String(m).padStart(2, "0")}</b>?`,
    options, correctIndex, value: `${v}°`,
    explanation: `Hora: 30°×${h % 12} = ${30 * (h % 12)}°. Minutero: 5,5°×${m} = ${5.5 * m}°. Diferencia = <b>${v}°</b> (el menor de los dos ángulos).` });
}

export function multiStepWord(tier = 5) {
  const gross = randInt(10, 40) * 100;
  const disc = choice([10, 20, 25]);
  const tax = choice([10, 21]);
  const afterDisc = gross * (1 - disc / 100);
  const v = Math.round(afterDisc * (1 + tax / 100) * 100) / 100;
  const fmt = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;
  const { options, correctIndex } = buildOptions(v, () => Math.round((v + choice([-120, -60, -30, 30, 60, 120])) * 100) / 100, fmt);
  return item({ family: "multistep", tier, prompt: `Un pedido de <b>${gross} €</b> tiene un <b>${disc}% de descuento</b> y después se le aplica un <b>${tax}% de IVA</b>. ¿Importe final?`,
    options, correctIndex, value: fmt(v),
    explanation: `${gross} × ${(100 - disc) / 100} = ${afterDisc} €; ${afterDisc} × ${(100 + tax) / 100} = <b>${fmt(v)}</b>.` });
}

export function hardCombinatorics(tier = 5) {
  const mode = choice(["word", "committee", "arrange"]);
  if (mode === "word") {
    const words = [["PATATA", 6, [3, 2]], ["BANANA", 6, [3, 2]], ["CARRERA", 7, [3, 2]], ["ALGEBRA", 7, [2]]];
    const [w, n, reps] = choice(words);
    const v = factorial(n) / reps.reduce((acc, r) => acc * factorial(r), 1);
    const { options, correctIndex } = buildOptions(v, () => Math.max(1, v + choice([-120, -60, -20, 20, 60, 120])));
    return item({ family: "hardcombi", tier, prompt: `¿Cuántas palabras distintas (con o sin sentido) se pueden formar con las letras de <b>${w}</b>?`,
      options, correctIndex, value: v,
      explanation: `${n}! dividido entre los factoriales de las letras repetidas (${reps.join(", ")}) = <b>${v}</b>.` });
  }
  if (mode === "committee") {
    const men = randInt(4, 7), women = randInt(4, 7), km = 2, kw = 2;
    const C = (n, k) => factorial(n) / (factorial(k) * factorial(n - k));
    const v = C(men, km) * C(women, kw);
    const { options, correctIndex } = buildOptions(v, () => Math.max(1, v + choice([-60, -30, -10, 10, 30, 60])));
    return item({ family: "hardcombi", tier, prompt: `De <b>${men} hombres</b> y <b>${women} mujeres</b>, ¿cuántos comités de <b>2 y 2</b> se pueden formar?`,
      options, correctIndex, value: v,
      explanation: `C(${men},2) × C(${women},2) = ${C(men, km)} × ${C(women, kw)} = <b>${v}</b>.` });
  }
  const n = randInt(4, 6), v = factorial(n) * 2;
  const { options, correctIndex } = buildOptions(v, () => Math.max(2, v + choice([-48, -24, -12, 12, 24, 48])));
  return item({ family: "hardcombi", tier, prompt: `¿De cuántas formas se sientan <b>${n} personas</b> en fila si dos concretas deben ir siempre juntas?`,
    options, correctIndex, value: v,
    explanation: `Se tratan las dos como un bloque: ${n - 1}! = ${factorial(n - 1)} ordenaciones × 2 (el bloque puede ir en 2 órdenes) = <b>${v}</b>.` });
}

export function hardProbability(tier = 5) {
  const r = randInt(3, 7), b = randInt(3, 7), n = r + b;
  // P(al menos una roja en 2 extracciones sin reposición) = 1 − P(ninguna roja)
  const num = n * (n - 1) - b * (b - 1);
  const v = frac(num, n * (n - 1));
  const { options, correctIndex } = buildOptions(v, () => frac(b * (b - 1), n * (n - 1)), (x) => x);
  return item({ family: "hardprob", tier, prompt: `Urna con <b>${r} rojas</b> y <b>${b} azules</b>. Se extraen <b>2 sin reposición</b>. ¿Probabilidad de sacar <b>al menos una roja</b>?`,
    options, correctIndex, value: v,
    explanation: `Complementario: P(ninguna roja) = ${b}/${n} × ${b - 1}/${n - 1} = ${frac(b * (b - 1), n * (n - 1))}. 1 − eso = <b>${v}</b>.` });
}

/* --------------------------- registro por tier --------------------------- */
export const NUM_FAMILIES = {
  1: [arithSeries, simplePercent, reverseDiscount, speedTime, fractionOf],
  2: [geomSeries, increasingDiff, chainedPercent, mixture, agesProblem, workRate],
  3: [mulAddSeries, interleavedSeries, squaresSeries, fibonacciSeries, combinatorics, simpleProbability, averageProblem],
  4: [primeSeries, alternatingOps, secondDiffSeries, compoundInterest, weightedAverage, twoDrawProbability, ratioSharing],
  5: [mixedRuleSeries, numericMatrix, clockAngle, multiStepWord, hardCombinatorics, hardProbability],
};

export function generateNumeric(tier) {
  const t = Math.min(5, Math.max(1, tier | 0));
  const pool = NUM_FAMILIES[t];
  return pool[Math.floor(Math.random() * pool.length)](t);
}
