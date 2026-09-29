// Ritmo objetivo hasta el examen: cuántas lecciones deberías llevar ahora para terminar
// TODAS las del camino a tiempo. Modelo simple y explícito:
//   - Cada día se estudian `hoursPerDay` horas, repartidas de forma uniforme entre
//     las 09:00 y las 22:00 (el resto -dormir, trabajo, comidas, deporte- no cuenta).
//   - El examen es a las 08:00 del día del examen, así que ese día no suma horas.
//   - Se parte de `baseDone` lecciones hechas en el momento `startMs`; el objetivo es
//     `total` lecciones al llegar el examen, con avance lineal en horas de estudio.

export const STUDY_START_H = 9;
export const STUDY_END_H = 22;
export const EXAM_HOUR = 8;

/** Milisegundos del examen para un `YYYY-MM-DD` (08:00 hora local). */
export function examMs(examDate) {
  const [y, m, d] = examDate.split("-").map(Number);
  return new Date(y, m - 1, d, EXAM_HOUR, 0, 0, 0).getTime();
}

/** Horas de estudio "disponibles" entre a y b (ms), con `hoursPerDay` por día. */
export function studyHoursBetween(a, b, hoursPerDay) {
  if (b <= a) return 0;
  const span = STUDY_END_H - STUDY_START_H;
  let total = 0;
  const day = new Date(a);
  day.setHours(0, 0, 0, 0);
  for (; day.getTime() < b; day.setDate(day.getDate() + 1)) {
    const ws = new Date(day); ws.setHours(STUDY_START_H, 0, 0, 0);
    const we = new Date(day); we.setHours(STUDY_END_H, 0, 0, 0);
    const overlap = Math.min(b, we.getTime()) - Math.max(a, ws.getTime());
    if (overlap > 0) total += (overlap / 36e5 / span) * hoursPerDay;
  }
  return total;
}

/**
 * @returns {{expected:number, remaining:number, hoursLeft:number, perHour:number, perDay:number, ahead:number}}
 *  expected: lecciones que deberías llevar ahora (fraccionario)
 *  ahead: hechas - esperadas (positivo = vas por delante)
 */
export function computePlan({ total, done, baseDone, startMs, nowMs, examDate, hoursPerDay }) {
  const end = examMs(examDate);
  const totalHours = studyHoursBetween(startMs, end, hoursPerDay);
  const usedHours = studyHoursBetween(startMs, Math.min(nowMs, end), hoursPerDay);
  const frac = totalHours > 0 ? Math.min(1, usedHours / totalHours) : 1;
  const expected = baseDone + (total - baseDone) * frac;
  const hoursLeft = studyHoursBetween(Math.max(nowMs, startMs), end, hoursPerDay);
  const remaining = Math.max(0, total - done);
  return {
    expected,
    remaining,
    hoursLeft,
    perHour: hoursLeft > 0 ? remaining / hoursLeft : Infinity,
    perDay: hoursPerDay > 0 && hoursLeft > 0 ? remaining / (hoursLeft / hoursPerDay) : Infinity,
    ahead: done - expected,
  };
}
