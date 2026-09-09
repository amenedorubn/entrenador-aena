// Lógica de comprobación de listening compartida entre scripts/validar-listening.mjs
// (CLI / gate de build) y test/listening.test.js (gate de `npm test`), para no tener
// dos implementaciones que puedan divergir.

// Palabras funcionales que se ignoran al medir solape -- deliberadamente NO incluye
// negadores ("no", "not", "n't") ni intensificadores: cambian el significado, así que
// contar su repetición sí importa. El objetivo es medir solape de CONTENIDO, no de
// conectores gramaticales.
const STOPWORDS = new Set([
  "a", "an", "the", "to", "of", "in", "on", "at", "is", "are", "was", "were", "and",
  "or", "but", "that", "this", "it", "for", "with", "as", "be", "by", "from", "has",
  "have", "had", "will", "would", "can", "could", "should", "do", "does", "did", "so",
  "than", "then", "if", "you", "your", "we", "our", "they", "their", "he", "she",
  "his", "her", "its", "i", "me", "my", "them", "who", "what", "which", "when",
  "where", "how", "why", "there", "these", "those", "just", "also",
]);

export function contentWords(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !STOPWORDS.has(w));
}

function ngrams(words, n) {
  const out = [];
  for (let i = 0; i <= words.length - n; i++) out.push(words.slice(i, i + n).join(" "));
  return out;
}

/**
 * Regla dura de la Tarea 3: la opción correcta no puede compartir `n` (por defecto 3)
 * o más palabras de CONTENIDO consecutivas con el transcript -- eso sería caza de
 * palabras clave, no comprensión. Devuelve el n-grama compartido más largo encontrado
 * (o null si no hay solape ≥ n), para poder señalarlo en el informe.
 */
export function literalOverlap(correctText, transcript, n = 3) {
  const cw = contentWords(correctText);
  const tw = contentWords(transcript);
  if (cw.length < n) return null;
  const tgrams = new Set(ngrams(tw, n));
  for (const g of ngrams(cw, n)) {
    if (tgrams.has(g)) return g;
  }
  return null;
}

/**
 * Señal blanda (no rompe el build): cuántos de los distractores comparten al menos una
 * palabra de contenido con el transcript -- el patrón "se menciona en el audio pero no
 * responde" es la base del listening difícil, pero no toda opción abstracta puede
 * verificarse por texto, así que esto es informativo, no un gate.
 */
export function mentionedDistractorCount(options, correctIndex, transcript) {
  const tw = new Set(contentWords(transcript));
  return options.filter((o, i) => i !== correctIndex && contentWords(o).some((w) => tw.has(w))).length;
}
