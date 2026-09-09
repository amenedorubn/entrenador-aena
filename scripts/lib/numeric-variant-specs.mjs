// Fase B · Motor numérico: una spec por cada una de las 29 semillas de
// razonamiento_numerico en texto puro (ver reports/SEMILLAS.md). Cada spec computa la
// respuesta con código -- nunca se copia de la semilla -- y variant-engine.mjs comprueba
// al cargar que compute(seedParams) reproduce EXACTAMENTE el correctText real antes de
// generar una sola variante.
import { randInt, choice } from "../../js/rng.js";

const NUM_WORDS = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho",
  "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte"];
const numWord = (n) => (n >= 0 && n <= 20 ? NUM_WORDS[n] : String(n));
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
// useGrouping explícito: el Node "small-icu" de este entorno no agrupa por miles con
// solo pasar el locale (5000 -> "5000" en vez de "5.000") a menos que se pida a las claras.
const grouped = (n) => Math.round(n).toLocaleString("es-ES", { useGrouping: true });
const euros = (n) => `${grouped(n)} €`;
const eurosPalabra = (n) => `${grouped(n)} euros`; // ex20240317-51: la semilla real usa "euros", no "€"
const kilos = (n) => `${Math.round(n)} kilos`; // wa-aptitudes-37 real: "2000 kilos", sin separador de miles
const gramos = (n) => `${grouped(n)} gramos`;
const km = (n) => `${Math.round(n)} Km`;
const diasSuf = (n) => `${Math.round(n)} días`;
const plain = (n) => String(Math.round(n));
const pct = (n) => `${Math.round(n)}%`;

/* --------------------- plantilla compartida: "vacío + % del total = lleno" --------------------- */
// wa-aptitudes-37 (piscina) y wa-aptitudes-47 (contenedor) son la MISMA estructura
// matemática: full = empty * 100 / (100 - P). La frase de apertura SÍ cambia entre
// ellas ("Una piscina pesa X kilos" vs "El peso de un contenedor vacío es de X gramos"),
// así que `opening(empty)` la da entera (con su propio verbo) en vez de intentar forzar
// las dos semillas al mismo hueco "${sujeto} pesa ${empty}" -- eso fue justo el bug
// detectado en la muestra ("es de pesa 480 gramos", verbo duplicado).
function emptyPercentSpec({ seedId, seedEmpty, seedP, opening, fluid, wholeNoun, fluidSuffix, unitFmt }) {
  return {
    seedId, family: "razonamiento_numerico_porcentajes",
    seedParams: { empty: seedEmpty, P: seedP },
    genParams: () => ({ empty: randInt(20, 600), P: choice([90, 91, 92, 93, 94, 95, 96, 97, 98]) }),
    compute: ({ empty, P }) => (empty * 100) / (100 - P),
    distractors: ({ empty, P }, correct) => [
      (empty * P) / (100 - P),               // invierte P/(100-P) en vez de 100/(100-P)
      (empty * (P - 1)) / (101 - P),          // desfase de un punto porcentual
      correct + empty,                        // cuenta el envase vacío dos veces
    ],
    format: unitFmt,
    prompt: ({ empty, P }) => {
      const lleno = `llen${wholeNoun.endsWith("a") ? "a" : "o"}`;
      return `${opening(Math.round(empty))} Sabiendo que ${fluid} representa el ${P}% del peso ${wholeNoun} ${lleno}${fluidSuffix}, ¿cuál es el peso ${wholeNoun} ${lleno}${fluidSuffix}?`;
    },
    explanation: ({ empty, P }, correct) => `Si ${fluid} es el ${P}% del total, el envase vacío es el ${100 - P}% -> total = ${Math.round(empty)} × 100 / ${100 - P} = ${unitFmt(correct)}.`,
  };
}

/* ------------------- plantilla compartida: dos fracciones encadenadas ------------------- */
// wa-aptitudes-52, ex20240317-50, ex20240317-52 comparten la MISMA forma: "{sujeto}
// consta de dos fases: n1/d1 {verb1}, y de esos, n2/d2 {verb2}. Si hay {total}
// {unidad}, {question}". wa-aptitudes-50 (subvención en euros) NO comparte esta forma
// -- es "asigna una subvención de X euros, el n1/d1 se destina a..." -- así que tiene su
// propia spec más abajo en vez de forzarla aquí (ese forzado fue el otro bug real que
// salió en la muestra: "asigna una subvención consta de dos fases" no tiene sentido).
function chainedFractionSpec({ seedId, seedTotal, seedN1, seedD1, seedN2, seedD2, subject, verb1, verb2, unitNoun, question, unitFmt, fracPool }) {
  return {
    seedId, family: "razonamiento_numerico_proporciones",
    seedParams: { total: seedTotal, n1: seedN1, d1: seedD1, n2: seedN2, d2: seedD2 },
    genParams: () => {
      const [n1, d1] = choice(fracPool);
      let [n2, d2] = choice(fracPool);
      while (d2 === d1 && n2 === n1) [n2, d2] = choice(fracPool);
      const base = randInt(5, 60);
      return { total: base * d1 * d2, n1, d1, n2, d2 };
    },
    compute: ({ total, n1, d1, n2, d2 }) => (total * n1 * n2) / (d1 * d2),
    distractors: ({ total, n1, d1, n2, d2 }) => [
      (total * n1) / d1,                                   // se para en la primera fase
      (total * n2) / d2,                                   // usa solo la segunda fracción
      (total * n1) / d1 + (total * n2) / d2,                // suma las dos fases en vez de encadenarlas
    ],
    format: unitFmt,
    prompt: ({ total, n1, d1, n2, d2 }) => `${subject} consta de dos fases: ${n1}/${d1} ${verb1}, y de esos, ${n2}/${d2} ${verb2}. Si hay ${Math.round(total)}${unitNoun ? ` ${unitNoun}` : ""}, ${question}`,
    explanation: ({ total, n1, d1, n2, d2 }, correct) => `${Math.round(total)} × ${n1}/${d1} × ${n2}/${d2} = ${unitFmt(correct)}.`,
  };
}

/* --------------------- plantilla compartida: trabajo inversamente proporcional --------------------- */
// ex20240317-36 (obreros) y ex20240317-40 (electricistas): days2 = days1 × w1 / w2.
function inverseWorkSpec({ seedId, seedW1, seedD1, seedW2, workerNoun, taskNoun }) {
  return {
    seedId, family: "razonamiento_numerico_trabajo_velocidad",
    seedParams: { w1: seedW1, d1: seedD1, w2: seedW2 },
    genParams: () => {
      const w1 = randInt(4, 30);
      let w2 = randInt(1, w1 - 1);
      return { w1, d1: randInt(2, 40), w2 };
    },
    compute: ({ w1, d1, w2 }) => (d1 * w1) / w2,
    distractors: ({ w1, d1, w2 }) => [
      (d1 * w2) / w1,          // invierte la proporción (directa en vez de inversa)
      d1 + (w1 - w2),          // suma en vez de multiplicar/dividir
      d1 * (w1 - w2),          // multiplica por la diferencia de trabajadores
    ],
    format: plain,
    prompt: ({ w1, d1, w2 }) => `Un equipo de ${w1} ${workerNoun} ${taskNoun.action} en ${d1} días. ¿Cuántos días habría tardado un equipo de ${w2} ${workerNoun}, asumiendo que todos rinden lo mismo?`,
    explanation: ({ w1, d1, w2 }, correct) => `Proporción INVERSA (menos trabajadores, más días): ${d1} × ${w1} / ${w2} = ${plain(correct)} días.`,
  };
}

export const NUMERIC_SPECS = [
  // ---- aritmética general ----
  {
    seedId: "wa-aptitudes-36", family: "razonamiento_numerico_aritmetica_general",
    seedParams: { perMonth: 4, years: 3 },
    genParams: () => ({ perMonth: randInt(2, 9), years: randInt(2, 6) }),
    compute: ({ perMonth, years }) => perMonth * 12 * years,
    distractors: ({ perMonth, years }) => [
      perMonth * 12 * (years + 1),          // un año de más
      perMonth * 11 * years,                 // confunde 12 meses con 11
      perMonth * 12 * years - perMonth,       // olvida un mes
    ],
    format: plain,
    prompt: ({ perMonth, years }) => `Un niño compra ${perMonth} sobres de cromos cada mes. ¿Cuántos comprará a lo largo de ${numWord(years)} años?`,
    explanation: ({ perMonth, years }, c) => `${perMonth} × 12 meses × ${years} años = ${plain(c)}.`,
  },
  emptyPercentSpec({
    seedId: "wa-aptitudes-37", seedEmpty: 40, seedP: 98,
    opening: (empty) => `Una piscina pesa ${empty} kilos.`, wholeNoun: "de la piscina", fluid: "el agua", fluidSuffix: " de agua", unitFmt: kilos,
  }),
  {
    seedId: "wa-aptitudes-38", family: "razonamiento_numerico_edades",
    seedParams: { diff: 39, headStart: 21, futureBoss: 60 },
    genParams: () => {
      const headStart = randInt(18, 35);
      const futureBoss = 2 * headStart + randInt(5, 40);
      return { diff: futureBoss - headStart, headStart, futureBoss };
    },
    compute: ({ diff }) => diff,
    distractors: ({ diff, headStart, futureBoss }) => [
      futureBoss - 2 * headStart,   // usa el doble del gap en vez del gap simple
      2 * diff,                     // dobla la respuesta
      futureBoss,                   // devuelve la edad futura del jefe sin restar
    ],
    format: plain,
    prompt: ({ headStart, futureBoss }) => `Cuando cumplí ${headStart} años mi jefe tenía el doble que yo. ¿Cuántos cumpliré cuando él tenga ${futureBoss}?`,
    explanation: ({ headStart, futureBoss }, c) => `La diferencia de edad (jefe - yo) es constante: ${headStart}. Cuando el jefe tenga ${futureBoss}, yo tendré ${futureBoss} - ${headStart} = ${plain(c)}.`,
  },
  {
    seedId: "wa-aptitudes-39", family: "razonamiento_numerico_aritmetica_general",
    seedParams: { cows: 20, chickens: 30, sheep: 50 },
    genParams: () => ({ cows: randInt(5, 40), chickens: randInt(5, 60), sheep: randInt(5, 40) }),
    compute: ({ cows, chickens, sheep }) => cows * 4 + chickens * 2 + sheep * 4,
    distractors: ({ cows, chickens, sheep }) => [
      cows * 2 + chickens * 2 + sheep * 2,   // trata a todos como bípedos
      cows * 4 + chickens * 4 + sheep * 4,   // trata a todos como cuadrúpedos
      cows + chickens + sheep,               // cuenta animales, no patas
    ],
    format: plain,
    prompt: ({ cows, chickens, sheep }) => `En una granja hay ${cows} vacas, ${chickens} pollos y ${sheep} ovejas ¿Cuántas patas hay en total?`,
    explanation: ({ cows, chickens, sheep }, c) => `${cows}×4 (vacas) + ${chickens}×2 (pollos) + ${sheep}×4 (ovejas) = ${plain(c)}.`,
  },
  {
    seedId: "wa-aptitudes-40", family: "razonamiento_numerico_aritmetica_general",
    seedParams: { total: 900, back: 150 },
    genParams: () => {
      const total = randInt(4, 16) * 100;
      const back = randInt(1, Math.floor(total / 8)) * 10;
      return { total, back };
    },
    compute: ({ total, back }) => total + 2 * back,
    distractors: ({ total, back }) => [total, total - back, total + back],
    format: plain,
    prompt: ({ total, back }) => `Un viajante comienza un viaje de ${total} kilómetros. Cuando ha recorrido la mitad, decide volver. Cuando lleva ${back} kilómetros de vuelta decide llegar a su destino final, ¿cuántos kilómetros recorrerá finalmente?`,
    explanation: ({ total, back }, c) => `Recorre ${total / 2} (ida hasta la mitad) + ${back} (vuelta) + ${total / 2 + back} (de nuevo hacia el destino) = ${total} + 2×${back} = ${plain(c)}.`,
  },
  {
    seedId: "wa-aptitudes-41", family: "razonamiento_numerico_aritmetica_general",
    seedParams: { normal: 100, hours: 4, slow: 60 },
    genParams: () => {
      const normal = randInt(60, 150);
      return { normal, hours: randInt(2, 8), slow: randInt(20, normal - 10) };
    },
    compute: ({ normal, hours, slow }) => (normal - slow) * hours,
    distractors: ({ normal, hours, slow }) => [normal * hours - slow, slow * hours, normal - slow],
    format: plain,
    prompt: ({ normal, hours, slow }) => `Una churrería sirve ${normal} cafés por hora. Durante ${hours} horas, la máquina funcionaba más lentamente de lo normal y sólo pudieron servirse ${slow} por hora. ¿Cuántos cafés dejaron de servirse durante ese tiempo?`,
    explanation: ({ normal, hours, slow }, c) => `(${normal} - ${slow}) cafés/hora × ${hours} horas = ${plain(c)}.`,
  },
  // ---- algebraico ----
  {
    seedId: "wa-aptitudes-43", family: "razonamiento_numerico_algebraico",
    seedParams: { A: 25, C: 26 },
    genParams: () => { const A = randInt(-20, 40), Bwanted = randInt(-20, 20); return { A, C: 2 * A + 2 * Bwanted }; },
    compute: ({ A, C }) => (C - 2 * A) / 2,
    distractors: ({ A, C }, correct) => [C - 2 * A, -correct, (C + 2 * A) / 2],
    format: plain,
    prompt: ({ A, C }) => `Si: A + A + B = C - B; C = ${C}; A = ${A}. Entonces B es igual a:`,
    explanation: ({ A, C }, c) => `2A + B = C - B → 2B = C - 2A → B = (${C} - 2×${A}) / 2 = ${plain(c)}.`,
  },
  {
    seedId: "wa-aptitudes-45", family: "razonamiento_numerico_algebraico",
    seedParams: { A: -5, C: 11 },
    genParams: () => { const A = randInt(-30, 30), Bwanted = randInt(-20, 20); return { A, C: A + 2 * Bwanted }; },
    compute: ({ A, C }) => (C - A) / 2,
    distractors: ({ A, C }, correct) => [(C + A) / 2, C - A, -correct],
    format: plain,
    prompt: ({ A, C }) => `Si: (A + C):2 = A + B; C = ${C}; A = ${A}. Entonces B es igual a:`,
    explanation: ({ A, C }, c) => `(A+C)/2 = A+B → B = (C-A)/2 = (${C} - ${A}) / 2 = ${plain(c)}.`,
  },
  {
    seedId: "ex20240317-47", family: "razonamiento_numerico_algebraico",
    seedParams: { A: 5, offset: 6, B: -2 },
    genParams: () => ({ A: randInt(-20, 30), offset: randInt(2, 15), B: randInt(-15, 15) }),
    compute: ({ A, offset }) => A + offset,
    distractors: ({ A, offset, B }) => [A + offset + B, A - offset, offset],
    format: plain,
    prompt: ({ A, offset, B }) => `Si: A + ${offset} + B = C + B; A = ${A}; B = ${B}. Entonces C es igual a:`,
    explanation: ({ A, offset }, c) => `B aparece en ambos lados y se cancela: C = A + ${offset} = ${A} + ${offset} = ${plain(c)}.`,
  },
  // ---- probabilidad ----
  {
    seedId: "wa-aptitudes-44", family: "razonamiento_numerico_probabilidad",
    seedParams: { faces: 6, minCond: 3 },
    genParams: () => choice([
      { faces: 6, minCond: 3 }, { faces: 6, minCond: 2 }, { faces: 6, minCond: 5 },
      { faces: 10, minCond: 6 }, { faces: 10, minCond: 1 }, { faces: 4, minCond: 3 }, { faces: 8, minCond: 5 },
    ]),
    compute: ({ faces, minCond }) => Math.round(100 / (faces - minCond + 1)),
    distractors: ({ faces, minCond }) => {
      const count = faces - minCond + 1;
      return [Math.round(100 / faces), Math.round(100 / (count - 1 || 1)), Math.round((100 * (count - 1)) / count)];
    },
    format: pct,
    prompt: ({ faces, minCond }) => `Nikolai lanza un dado de ${faces} caras numeradas del 1 al ${faces}. Si el número que sale es mayor o igual que ${minCond}, ¿cuál es la probabilidad de que sea igual a ${faces}?`,
    explanation: ({ faces, minCond }, c) => `Hay ${faces - minCond + 1} resultados posibles (${minCond} a ${faces}) y solo 1 es el buscado → 100/${faces - minCond + 1} = ${pct(c)}.`,
  },
  // ---- suma de tres números ----
  {
    seedId: "wa-aptitudes-46", family: "razonamiento_numerico_aritmetica_general",
    seedParams: { S: 90, m: 2, o: 10 },
    genParams: () => {
      const first = randInt(5, 40), m = choice([2, 3, 4]), o = randInt(5, 30);
      return { S: first * (2 + m) + o, m, o };
    },
    compute: ({ S, m, o }) => (S - o) / (2 + m) + o,
    distractors: ({ S, m, o }) => {
      const first = (S - o) / (2 + m);
      return [first, m * first, first + o + m];
    },
    format: plain,
    prompt: ({ S, m, o }) => `La suma de tres números diferentes es ${S}. El segundo número es ${m === 2 ? "el doble" : m === 3 ? "el triple" : "el cuádruple"} del primer número y el tercer número es ${o} unidades más que el primer número. ¿Cuál es el valor del tercer número?`,
    explanation: ({ S, m, o }, c) => `primero×(2+${m}) = ${S}-${o} → primero = ${(S - o) / (2 + m)} → tercero = primero + ${o} = ${plain(c)}.`,
  },
  emptyPercentSpec({
    seedId: "wa-aptitudes-47", seedEmpty: 350, seedP: 93,
    opening: (empty) => `El peso de un contenedor vacío es de ${empty} gramos.`, wholeNoun: "del contenedor", fluid: "el líquido que contiene", fluidSuffix: " de líquido", unitFmt: gramos,
  }),
  // ---- porcentajes / descuentos ----
  {
    seedId: "wa-aptitudes-48", family: "razonamiento_numerico_porcentajes",
    seedParams: { price: 1.5, count: 300, P: 10 },
    genParams: () => ({ price: choice([1, 1.5, 2, 2.5, 3]), count: randInt(100, 500), P: choice([5, 10, 15, 20, 25]) }),
    compute: ({ price, count, P }) => (price * count * P) / 100,
    distractors: ({ price, count, P }) => [price * count, (price * count * (100 - P)) / 100, (count * P) / 100],
    format: euros,
    prompt: ({ price, count, P }) => `En una rifa se venden boletos a ${price} euros cada uno. Se venden un total de ${count} boletos, y el ${P}% del dinero recaudado se destina a premios, ¿cuánto dinero se destina a premios?`,
    explanation: ({ price, count, P }, c) => `${price} × ${count} = recaudado; ${P}% de eso = ${euros(c)}.`,
  },
  {
    // Forma propia (no chainedFractionSpec): "asigna una subvención de X euros. El
    // n1/d1 se destina a educación, y de esta cantidad, n2/d2 se usa para becas" no
    // comparte la forma "X consta de dos fases" de wa-aptitudes-52/ex20240317-50/52 --
    // forzarla ahí fue el bug real que salió en la muestra de la Fase D ("asigna una
    // subvención consta de dos fases", sin sentido).
    seedId: "wa-aptitudes-50", family: "razonamiento_numerico_proporciones",
    seedParams: { total: 112500, n1: 1, d1: 5, n2: 2, d2: 3 },
    genParams: () => {
      const fracPool = [[1, 5], [1, 4], [2, 5], [1, 3], [2, 3], [3, 5]];
      const [n1, d1] = choice(fracPool);
      let [n2, d2] = choice(fracPool);
      while (d2 === d1 && n2 === n1) [n2, d2] = choice(fracPool);
      return { total: randInt(50, 2000) * d1 * d2, n1, d1, n2, d2 };
    },
    compute: ({ total, n1, d1, n2, d2 }) => (total * n1 * n2) / (d1 * d2),
    distractors: ({ total, n1, d1, n2, d2 }) => [(total * n1) / d1, (total * n2) / d2, (total * n1) / d1 + (total * n2) / d2],
    format: euros,
    prompt: ({ total, n1, d1, n2, d2 }) => `Un gobierno asigna una subvención de ${grouped(total)} euros. El ${n1}/${d1} del dinero se destina a la educación, y de esta cantidad, un ${n2}/${d2} se usa para becas. ¿Cuánto dinero destina a becas?`,
    explanation: ({ total, n1, d1, n2, d2 }, c) => `${grouped(total)} × ${n1}/${d1} × ${n2}/${d2} = ${euros(c)}.`,
  },
  {
    seedId: "wa-aptitudes-51", family: "razonamiento_numerico_porcentajes",
    seedParams: { price: 65000, P: 20 },
    genParams: () => ({ price: randInt(20, 900) * 100, P: choice([10, 15, 20, 25, 30, 40]) }),
    compute: ({ price, P }) => price * (1 - P / 100),
    distractors: ({ price, P }) => [(price * P) / 100, price * (1 + P / 100), price - P],
    format: euros,
    prompt: ({ price, P }) => `Un artículo de lujo tiene un valor de ${price} euros. El precio se reduce en un ${P}% al aplicar un descuento por rebajas. ¿Cuál será el precio final después del descuento?`,
    explanation: ({ price, P }, c) => `${price} × (1 - ${P}/100) = ${euros(c)}.`,
  },
  chainedFractionSpec({
    seedId: "wa-aptitudes-52", seedTotal: 210, seedN1: 3, seedD1: 5, seedN2: 2, seedD2: 7,
    subject: "Un torneo de ajedrez", verb1: "avanzan a la segunda fase", verb2: "logran llegar a la final",
    unitNoun: "jugadores al inicio", question: "¿cuántos jugadores llegarán a la final?",
    unitFmt: plain, fracPool: [[3, 5], [2, 7], [1, 4], [3, 4], [2, 5], [5, 6]],
  }),
  {
    seedId: "wa-aptitudes-54", family: "razonamiento_numerico_edades",
    seedParams: { diff: 3, m: 2, F: 5 },
    genParams: () => { const m = choice([2, 3]), E = randInt(2, 20); return { diff: (m - 1) * E, m, F: randInt(2, 10), E }; },
    compute: ({ diff, m }) => (m * diff) / (m - 1),
    distractors: ({ diff, m, F, E }) => [diff * m, diff + F, E ?? diff / (m - 1)],
    format: plain,
    prompt: ({ diff, m, F }) => `${m === 2 ? "Luis tiene el doble de años que Elena" : "Luis tiene el triple de años que Elena"}. Dentro de ${F} años, Elena tendrá ${diff} años menos que Luis. ¿Cuántos años tiene Luis actualmente?`,
    explanation: ({ diff, m }, c) => `La diferencia de edad no cambia con el tiempo (los años "dentro de ${"N"}" no afectan): Elena = ${diff}/(${m}-1), Luis = ${m}×Elena = ${plain(c)}.`,
  },
  // ---- trabajo / velocidad ----
  inverseWorkSpec({
    seedId: "ex20240317-36", seedW1: 10, seedD1: 20, seedW2: 5,
    workerNoun: "trabajadores", taskNoun: { action: "construye un edificio" },
  }),
  {
    seedId: "ex20240317-37", family: "razonamiento_numerico_trabajo_velocidad",
    seedParams: { perTruck: 62, trucks: 3 },
    genParams: () => ({ perTruck: randInt(15, 150), trucks: randInt(2, 8) }),
    compute: ({ perTruck, trucks }) => perTruck * trucks,
    distractors: ({ perTruck, trucks }) => [perTruck * (trucks - 1), perTruck + trucks, perTruck * trucks + trucks],
    format: plain,
    prompt: ({ perTruck, trucks }) => `Un camión transporta ${perTruck} cajas de naranjas, ¿cuántas cajas de naranjas transportarán ${trucks} camiones idénticos y en las mismas condiciones que el primero?`,
    explanation: ({ perTruck, trucks }, c) => `${perTruck} × ${trucks} = ${plain(c)}.`,
  },
  {
    seedId: "ex20240317-38", family: "razonamiento_numerico_aritmetica_general",
    seedParams: { weeks: 2, first: 10, step: 5 },
    genParams: () => ({ weeks: choice([1, 2, 3]), first: randInt(3, 20), step: randInt(2, 10) }),
    compute: ({ weeks, first, step }) => first + (weeks * 7 - 1) * step,
    distractors: ({ weeks, first, step }) => [first + weeks * 7 * step, first * weeks * 7, first + (weeks * 7 - 2) * step],
    format: km,
    prompt: ({ weeks, first, step }) => `Un ciclista entrena todos los días durante ${weeks} semana${weeks > 1 ? "s" : ""}, el primer día recorrió ${first} kilómetros. Cada día de los siguientes recorrió ${step} kilómetros más que el día anterior, ¿cuántos kilómetros recorrió el último día?`,
    explanation: ({ weeks, first, step }, c) => `${weeks * 7} días en total: ${first} + (${weeks * 7}-1)×${step} = ${km(c)}.`,
  },
  {
    seedId: "ex20240317-39", family: "razonamiento_numerico_trabajo_velocidad",
    seedParams: { headStartHours: 4, horseSpeed: 20, catchUpHours: 2 },
    genParams: () => ({ headStartHours: randInt(1, 6), horseSpeed: randInt(10, 40), catchUpHours: randInt(1, 6) }),
    compute: ({ headStartHours, horseSpeed, catchUpHours }) => (horseSpeed * (headStartHours + catchUpHours)) / catchUpHours,
    distractors: ({ headStartHours, horseSpeed, catchUpHours }) => [
      horseSpeed,
      (horseSpeed * headStartHours) / catchUpHours,
      horseSpeed * (headStartHours + catchUpHours),
    ],
    format: (n) => `${Math.round(n)} Km/h`,
    prompt: ({ headStartHours, horseSpeed, catchUpHours }) => `Un hombre a caballo sale a las 7 de la mañana trotando a una velocidad media de ${horseSpeed} Km/h. Un motociclista sale del mismo punto a las ${7 + headStartHours} de la mañana y se une al hombre a caballo al cabo de ${catchUpHours} horas. ¿Cuál es la velocidad del motorista?`,
    explanation: ({ headStartHours, horseSpeed, catchUpHours }, c) => `El caballo lleva recorridos ${horseSpeed}×(${headStartHours}+${catchUpHours}) Km cuando se encuentran; el motorista cubre eso en ${catchUpHours}h → ${c} Km/h.`,
  },
  inverseWorkSpec({
    seedId: "ex20240317-40", seedW1: 12, seedD1: 2, seedW2: 3,
    workerNoun: "electricistas", taskNoun: { action: "preparan una instalación" },
  }),
  {
    seedId: "ex20240317-41", family: "razonamiento_numerico_proporciones",
    seedParams: { a: 24, b: 36 },
    genParams: () => {
      let a, b, l;
      do { a = randInt(4, 40); b = randInt(4, 40); l = lcm(a, b); } while (a === b || l > 500);
      return { a, b };
    },
    compute: ({ a, b }) => lcm(a, b),
    distractors: ({ a, b }) => [a * b, a + b, Math.max(a, b)],
    format: diasSuf,
    prompt: ({ a, b }) => `Dos amigas, Silvia y Laura, sólo coinciden en la peluquería. Silvia va cada ${a} días y Laura cada ${b} días. Sabiendo que se han conocido hoy, ¿dentro de cuántos días se verán por primera vez?`,
    explanation: ({ a, b }, c) => `Se necesita el mínimo común múltiplo de ${a} y ${b} = ${plain(c)} días.`,
  },
  {
    seedId: "ex20240317-43", family: "razonamiento_numerico_proporciones",
    seedParams: { ratioA: 3, ratioB: 4, countB: 32 },
    genParams: () => {
      const ratioA = randInt(2, 6);
      let ratioB = randInt(2, 7);
      while (ratioB === ratioA) ratioB = randInt(2, 7);
      return { ratioA, ratioB, countB: ratioB * randInt(3, 20) };
    },
    compute: ({ ratioA, ratioB, countB }) => (countB * ratioA) / ratioB + countB,
    distractors: ({ ratioA, ratioB, countB }) => [(countB * ratioA) / ratioB, countB, countB + ratioA],
    format: plain,
    prompt: ({ ratioA, ratioB, countB }) => `En un museo hay cuadros y esculturas. Sabiendo que la ratio entre el número de cuadros y el número de esculturas es ${ratioA}:${ratioB} y que hay ${countB} esculturas en el museo, ¿cuál es el número total de obras de arte en el museo?`,
    explanation: ({ ratioA, ratioB, countB }, c) => `Cuadros = ${countB}×${ratioA}/${ratioB}; total = cuadros + esculturas = ${plain(c)}.`,
  },
  {
    seedId: "ex20240317-45", family: "razonamiento_numerico_proporciones",
    seedParams: { baseMoney: 5, baseCount: 2, newMoney: 15 },
    genParams: () => {
      const baseMoney = choice([2, 3, 4, 5, 10]), baseCount = randInt(1, 6), k = randInt(2, 8);
      return { baseMoney, baseCount, newMoney: baseMoney * k };
    },
    compute: ({ baseMoney, baseCount, newMoney }) => (newMoney * baseCount) / baseMoney,
    distractors: ({ baseMoney, baseCount, newMoney }) => [
      newMoney - baseMoney + baseCount,
      newMoney / baseCount,
      baseCount * (newMoney - baseMoney),
    ],
    format: plain,
    prompt: ({ baseMoney, baseCount, newMoney }) => `Sabiendo que con ${baseMoney}€ te puedes comprar ${baseCount} refrescos, ¿cuántos refrescos te puedes comprar con ${newMoney}€?`,
    explanation: ({ baseMoney, baseCount, newMoney }, c) => `${newMoney}€ / ${baseMoney}€ × ${baseCount} = ${plain(c)}.`,
  },
  chainedFractionSpec({
    seedId: "ex20240317-50", seedTotal: 300, seedN1: 1, seedD1: 3, seedN2: 1, seedD2: 2,
    subject: "Una prueba de una oposición", verb1: "aprueban la primera prueba", verb2: "de los que han aprobado la primera prueba aprueban también la segunda",
    unitNoun: "candidatos", question: "¿cuántos serán admitidos?",
    unitFmt: plain, fracPool: [[1, 3], [1, 2], [1, 4], [2, 5], [3, 4], [1, 5]],
  }),
  {
    seedId: "ex20240317-51", family: "razonamiento_numerico_porcentajes",
    seedParams: { price: 90, P: 30 },
    genParams: () => ({ price: randInt(20, 500), P: choice([10, 15, 20, 25, 30, 40, 50]) }),
    compute: ({ price, P }) => (price * P) / 100,
    distractors: ({ price, P }) => [price * (1 - P / 100), price - P, (price * 100) / (100 - P)],
    format: eurosPalabra,
    prompt: ({ price, P }) => `Un cuadro tiene un precio de catálogo de ${price} euros y se vende con un descuento del ${P}%. ¿A cuánto asciende el descuento?`,
    explanation: ({ price, P }, c) => `${price} × ${P}/100 = ${euros(c)} (el descuento, no el precio final).`,
  },
  chainedFractionSpec({
    seedId: "ex20240317-52", seedTotal: 180, seedN1: 2, seedD1: 3, seedN2: 1, seedD2: 6,
    subject: "Un examen de admisión", verb1: "aprueban la primera prueba", verb2: "de los que han aprobado la primera prueba aprueban también la segunda",
    unitNoun: "candidatos", question: "¿cuántos serán admitidos?",
    unitFmt: plain, fracPool: [[2, 3], [1, 6], [1, 3], [3, 4], [1, 4], [2, 5]],
  }),
  {
    seedId: "ex20240317-54", family: "razonamiento_numerico_edades",
    seedParams: { eva: 10, mult: 2, diff: 2 },
    genParams: () => ({ eva: randInt(3, 30), mult: choice([2, 3]), diff: randInt(1, 10) }),
    compute: ({ eva, mult, diff }) => mult * eva + diff,
    distractors: ({ eva, mult, diff }) => [mult * eva, mult * (eva + diff), eva + diff],
    format: plain,
    prompt: ({ eva, mult, diff }) => `Jaime tiene ${diff} años menos que Ana y ${mult === 2 ? "el doble" : "el triple"} que Eva. Sabiendo que Eva tiene ${eva} años, ¿cuántos años tiene Ana?`,
    explanation: ({ eva, mult, diff }, c) => `Jaime = ${mult}×${eva} = ${mult * eva}; Ana = Jaime + ${diff} = ${plain(c)}.`,
  },
];
