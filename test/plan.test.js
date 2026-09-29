import { describe, it, expect } from "vitest";
import { studyHoursBetween, computePlan, examMs, feasibility } from "../js/plan.js";

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

describe("hoursPerDay como función (horas distintas por día)", () => {
  const hours = (d) => (d.getDate() === 1 ? 0 : 6); // 1/10 sin hueco, el resto 6 h
  it("un día con 0 h no suma", () => {
    expect(studyHoursBetween(at(2026, 10, 1, 0), at(2026, 10, 2, 0), hours)).toBe(0);
    expect(studyHoursBetween(at(2026, 9, 30, 0), at(2026, 10, 1, 0), hours)).toBeCloseTo(6, 6);
  });
  it("computePlan acepta la función y da un perDay finito", () => {
    const p = computePlan({ total: 158, done: 28, baseDone: 28, startMs: at(2026, 9, 29, 12, 12), nowMs: at(2026, 9, 29, 12, 12), examDate: "2026-10-03", hoursPerDay: hours });
    expect(Number.isFinite(p.perDay)).toBe(true);
    expect(p.hoursLeft).toBeGreaterThan(0);
  });
});

describe("ventanas de estudio por día", () => {
  const win = (d) => (d.getDate() === 30 ? [15.5, 20.5] : [16, 20]);
  it("solo cuenta dentro de la ventana", () => {
    // 30/9: ventana 15:30-20:30 (5 h) con 5 h/día -> 15:30-18:00 = 2,5 h
    expect(studyHoursBetween(at(2026, 9, 30, 15, 30), at(2026, 9, 30, 18, 0), 5, win)).toBeCloseTo(2.5, 6);
    expect(studyHoursBetween(at(2026, 9, 30, 0, 0), at(2026, 9, 30, 15, 0), 5, win)).toBe(0);
  });
  it("el ritmo esperado no avanza fuera de la ventana", () => {
    const base = { total: 158, baseDone: 28, done: 28, startMs: at(2026, 9, 29, 12, 12), examDate: "2026-10-03", hoursPerDay: 5, windowFor: win };
    const a = computePlan({ ...base, nowMs: at(2026, 9, 30, 8, 0) }).expected;
    const b = computePlan({ ...base, nowMs: at(2026, 9, 30, 14, 0) }).expected;
    expect(b).toBeCloseTo(a, 6);
  });
});

describe("feasibility", () => {
  it("compara horas necesarias con las que quedan", () => {
    expect(feasibility({ remainingUnits: 600, minutesPerUnit: 0.5, hoursLeft: 6 })).toMatchObject({ needed: 5, ok: true });
    expect(feasibility({ remainingUnits: 600, minutesPerUnit: 0.5, hoursLeft: 4 }).ok).toBe(false);
  });
});
