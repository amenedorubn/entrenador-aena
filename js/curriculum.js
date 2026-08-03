// Estructura del curso, replicando el modelo de Duolingo:
//   MUNDO (sección) → UNIDAD (temática) → NIVEL/LECCIÓN (los círculos del camino)
// Cada mundo sube un nivel de dificultad (tier 1-5). Una lección se supera con ≥80 %
// de aciertos; superadas todas las lecciones de una unidad se gana su trofeo; superadas
// todas las unidades, el mundo queda completado y se desbloquea el siguiente.

export const PASS_THRESHOLD = 0.8;   // 80 % para dar una lección por superada
export const QUESTIONS_PER_LESSON = 10;
export const HEARTS = 5;

const U = (id, title, subtitle, sources, lessons = 5) => ({ id, title, subtitle, sources, lessons });

export const WORLDS = [
  {
    id: "w1", tier: 1, name: "Despegue", tagline: "Bases de aptitud e inglés B1",
    color: "#58cc02",
    units: [
      U("w1u1", "Vocabulario y series", "Sinónimos, antónimos e intrusos", ["verbal"], 4),
      U("w1u2", "Cálculo básico", "Series aritméticas, porcentajes y descuentos", ["num"], 4),
      U("w1u3", "Figuras y rotaciones", "Series de figuras con una sola regla", ["abs"], 4),
      U("w1u4", "English essentials", "Gramática B1 y primeras traducciones", ["grammar", "translate"], 4),
      U("w1u5", "Avisos de aeropuerto", "Listening: puertas, retrasos y mostradores", ["listen"], 4),
      U("w1u6", "Repaso del mundo 1", "Todo lo anterior mezclado", ["verbal", "num", "abs", "grammar"], 3),
    ],
  },
  {
    id: "w2", tier: 2, name: "Ascenso", tagline: "Reglas compuestas y competencias",
    color: "#1cb0f6",
    units: [
      U("w2u1", "Analogías y lógica", "Analogías, series de letras y silogismos", ["verbal"], 5),
      U("w2u2", "Proporciones y mezclas", "Series geométricas, % encadenados, edades", ["num"], 5),
      U("w2u3", "Doble transformación", "Rotación 45°, lados y relleno", ["abs"], 4),
      U("w2u4", "Competencias I", "Juicio situacional: equipo, cliente, seguridad", ["sjt"], 4),
      U("w2u5", "English B1+", "Condicionales, pasiva y producción escrita", ["grammar", "translate", "error"], 5),
      U("w2u6", "Repaso del mundo 2", "Todo lo anterior mezclado", ["verbal", "num", "abs", "sjt", "grammar"], 3),
    ],
  },
  {
    id: "w3", tier: 3, name: "Crucero", tagline: "Nivel examen · B2",
    color: "#ce82ff",
    units: [
      U("w3u1", "Léxico de oposición", "Vocabulario culto y deducción", ["verbal"], 5),
      U("w3u2", "Multi-paso", "×n+k, intercaladas, cuadrados y Fibonacci", ["num"], 5),
      U("w3u3", "Matrices 3×3", "Raven de una regla por fila y columna", ["abs"], 5),
      U("w3u4", "Probabilidad y combinatoria", "Casos favorables, permutaciones y grupos", ["num"], 4),
      U("w3u5", "Competencias II", "Situaciones con opciones más ambiguas", ["sjt"], 5),
      U("w3u6", "English B2", "Inversión, gerundios, relativos y writing", ["grammar", "translate", "error"], 5),
      U("w3u7", "Listening B2", "Avisos largos con varias condiciones", ["listen"], 4),
      U("w3u8", "Repaso del mundo 3", "Simulacro por bloques", ["verbal", "num", "abs", "sjt", "grammar", "listen"], 3),
    ],
  },
  {
    id: "w4", tier: 4, name: "Aproximación", tagline: "Por encima del examen · B2+",
    color: "#ff9600",
    units: [
      U("w4u1", "Vocabulario muy culto", "Nivel alto y series intercaladas", ["verbal"], 5),
      U("w4u2", "Series avanzadas", "Primos, operaciones alternas, 2ª diferencia", ["num"], 5),
      U("w4u3", "Interés y medias", "Interés compuesto, media ponderada, repartos", ["num"], 5),
      U("w4u4", "Atributos múltiples", "Figuras con 2-3 atributos a la vez", ["abs"], 5),
      U("w4u5", "Competencias III", "Integridad, liderazgo y adaptación", ["sjt"], 5),
      U("w4u6", "English B2+", "Inversiones, causativo y estructuras enfáticas", ["grammar", "translate", "error"], 5),
      U("w4u7", "Repaso del mundo 4", "Simulacro completo", ["verbal", "num", "abs", "sjt", "grammar", "translate", "listen"], 4),
    ],
  },
  {
    id: "w5", tier: 5, name: "Aterrizaje", tagline: "Nivel élite · C1",
    color: "#ff4b4b",
    units: [
      U("w5u1", "Lógica formal", "Silogismos y condicionales complejos", ["verbal"], 5),
      U("w5u2", "Problemas multi-paso", "Descuento + IVA, relojes, matrices numéricas", ["num"], 5),
      U("w5u3", "Combinatoria avanzada", "Anagramas, comités y probabilidad compuesta", ["num"], 5),
      U("w5u4", "Lógica figurativa", "Operaciones AND/OR/XOR sobre rejillas", ["abs"], 5),
      U("w5u5", "Competencias élite", "Dilemas con conflicto entre principios", ["sjt"], 5),
      U("w5u6", "English C1", "Inversión total, pasiva impersonal y writing", ["grammar", "translate", "error"], 5),
      U("w5u7", "Listening C1", "Avisos con matices y condiciones múltiples", ["listen"], 4),
      U("w5u8", "Examen final", "Todo, al máximo nivel", ["verbal", "num", "abs", "sjt", "grammar", "translate", "listen", "error"], 5),
    ],
  },
];

/** Lista plana de todas las lecciones en orden de camino. */
export function allLessons() {
  const out = [];
  WORLDS.forEach((w, wi) => {
    w.units.forEach((u, ui) => {
      for (let li = 0; li < u.lessons; li++) {
        out.push({
          key: `${u.id}l${li + 1}`,
          worldId: w.id, worldIndex: wi, worldName: w.name, tier: w.tier, color: w.color,
          unitId: u.id, unitIndex: ui, unitTitle: u.title, unitSubtitle: u.subtitle,
          lessonIndex: li, lessonsInUnit: u.lessons, sources: u.sources,
        });
      }
    });
  });
  return out;
}

export const LESSONS = allLessons();
export const TOTAL_LESSONS = LESSONS.length;

/** ¿Está superada esta lección? `progress` es el objeto {lessonKey: bestPct}. */
export function isPassed(progress, key) {
  return (progress[key] ?? 0) >= PASS_THRESHOLD * 100;
}

/**
 * Una lección está desbloqueada si es la primera o si la anterior está superada.
 * Devuelve "done" | "current" | "locked".
 */
export function lessonState(progress, index) {
  const l = LESSONS[index];
  if (isPassed(progress, l.key)) return "done";
  if (index === 0) return "current";
  return isPassed(progress, LESSONS[index - 1].key) ? "current" : "locked";
}

/** Índice de la primera lección no superada (dónde está el usuario ahora). */
export function currentLessonIndex(progress) {
  const i = LESSONS.findIndex((l) => !isPassed(progress, l.key));
  return i === -1 ? LESSONS.length - 1 : i;
}

/** Progreso de una unidad: {done, total, complete}. */
export function unitProgress(progress, unitId) {
  const ls = LESSONS.filter((l) => l.unitId === unitId);
  const done = ls.filter((l) => isPassed(progress, l.key)).length;
  return { done, total: ls.length, complete: done === ls.length };
}

/** Progreso de un mundo: unidades completadas y % global. */
export function worldProgress(progress, worldId) {
  const w = WORLDS.find((x) => x.id === worldId);
  const units = w.units.map((u) => unitProgress(progress, u.id));
  const done = units.filter((u) => u.complete).length;
  const lessonsDone = units.reduce((a, u) => a + u.done, 0);
  const lessonsTotal = units.reduce((a, u) => a + u.total, 0);
  return { unitsDone: done, unitsTotal: w.units.length, complete: done === w.units.length, lessonsDone, lessonsTotal };
}

/** Un mundo está desbloqueado si es el primero o el anterior está completo. */
export function worldUnlocked(progress, worldIndex) {
  if (worldIndex === 0) return true;
  return worldProgress(progress, WORLDS[worldIndex - 1].id).complete;
}

export function totalPassed(progress) {
  return LESSONS.filter((l) => isPassed(progress, l.key)).length;
}
