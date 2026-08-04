// Valida el banco de preguntas reales en texto plano (data/real.source.js), que NO
// se sube al repo (ver .gitignore) y solo existe en local — es la fuente que
// scripts/encrypt.mjs cifra a data/real.enc.json. Si el archivo no existe (p. ej. un
// clon nuevo del repo antes de recibirlo por otro canal), estos tests se saltan en
// vez de romper `npm test`.
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "real.source.js");

describe.skipIf(!existsSync(SOURCE_PATH))("data/real.source.js", () => {
  it("cada ítem tiene forma válida", async () => {
    const { REAL, FIGURE_CATEGORIES, CATEGORY_SOURCE } = await import("../data/real.source.js");
    expect(REAL.length).toBeGreaterThan(0);

    const ids = REAL.map((it) => it.id);
    expect(new Set(ids).size, "ids duplicados").toBe(ids.length);

    for (const it of REAL) {
      expect(it.options.length, it.id).toBeGreaterThanOrEqual(2);
      expect(it.options.length, it.id).toBeLessThanOrEqual(6);
      expect(new Set(it.options).size, `${it.id}: opciones duplicadas`).toBe(it.options.length);
      expect(it.correctIndex, it.id).toBeGreaterThanOrEqual(0);
      expect(it.correctIndex, it.id).toBeLessThan(it.options.length);
      expect(it.prompt.trim().length, it.id).toBeGreaterThan(0);
      expect(it.isReal, it.id).toBe(true);
      expect(["alta", "media", "baja"], it.id).toContain(it.confidence);
      expect(Object.keys(CATEGORY_SOURCE), `${it.id}: categoría "${it.category}" sin fuente de curriculum`).toContain(it.category);
      if (FIGURE_CATEGORIES.has(it.category)) {
        expect(it.image, `${it.id}: categoría de figura sin imagen`).toBeTruthy();
      }
    }
  });
});
