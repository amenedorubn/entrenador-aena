// Utilidades compartidas por todos los generadores.
// Requisito no negociable: el generador calcula enunciado Y solución con la misma
// regla, de modo que la respuesta correcta lo es por construcción.

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
export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}
export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
export function isPrime(n) {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}
export function primesFrom(start, count) {
  const out = []; let n = start;
  while (out.length < count) { if (isPrime(n)) out.push(n); n++; }
  return out;
}
export function factorial(n) {
  let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
}
/** Fracción reducida como texto "a/b" (o "a" si b===1). */
export function frac(num, den) {
  const g = gcd(num, den);
  const n = num / g, d = den / g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}

// Alfabeto español SIN Ñ — es el que usan las series de letras en oposiciones.
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export function letterAt(i) {
  return ALPHABET[((i % ALPHABET.length) + ALPHABET.length) % ALPHABET.length];
}
export function letterIndex(ch) {
  return ALPHABET.indexOf(ch.toUpperCase());
}

/**
 * Construye las 4 opciones a partir del valor correcto y una fábrica de distractores.
 * Garantiza 4 opciones distintas; si la fábrica se agota, rellena con un fallback.
 */
export function buildOptions(correctVal, makeDistractor, format = String, fallback) {
  const seen = new Set([format(correctVal)]);
  const vals = [correctVal];
  let guard = 0;
  while (vals.length < 4 && guard < 400) {
    guard++;
    const d = makeDistractor();
    if (d === null || d === undefined) continue;
    const f = format(d);
    if (!seen.has(f)) { seen.add(f); vals.push(d); }
  }
  // Red de seguridad: nunca devolver menos de 4 opciones.
  let n = 1;
  while (vals.length < 4) {
    const d = fallback ? fallback(n) : `${format(correctVal)} (${n})`;
    const f = format(d);
    if (!seen.has(f)) { seen.add(f); vals.push(d); }
    n++;
    if (n > 100) break;
  }
  const tagged = vals.map((v, i) => ({ v, correct: i === 0 }));
  const mixed = shuffle(tagged);
  return {
    options: mixed.map((x) => format(x.v)),
    correctIndex: mixed.findIndex((x) => x.correct),
  };
}

/**
 * Blindaje de integridad (ver CLAUDE.md / auditoría de esquema): baraja las opciones
 * de un ítem de banco estático (options[] + correctIndex) conservando cuál es la
 * correcta -- mismo patrón que el resto del código (se etiqueta cada opción con si es
 * la correcta ANTES de barajar y se recalcula el índice DESPUÉS con findIndex, nunca se
 * barajan índices sueltos). Si el ítem trae `expectedText` (el campo `correctText`
 * guardado junto a correctIndex en los bancos estáticos, snapshot de qué opción era la
 * correcta en origen), se comprueba tras barajar que options[correctIndex] sigue siendo
 * esa misma opción. Un desajuste (dato editado a mano sin mantener correctText al día,
 * o un bug futuro en el shuffle) no se sirve nunca a la UI: se registra en consola con
 * el id del ítem y se lanza ShuffleIntegrityError para que quien llama lo descarte y
 * sirva otra cosa, en vez de arriesgarse a pintar una pregunta con la clave equivocada.
 */
export class ShuffleIntegrityError extends Error {}

export function shuffleBankOptions(options, correctIndex, expectedText, idForLog = "?") {
  const tagged = options.map((t, i) => ({ t, ok: i === correctIndex }));
  const mixed = shuffle(tagged);
  const newOptions = mixed.map((x) => x.t);
  const newCorrectIndex = mixed.findIndex((x) => x.ok);
  if (expectedText !== undefined && expectedText !== null) {
    const got = typeof newOptions[newCorrectIndex] === "string" ? newOptions[newCorrectIndex] : (newOptions[newCorrectIndex]?.text ?? "");
    if (got !== expectedText) {
      console.error(`[integridad] "${idForLog}": tras barajar, la opción correcta no coincide con correctText ("${got}" ≠ "${expectedText}"). Se descarta la pregunta.`);
      throw new ShuffleIntegrityError(String(idForLog));
    }
  }
  return { options: newOptions, correctIndex: newCorrectIndex };
}

/** Igual que buildOptions pero conservando objetos (specs de figura) sin formatear. */
export function buildFigureOptions(correctSpec, makeDistractor) {
  const key = (s) => JSON.stringify(s);
  const seen = new Set([key(correctSpec)]);
  const specs = [correctSpec];
  let guard = 0;
  while (specs.length < 4 && guard < 400) {
    guard++;
    const d = makeDistractor();
    if (!d) continue;
    if (!seen.has(key(d))) { seen.add(key(d)); specs.push(d); }
  }
  const tagged = specs.map((s, i) => ({ s, correct: i === 0 }));
  const mixed = shuffle(tagged);
  return {
    options: mixed.map((x) => x.s),
    correctIndex: mixed.findIndex((x) => x.correct),
  };
}
