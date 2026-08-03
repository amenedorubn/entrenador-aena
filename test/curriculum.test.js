import { describe, it, expect } from "vitest";
import {
  WORLDS, LESSONS, PASS_THRESHOLD, isPassed, lessonState,
  currentLessonIndex, unitProgress, worldProgress, worldUnlocked, totalPassed,
} from "../js/curriculum.js";
import { SOURCES } from "../js/content.js";

describe("estructura del curso", () => {
  it("tiene 5 mundos de dificultad creciente", () => {
    expect(WORLDS).toHaveLength(5);
    WORLDS.forEach((w, i) => expect(w.tier).toBe(i + 1));
  });

  it("los ids de mundo, unidad y lección son únicos", () => {
    const wIds = WORLDS.map((w) => w.id);
    expect(new Set(wIds).size).toBe(wIds.length);
    const uIds = WORLDS.flatMap((w) => w.units.map((u) => u.id));
    expect(new Set(uIds).size).toBe(uIds.length);
    const lKeys = LESSONS.map((l) => l.key);
    expect(new Set(lKeys).size).toBe(lKeys.length);
  });

  it("toda unidad declara fuentes existentes y al menos 3 lecciones", () => {
    for (const w of WORLDS) {
      for (const u of w.units) {
        expect(u.lessons, u.id).toBeGreaterThanOrEqual(3);
        expect(u.sources.length, u.id).toBeGreaterThan(0);
        for (const s of u.sources) expect(Object.keys(SOURCES), `${u.id}: fuente "${s}"`).toContain(s);
      }
    }
  });

  it("da para practicar muchos días hasta el examen", () => {
    // ~60 días de preparación con margen para más de una sesión diaria.
    expect(LESSONS.length).toBeGreaterThanOrEqual(150);
  });
});

describe("desbloqueo y progreso", () => {
  const passAll = (n) => Object.fromEntries(LESSONS.slice(0, n).map((l) => [l.key, 100]));

  it("sin progreso, solo la primera lección está disponible", () => {
    const p = {};
    expect(lessonState(p, 0)).toBe("current");
    expect(lessonState(p, 1)).toBe("locked");
    expect(currentLessonIndex(p)).toBe(0);
  });

  it("superar una lección desbloquea la siguiente", () => {
    const p = passAll(3);
    expect(lessonState(p, 2)).toBe("done");
    expect(lessonState(p, 3)).toBe("current");
    expect(lessonState(p, 4)).toBe("locked");
    expect(currentLessonIndex(p)).toBe(3);
  });

  it("por debajo del umbral la lección no cuenta como superada", () => {
    const key = LESSONS[0].key;
    expect(isPassed({ [key]: PASS_THRESHOLD * 100 - 1 }, key)).toBe(false);
    expect(isPassed({ [key]: PASS_THRESHOLD * 100 }, key)).toBe(true);
  });

  it("una unidad se completa al superar todas sus lecciones", () => {
    const u = WORLDS[0].units[0];
    const p = passAll(u.lessons);
    const up = unitProgress(p, u.id);
    expect(up.done).toBe(u.total ?? u.lessons);
    expect(up.complete).toBe(true);
  });

  it("el segundo mundo se desbloquea solo al completar el primero", () => {
    expect(worldUnlocked({}, 0)).toBe(true);
    expect(worldUnlocked({}, 1)).toBe(false);
    const w1Lessons = WORLDS[0].units.reduce((a, u) => a + u.lessons, 0);
    const p = passAll(w1Lessons);
    expect(worldProgress(p, WORLDS[0].id).complete).toBe(true);
    expect(worldUnlocked(p, 1)).toBe(true);
  });

  it("totalPassed cuenta solo las superadas", () => {
    expect(totalPassed(passAll(7))).toBe(7);
    expect(totalPassed({})).toBe(0);
  });
});
