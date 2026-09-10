// Motor compartido de variantes (Fase B). Reglas duras que aplica SIEMPRE, para
// cualquier familia:
//   1. La respuesta se calcula con código (spec.compute), nunca se copia/estima.
//   2. Autocomprobación al cargar: compute(seedParams) debe reproducir exactamente el
//      correctText de la semilla real -- si no coincide, la spec está mal y el script
//      revienta ANTES de generar nada (mejor fallar aquí que servir una clave mala:
//      el bug de las patas de la granja salió justo de esto).
//   3. Anti-clon: una variante nunca puede tener el mismo enunciado normalizado que su
//      semilla ni que otra variante ya generada de la misma semilla.
//   4. Cada variante lleva origen:"variante" + origenId apuntando al id de la semilla.
import { randInt, choice, shuffle } from "../../js/rng.js";

function normalizeText(text) {
  return text
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Ejecuta una spec numérica: autocomprobación contra la semilla, luego hasta
 * `count` variantes con parámetros aleatorios dentro del rango de la propia spec,
 * descartando (con reintento acotado) cualquier variante cuyo enunciado normalizado
 * coincida con la semilla o con una variante hermana ya aceptada.
 *
 * spec = {
 *   seedId, family,
 *   seedParams,                  // los valores REALES de la semilla, para autocheck
 *   genParams(),                 // -> params aleatorios dentro de rango realista
 *   compute(params) -> number,   // resultado correcto, siempre calculado
 *   distractors(params, correct) -> number[3],  // mismas trampas que el examen real
 *   format(value, params) -> string,            // formatea número->texto (unidad, decimales...)
 *   prompt(params) -> string,
 *   explanation(params, correct) -> string,
 * }
 */
export function runNumericSpec(spec, seed, count) {
  const selfCheckValue = spec.compute(spec.seedParams);
  const selfCheckText = spec.format(selfCheckValue, spec.seedParams);
  if (selfCheckText !== seed.correctText) {
    throw new Error(
      `[autocheck] ${spec.seedId}: compute(seedParams) da "${selfCheckText}" pero la semilla real dice "${seed.correctText}". Revisa la fórmula antes de generar nada.`
    );
  }

  const out = [];
  const seenNormalized = new Set([normalizeText(seed.prompt)]);
  let guard = 0;
  while (out.length < count && guard < count * 25) {
    guard++;
    const params = spec.genParams();
    const correct = spec.compute(params);
    const correctText = spec.format(correct, params);
    const distractorValues = spec.distractors(params, correct);
    const distractorTexts = distractorValues.map((v) => spec.format(v, params));

    // Distractores duplicados entre sí o iguales a la correcta -> variante inservible,
    // se descarta este intento (no se cuenta como generada) y se reintenta con otros params.
    const allTexts = [correctText, ...distractorTexts];
    if (new Set(allTexts).size !== allTexts.length) continue;

    const promptText = spec.prompt(params);
    const norm = normalizeText(promptText);
    if (seenNormalized.has(norm)) continue; // anti-clon: igual a la semilla o a una hermana

    const tagged = [{ t: correctText, ok: true }, ...distractorTexts.map((t) => ({ t, ok: false }))];
    const mixed = shuffle(tagged);
    const correctIndex = mixed.findIndex((x) => x.ok);

    seenNormalized.add(norm);
    out.push({
      id: `${spec.seedId}-v${out.length + 1}`,
      origen: "variante", origenId: spec.seedId, family: spec.family,
      lvl: seed.lvl, category: seed.category, confidence: "alta",
      prompt: promptText,
      options: mixed.map((x) => x.t),
      correctIndex, correctText,
      explanation: spec.explanation(params, correct),
      sourceFile: `Variante generada de ${spec.seedId} (scripts/generar-variantes.mjs)`,
    });
  }
  return out;
}

export { randInt, choice, normalizeText };
