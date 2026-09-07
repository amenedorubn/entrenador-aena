// Valida el banco de preguntas reales en texto plano (data/real.source.js), que NO
// se sube al repo (ver .gitignore) y solo existe en local — es la fuente que
// scripts/encrypt.mjs cifra a data/real.enc.json. Si el archivo no existe (p. ej. un
// clon nuevo del repo antes de recibirlo por otro canal), estos tests se saltan en
// vez de romper `npm test`.
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "real.source.js");
const ASSETS_DIR = path.join(ROOT, "public", "assets", "exams");

// Una opción puede ser un string (caso normal) o un objeto { text, asset } cuando la
// opción en sí es una imagen (ver js/engine.js: optionText/optionAsset). optionKey da
// una clave comparable para detectar duplicados en ambos casos: comparar objetos con
// Set directamente nunca detecta duplicados porque cada objeto es una referencia
// distinta, aunque tengan el mismo asset/texto.
function optionKey(o) {
  return typeof o === "string" ? o : JSON.stringify(o);
}

function walk(dir, prefix = "") {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), prefix + e.name + "/"));
    else out.push(prefix + e.name);
  }
  return out;
}
const diskAssets = new Set(existsSync(ASSETS_DIR) ? walk(ASSETS_DIR) : []);

describe.skipIf(!existsSync(SOURCE_PATH))("data/real.source.js", () => {
  it("cada ítem tiene forma válida", async () => {
    const { REAL, FIGURE_CATEGORIES, CATEGORY_SOURCE } = await import("../data/real.source.js");
    expect(REAL.length).toBeGreaterThan(0);

    const ids = REAL.map((it) => it.id);
    expect(new Set(ids).size, "ids duplicados").toBe(ids.length);

    for (const it of REAL) {
      expect(it.options.length, it.id).toBeGreaterThanOrEqual(2);
      expect(it.options.length, it.id).toBeLessThanOrEqual(6);
      const keys = it.options.map(optionKey);
      expect(new Set(keys).size, `${it.id}: opciones duplicadas`).toBe(it.options.length);
      expect(it.correctIndex, it.id).toBeGreaterThanOrEqual(0);
      expect(it.correctIndex, it.id).toBeLessThan(it.options.length);
      expect(it.prompt.trim().length, it.id).toBeGreaterThan(0);
      expect(it.isReal, it.id).toBe(true);
      expect(["alta", "media", "baja"], it.id).toContain(it.confidence);
      expect(Object.keys(CATEGORY_SOURCE), `${it.id}: categoría "${it.category}" sin fuente de curriculum`).toContain(it.category);
      if (FIGURE_CATEGORIES.has(it.category)) {
        expect(it.image, `${it.id}: categoría de figura sin imagen`).toBeTruthy();
      }
      for (const o of it.options) {
        if (typeof o === "string") continue;
        expect(o.text || o.asset, `${it.id}: opción-objeto sin texto ni asset`).toBeTruthy();
        if (o.asset) expect(diskAssets.has(o.asset), `${it.id}: asset de opción "${o.asset}" no existe en public/assets/exams/`).toBe(true);
      }
    }
  });
});
