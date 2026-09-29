// Ritmo objetivo hasta el examen: cuánto deberías llevar ahora para terminar TODO a tiempo.
// Modelo explícito:
//   - Cada día tiene una ventana de estudio [inicio, fin] (horas decimales, hora local) y
//     unas horas de estudio efectivas dentro de ella. Por defecto 09:00-22:00.
//   - El avance esperado es lineal en horas de estudio efectivas acumuladas entre el
//     punto de partida y el examen. Fuera de ventana (trabajo, comidas, sueño) no avanza.
//   - Se parte de `baseDone` unidades hechas en `startMs`; la meta es `total` al examen.
// `hoursPerDay` y `windowFor` pueden ser fijos o funciones(Date del día).

export const DEFAULT_WINDOW = [9, 22];
export const EXAM_HOUR = 8;

/** Milisegundos del examen para un `YYYY-MM-DD` (08:00 hora local). */
export function examMs(examDate) {
  const [y, m, d] = examDate.split("-").map(Number);
  return new Date(y, m - 1, d, EXAM_HOUR, 0, 0, 0).getTime();
}

const val = (x, day) => (typeof x === "function" ? x(new Date(day)) : x);
const atHour = (day, h) => { const d = new Date(day); d.setHours(0, 0, 0, 0); return d.getTime() + h * 36e5; };

/** Horas de estudio efectivas entre a y b (ms). */
export function studyHoursBetween(a, b, hoursPerDay, windowFor = DEFAULT_WINDOW) {
  if (b <= a) return 0;
  let total = 0;
  const day = new Date(a);
  day.setHours(0, 0, 0, 0);
  for (; day.getTime() < b; day.setDate(day.getDate() + 1)) {
    const [s, e] = val(windowFor, day);
    const ws = atHour(day, s), we = atHour(day, e);
    const overlap = Math.min(b, we) - Math.max(a, ws);
    if (overlap > 0) total += (overlap / 36e5 / (e - s)) * val(hoursPerDay, day);
  }
  return total;
}

/** Horas de una jornada típica: media de los días con hueco entre a y b. */
function typicalDayHours(a, b, hoursPerDay) {
  const day = new Date(a); day.setHours(0, 0, 0, 0);
  let sum = 0, n = 0;
  for (; day.getTime() < b; day.setDate(day.getDate() + 1)) {
    const h = val(hoursPerDay, day);
    if (h > 0) { sum += h; n++; }
  }
  return n ? sum / n : 1;
}

/**
 * @returns {{expected:number, remaining:number, hoursLeft:number, perHour:number, perDay:number, ahead:number}}
 *  expected: unidades que deberías llevar ahora (fraccionario)
 *  ahead: hechas - esperadas (positivo = vas por delante)
 */
export function computePlan({ total, done, baseDone, startMs, nowMs, examDate, hoursPerDay, windowFor = DEFAULT_WINDOW }) {
  const end = examMs(examDate);
  const totalHours = studyHoursBetween(startMs, end, hoursPerDay, windowFor);
  const usedHours = studyHoursBetween(startMs, Math.min(nowMs, end), hoursPerDay, windowFor);
  const frac = totalHours > 0 ? Math.min(1, usedHours / totalHours) : 1;
  const expected = baseDone + (total - baseDone) * frac;
  const hoursLeft = studyHoursBetween(Math.max(nowMs, startMs), end, hoursPerDay, windowFor);
  const remaining = Math.max(0, total - done);
  return {
    expected,
    remaining,
    hoursLeft,
    perHour: hoursLeft > 0 ? remaining / hoursLeft : Infinity,
    // Por jornada "típica" (media de los días con hueco).
    perDay: hoursLeft > 0 ? remaining / Math.max(0.01, hoursLeft / typicalDayHours(nowMs, end, hoursPerDay)) : Infinity,
    ahead: done - expected,
  };
}

/**
 * ¿Da tiempo? Compara las horas que hacen falta al ritmo real medido (minutos por
 * unidad) con las horas de estudio que quedan.
 */
export function feasibility({ remainingUnits, minutesPerUnit, hoursLeft }) {
  const needed = (remainingUnits * minutesPerUnit) / 60;
  return { needed, hoursLeft, gap: hoursLeft - needed, ok: hoursLeft >= needed };
}
