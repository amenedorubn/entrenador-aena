// Guard: si data/real.source.js o data/variantes.source.js (fuentes en claro,
// gitignored) son más recientes que data/real.enc.json (el fichero cifrado que sirve
// la app, tracked en git), alguien tocó datos y no re-cifró. Antes esto se detectaba
// a posteriori mirando timestamps a mano -- ver commit "Corrige 2 claves..." del
// 2026-09-10, donde el primer cifrado se hizo antes de la corrección de
// wa-aptitudes-3 y hubo que repetirlo. Ahora falla npm test, que ya es gate obligatorio
// antes de cada push.
import { describe, it, expect } from "vitest";
import { checkEncFreshness } from "../scripts/lib/check-enc-freshness.mjs";

describe("real.enc.json · frescura frente a las fuentes en claro", () => {
  it("no está desactualizado respecto a real.source.js / variantes.source.js", () => {
    const result = checkEncFreshness();
    if (!result.checked) return; // checkout sin fuentes en claro (p. ej. CI): nada que comparar
    expect(result.stale, result.message).toBe(false);
  });
});
