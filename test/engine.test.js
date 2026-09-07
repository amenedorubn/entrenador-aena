import { describe, it, expect } from "vitest";
import { optionText, optionAsset } from "../js/engine.js";

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
