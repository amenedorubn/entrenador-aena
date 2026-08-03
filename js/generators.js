// Fase 1 · Generadores procedurales — Numérico y Abstracto.
// Requisito no negociable: el generador crea el enunciado Y calcula la solución
// con la misma regla, de modo que la respuesta correcta lo es por construcción.
// Cada función devuelve un ítem ya listo para el motor de render (engine.js).

/* ---------------------------- utilidades ---------------------------- */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
function nextPrimesFrom(start, count) {
  const out = []; let n = start;
  while (out.length < count) { if (isPrime(n)) out.push(n); n++; }
  return out;
}

// Combina un valor correcto + distractores en opciones barajadas (texto).
function finalizeTextOptions(correctVal, makeDistractor, formatFn = (v) => String(v)) {
  const seen = new Set([formatFn(correctVal)]);
  const vals = [correctVal];
  let guard = 0;
  while (vals.length < 4 && guard < 200) {
    guard++;
    const d = makeDistractor();
    const f = formatFn(d);
    if (!seen.has(f)) { seen.add(f); vals.push(d); }
  }
  const items = vals.map((v, i) => ({ text: formatFn(v), correct: i === 0 }));
  const shuffled = shuffle(items);
  return { options: shuffled.map((x) => x.text), correctIndex: shuffled.findIndex((x) => x.correct) };
}

// Igual que arriba pero conservando specs de figura (objetos), no texto.
function specKey(spec) { return JSON.stringify(spec); }
function finalizeFigureOptions(correctSpec, makeDistractorSpec) {
  const seen = new Set([specKey(correctSpec)]);
  const specs = [correctSpec];
  let guard = 0;
  while (specs.length < 4 && guard < 200) {
    guard++;
    const d = makeDistractorSpec();
    const k = specKey(d);
    if (!seen.has(k)) { seen.add(k); specs.push(d); }
  }
  const items = specs.map((s, i) => ({ spec: s, correct: i === 0 }));
  const shuffled = shuffle(items);
  return { options: shuffled.map((x) => x.spec), correctIndex: shuffled.findIndex((x) => x.correct) };
}

/* ============================== NUMÉRICO ============================== */

// Fácil · serie aritmética a, a+d, a+2d…
function genArithSeries(difficulty) {
  const d = randInt(2, 9), a = randInt(1, 20);
  const terms = [0, 1, 2, 3, 4].map((k) => a + k * d);
  const answer = a + 5 * d;
  const { options, correctIndex } = finalizeTextOptions(answer, () => answer + choice([-2, -1, 1, 2, d, -d]) * randInt(1, 2));
  return { kind: "text", difficulty, block: "num", prompt: `Serie: <span class="series">${terms.join(", ")}, ?</span>`, options, correctIndex, value: answer, explanation: `Serie aritmética de razón +${d} → ${terms[4]} + ${d} = <b>${answer}</b>.` };
}

// Fácil · porcentaje simple
function genSimplePercent(difficulty) {
  const pct = choice([5, 10, 20, 25, 50]);
  const base = randInt(2, 30) * 20; // múltiplo de 20 → % simple siempre entero
  const answer = (base * pct) / 100;
  const { options, correctIndex } = finalizeTextOptions(answer, () => Math.max(1, answer + choice([-10, -5, -2, 2, 5, 10])));
  return { kind: "text", difficulty, block: "num", prompt: `¿Cuánto es el <b>${pct}%</b> de <b>${base}</b>?`, options, correctIndex, value: answer, explanation: `${pct}% de ${base} = ${base} × ${pct}/100 = <b>${answer}</b>.` };
}

// Fácil · descuento simple
function genSimpleDiscount(difficulty) {
  const pct = choice([10, 20, 25, 50]);
  const price = randInt(2, 30) * 20;
  const answer = price - (price * pct) / 100;
  const { options, correctIndex } = finalizeTextOptions(answer, () => Math.max(1, answer + choice([-20, -10, -5, 5, 10, 20])));
  return { kind: "text", difficulty, block: "num", prompt: `Un artículo de <b>${price} €</b> tiene un descuento del <b>${pct}%</b>. ¿Precio final?`, options: options.map((o) => `${o} €`), correctIndex, value: `${answer} €`, explanation: `${price} € − ${pct}% = ${price} × ${(100 - pct) / 100} = <b>${answer} €</b>.` };
}

// Fácil · velocidad media
function genSpeedTime(difficulty) {
  const speed = randInt(4, 16) * 10;
  const time = randInt(2, 6);
  const dist = speed * time;
  const { options, correctIndex } = finalizeTextOptions(speed, () => Math.max(10, speed + choice([-30, -20, -10, 10, 20, 30])));
  return { kind: "text", difficulty, block: "num", prompt: `Un vehículo recorre <b>${dist} km</b> en <b>${time} h</b>. ¿Velocidad media?`, options: options.map((o) => `${o} km/h`), correctIndex, value: `${speed} km/h`, explanation: `${dist} ÷ ${time} = <b>${speed} km/h</b>.` };
}

// Medio · serie geométrica ×r
function genGeometricSeries(difficulty) {
  const r = choice([2, 3]), a = randInt(1, 5);
  const terms = [0, 1, 2, 3].map((k) => a * Math.pow(r, k));
  const answer = a * Math.pow(r, 4);
  const { options, correctIndex } = finalizeTextOptions(answer, () => answer + choice([-r, r, -2 * r, 2 * r, -1, 1]) * randInt(1, 3));
  return { kind: "text", difficulty, block: "num", prompt: `Serie: <span class="series">${terms.join(", ")}, ?</span>`, options, correctIndex, value: answer, explanation: `Serie geométrica de razón ×${r} → ${terms[3]} × ${r} = <b>${answer}</b>.` };
}

// Medio · diferencias crecientes (+1,+2,+3…)
function genIncreasingDiffSeries(difficulty) {
  const a = randInt(1, 10), d0 = randInt(1, 4);
  const terms = [a];
  let diff = d0;
  for (let i = 0; i < 5; i++) { terms.push(terms[terms.length - 1] + diff); diff++; }
  const answer = terms.pop();
  const { options, correctIndex } = finalizeTextOptions(answer, () => answer + choice([-3, -2, -1, 1, 2, 3]));
  return { kind: "text", difficulty, block: "num", prompt: `Serie: <span class="series">${terms.join(", ")}, ?</span>`, options, correctIndex, value: answer, explanation: `Las diferencias entre términos crecen +1 cada vez (${d0}, ${d0 + 1}, ${d0 + 2}…) → siguiente diferencia +${diff} → <b>${answer}</b>.` };
}

// Medio · porcentajes encadenados (sube X%, baja Y%)
function genChainedPercent(difficulty) {
  const up = choice([10, 20, 25, 50]), down = choice([10, 20, 25, 50]);
  const factor = (100 + up) * (100 - down); // /10000
  const netPct = Math.round((factor / 10000 - 1) * 10000) / 100; // % neto, con 2 decimales
  const netStr = netPct === 0 ? "queda igual" : netPct > 0 ? `sube un ${netPct}%` : `baja un ${Math.abs(netPct)}%`;
  const distractors = [`sube un ${up}%`, `baja un ${down}%`, "queda igual", `sube un ${Math.abs(netPct)}%`];
  const pool = distractors.filter((d) => d !== netStr);
  let i = 0;
  const { options, correctIndex } = finalizeTextOptions(netStr, () => pool[(i++) % pool.length], (v) => v);
  return { kind: "text", difficulty, block: "num", prompt: `Un precio sube un <b>${up}%</b> y después baja un <b>${down}%</b>. Respecto al precio inicial, el resultado final:`, options, correctIndex, value: netStr, explanation: `(1 + ${up}/100) × (1 − ${down}/100) = ${(factor / 10000).toFixed(4)} → el precio <b>${netStr}</b> respecto al original.` };
}

// Medio · proporciones / mezclas
function genRatioMixture(difficulty) {
  let n, c1, c2, x;
  let guard = 0;
  do {
    n = randInt(2, 10) * 5;
    c1 = choice([20, 30, 40, 50, 60]);
    c2 = choice([10, 20, 30, 40]);
    if (c2 >= c1) continue;
    x = (n * c1) / c2 - n;
    guard++;
  } while ((!Number.isInteger(x) || x <= 0) && guard < 500);
  if (!Number.isInteger(x) || x <= 0) { n = 20; c1 = 30; c2 = 20; x = 10; } // fallback verificado
  const { options, correctIndex } = finalizeTextOptions(x, () => Math.max(1, x + choice([-10, -5, -2, 2, 5, 10])));
  return { kind: "text", difficulty, block: "num", prompt: `Tienes <b>${n} L</b> de disolución al <b>${c1}%</b>. ¿Cuánta agua hay que añadir para bajarla al <b>${c2}%</b>?`, options: options.map((o) => `${o} L`), correctIndex, value: `${x} L`, explanation: `Soluto = ${(n * c1) / 100} L. ${(n * c1) / 100} / (${n}+x) = ${c2}/100 → x = <b>${x} L</b>.` };
}

// Medio · problema de edades
function genAgesProblem(difficulty) {
  let m, k, y, b;
  let guard = 0;
  do {
    m = randInt(2, 4); k = randInt(2, m); y = randInt(2, 15) * (m - k || 1);
    b = (y * (k - 1)) / (m - k);
    guard++;
  } while ((!Number.isInteger(b) || b <= 0 || m === k) && guard < 500);
  if (!Number.isInteger(b) || b <= 0) { m = 3; k = 2; y = 10; b = 10; } // fallback verificado (seed original)
  const { options, correctIndex } = finalizeTextOptions(b, () => Math.max(1, b + choice([-5, -3, -2, 2, 3, 5])));
  return { kind: "text", difficulty, block: "num", prompt: `Ana tiene ${m === 2 ? "el doble" : m === 3 ? "el triple" : `${m} veces`} la edad de Beto. Dentro de ${y} años tendrá ${k === 2 ? "el doble" : `${k} veces`} la edad de Beto. ¿Edad actual de Beto?`, options, correctIndex, value: b, explanation: `${m}B + ${y} = ${k}(B + ${y}) → B = <b>${b}</b>.` };
}

// Difícil · ×n + k
function genMultiplyAddSeries(difficulty) {
  const n = randInt(2, 3), k = randInt(1, 6), a = randInt(1, 6);
  const terms = [a];
  for (let i = 0; i < 4; i++) terms.push(terms[terms.length - 1] * n + k);
  const answer = terms.pop();
  const { options, correctIndex } = finalizeTextOptions(answer, () => answer + choice([-k, k, -n, n, -1, 1]) * randInt(1, 4));
  return { kind: "text", difficulty, block: "num", prompt: `Serie: <span class="series">${terms.join(", ")}, ?</span>`, options, correctIndex, value: answer, explanation: `Regla ×${n} + ${k} → ${terms[terms.length - 1]}×${n}+${k} = <b>${answer}</b>.` };
}

// Difícil · series intercaladas (dos series arimtéticas alternadas)
function genInterleavedSeries(difficulty) {
  const a0 = randInt(1, 10), da = randInt(2, 5);
  const b0 = randInt(1, 10), db = randInt(2, 5);
  const A = [0, 1, 2, 3].map((i) => a0 + i * da);
  const B = [0, 1, 2].map((i) => b0 + i * db);
  const terms = [A[0], B[0], A[1], B[1], A[2], B[2]];
  const answer = A[3];
  const { options, correctIndex } = finalizeTextOptions(answer, () => answer + choice([-da, da, -db, db, -1, 1]));
  return { kind: "text", difficulty, block: "num", prompt: `Serie intercalada: <span class="series">${terms.join(", ")}, ?</span>`, options, correctIndex, value: answer, explanation: `Dos series intercaladas: posiciones impares +${da} (${A.join(", ")}…) y pares +${db}. Toca la primera → <b>${answer}</b>.` };
}

// Difícil · combinatoria básica
function genCombinatorics(difficulty) {
  const n = randInt(4, 6);
  if (Math.random() < 0.5) {
    const answer = factorial(n);
    const { options, correctIndex } = finalizeTextOptions(answer, () => Math.max(2, answer + choice([-24, -6, -2, 2, 6, 24])));
    return { kind: "text", difficulty, block: "num", prompt: `¿De cuántas formas distintas se pueden ordenar <b>${n}</b> personas en fila?`, options, correctIndex, value: answer, explanation: `${n}! = ${answer.toLocaleString("es-ES")} formas distintas.` };
  }
  const answer = (n * (n - 1)) / 2;
  const { options, correctIndex } = finalizeTextOptions(answer, () => Math.max(1, answer + choice([-4, -2, -1, 1, 2, 4])));
  return { kind: "text", difficulty, block: "num", prompt: `¿Cuántas parejas distintas se pueden formar entre <b>${n}</b> personas?`, options, correctIndex, value: answer, explanation: `C(${n},2) = ${n}×${n - 1}/2 = <b>${answer}</b>.` };
}
function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }

// Difícil · trabajo combinado (ritmos de trabajo), respuesta como fracción exacta
function genWorkRate(difficulty) {
  const t1 = randInt(3, 10), t2 = randInt(3, 10);
  let num = t1 * t2, den = t1 + t2;
  const g = gcd(num, den);
  num /= g; den /= g;
  const answerStr = den === 1 ? `${num} h` : `${num}/${den} h`;
  const { options, correctIndex } = finalizeTextOptions(answerStr, () => {
    const fn = num + choice([-2, -1, 1, 2]), fd = den + choice([-1, 1, 0]) || 1;
    return fd === 1 ? `${Math.max(1, fn)} h` : `${Math.max(1, fn)}/${Math.max(2, fd)} h`;
  }, (v) => v);
  return { kind: "text", difficulty, block: "num", prompt: `Dos operarios tardan <b>${t1} h</b> y <b>${t2} h</b> (por separado) en la misma tarea. Trabajando juntos, ¿cuánto tardan?`, options, correctIndex, value: answerStr, explanation: `1/${t1} + 1/${t2} por hora → tiempo conjunto = ${t1}×${t2}/(${t1}+${t2}) = <b>${answerStr}</b>.` };
}

// Difícil · primos o factoriales (serie)
function genPrimeOrFactorialSeries(difficulty) {
  if (Math.random() < 0.5) {
    const start = choice([2, 3, 5, 7, 11]);
    const primes = nextPrimesFrom(start, 6);
    const shown = primes.slice(0, 5);
    const answer = primes[5];
    const { options, correctIndex } = finalizeTextOptions(answer, () => answer + choice([-4, -2, -1, 1, 2, 4]));
    return { kind: "text", difficulty, block: "num", prompt: `Serie: <span class="series">${shown.join(", ")}, ?</span>`, options, correctIndex, value: answer, explanation: `Son números primos consecutivos → siguiente <b>${answer}</b>.` };
  }
  const terms = [1, 2, 6, 24, 120];
  const answer = 720;
  const { options, correctIndex } = finalizeTextOptions(answer, () => answer + choice([-360, -120, -60, 60, 120, 360]));
  return { kind: "text", difficulty, block: "num", prompt: `Serie: <span class="series">${terms.join(", ")}, ?</span>`, options, correctIndex, value: answer, explanation: `Se multiplica por 2, 3, 4, 5 → siguiente ×6 → 120×6 = <b>${answer}</b>.` };
}

const NUM_POOLS = {
  facil: [genArithSeries, genSimplePercent, genSimpleDiscount, genSpeedTime],
  medio: [genGeometricSeries, genIncreasingDiffSeries, genChainedPercent, genRatioMixture, genAgesProblem],
  dificil: [genMultiplyAddSeries, genInterleavedSeries, genCombinatorics, genWorkRate, genPrimeOrFactorialSeries],
};

export function generateNumeric(difficulty) {
  const pool = difficulty === "mix"
    ? [...NUM_POOLS.facil, ...NUM_POOLS.medio, ...NUM_POOLS.dificil]
    : (NUM_POOLS[difficulty] || NUM_POOLS.medio);
  const fn = choice(pool);
  const realDifficulty = difficulty === "mix"
    ? (NUM_POOLS.facil.includes(fn) ? "facil" : NUM_POOLS.medio.includes(fn) ? "medio" : "dificil")
    : difficulty;
  return fn(realDifficulty);
}

/* ============================== ABSTRACTO ============================== */

// Fácil · rotación de flecha en pasos de 90°
function genRotationSeries(difficulty, step) {
  const a0 = randInt(0, 3) * step;
  const seq = [0, 1, 2].map((k) => ({ k: "arrow", a: (a0 + k * step) % 360 }));
  const answer = { k: "arrow", a: (a0 + 3 * step) % 360 };
  const { options, correctIndex } = finalizeFigureOptions(answer, () => ({ k: "arrow", a: choice([0, 45, 90, 135, 180, 225, 270, 315]) }));
  return { kind: "figure-series", difficulty, block: "abs", seq, options, correctIndex, explanation: `Giro horario constante de <b>${step}°</b> por paso → siguiente ${answer.a}°.` };
}

// Fácil/Medio · conteo de puntos con paso fijo
function genCountSeries(difficulty, step) {
  const start = step > 0 ? randInt(1, 9 - 3 * step) : randInt(1 - 3 * step, 9);
  const seq = [0, 1, 2].map((k) => ({ k: "dots", n: start + k * step }));
  const answer = { k: "dots", n: start + 3 * step };
  // Distractores en todo el dominio válido (1-9): con pasos ±delta cerca de los bordes
  // el rango clampeado colapsaba a <3 valores distintos y dejaba menos de 4 opciones.
  const { options, correctIndex } = finalizeFigureOptions(answer, () => ({ k: "dots", n: randInt(1, 9) }));
  return { kind: "figure-series", difficulty, block: "abs", seq, options, correctIndex, explanation: `El número de puntos cambia ${step > 0 ? "+" : ""}${step} en cada paso → siguiente <b>${answer.n}</b>.` };
}

// Medio · número de lados +1 por paso
function genPolySides(difficulty) {
  const start = randInt(3, 5);
  const seq = [0, 1, 2].map((k) => ({ k: "poly", n: start + k }));
  const answer = { k: "poly", n: start + 3 };
  const { options, correctIndex } = finalizeFigureOptions(answer, () => ({ k: "poly", n: randInt(3, 9) }));
  return { kind: "figure-series", difficulty, block: "abs", seq, options, correctIndex, explanation: `El número de lados sube +1 en cada paso → siguiente <b>${answer.n} lados</b>.` };
}

// Difícil · matriz 3×3 (regla por fila y columna: value(r,c) = base + r·rowStep + c·colStep)
function genMatrix3x3(difficulty) {
  const useDots = Math.random() < 0.5;
  const vMin = 1, vMax = useDots ? 9 : 7; // dots: n∈[1,9] directo; poly: n=v+2∈[3,9] → v∈[1,7]
  let base, rowStep, colStep, guard = 0;
  do {
    base = randInt(1, 2); rowStep = randInt(1, 2); colStep = randInt(1, 2);
    guard++;
  } while (base + 2 * rowStep + 2 * colStep > vMax && guard < 50);
  if (base + 2 * rowStep + 2 * colStep > vMax) { base = 1; rowStep = 1; colStep = 1; } // fallback seguro
  const make = (r, c) => {
    const v = base + r * rowStep + c * colStep; // siempre dentro de [vMin, vMax] por construcción, sin recortes
    return useDots ? { k: "dots", n: v } : { k: "poly", n: v + 2 };
  };
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(r === 2 && c === 2 ? null : make(r, c));
  const answer = make(2, 2);
  const { options, correctIndex } = finalizeFigureOptions(answer, () =>
    useDots ? { k: "dots", n: randInt(1, 9) } : { k: "poly", n: randInt(3, 9) }
  );
  return { kind: "matrix", difficulty, block: "abs", cells, options, correctIndex, explanation: `Cada fila y columna sigue la misma regla de incremento → la celda que falta es <b>${useDots ? answer.n + " puntos" : answer.n + " lados"}</b>.` };
}

// Difícil · doble transformación (posición rota + relleno alterna)
function genDoubleTransform(difficulty) {
  const startPos = randInt(0, 3);
  const startFill = Math.random() < 0.5;
  const seq = [0, 1, 2].map((k) => ({ k: "sqfill", p: (startPos + k) % 4, fill: k % 2 === 0 ? startFill : !startFill }));
  const answer = { k: "sqfill", p: (startPos + 3) % 4, fill: 3 % 2 === 0 ? startFill : !startFill };
  const { options, correctIndex } = finalizeFigureOptions(answer, () => ({ k: "sqfill", p: randInt(0, 3), fill: Math.random() < 0.5 }));
  return { kind: "figure-series", difficulty, block: "abs", seq, options, correctIndex, explanation: `Dos reglas a la vez: la posición rota en horario por las esquinas y el relleno alterna en cada paso.` };
}

const ABS_POOLS = {
  facil: [(d) => genRotationSeries(d, 90), (d) => genCountSeries(d, 1)],
  medio: [(d) => genRotationSeries(d, 45), (d) => genCountSeries(d, -2), genPolySides],
  dificil: [genMatrix3x3, genDoubleTransform],
};

export function generateAbstract(difficulty) {
  const pool = difficulty === "mix"
    ? [...ABS_POOLS.facil, ...ABS_POOLS.medio, ...ABS_POOLS.dificil]
    : (ABS_POOLS[difficulty] || ABS_POOLS.medio);
  const fn = choice(pool);
  const realDifficulty = difficulty === "mix"
    ? (ABS_POOLS.facil.includes(fn) ? "facil" : ABS_POOLS.medio.includes(fn) ? "medio" : "dificil")
    : difficulty;
  return fn(realDifficulty);
}

// Exportadas para los tests de corrección (generadores individuales).
export const _internal = {
  genArithSeries, genSimplePercent, genSimpleDiscount, genSpeedTime,
  genGeometricSeries, genIncreasingDiffSeries, genChainedPercent, genRatioMixture, genAgesProblem,
  genMultiplyAddSeries, genInterleavedSeries, genCombinatorics, genWorkRate, genPrimeOrFactorialSeries,
  genRotationSeries, genCountSeries, genPolySides, genMatrix3x3, genDoubleTransform,
  NUM_POOLS, ABS_POOLS, factorial, gcd,
};
