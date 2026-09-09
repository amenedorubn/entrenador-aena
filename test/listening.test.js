// Tarea 3 · Gate de `npm test` para el banco de listening (data/listening.js). La
// lógica de comprobación vive en scripts/lib/listening-checks.mjs, compartida con
// scripts/validar-listening.mjs (la versión CLI, con informe legible) para no tener dos
// implementaciones que puedan divergir.
import { describe, it, expect } from "vitest";
import { LISTENING, LEVELS, estimateDurationSec } from "../data/listening.js";
import { AIRPORT_LEXICON } from "../data/contextos.js";
import { literalOverlap } from "../scripts/lib/listening-checks.mjs";

const DURATION_RANGE = { A: [40, 70], B: [40, 70], C: [90, 150], D: [90, 150] };
const AIRPORT_RE = new RegExp(`\\b(${AIRPORT_LEXICON.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i");
const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

describe("data/listening.js · forma del ítem", () => {
  it("tiene al menos 12 ítems con ids únicos", () => {
    expect(LISTENING.length).toBeGreaterThanOrEqual(12);
    expect(new Set(LISTENING.map((it) => it.id)).size).toBe(LISTENING.length);
  });

  it("cada ítem tiene 4 opciones distintas, correctIndex válido y correctText coherente", () => {
    for (const it of LISTENING) {
      expect(it.options, it.id).toHaveLength(4);
      expect(new Set(it.options).size, it.id).toBe(4);
      expect(it.correctIndex, it.id).toBeGreaterThanOrEqual(0);
      expect(it.correctIndex, it.id).toBeLessThanOrEqual(3);
      expect(it.options[it.correctIndex], it.id).toBe(it.correctText);
    }
  });

  it("cada ítem trae un nivel A-D válido y audio no vacío", () => {
    for (const it of LISTENING) {
      expect(LEVELS, it.id).toContain(it.level);
      expect(it.audio.trim().length, it.id).toBeGreaterThan(0);
    }
  });

  it("los diálogos (turns) declaran acento por turno y speakers coherente", () => {
    for (const it of LISTENING.filter((x) => x.turns)) {
      expect(it.turns.length, it.id).toBeGreaterThan(1);
      for (const t of it.turns) expect(t.accent, it.id).toBeTruthy();
      expect(it.speakers, it.id).toBe(new Set(it.turns.map((t) => t.speaker)).size);
    }
  });
});

describe("data/listening.js · reglas duras de la Tarea 3", () => {
  it("la opción correcta nunca comparte 3+ palabras de contenido consecutivas con el transcript", () => {
    for (const it of LISTENING) {
      const overlap = literalOverlap(it.correctText, it.audio);
      expect(overlap, `${it.id}: solape literal "${overlap}" -- se acertaría sin escuchar`).toBeNull();
    }
  });

  it("la duración estimada encaja en su nivel (B1 40-70s, B2 90-150s)", () => {
    for (const it of LISTENING) {
      const [min, max] = DURATION_RANGE[it.level];
      const dur = estimateDurationSec(it);
      expect(dur, `${it.id}: ${dur}s fuera de [${min}-${max}]s`).toBeGreaterThanOrEqual(min);
      expect(dur, `${it.id}: ${dur}s fuera de [${min}-${max}]s`).toBeLessThanOrEqual(max);
    }
  });

  it("el contexto aeroportuario no supera el 15 % del banco", () => {
    const hits = LISTENING.filter((it) => AIRPORT_RE.test(normalize(it.audio)));
    const pct = (hits.length / LISTENING.length) * 100;
    expect(pct, `ítems con contexto aeroportuario: ${hits.map((it) => it.id).join(", ")}`).toBeLessThanOrEqual(15);
  });

  // Regla pedida explícitamente: "un chequeo que falle si la correcta es la opción con
  // mayor solape léxico con el transcript. Si acertar por solape funciona, el ítem es
  // malo." -- si hay un único "ganador" por conteo de palabras en común con el audio,
  // ESE no puede ser el índice correcto (si lo fuera, contar palabras sin escuchar ya
  // te daría la respuesta).
  it("la opción correcta no es la que gana por solape léxico bruto con el transcript", () => {
    const STOPWORDS = new Set(["a", "an", "the", "to", "of", "in", "on", "at", "is", "are", "was", "were", "and", "or", "but", "for", "with"]);
    const words = (s) => s.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter((w) => w && !STOPWORDS.has(w));
    for (const it of LISTENING) {
      const tw = new Set(words(it.audio));
      const scores = it.options.map((o) => words(o).filter((w) => tw.has(w)).length);
      const topScore = Math.max(...scores);
      const topIndices = scores.map((s, i) => (s === topScore ? i : -1)).filter((i) => i >= 0);
      if (topIndices.length === 1) {
        expect(topIndices[0], `${it.id}: "${it.options[topIndices[0]]}" gana por solape léxico bruto y es la correcta -- se acertaría contando palabras`).not.toBe(it.correctIndex);
      }
    }
  });
});
