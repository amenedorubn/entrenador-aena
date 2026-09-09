// Blindaje de esquema (ver CLAUDE.md / auditoría de la migración a opciones[]+correctas[]
// por id que finalmente NO se hizo -- se optó por este seguro más barato en su lugar):
// 200 barajados sobre una muestra de ítems reales de cada banco estático con
// options[]+correctIndex+correctText, comprobando que la opción marcada como correcta
// SIGUE siendo la misma tras barajar, siempre. shuffleBankOptions ya lanza
// ShuffleIntegrityError si detecta un desajuste (ver js/rng.js) -- este test comprueba
// que, en 200 intentos, nunca lo lanza para datos que hoy son correctos.
import { describe, it, expect } from "vitest";
import { shuffleBankOptions } from "../js/rng.js";
import { GRAMMAR, ERROR_CORRECTION } from "../data/english.js";
import { SJT } from "../data/sjt.js";

const SAMPLE = [...GRAMMAR, ...ERROR_CORRECTION, ...SJT].slice(0, 50);
const SHUFFLES = 200;

describe("shuffleBankOptions · estabilidad tras barajar", () => {
  it(`${SHUFFLES} barajados sobre ${SAMPLE.length} ítems: la opción correcta nunca cambia`, () => {
    expect(SAMPLE.length).toBeGreaterThan(0);
    for (const it of SAMPLE) {
      for (let i = 0; i < SHUFFLES; i++) {
        const { options, correctIndex } = shuffleBankOptions(it.options, it.correctIndex, it.correctText, it.id);
        expect(options[correctIndex], `${it.id} (intento ${i})`).toBe(it.correctText);
        // Las mismas opciones (aunque reordenadas) siguen presentes -- el shuffle no
        // pierde ni inventa ninguna.
        expect([...options].sort(), it.id).toEqual([...it.options].sort());
      }
    }
  });
});
