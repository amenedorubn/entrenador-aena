// Fase 3 · Generadores de inglés.
// Grammar / error correction / producción escrita salen de bancos estáticos. El
// listening también sale de un banco -- ver data/listening.js y su cabecera: la Tarea
// 3 del encargo retiró los generadores por procedimiento que había aquí antes
// (listenGate/listenDelay/listenReason/listenDesk/listenShuttle) porque eran 100 %
// aeropuerto, con la respuesta repitiendo literalmente el audio, sin acentos, sin
// niveles y demasiado cortos para pasar por B1 real. El banco nuevo cumple las reglas
// duras de esa tarea (ver scripts/validar-listening.mjs) y no se puede generar por
// procedimiento con esa calidad sin un modelo de lenguaje -- así que es banco curado,
// como GRAMMAR/ERROR_CORRECTION.
import { GRAMMAR, TRANSLATE, ERROR_CORRECTION } from "../data/english.js";
import { NOTES } from "../data/english-notes.js";
import { LISTENING, questionsOf } from "../data/listening.js";
import { choice, shuffle, shuffleBankOptions, ShuffleIntegrityError } from "./rng.js";

const near = (arr, tier) => {
  const p = arr.filter((x) => Math.abs(x.lvl - tier) <= 1);
  return p.length ? p : arr;
};

/**
 * Baraja las opciones de un ítem de banco conservando cuál es la correcta, con
 * blindaje de integridad vía shuffleBankOptions (ver js/rng.js): si correctText no
 * coincide tras barajar, no se sirve -- se relanza para que la fábrica de arriba
 * (grammarItem/errorItem) reintente con otro ítem del banco.
 */
function shuffledBankItem(it, kind, block, tier) {
  const { options, correctIndex } = shuffleBankOptions(it.options, it.correctIndex, it.correctText, it.id);
  return {
    kind, block, tier, family: it.id.replace(/\d+$/, ""),
    prompt: it.prompt, audio: it.audio,
    options, correctIndex,
    value: it.options[it.correctIndex],
    explanation: NOTES[it.id] ?? it.explanation, origen: it.origen, origenId: it.origenId ?? null,
  };
}

/** Reintenta con otro ítem del pool si shuffledBankItem descarta uno por integridad. */
function pickBankItem(pool, kind, block, tier) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return shuffledBankItem(choice(pool), kind, block, tier);
    } catch (e) {
      if (!(e instanceof ShuffleIntegrityError)) throw e;
    }
  }
  throw new Error("pickBankItem: no se pudo servir ningún ítem íntegro tras varios intentos.");
}

export function grammarItem(tier = 3) {
  return pickBankItem(near(GRAMMAR, tier), "text", "grammar", tier);
}

export function errorItem(tier = 3) {
  return pickBankItem(near(ERROR_CORRECTION, tier), "text", "grammar", tier);
}

/** Producción escrita: construir la frase con fichas (tipo Duolingo). */
export function translateItem(tier = 3) {
  const t = choice(near(TRANSLATE, tier));
  const tokens = shuffle([...t.answer, ...t.lures]);
  return {
    kind: "wordbank", block: "translate", tier, family: "translate",
    prompt: `Traduce al inglés: <b>${t.es}</b>`,
    tokens, answer: t.answer, alts: t.alts ?? [],
    value: t.answer.join(" "),
    explanation: NOTES[t.id] ?? "", // la respuesta ya sale como «Respuesta correcta»: aquí va la regla
    origen: t.origen, origenId: t.origenId ?? null,
  };
}

/* ---------------------------------- listening ---------------------------------- */

/** Igual que shuffledBankItem pero conserva los campos propios del listening (nivel,
 *  acento(s), turnos multivoz, tipo de pregunta) que engine.js necesita para
 *  reproducir el audio y pintar el badge de nivel. */
function listeningBankItem(it, tier) {
  const { options, correctIndex } = shuffleBankOptions(it.options, it.correctIndex, it.correctText, it.id);
  return {
    kind: "listen", block: "listen", tier, family: it.id,
    prompt: it.prompt, audio: it.audio, turns: it.turns, accent: it.accent,
    level: it.level, speakers: it.speakers, questionType: it.questionType,
    options, correctIndex,
    value: it.options[it.correctIndex],
    explanation: it.explanation, origen: it.origen, origenId: it.origenId ?? null,
  };
}

/**
 * `opts.level` ("A"|"B"|"C"|"D"), cuando se pasa (selector de Práctica libre, ver
 * app.js), filtra el banco a ese nivel exacto en vez de usar el tier del curso. Sin
 * `opts.level`, se filtra por tier como el resto de fuentes (near()).
 */
export function listeningItem(tier = 3, opts = {}) {
  const pool = opts.level ? LISTENING.filter((x) => x.level === opts.level) : near(LISTENING, tier);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return listeningBankItem(choice(pool.length ? pool : LISTENING), tier);
    } catch (e) {
      if (!(e instanceof ShuffleIntegrityError)) throw e;
    }
  }
  throw new Error("listeningItem: no se pudo servir ningún ítem íntegro tras varios intentos.");
}

/**
 * Un audio con varias preguntas seguidas (como en el examen real): devuelve los ítems de
 * UN mismo audio, que comparten `group` ({ plays }) para que las reproducciones (máx. 2)
 * cuenten para todo el grupo. `excludeIds` evita repetir audio dentro de una lección.
 * Devuelve [] si no queda ningún audio servible.
 */
export function listeningGroup(tier = 3, opts = {}, excludeIds = new Set()) {
  const base = opts.level ? LISTENING.filter((x) => x.level === opts.level) : near(LISTENING, tier);
  const pool = (base.length ? base : LISTENING).filter((x) => !excludeIds.has(x.id));
  for (let attempt = 0; attempt < 5 && pool.length; attempt++) {
    const it = choice(pool);
    try {
      const qs = questionsOf(it);
      const group = { id: it.id, plays: 0 };
      const out = qs.map((q, i) => {
        const { options, correctIndex } = shuffleBankOptions(q.options, q.correctIndex, q.correctText, q.id);
        return {
          kind: "listen", block: "listen", tier, family: it.id,
          prompt: q.prompt, audio: it.audio, turns: it.turns, accent: it.accent,
          level: it.level, speakers: it.speakers, questionType: q.questionType,
          options, correctIndex, value: q.options[q.correctIndex],
          explanation: q.explanation, origen: it.origen, origenId: it.origenId ?? null,
          group, groupPos: i, groupSize: qs.length, source: "listen",
        };
      });
      excludeIds.add(it.id);
      return out;
    } catch (e) {
      if (!(e instanceof ShuffleIntegrityError)) throw e;
    }
  }
  return [];
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
