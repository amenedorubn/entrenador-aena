import { describe, it, expect } from "vitest";
import { optionText, optionAsset, fig } from "../js/engine.js";

// Una opción del banco real es un string (caso normal) o un objeto { text, asset }
// (opción-imagen). optionText/optionAsset son el único punto de lectura: cualquier
// otro sitio que lea `option.text`/`option.asset` a pelo rompe con el caso string.
describe("optionText / optionAsset", () => {
  it("opción-string: el texto es el propio string, sin asset", () => {
    expect(optionText("Figura C")).toBe("Figura C");
    expect(optionAsset("Figura C")).toBeNull();
  });

  it("opción-objeto con texto y asset", () => {
    const o = { text: "Plano A", asset: "domino/opt-a.png" };
    expect(optionText(o)).toBe("Plano A");
    expect(optionAsset(o)).toBe("domino/opt-a.png");
  });

  it("opción-objeto solo-imagen (sin texto)", () => {
    const o = { text: null, asset: "domino/opt-b.png" };
    expect(optionText(o)).toBe("");
    expect(optionAsset(o)).toBe("domino/opt-b.png");
  });

  it("null/undefined no rompen (defensivo)", () => {
    expect(optionText(null)).toBe("");
    expect(optionAsset(undefined)).toBeNull();
  });
});

// Bug real de esta sesión: la manecilla apuntaba una hora antes de la que decía
// ((hour-1)%12*30 en vez de hour%12*30). Fijado con un test explícito hora a hora
// para que no pueda volver a colarse sin que rompa el build.
describe("fig({k:'clock'}) — ángulo de la manecilla", () => {
  it("hora H -> H%12 * 30 grados (12 en punto = 0°, sentido horario)", () => {
    for (let h = 1; h <= 12; h++) {
      const svg = fig({ k: "clock", hour: h });
      const angle = Number(svg.match(/rotate\((\d+)/)[1]);
      expect(angle, `hora ${h}`).toBe((h % 12) * 30);
    }
  });
});
