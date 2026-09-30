import { describe, it, expect } from "vitest";
import {
  median, pushEntry, LOG_CAP, summary, speedBuckets, bySource, byCategory, byDay, sessions, speedTrend, estimate, realPaceSPerQ,
  downsample, cumulativeSeries, rollingMedianS, rollingAcc, dayTicks,
} from "../js/stats.js";

const NOW = new Date(2026, 9, 1, 15, 0).getTime();
const e = (over = {}) => ({ t: NOW, ms: 20000, ok: 1, src: "num", cat: "real-series_numeros", r: 1, s: NOW - 600000, ...over });

describe("stats", () => {
  it("mediana", () => {
    expect(median([])).toBe(0);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("el registro respeta el tope", () => {
    let log = [];
    for (let i = 0; i < LOG_CAP + 5; i++) log = pushEntry(log, e({ t: i }));
    expect(log).toHaveLength(LOG_CAP);
    expect(log.at(-1).t).toBe(LOG_CAP + 4);
  });

  it("resumen: aciertos ignoran las reportadas y cuenta hoy", () => {
    const es = [e(), e({ ok: 0 }), e({ ok: 0, x: 1 }), e({ t: NOW - 3 * 86400000 })];
    const s = summary(es, NOW);
    expect(s.total).toBe(4);
    expect(s.today).toBe(3);
    expect(s.last7).toBe(4);
    expect(s.acc).toBeCloseTo(2 / 3);
  });

  it("reparte rápidas, normales y lentas", () => {
    expect(speedBuckets([e({ ms: 5000 }), e({ ms: 30000 }), e({ ms: 90000 }), e({ ms: 14000 })])).toEqual({ fast: 2, mid: 1, slow: 1 });
  });

  it("agrupa por bloque y por categoría con mínimo", () => {
    const es = [e(), e(), e(), e({ src: "abs", cat: "real-relojes", ms: 60000 })];
    expect(bySource(es).map((r) => [r.key, r.n])).toEqual([["num", 3], ["abs", 1]]);
    expect(byCategory(es, 3).map((r) => r.key)).toEqual(["real-series_numeros"]);
  });

  it("por día devuelve 7 días y hoy al final", () => {
    const d = byDay([e(), e({ t: NOW - 86400000 })], NOW, 7);
    expect(d).toHaveLength(7);
    expect(d.at(-1).n).toBe(1);
    expect(d.at(-2).n).toBe(1);
  });

  it("sesiones: ritmo de reloj con explicaciones", () => {
    const s0 = NOW - 600000;
    const es = [0, 1, 2, 3].map((i) => e({ s: s0, t: s0 + (i + 1) * 60000 }));
    const [s] = sessions(es);
    expect(s.n).toBe(4);
    expect(s.wallS).toBe(240);
    expect(s.sPerQ).toBe(60);
    expect(realPaceSPerQ(es)).toBe(60);
  });

  it("tendencia necesita 20 respuestas y mide el cambio", () => {
    expect(speedTrend([e()])).toBeNull();
    const es = [...Array(10).fill(0).map(() => e({ ms: 40000 })), ...Array(10).fill(0).map(() => e({ ms: 20000 }))];
    expect(speedTrend(es).delta).toBe(-20);
  });

  it("estimación compara con las horas disponibles", () => {
    const s0 = NOW - 600000;
    const es = [0, 1, 2, 3].map((i) => e({ s: s0, t: s0 + (i + 1) * 60000 })); // 60 s/pregunta
    const est = estimate(es, 120, 3);
    expect(est.hours).toBeCloseTo(2);
    expect(est.qPerHour).toBeCloseTo(60);
    expect(est.slackHours).toBeCloseTo(1);
    expect(estimate([], 10)).toBeNull();
  });

  it("series: acumulada, móviles y submuestreo", () => {
    const es = Array.from({ length: 30 }, (_, i) => e({ t: NOW + i * 1000, ms: (i < 15 ? 40000 : 20000), ok: i < 15 ? 0 : 1 }));
    expect(cumulativeSeries(es).at(-1).n).toBe(30);
    const rm = rollingMedianS(es, 10);
    expect(rm).toHaveLength(21);
    expect(rm[0].v).toBe(40);
    expect(rm.at(-1).v).toBe(20);
    expect(rollingAcc(es, 10).at(-1).v).toBe(1);
    const ds = downsample(Array.from({ length: 500 }, (_, i) => i), 50);
    expect(ds).toHaveLength(50);
    expect([ds[0], ds.at(-1)]).toEqual([0, 499]);
  });

  it("marcas de día: medianoches dentro del rango y con tope", () => {
    const t0 = new Date(2026, 8, 25, 10).getTime();
    const t1 = new Date(2026, 9, 5, 10).getTime();
    const ticks = dayTicks(t0, t1, 5);
    expect(ticks.length).toBeLessThanOrEqual(5);
    expect(new Date(ticks[0]).getHours()).toBe(0);
  });

  it("una sesión abierta horas no infla el ritmo real", () => {
    const s0 = NOW - 36e5 * 5;
    const ok = [0, 1, 2, 3].map((i) => e({ s: s0 + 1e6, t: s0 + 1e6 + (i + 1) * 30000 })); // 30 s/preg
    const left = [0, 1, 2].map((i) => e({ s: s0, t: s0 + 4 * 36e5 + i * 1000 }));           // 4 h abierta
    expect(realPaceSPerQ([...left, ...ok])).toBe(30);
  });
});
