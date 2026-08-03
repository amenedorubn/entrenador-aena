// Fase 3 · Generadores de inglés.
// Grammar / error correction / listening curado salen de bancos; los avisos de
// listening numéricos y las frases de producción se generan por procedimiento.
import { GRAMMAR, TRANSLATE, ERROR_CORRECTION, LISTENING } from "../data/english.js";
import { randInt, choice, shuffle, buildOptions } from "./rng.js";

const near = (arr, tier) => {
  const p = arr.filter((x) => Math.abs(x.lvl - tier) <= 1);
  return p.length ? p : arr;
};

/** Baraja las opciones de un ítem de banco conservando cuál es la correcta. */
function shuffledBankItem(it, kind, block, tier) {
  const tagged = it.options.map((t, i) => ({ t, ok: i === it.correctIndex }));
  const mixed = shuffle(tagged);
  return {
    kind, block, tier, family: it.id.replace(/\d+$/, ""),
    prompt: it.prompt, audio: it.audio,
    options: mixed.map((x) => x.t),
    correctIndex: mixed.findIndex((x) => x.ok),
    value: it.options[it.correctIndex],
    explanation: it.explanation,
  };
}

export function grammarItem(tier = 3) {
  return shuffledBankItem(choice(near(GRAMMAR, tier)), "text", "grammar", tier);
}

export function errorItem(tier = 3) {
  return shuffledBankItem(choice(near(ERROR_CORRECTION, tier)), "text", "grammar", tier);
}

/** Producción escrita: construir la frase con fichas (tipo Duolingo). */
export function translateItem(tier = 3) {
  const t = choice(near(TRANSLATE, tier));
  const tokens = shuffle([...t.answer, ...t.lures]);
  return {
    kind: "wordbank", block: "translate", tier, family: "translate",
    prompt: `Traduce al inglés: <b>${t.es}</b>`,
    tokens, answer: t.answer,
    value: t.answer.join(" "),
    explanation: `Respuesta: <b>${t.answer.join(" ")}</b>.`,
  };
}

/* ------------------------- listening por procedimiento ------------------------- */

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Número (0-99) a palabras en inglés — para que el sintetizador lo lea con claridad. */
export function numberWords(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10), u = n % 10;
  return u === 0 ? TENS[t] : `${TENS[t]}-${ONES[u]}`;
}

const CITIES = ["Barcelona", "Lisbon", "Dublin", "Amsterdam", "Rome", "Vienna", "Copenhagen", "Manchester", "Frankfurt", "Oslo"];
const REASONS = [
  { audio: "strong winds", q: "strong winds", alt: ["fog", "a technical fault", "a strike"] },
  { audio: "dense fog", q: "fog", alt: ["strong winds", "a bird strike", "a medical emergency"] },
  { audio: "a technical inspection", q: "a technical inspection", alt: ["bad weather", "a security alert", "a staff shortage"] },
  { audio: "a security alert", q: "a security alert", alt: ["dense fog", "a technical fault", "heavy snow"] },
  { audio: "heavy snow", q: "heavy snow", alt: ["strong winds", "a strike", "a runway closure"] },
];

function listenGate(tier) {
  const gate = randInt(1, 45), city = choice(CITIES), num = randInt(100, 899);
  const audio = `Passengers for flight I B ${numberWords(num % 100)} to ${city}, please proceed to gate ${numberWords(gate)}. Boarding is now in progress.`;
  const { options, correctIndex } = buildOptions(gate, () => {
    const d = gate + choice([-20, -10, -3, -1, 1, 3, 10, 20]);
    return d >= 1 && d <= 60 ? d : null;
  }, (x) => `Gate ${x}`);
  return { kind: "listen", block: "listen", tier, family: "gate", audio, prompt: `Which gate should passengers go to?`,
    options, correctIndex, value: `Gate ${gate}`, explanation: `«proceed to gate ${numberWords(gate)}» → puerta <b>${gate}</b>.` };
}

function listenDelay(tier) {
  const mins = choice([15, 20, 25, 30, 40, 45, 50, 55, 70, 90]);
  const city = choice(CITIES), r = choice(REASONS);
  const audio = `We regret to announce that the service to ${city} is delayed by ${numberWords(mins)} minutes due to ${r.audio}.`;
  const { options, correctIndex } = buildOptions(mins, () => {
    const d = choice([mins + 10, mins - 10, mins + 5, mins - 5, Math.round(mins / 10), mins * 2]);
    return d > 0 && d <= 180 ? d : null;
  }, (x) => `${x} minutes`);
  return { kind: "listen", block: "listen", tier, family: "delay", audio, prompt: `How long is the flight delayed?`,
    options, correctIndex, value: `${mins} minutes`, explanation: `«delayed by ${numberWords(mins)} minutes» → <b>${mins} minutos</b>.` };
}

function listenReason(tier) {
  const r = choice(REASONS), city = choice(CITIES);
  const audio = `Due to ${r.audio}, the departure to ${city} has been postponed. We apologise for the inconvenience.`;
  const mixed = shuffle([{ t: r.q, ok: true }, ...r.alt.map((t) => ({ t, ok: false }))]);
  return { kind: "listen", block: "listen", tier, family: "reason", audio, prompt: `Why has the departure been postponed?`,
    options: mixed.map((x) => x.t), correctIndex: mixed.findIndex((x) => x.ok), value: r.q,
    explanation: `«Due to ${r.audio}» → <b>${r.q}</b>.` };
}

function listenDesk(tier) {
  const desk = randInt(1, 40), hour = randInt(6, 11);
  const audio = `Passengers with checked baggage must drop their bags at desk ${numberWords(desk)} before ${numberWords(hour)} a m.`;
  const { options, correctIndex } = buildOptions(desk, () => {
    const d = desk + choice([-20, -10, -2, -1, 1, 2, 10, 20]);
    return d >= 1 && d <= 60 ? d : null;
  }, (x) => `Desk ${x}`);
  return { kind: "listen", block: "listen", tier, family: "desk", audio, prompt: `Where must checked bags be dropped?`,
    options, correctIndex, value: `Desk ${desk}`, explanation: `«drop their bags at desk ${numberWords(desk)}» → mostrador <b>${desk}</b>.` };
}

function listenShuttle(tier) {
  const every = choice([5, 10, 12, 15, 20, 25, 30]), term = randInt(1, 4);
  const audio = `The shuttle bus to terminal ${numberWords(term)} departs every ${numberWords(every)} minutes from the stop outside arrivals.`;
  const { options, correctIndex } = buildOptions(every, () => {
    const d = choice([every + 5, every - 5, every * 2, Math.round(every / 5), every + 10]);
    return d > 0 && d <= 120 ? d : null;
  }, (x) => `Every ${x} minutes`);
  return { kind: "listen", block: "listen", tier, family: "shuttle", audio, prompt: `How often does the shuttle depart?`,
    options, correctIndex, value: `Every ${every} minutes`, explanation: `«every ${numberWords(every)} minutes» → cada <b>${every} minutos</b>.` };
}

const LISTEN_GENERATORS = [listenGate, listenDelay, listenReason, listenDesk, listenShuttle];

export function listeningItem(tier = 3) {
  // A partir de tier 3 se mezclan avisos curados (más largos) con los generados.
  if (tier >= 3 && Math.random() < 0.5) {
    return shuffledBankItem(choice(near(LISTENING, tier)), "listen", "listen", tier);
  }
  return choice(LISTEN_GENERATORS)(tier);
}

/* --------------------------- registro por tier --------------------------- */
export const ENGLISH_FAMILIES = {
  1: [grammarItem, translateItem, listeningItem],
  2: [grammarItem, translateItem, listeningItem, errorItem],
  3: [grammarItem, translateItem, listeningItem, errorItem],
  4: [grammarItem, translateItem, listeningItem, errorItem],
  5: [grammarItem, translateItem, listeningItem, errorItem],
};

export function generateEnglish(tier) {
  const t = Math.min(5, Math.max(1, tier | 0));
  const pool = ENGLISH_FAMILIES[t];
  return pool[Math.floor(Math.random() * pool.length)](t);
}
