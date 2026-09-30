import { describe, it, expect } from "vitest";
import { niceMax, lineChart, columnChart } from "../js/charts.js";

describe("charts", () => {
  it("niceMax redondea a 1, 2, 5 x 10^k", () => {
    expect([niceMax(0), niceMax(0.7), niceMax(3), niceMax(7), niceMax(180), niceMax(1001)]).toEqual([1, 1, 5, 10, 200, 2000]);
  });

  it("lineChart con pocos puntos avisa en vez de dibujar", () => {
    expect(lineChart([{ x: 0, y: 1 }])).toContain("pocos datos");
  });

  it("lineChart dibuja línea, ejes, referencia y escapa el texto", () => {
    const html = lineChart([{ x: 0, y: 1, tip: "<b>a</b>" }, { x: 1, y: 3 }, { x: 2, y: 2 }], { ref: { y: 2, label: "Meta" }, title: "T" });
    expect(html).toContain("<svg");
    expect(html).toContain("Meta");
    expect(html).not.toContain("<b>a</b>");
    expect(html).toContain('aria-label="T"');
  });

  it("columnChart pinta una columna por elemento", () => {
    const html = columnChart([{ label: "a", value: 0 }, { label: "b", value: 3 }, { label: "c", value: 5 }]);
    expect((html.match(/<rect /g) ?? []).length).toBe(2);
  });
});
