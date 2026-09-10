// Fase B · Motor verbal (sinónimos/antónimos/analogías -- "parcial" en el inventario).
// No hay fórmula que calcule un sinónimo: la variante conserva EXACTAMENTE el enunciado
// y la respuesta correcta de la semilla (ese es el hecho de examen verificado; tocarlo
// sería inventar una palabra nueva sin verificar) y solo renueva el juego de 3
// distractores, sacándolos de data/lexicon.js (ya vetado a mano por el propio proyecto).
//
// Regla anti-ambigüedad (pedida explícitamente): un distractor nunca puede
//   (a) coincidir textualmente con el enunciado, la correcta, o cualquier opción
//       original de la semilla (comparación sin tildes/mayúsculas);
//   (b) venir de la MISMA entrada de lexicon.js que otro distractor ya elegido (dos
//       palabras de la misma entrada SON sinónimas entre sí por construcción);
//   (c) repetirse como palabra dentro de la misma variante.
// Si tras ampliar el radio de dificultad no se pueden construir 3 distractores que
// cumplan lo anterior, la semilla se descarta (no se genera ninguna variante) y se
// cuenta aparte -- "el léxico no permite... prefiero menos".
import { SYNONYMS, ANTONYMS } from "../../data/lexicon.js";
import { shuffle } from "../../js/rng.js";
import { normalizeText } from "./variant-engine.mjs";

const capitalize = (w) => w.charAt(0).toUpperCase() + w.slice(1);
const normWord = (w) => normalizeText(w);

/** Pool de palabras candidatas para sinónimos/antónimos: cada palabra lleva `key` (id
 *  de su entrada en el léxico) para poder excluir la otra mitad del mismo par. */
const SYN_ANT_POOL = [
  ...SYNONYMS.flatMap((e, i) => [{ word: e.w, key: `syn${i}`, lvl: e.lvl }, { word: e.s, key: `syn${i}`, lvl: e.lvl }]),
  ...ANTONYMS.flatMap((e, i) => [{ word: e.w, key: `ant${i}`, lvl: e.lvl }, { word: e.a, key: `ant${i}`, lvl: e.lvl }]),
];
const DIFFICULTY_LVL = { facil: 1.5, media: 2.5, dificil: 4 };

// De las 125 semillas de `analogias`, la inmensa mayoría NO son relaciones léxicas
// (vocabulario común) sino cultura general -- geografía, química, historia, arte,
// biología, mitología (p. ej. "Cu es a Cobre como Ag es a: Plata/Oro/Argón/Artemisa") --
// donde un distractor sacado de data/lexicon.js (adjetivos/sustantivos de registro
// culto genérico) sería un disparate, no un distractor plausible: no comparte NI el
// tipo de relación NI la categoría de conocimiento. Además, 60 semillas (ids "tac-*")
// tienen un formato de DOS huecos con opciones compuestas ("Macro-Magno") -- un formato
// estructuralmente distinto que este mecanismo (sustituir un único distractor de una
// sola palabra) no puede tocar sin arriesgar generar disparates con guion.
//
// Tras revisar las 125 una por una, solo estas 6 son relación léxica pura entre
// vocabulario común (mismo registro que data/lexicon.js, ni nombre propio ni símbolo ni
// número): el resto se descarta explícitamente, no por una heurística automática en la
// que no confío al 100%, sino por id -- así queda auditable qué se incluyó y por qué.
// Exclusión a mano (Fase D, revisión humana de la muestra): el distractor "Sobrio"
// generado para wa-aptitudes-12 (antónimo de "Lisonjero") es defendible casi tanto como
// la correcta "Molesto" -- "lisonjero" es polisémico en español (adulador / grato-agradable)
// y esa segunda acepción hace que "sobrio" (comedido, sin adornos) compita de verdad. La
// regla de polisemia de más abajo NO habría cazado este caso (data/lexicon.js solo tiene
// UNA entrada para "lisonjero": {sense:"real-lisonjero"}, añadida específicamente para
// esta semilla) -- por eso hace falta esta exclusión explícita además de la regla general.
const EXCLUDED_SEED_IDS = new Set(["wa-aptitudes-12"]);

const ELIGIBLE_ANALOGY_IDS = new Set([
  "wa-aptitudes-8",   // Apaciguar:Tranquilizar :: Rechazar:Repeler
  "wa-aptitudes-11",  // Acopio:Provisión :: Estridente:Llamativo
  "wa-aptitudes-20",  // Competente:Inexperto :: Hábil:Torpe
  "ex20240317-11",    // Avalar:Desacreditar :: Farsante:Veraz
  "ex20240317-18",    // Nocivo:Perjudicial :: Inocuo:Inofensivo
  "tas2-c1-26",       // Haragán:indolente :: paupérrimo:Misérrimo
]);

// Palabras propias del enunciado (el término preguntado, y en analogías los 2-3
// términos de la relación) que NUNCA pueden colarse como distractor -- si no se
// excluyen aquí, un distractor podría coincidir con la palabra que se está preguntando
// (p. ej. "Ejemplo" como distractor de "¿parecido a Ejemplo?"), que es peor que
// ambiguo: es un candado roto. Palabras con mayúscula inicial en el prompt, fuera de un
// stoplist de arranques de frase/instrucción.
const PROMPT_WORD_STOPLIST = new Set([
  "Elija", "Señale", "Cuál", "Cual", "De", "Las", "Los", "Si", "El", "La", "Un", "Una",
]);
function promptOwnWords(prompt) {
  const words = prompt.match(/\b\p{Lu}[\p{Ll}]+\b/gu) ?? [];
  return words.filter((w) => !PROMPT_WORD_STOPLIST.has(w));
}

// Palabra preguntada exacta (el primer término con mayúscula del prompt, tras el
// stoplist) -- para la regla de polisemia hace falta la palabra EN SÍ, no toda la lista
// de "palabras propias" (que en analogías incluye 2-3 términos).
function targetWord(prompt) {
  return promptOwnWords(prompt)[0] ?? "";
}

/**
 * Regla anti-ambigüedad pedida explícitamente tras la Fase D: si la palabra preguntada
 * tiene MÁS DE UN sentido registrado en data/lexicon.js (aparece como w/s/a de entradas
 * con `sense` distinto -- p. ej. "audaz" es sinónimo de "valiente" en una entrada Y
 * antónimo de "cobarde" en otra), un distractor sacado del léxico sin más cuidado podría
 * colisionar con esa otra acepción. Se descarta la semilla en vez de intentar generar
 * distractores "de un solo sentido" (exigiría saber CUÁL de los sentidos es el que
 * pregunta la semilla, y el léxico no lo dice). OJO: esto NO sustituye la revisión
 * humana -- no detecta polisemia del mundo real que el léxico no haya registrado (ver
 * EXCLUDED_SEED_IDS: "lisonjero" solo tiene una entrada en el léxico y aun así generó un
 * distractor problemático).
 */
function wordSenseCount(word) {
  const target = normWord(word);
  const senses = new Set();
  for (const e of SYNONYMS) {
    if (normWord(e.w) === target || normWord(e.s) === target) senses.add(`syn:${e.sense}`);
  }
  for (const e of ANTONYMS) {
    if (normWord(e.w) === target || normWord(e.a) === target) senses.add(`ant:${e.sense}`);
  }
  return senses.size;
}

/**
 * Elige `n` distractores limpios del pool, ampliando el radio de dificultad hasta
 * encontrar suficientes candidatos válidos. Devuelve null (nunca un array corto) si no
 * se pueden construir `n` distintos ni ampliando el radio al máximo -- eso es la señal
 * de "descarta esta semilla" para quien llama.
 */
function pickDistractors(pool, excludeWords, wantLvl, n, avoidCombos) {
  const excludeNorm = new Set(excludeWords.map(normWord));
  for (let radius = 1; radius <= 6; radius++) {
    const tier = shuffle(pool.filter((c) => !excludeNorm.has(normWord(c.word)) && Math.abs(c.lvl - wantLvl) <= radius));
    const byKey = new Map();
    for (const c of tier) {
      if (byKey.has(c.key)) continue;
      if ([...byKey.values()].some((x) => normWord(x.word) === normWord(c.word))) continue;
      byKey.set(c.key, c);
      if (byKey.size >= n) break;
    }
    if (byKey.size < n) continue;
    const picked = [...byKey.values()].map((c) => c.word);
    const comboKey = [...picked].map(normWord).sort().join("|");
    if (avoidCombos.has(comboKey)) continue; // ya se usó esta misma terna en otra variante de la semilla
    avoidCombos.add(comboKey);
    return picked;
  }
  return null;
}

/**
 * Genera hasta `count` variantes de una semilla verbal (sinónimo/antónimo/analogía).
 * Enunciado y respuesta correcta SIEMPRE iguales a la semilla; solo cambia el trío de
 * distractores en cada variante. Devuelve { variants, discarded } -- discarded=true
 * cuando el léxico no dio para construir ni una sola terna limpia.
 */
export function generateVerbalVariants(seed, count) {
  if (EXCLUDED_SEED_IDS.has(seed.id)) return { variants: [], discarded: true, reason: "excluida a mano tras revisión humana (Fase D)" };
  const isAnalogy = seed.category === "analogias";
  if (isAnalogy && !ELIGIBLE_ANALOGY_IDS.has(seed.id)) return { variants: [], discarded: true, reason: "analogía de cultura general o formato de dos huecos, no de relación léxica" };
  if (wordSenseCount(targetWord(seed.prompt)) > 1) return { variants: [], discarded: true, reason: "palabra objetivo polisémica en data/lexicon.js" };
  // Las analogías léxicas elegibles comparten registro con sinónimos/antónimos (relación
  // de grado/antonimia entre vocabulario común) -- ANALOGY_RELATIONS son sustantivos
  // concretos de relaciones especialista-órgano/ciencia-objeto, mal encaje de registro
  // para estas 6 semillas (su respuesta es casi siempre un adjetivo). Se usa SYN_ANT_POOL
  // para ambas categorías.
  const pool = SYN_ANT_POOL;
  const wantLvl = DIFFICULTY_LVL[seed.difficulty] ?? 2.5;
  const excludeWords = [
    ...seed.options.map((o) => (typeof o === "string" ? o : o.text ?? "")),
    ...promptOwnWords(seed.prompt),
  ];
  const avoidCombos = new Set();

  const variants = [];
  for (let i = 0; i < count; i++) {
    const distractors = pickDistractors(pool, excludeWords, wantLvl, 3, avoidCombos);
    if (!distractors) break; // el léxico se agotó para esta semilla (a partir de aquí, ninguna más)
    const capDistractors = distractors.map(capitalize);
    const tagged = [{ t: seed.correctText, ok: true }, ...capDistractors.map((t) => ({ t, ok: false }))];
    const mixed = shuffle(tagged);
    const correctIndex = mixed.findIndex((x) => x.ok);
    // El enunciado no cambia entre variantes de la misma semilla (solo los distractores),
    // así que la firma anti-clon real es el propio id -- se guarda igual por si acaso.
    variants.push({
      id: `${seed.id}-v${i + 1}`,
      origen: "variante", origenId: seed.id, family: seed.category,
      // La confianza se hereda de la semilla, no se fija a "alta" a pelo: si la semilla
      // está marcada confidence:"baja" (p. ej. wa-aptitudes-3, con nota "Revisar" en su
      // propia explicación), la variante hereda EXACTAMENTE el mismo enunciado y
      // respuesta -- afirmar más confianza que la semilla sería falso.
      lvl: seed.lvl, category: seed.category, confidence: seed.confidence ?? "alta",
      prompt: seed.prompt,
      options: mixed.map((x) => x.t),
      correctIndex, correctText: seed.correctText,
      explanation: seed.explanation ?? `Misma pregunta que ${seed.id}, distractores renovados desde el léxico vetado del proyecto.`,
      sourceFile: `Variante de ${seed.id} (mismo enunciado y respuesta, distractores nuevos) -- scripts/generar-variantes.mjs`,
    });
  }
  return { variants, discarded: variants.length === 0 };
}
