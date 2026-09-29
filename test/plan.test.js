import { describe, it, expect } from "vitest";
import { studyHoursBetween, computePlan, examMs } from "../js/plan.js";

const at = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

describe("studyHoursBetween", () => {
  it("un día completo aporta exactamente hoursPerDay", () => {
    expect(studyHoursBetween(at(2026, 9, 30, 0), at(2026, 10, 1, 0), 5)).toBeCloseTo(5, 6);
  });
  it("fuera de la ventana 09-22 no cuenta", () => {
    expect(studyHoursBetween(at(2026, 9, 30, 23), at(2026, 10, 1, 8), 5)).toBe(0);
  });
  it("el día del examen (08:00) no suma nada", () => {
    expect(studyHoursBetween(at(2026, 10, 3, 0), examMs("2026-10-03"), 5)).toBe(0);
  });
});

describe("computePlan", () => {
  const base = { total: 158, baseDone: 28, startMs: at(2026, 9, 29, 12, 12), examDate: "2026-10-03", hoursPerDay: 5 };
  it("en el instante de partida se espera lo ya hecho", () => {
    const p = computePlan({ ...base, done: 28, nowMs: base.startMs });
    expect(p.expected).toBeCloseTo(28, 6);
    expect(p.ahead).toBeCloseTo(0, 6);
    expect(p.remaining).toBe(130);
  });
  it("en el examen se espera el total", () => {
    const p = computePlan({ ...base, done: 100, nowMs: examMs("2026-10-03") });
    expect(p.expected).toBeCloseTo(158, 6);
    expect(p.ahead).toBeLessThan(0);
  });
  it("el ritmo es monótono", () => {
    const a = computePlan({ ...base, done: 28, nowMs: at(2026, 9, 30, 12) }).expected;
    const b = computePlan({ ...base, done: 28, nowMs: at(2026, 10, 1, 12) }).expected;
    expect(b).toBeGreaterThan(a);
  });
});
