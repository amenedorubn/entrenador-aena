// Estadísticas de ritmo a partir del registro de respuestas (store.answerLog).
// Funciones puras: reciben las entradas y `now`, no tocan DOM ni localStorage.
//
// Entrada del registro: { t, ms, ok, src, cat, r, s, x }
//   t    instante de la respuesta (ms epoch)
//   ms   segundos de pensar hasta pulsar "Comprobar", en ms (ya recortado a MAX_MS)
//   ok   1 acierto, 0 fallo
//   src  fuente del curso (verbal, num, abs, sjt, grammar...)
//   cat  categoría real (series_numeros, relojes...) o familia del generador
//   r    1 si es pregunta real de examen, 0 si es generada
//   s    id de sesión (instante de inicio de la sesión)
//   x    1 si se reportó y no cuenta como fallo (se ignora en aciertos)

export const MAX_MS = 5 * 60 * 1000;   // una pregunta abierta más de 5 min es un descanso, no ritmo
export const LOG_CAP = 4000;
export const FAST_S = 15;
export const SLOW_S = 45;

export function median(nums) {
  if (!nums.length) return 0;
  const a = [...nums].sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
const mean = (nums) => (nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0);
const graded = (es) => es.filter((e) => !e.x);
const accOf = (es) => { const g = graded(es); return g.length ? g.filter((e) => e.ok).length / g.length : null; };

const startOfDay = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** Añade una entrada respetando el tope del registro. */
export function pushEntry(log, entry) {
  const next = [...log, entry];
  return next.length > LOG_CAP ? next.slice(next.length - LOG_CAP) : next;
}

export function summary(es, now) {
  const day0 = startOfDay(now);
  const secs = es.map((e) => e.ms / 1000);
  return {
    total: es.length,
    acc: accOf(es),
    medS: median(secs),
    meanS: mean(secs),
    today: es.filter((e) => e.t >= day0).length,
    last7: es.filter((e) => e.t >= day0 - 6 * 86400000).length,
    activeS: secs.reduce((t, x) => t + x, 0),
    fastS: secs.length ? Math.min(...secs) : 0,
    slowS: secs.length ? Math.max(...secs) : 0,
  };
}

/** Reparto de preguntas por tiempo de respuesta: rápidas, normales y lentas. */
export function speedBuckets(es) {
  const b = { fast: 0, mid: 0, slow: 0 };
  for (const e of es) {
    const s = e.ms / 1000;
    if (s < FAST_S) b.fast++; else if (s < SLOW_S) b.mid++; else b.slow++;
  }
  return b;
}

function groupBy(es, keyFn) {
  const m = new Map();
  for (const e of es) {
    const k = keyFn(e);
    if (k == null) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(e);
  }
  return m;
}

const row = (key, es) => ({ key, n: es.length, acc: accOf(es), medS: median(es.map((e) => e.ms / 1000)) });

export function bySource(es) {
  return [...groupBy(es, (e) => e.src)].map(([k, v]) => row(k, v)).sort((a, b) => b.n - a.n);
}

/** Categorías con al menos `min` respuestas, de más lenta a más rápida (mediana). */
export function byCategory(es, min = 3) {
  return [...groupBy(es, (e) => e.cat)].filter(([, v]) => v.length >= min)
    .map(([k, v]) => row(k, v)).sort((a, b) => b.medS - a.medS);
}

export function byOrigin(es) {
  return { real: row("real", es.filter((e) => e.r)), gen: row("gen", es.filter((e) => !e.r)) };
}

/** Últimos `days` días (el último es hoy): preguntas, aciertos y segundos por pregunta. */
export function byDay(es, now, days = 7) {
  const day0 = startOfDay(now);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const from = day0 - i * 86400000; // ojo: suficiente para barras; los cambios de hora no importan aquí
    const to = from + 86400000;
    const d = es.filter((e) => e.t >= from && e.t < to);
    out.push({ day: new Date(from), n: d.length, acc: accOf(d), medS: median(d.map((e) => e.ms / 1000)) });
  }
  return out;
}

/** Sesiones más recientes (más nuevas primero). `wallS` incluye leer explicaciones. */
export function sessions(es, last = 10) {
  const groups = groupBy(es, (e) => e.s);
  return [...groups].map(([s, v]) => {
    const end = Math.max(...v.map((e) => e.t));
    const wallS = Math.max(1, (end - s) / 1000);
    return { start: s, n: v.length, acc: accOf(v), medS: median(v.map((e) => e.ms / 1000)), wallS, sPerQ: wallS / v.length };
  }).sort((a, b) => b.start - a.start).slice(0, last);
}

export function byDaypart(es) {
  const part = (h) => (h < 6 ? "Madrugada" : h < 12 ? "Mañana" : h < 18 ? "Tarde" : "Noche");
  const order = ["Mañana", "Tarde", "Noche", "Madrugada"];
  return [...groupBy(es, (e) => part(new Date(e.t).getHours()))]
    .map(([k, v]) => row(k, v)).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

/** Tendencia de velocidad: mediana de la primera mitad vs la segunda (negativo = más rápido). */
export function speedTrend(es) {
  if (es.length < 20) return null;
  const secs = es.map((e) => e.ms / 1000);
  const h = secs.length >> 1;
  const a = median(secs.slice(0, h)), b = median(secs.slice(h));
  return { from: a, to: b, delta: b - a };
}

/**
 * Segundos por pregunta "de verdad": tiempo de reloj de las sesiones recientes (con
 * explicaciones y pausas cortas) dividido entre sus preguntas. Si aún no hay sesiones,
 * cae a la mediana de respuesta más un margen fijo de lectura.
 */
export function realPaceSPerQ(es) {
  // Una sesión dejada abierta horas (sPerQ enorme) no es ritmo de estudio: se descarta.
  const ss = sessions(es, 8).filter((s) => s.n >= 3 && s.sPerQ <= 240);
  if (ss.length) return ss.reduce((t, s) => t + s.wallS, 0) / ss.reduce((t, s) => t + s.n, 0);
  const recent = es.slice(-100);
  return recent.length ? median(recent.map((e) => e.ms / 1000)) + 10 : 0;
}

/**
 * Estimación: `questions` preguntas por delante a tu ritmo real, frente a las horas de
 * estudio disponibles (`availableHours`, puede ser null).
 */
export function estimate(es, questions, availableHours = null) {
  const sPerQ = realPaceSPerQ(es);
  if (!sPerQ) return null;
  const hours = (questions * sPerQ) / 3600;
  return {
    sPerQ, qPerHour: 3600 / sPerQ, questions, hours,
    availableHours,
    slackHours: availableHours == null ? null : availableHours - hours,
  };
}

/** Reduce una serie a como mucho `max` puntos (conserva siempre el primero y el último). */
export function downsample(arr, max = 120) {
  if (arr.length <= max) return arr;
  const out = [];
  for (let i = 0; i < max; i++) out.push(arr[Math.round((i * (arr.length - 1)) / (max - 1))]);
  return out;
}

/** Respondidas acumuladas en el tiempo: [{ t, n }]. */
export function cumulativeSeries(es) {
  return es.map((e, i) => ({ t: e.t, n: i + 1 }));
}

/**
 * Serie móvil sobre las últimas `win` respuestas: fn(ventana) -> valor. Devuelve
 * [{ i, t, v }] (i = nº de respuesta, empezando en `win >> 1` para no dibujar ruido).
 */
export function rollingSeries(es, win, fn) {
  const out = [];
  for (let i = Math.min(win, es.length) - 1; i < es.length; i++) {
    const w = es.slice(Math.max(0, i - win + 1), i + 1);
    out.push({ i: i + 1, t: es[i].t, v: fn(w) });
  }
  return out;
}
export const rollingMedianS = (es, win = 10) => rollingSeries(es, win, (w) => median(w.map((e) => e.ms / 1000)));
export const rollingAcc = (es, win = 20) => rollingSeries(es, win, (w) => accOf(w) ?? 0);

/** Marcas de medianoche entre t0 y t1 (como mucho `max`, repartidas). */
export function dayTicks(t0, t1, max = 5) {
  const all = [];
  for (let d = startOfDay(t0) + 86400000; d < t1; d += 86400000) all.push(d);
  if (all.length <= max) return all;
  const step = Math.ceil(all.length / max);
  return all.filter((_, i) => i % step === 0);
}
