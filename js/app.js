import {
  WORLDS, LESSONS, PASS_THRESHOLD, QUESTIONS_PER_LESSON, HEARTS,
  isPassed, lessonState, currentLessonIndex, unitProgress, worldProgress, worldUnlocked, totalPassed,
} from "./curriculum.js";
import { buildLesson, buildReviewLesson, makeItem, SOURCE_LABELS, SOURCES, setSeenIds, realCoverage, buildUnseenLesson, buildRealsOnlyLesson, buildEnglishBankLesson, englishBankCounts } from "./content.js";
import { renderQuestion, renderListenGroup, renderOptions, renderWordbank, markOptions, lockWordbank, speakItem, stopSpeech, optionText, transcriptText } from "./engine.js";
import { LEVELS as LISTEN_LEVELS, LEVEL_LABEL as LISTEN_LEVEL_LABEL } from "../data/listening.js";
import { SPEAKING_PROMPTS } from "../data/english.js";
import { LIKERT_SCALE, LIKERT_ITEMS, FORCED_CHOICE_ITEMS } from "../data/competencias.js";
import { loadReal, REAL } from "../data/real.js";
import { choice, shuffle } from "./rng.js";
import { APP_VERSION } from "./version.js";
import { createStudy } from "./study.js";
import { computePlan, feasibility, studyHoursBetween, examMs } from "./plan.js";
import * as stats from "./stats.js";
import { lineChart, columnChart, bindCharts } from "./charts.js";

/* ============================== almacenamiento ============================== */
const K = "aena2_";
const get = (k, d) => { try { const v = localStorage.getItem(K + k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const set = (k, v) => { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch { /* modo privado: la app sigue sin persistencia */ } };
const today = (d = new Date()) => d.toISOString().slice(0, 10);
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return today(d); };

const store = {
  get progress() { return get("progress", {}); },
  set progress(v) { set("progress", v); },
  get xp() { return get("xp", 0); },
  set xp(v) { set("xp", v); },
  get streak() { return get("streak", 0); },
  set streak(v) { set("streak", v); },
  get lastPlay() { return get("lastPlay", ""); },
  set lastPlay(v) { set("lastPlay", v); },
  get theme() { return get("theme", "auto"); },
  set theme(v) { set("theme", v); },
  get heartsOn() { return get("heartsOn", true); },
  set heartsOn(v) { set("heartsOn", v); },
  get examDate() { return get("examDate", "2026-10-03"); },
  set examDate(v) { set("examDate", v); },
  get practiceTier() { return get("practiceTier", 3); },
  set practiceTier(v) { set("practiceTier", v); },
  // Nivel de listening fijado en Práctica libre ("any" = por tier, como el resto de
  // fuentes; "A".."D" fija el nivel exacto sin importar el tier -- ver Tarea 3).
  get listenLevel() { return get("listenLevel", "any"); },
  set listenLevel(v) { set("listenLevel", v); },
  // Filtro de origen (Tarea 1): "todas" | "oficial" | "generada". Persistente, un único
  // valor compartido por el selector de Práctica libre y el de Ajustes. Se aplica al
  // camino (lecciones), Práctica libre y Repasar fallos por igual -- ver makeItem().
  get origenFilter() { return get("origenFilter", "todas"); },
  set origenFilter(v) { set("origenFilter", v); },
  // Ids de preguntas REALES falladas la última vez que se sirvieron, para "Repasar
  // fallos". Se quita un id en cuanto se responde bien (refleja lo que sigue
  // pendiente, no un historial de todo lo que alguna vez se falló).
  // Banco de "Inglés oficial" elegido en Práctica libre ("b1" | "b2" | "all") y si solo
  // se sirven las falladas ("all" | "missed").
  get engBank() { return get("engBank", "b1"); },
  set engBank(v) { set("engBank", v); },
  get engMode() { return get("engMode", "all"); },
  set engMode(v) { set("engMode", v); },
  get missedIds() { return get("missedIds", []); },
  set missedIds(v) { set("missedIds", v); },
  // Preguntas reales que el propio usuario marcó con "Reportar fallo" tras responder.
  // [{ id, ts, motivo, elegida, imgOk, prompt, auto }]. Solo se guarda una vez por id
  // (reportar dos veces actualiza el registro). `prompt` es una copia del enunciado para
  // poder recordar de qué iba aunque el banco cambie; `imgOk` false = la imagen no cargó;
  // `auto` = lo registró la app al detectar la imagen rota, sin intervención del usuario.
  get reportedIds() { return get("reportedIds", []); },
  set reportedIds(v) { set("reportedIds", v); },
  // Horas de estudio reales al día (sin dormir/trabajo/comidas/deporte); base del ritmo
  // objetivo de la barra lateral del camino. Ver js/plan.js.
  get studyHours() { return get("studyHours", 5); },
  set studyHours(v) { set("studyHours", v); },
  // Excepciones por día: { "YYYY-MM-DD": horas }. Lo que no esté aquí usa studyHours.
  get studyDays() { return get("studyDays", {}); },
  set studyDays(v) { set("studyDays", v); },
  // Ids de preguntas reales ya respondidas alguna vez (para el contador de cobertura).
  get seenIds() { return get("seenIds", []); },
  set seenIds(v) { set("seenIds", v); },
  // Minutos por pregunta de las últimas sesiones: calibra cuánto tardas de verdad.
  get qMins() { return get("qMins", []); },
  set qMins(v) { set("qMins", v); },
  // Registro de cada respuesta (hora, tiempo, acierto, fuente...) para la pestaña Stats.
  // Formato y tope en js/stats.js.
  get answerLog() { return get("answerLog", []); },
  set answerLog(v) { set("answerLog", v); },
};

/* ============================== utilidades DOM ============================== */
const $ = (id) => document.getElementById(id);
const SCREENS = ["path", "practice", "speaking", "profile", "stats", "settings", "quality", "lesson", "results", "competencias", "study"];
const NAV_SCREENS = new Set(["path", "practice", "speaking", "profile", "stats", "settings"]);

function show(name) {
  SCREENS.forEach((s) => $(`screen-${s}`).classList.toggle("active", s === name));
  $("bottomnav").classList.toggle("hidden", !NAV_SCREENS.has(name));
  document.querySelectorAll(".navbtn").forEach((b) =>
    b.setAttribute("aria-current", b.dataset.nav === name ? "page" : "false"));
  window.scrollTo(0, 0);
}

/* ============================== tema ============================== */
const media = window.matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
  const t = store.theme;
  const dark = t === "dark" || (t === "auto" && media.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelectorAll("#theme-picker button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.themeSet === t)));
}
media.addEventListener("change", () => { if (store.theme === "auto") applyTheme(); });

/* ============================== cuenta atrás ============================== */
function daysLeft() {
  const target = new Date(`${store.examDate}T09:00:00`);
  return Math.max(0, Math.ceil((target - new Date()) / 86400000));
}

/* ============================== ritmo hasta el examen ============================== */
// Punto de partida del plan: martes 29/9/2026 12:12, con todo lo anterior a w2u2 hecho.
const PLAN_START_MS = new Date(2026, 8, 29, 12, 12).getTime();
const PLAN_BASE_DONE = LESSONS.findIndex((l) => l.unitId === "w2u2");

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// Compromiso del usuario para la semana del examen: estudia en cualquier hueco (también
// en horas de trabajo, comidas y desplazamientos). Ventana [inicio, fin] en horas locales
// decimales (despierto y sin correr/dormir) y horas de estudio efectivas dentro de ella.
// Suman 26,5 h: lo que hace falta a ~45 s por pregunta para camino + reales (~25 h).
// El viernes acaba a las 20:00 (cena fuera 20:30) -> el 100 % queda antes de dormir.
const STUDY_WINDOWS = {
  "2026-09-29": [12.2, 21.5], // mar: desde ahora hasta la cena
  "2026-09-30": [8, 20.5],    // mié: tras el rodaje y el desayuno, hasta la cena adelantada
  "2026-10-01": [8, 21],      // jue: oficina + tarde
  "2026-10-02": [8, 20],      // vie: oficina + tarde, hasta salir a cenar
};
const STUDY_HOURS = { "2026-09-29": 6, "2026-09-30": 7, "2026-10-01": 7, "2026-10-02": 6.5 };
const windowForDay = (d) => STUDY_WINDOWS[dayKey(d)] ?? [9, 22];
const defaultHoursForDay = (d) => STUDY_HOURS[dayKey(d)] ?? store.studyHours;
const hoursForDay = (d) => { const o = store.studyDays[dayKey(d)]; return Number.isFinite(o) ? o : defaultHoursForDay(d); };

function currentPlan(progress) {
  return computePlan({
    total: LESSONS.length, done: totalPassed(progress), baseDone: PLAN_BASE_DONE,
    startMs: PLAN_START_MS, nowMs: Date.now(), examDate: store.examDate, hoursPerDay: hoursForDay, windowFor: windowForDay,
  });
}

// Botón flotante fijo arriba del camino (siempre visible al hacer scroll) + detalle al pulsarlo.
function paintPlanPill(plan, done) {
  const total = LESSONS.length;
  const gap = Math.round(plan.ahead);
  const state = gap >= 0 ? "ok" : gap > -6 ? "warn" : "bad";
  const pill = $("plan-pill");
  if (done >= total) {
    // Meta cumplida: el 100 % del camino es el objetivo; lo que sobre de tiempo, repaso.
    pill.className = "plan-pill plan-pill--ok";
    pill.textContent = `✓ 100 % · ${total}/${total}`;
    $("plan-pop").innerHTML = `<b>¡Has visto todo el camino!</b>
      <div class="plan-pop__muted">Con el tiempo que quede: repasa lo que has fallado.</div>
      <button type="button" class="btn btn--green btn--wide" data-go="review">Repasar fallos</button>`;
    return;
  }
  pill.className = `plan-pill plan-pill--${state}`;
  pill.textContent = `${gap >= 0 ? "▲ +" : "▼ "}${gap} · ${done}/${total}`;
  const verdict = gap >= 0
    ? `Vas ${gap === 0 ? "al día" : `${gap} lección${gap === 1 ? "" : "es"} por delante`} ✓`
    : `Vas ${-gap} lección${gap === -1 ? "" : "es"} por detrás`;
  const pace = Number.isFinite(plan.perHour)
    ? `Te quedan ${plan.remaining} lecciones en ~${Math.round(plan.hoursLeft)} h de estudio: ${plan.perHour.toFixed(1)} por hora (${Math.ceil(plan.perDay)} en un día típico).`
    : plan.remaining ? "Ya no quedan horas de estudio antes del examen." : "¡Camino completo!";
  $("plan-pop").innerHTML = `<b>${verdict}</b>
    <div>Deberías ir por la lección <b>${Math.round(plan.expected)}</b> ahora mismo; vas por la ${done}.</div>
    <div class="plan-pop__muted">${pace}</div>
    ${coverageHtml(plan, done)}
    ${dailyTargetsHtml()}
    <button type="button" class="btn btn--green btn--wide" data-go="current">Ir a mi lección</button>
    <button type="button" class="btn btn--ghost btn--wide" data-go="target">Ir al objetivo</button>`;
}

function refreshPlan() {
  const progress = store.progress;
  const plan = currentPlan(progress);
  const done = totalPassed(progress);
  paintPlanPill(plan, done);
  paintRail($("path"), plan, done);
}

// Barra vertical pegada al borde: relleno hasta el nodo actual y marca "objetivo" en el
// nodo que tocaría ahora. Se alinea con los nodos reales (medidos), así que solo puede
// pintarse con el camino visible (con display:none todos los rects son 0): por eso se
// llama tras show("path") y no dentro de renderPath.
function paintRail(container, plan, done) {
  container.querySelector(".rail")?.remove();
  const nodes = [...container.querySelectorAll(".node[data-lesson]")];
  if (!nodes.length || !container.offsetParent) return;
  const base = container.getBoundingClientRect().top - container.scrollTop;
  const y = (i) => {
    const r = nodes[Math.min(Math.max(i, 0), nodes.length - 1)].getBoundingClientRect();
    return r.top - base + r.height / 2;
  };
  const yAt = (v) => {
    const lo = Math.floor(v), hi = Math.min(lo + 1, nodes.length);
    return y(lo - 1) + (y(hi - 1) - y(lo - 1)) * (v - lo);
  };
  const top = y(0) - 20;
  const bottom = y(nodes.length - 1) + 20;
  const fillTo = done > 0 ? yAt(done) : top;
  const targetY = yAt(Math.min(Math.max(plan.expected, 1), nodes.length));
  const rail = document.createElement("div");
  rail.className = "rail";
  rail.setAttribute("aria-hidden", "true");
  rail.style.cssText = `top:${top}px;height:${bottom - top}px`;
  rail.innerHTML = `<div class="rail__fill" style="height:${Math.max(0, fillTo - top)}px"></div>
    <div class="rail__target" style="top:${targetY - top}px"><span>🎯</span></div>`;
  container.appendChild(rail);
  container.dataset.targetY = String(Math.round(targetY));
}

// Cobertura de reales + si da tiempo, con el ritmo real medido (min/pregunta).
function coverageHtml(plan, done) {
  const cov = realCoverage();
  const qs = store.qMins;
  const minPerQ = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : 0.7;
  const measured = qs.length >= 2;
  const lessonsLeft = Math.max(0, LESSONS.length - done);
  // Camino entero + las reales que aún no habrías visto (peor caso: aparte del camino).
  const f = feasibility({ remainingUnits: lessonsLeft * QUESTIONS_PER_LESSON + cov.unseen, minutesPerUnit: minPerQ, hoursLeft: plan.hoursLeft });
  const verdict = f.ok
    ? `✓ Da tiempo: necesitas ~${f.needed.toFixed(1)} h y tienes ${f.hoursLeft.toFixed(1)} h.`
    : `✗ Faltan ~${(-f.gap).toFixed(1)} h: necesitas ${f.needed.toFixed(1)} h y tienes ${f.hoursLeft.toFixed(1)} h.`;
  return `<div class="plan-pop__sep"></div>
    <div><b>Reales vistas:</b> ${cov.seen}/${cov.total}${cov.unseen ? ` · faltan ${cov.unseen}` : " ✓ todas"}</div>
    <div class="plan-pop__muted">${verdict} Ritmo ${measured ? "medido" : "supuesto"}: ${Math.round(minPerQ * 60)} s por pregunta.</div>
    ${cov.unseen ? '<button type="button" class="btn btn--ghost btn--wide" data-go="unseen">Ver reales pendientes</button>' : ""}`;
}

// Objetivos al cierre de cada ventana de estudio que queda: lecciones y reales vistas que
// deberías llevar para llegar al 100 % de ambas el viernes a las 20:00.
function dailyTargetsHtml() {
  const now = Date.now();
  const cov = realCoverage();
  const DIAS_L = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const rows = [];
  for (const k of Object.keys(STUDY_WINDOWS).sort()) {
    const [y, m, d] = k.split("-").map(Number);
    const end = new Date(y, m - 1, d, 0, 0, 0).getTime() + STUDY_WINDOWS[k][1] * 36e5;
    if (end <= now) continue;
    const common = { startMs: PLAN_START_MS, nowMs: end, examDate: store.examDate, hoursPerDay: hoursForDay, windowFor: windowForDay };
    const les = computePlan({ ...common, total: LESSONS.length, done: 0, baseDone: PLAN_BASE_DONE });
    const rea = computePlan({ ...common, total: cov.total, done: 0, baseDone: 0 });
    const hh = String(Math.floor(STUDY_WINDOWS[k][1])).padStart(2, "0");
    const mm = STUDY_WINDOWS[k][1] % 1 ? "30" : "00";
    rows.push(`<div class="plan-pop__row"><span>${DIAS_L[new Date(y, m - 1, d).getDay()]} ${hh}:${mm}</span><b>${Math.min(LESSONS.length, Math.ceil(les.expected))}/${LESSONS.length} · ${Math.min(cov.total, Math.ceil(rea.expected))}/${cov.total} reales</b></div>`);
  }
  if (!rows.length) return "";
  return `<div class="plan-pop__sep"></div><div class="plan-pop__muted">Objetivo al cerrar cada día (lecciones · reales):</div>${rows.join("")}`;
}

/* ============================== camino ============================== */
function renderPath() {
  const progress = store.progress;
  const container = $("path");
  const current = currentLessonIndex(progress);
  let html = "";
  let flat = 0;

  WORLDS.forEach((w, wi) => {
    const unlocked = worldUnlocked(progress, wi);
    const wp = worldProgress(progress, w.id);
    html += `<div class="world-divider">Mundo ${wi + 1}</div>
      <div class="world-header">
        <div class="world-header__name">${w.name} ${wp.complete ? "🏆" : ""}</div>
        <div class="world-header__tag">${w.tagline} · nivel ${w.tier}</div>
        ${unlocked
          ? `<div class="world-header__lock">${wp.lessonsDone}/${wp.lessonsTotal} lecciones · ${wp.unitsDone}/${wp.unitsTotal} unidades</div>`
          : `<div class="world-header__lock">🔒 Completa el mundo ${wi} para desbloquearlo</div>`}
      </div>`;

    w.units.forEach((u, ui) => {
      const up = unitProgress(progress, u.id);
      const isListenUnit = u.sources.length === 1 && u.sources[0] === "listen";
      const skipped = up.skipped;
      const skipBtn = isListenUnit && !up.complete
        ? `<button type="button" class="btn btn--ghost" data-skip-unit="${u.id}" style="margin-top:8px;padding:6px 12px;min-height:0">${skipped ? "↩ Quitar salto (la unidad sigue pendiente)" : "⏭ Saltar unidad de sonido y volver luego"}</button>` : "";
      html += `<div class="unit-banner" style="background:${w.color}">
          <div>
            <div class="unit-banner__eyebrow">Mundo ${wi + 1} · Unidad ${ui + 1}</div>
            <div class="unit-banner__title">${u.title}</div>
            <div class="unit-banner__sub">${u.subtitle} · ${w.tier >= 5 ? "casi todo reales" : w.tier === 4 ? "mayoría de reales · última lección: solo reales" : "última lección: solo reales"}</div>
            ${skipBtn}
          </div>
          <div class="unit-banner__trophy" aria-label="${up.complete ? "Unidad completada" : `${up.done} de ${up.total} lecciones`}">${up.complete ? "🏆" : `${up.done}/${up.total}`}</div>
        </div>
        <div class="nodes">`;

      for (let li = 0; li < u.lessons; li++) {
        const idx = flat++;
        const l = LESSONS[idx];
        const state = unlocked ? lessonState(progress, idx) : "locked";
        const isCurrent = state === "current" && idx === current;
        const pct = progress[l.key] ?? 0;
        const icon = state === "done" ? "✓" : state === "locked" ? "🔒" : "⭐";
        const cls = state === "done" ? "node--done" : state === "locked" ? "node--locked" : "node--current";
        const label = `Mundo ${wi + 1}, unidad ${ui + 1}, lección ${li + 1}. ${state === "done" ? `Superada con ${pct}%` : state === "locked" ? "Bloqueada" : "Disponible"}`;
        html += `<div class="node-row" data-off="${idx % 8}"><div class="node-wrap">
            ${isCurrent ? '<span class="start-bubble">Empezar</span>' : ""}
            <button type="button" class="node ${cls}" data-lesson="${idx}" ${state === "locked" ? "disabled" : ""} aria-label="${label}">${icon}</button>
          </div></div>`;
      }

      html += `<div class="node-row" data-off="${(flat + 1) % 8}"><div class="node-wrap">
          <button type="button" class="node node--trophy ${up.complete ? "" : "node--locked"}" ${up.complete ? "" : "disabled"}
            data-trophy="${u.id}" aria-label="Trofeo de la unidad ${ui + 1}. ${up.complete ? "Conseguido" : "Bloqueado"}">${up.complete ? "🏆" : "🔒"}</button>
        </div></div></div>`;
    });
  });

  container.innerHTML = html;
  container.querySelectorAll("[data-lesson]").forEach((b) =>
    b.addEventListener("click", () => startLesson(Number(b.dataset.lesson))));
  container.querySelectorAll("[data-skip-unit]").forEach((b) =>
    b.addEventListener("click", () => {
      const prog = store.progress;
      const key = `skip:${b.dataset.skipUnit}`;
      if (prog[key]) delete prog[key]; else prog[key] = 1;
      store.progress = prog;
      renderPath();
    }));
  container.querySelectorAll("[data-trophy]").forEach((b) =>
    b.addEventListener("click", () => alert("¡Unidad completada! Sigue avanzando por el camino.")));

  refreshPlan();
  $("days").textContent = daysLeft();
  $("streak").textContent = store.streak;
  $("xp").textContent = store.xp;
  $("hearts-top").textContent = store.heartsOn ? HEARTS : "∞";

  // Deja a la vista la lección actual.
  const currentNode = container.querySelector(`[data-lesson="${current}"]`);
  if (currentNode) currentNode.scrollIntoView({ block: "center", behavior: "instant" });
}

/* ============================== sesión de lección ============================== */
const session = {
  items: [], i: 0, correct: 0, hearts: HEARTS,
  lessonIndex: null, practice: null, review: false, unseen: false, bank: null, blockIds: null, blockLabel: "", wrong: 0, failed: [], selection: null, answered: false, startedAt: 0,
  // Resultado de la pregunta en curso y cuántas se han perdonado por reportarlas (ver excuseWrong).
  verdict: null, excused: 0, itemStart: 0,
  // Página con varias preguntas del mismo audio: nº de ítems que ocupa, contenedores de opciones y respuestas.
  page: 1, groupBoxes: null, groupSel: [],
};

function startLesson(index) {
  const l = LESSONS[index];
  session.lessonIndex = index;
  session.practice = null;
  session.review = false; session.unseen = false; session.bank = null; session.blockIds = null;
  const isUnitFinal = l.lessonIndex === l.lessonsInUnit - 1;
  // La última lección de cada unidad es solo de preguntas reales (ignora el filtro de origen).
  const realsOnly = isUnitFinal ? buildRealsOnlyLesson(l.sources, l.tier, QUESTIONS_PER_LESSON) : [];
  session.items = realsOnly.length >= QUESTIONS_PER_LESSON
    ? realsOnly
    : buildLesson(l.sources, l.tier, QUESTIONS_PER_LESSON, { origenFilter: store.origenFilter });
  const tag = realsOnly.length >= QUESTIONS_PER_LESSON ? " · solo reales" : "";
  beginSession(`Mundo ${l.worldIndex + 1} · Unidad ${l.unitIndex + 1} · Lección ${l.lessonIndex + 1}${tag}`);
}

function startPractice(source, tier) {
  session.lessonIndex = null;
  session.practice = { source, tier };
  session.review = false; session.unseen = false; session.bank = null; session.blockIds = null;
  const opts = { origenFilter: store.origenFilter };
  if (source === "listen" && store.listenLevel !== "any") opts.level = store.listenLevel;
  session.items = buildLesson([source], tier, QUESTIONS_PER_LESSON, opts);
  const kicker = opts.level
    ? `Práctica libre · ${SOURCE_LABELS[source]} · ${LISTEN_LEVEL_LABEL[opts.level]}`
    : `Práctica libre · ${SOURCE_LABELS[source]} · nivel ${tier}`;
  beginSession(kicker);
}

/** Sesión de preguntas reales oficiales que aún no has visto (para llegar al 100 % de cobertura). */
function startUnseen(n = 10) {
  const items = buildUnseenLesson(n);
  if (!items.length) return;
  session.lessonIndex = null;
  session.practice = null;
  session.review = true; // sin vidas ni efecto en el camino
  session.unseen = true;
  session.bank = null; session.blockIds = null;
  session.items = items;
  beginSession(`Reales pendientes · ${items.length} pregunta${items.length === 1 ? "" : "s"}`);
}

/** Repasa exactamente las preguntas reales falladas la última vez (store.missedIds),
 *  sin límite de vidas -- el objetivo es verlas todas, no acertar una racha. */
function startReview() {
  const ids = store.missedIds;
  if (!ids.length) return;
  session.lessonIndex = null;
  session.practice = null;
  session.review = true;
  session.unseen = false;
  session.bank = null; session.blockIds = null;
  session.items = buildReviewLesson(ids);
  const n = session.items.length;
  beginSession(`Repasar fallos · ${n} pregunta${n === 1 ? "" : "s"}`);
}

/** Sesión del banco de inglés oficial (B1, B2 o ambos), entero o solo los fallos. */
function startEnglishBank() {
  const bank = store.engBank, onlyMissed = store.engMode === "missed";
  const items = buildEnglishBankLesson(bank, { onlyMissed, missedIds: store.missedIds });
  if (!items.length) return;
  session.lessonIndex = null;
  session.practice = null;
  session.review = true; // sin vidas ni efecto en el camino
  session.unseen = false;
  session.bank = bank; session.blockIds = null;
  session.items = items;
  const label = bank === "all" ? "Inglés B1 + B2" : `Inglés ${bank.toUpperCase()}`;
  beginSession(`${label}${onlyMissed ? " · solo fallos" : ""} · ${items.length} pregunta${items.length === 1 ? "" : "s"}`);
}

/** Examen de un tema del estudio: esas preguntas (ids) del banco elegido; al terminar se
 *  vuelve a la pantalla de estudio. */
function startEnglishBlock(ids, label) {
  const items = buildReviewLesson(ids);
  if (!items.length) return;
  session.lessonIndex = null;
  session.practice = null;
  session.review = true; // sin vidas ni efecto en el camino
  session.unseen = false;
  session.bank = store.engBank === "b2" ? "b2" : "b1";
  session.blockIds = ids; session.blockLabel = label;
  session.items = items;
  beginSession(`${label} · ${items.length} pregunta${items.length === 1 ? "" : "s"}`);
}

function beginSession(kicker) {
  session.i = 0; session.correct = 0; session.wrong = 0; session.failed = []; session.excused = 0; session.verdict = null; session.startedAt = Date.now();
  session.hearts = store.heartsOn && session.practice === null && !session.review ? HEARTS : Infinity;
  $("lesson-kicker").textContent = kicker;
  $("lesson-hearts").classList.toggle("hidden", session.hearts === Infinity);
  show("lesson");
  renderCurrentItem();
}

// Blindaje: un ítem "figure-real"/requiresAsset sin imagen resoluble nunca debería
// llegar aquí (content.js ya filtra status:"revision" del pool), pero si lo hace -por
// datos editados a mano tras el cifrado, por ejemplo- no se pinta: se sustituye por un
// ítem nuevo de la misma fuente/nivel y se avisa por consola. Tope de reintentos para
// no colgarse si una fuente entera queda sin ítems servibles.
function ensureRenderable(item) {
  let candidate = item;
  let guard = 0;
  while (candidate.kind === "figure-real" && !candidate.image && guard++ < 5) {
    console.warn(`[real] Ítem sin asset válido, se descarta: "${candidate.prompt?.slice(0, 80)}"`);
    candidate = makeItem(candidate.source, candidate.tier);
  }
  return candidate;
}

/** Por qué cada opción es buena o mala (preguntas con optionNotes); `mine` = índice elegido o null. */
function optionNotesHtml(item, mine) {
  const rows = item.options.map((o, i) => {
    const tag = i === item.correctIndex ? "✅" : i === mine ? "❌ tu respuesta" : "✖";
    return `<br><b>${"ABCD"[i]}) ${optionText(o)}</b> ${tag}<br>${item.optionNotes[i] ?? ""}`;
  });
  return `<br><br><b>Por qué:</b>${rows.join("<br>")}`;
}

/** Tarjetas desplegables con enunciado, tu respuesta, la correcta y la explicación completa. */
function failCardsHtml(entries) {
  if (!entries.length) return `<p class="note">No hay fallos que mostrar.</p>`;
  return entries.map(({ item, mine }, i) => {
    const prompt = String(item.prompt).replace("___", "_____");
    const yours = mine != null ? `Tu respuesta: <b>${optionText(item.options[mine])}</b><br>` : "";
    return `<details class="card" style="margin-bottom:10px"><summary><b>${i + 1}.</b> ${prompt}${item.tema ? ` <span class="note">· ${item.tema}</span>` : ""}</summary>
      <p style="margin-top:8px">${yours}Correcta: <b>${optionText(item.options[item.correctIndex])}</b><br><br>${item.explanation ?? ""}${item.optionNotes ? optionNotesHtml(item, mine) : ""}</p></details>`;
  }).join("");
}

// Examen de inglés (bancos de 50): cada fallo resta WRONG_PENALTY aciertos (el cuadernillo
// real puntúa +1 por acierto y -0,20 por error) y se aprueba con la mitad de la nota máxima.
const WRONG_PENALTY = 0.2;
const fmtNum = (x) => String(Math.round(x * 100) / 100).replace(".", ",");

/** Marcador en vivo de las sesiones de banco: llevo X de N, aciertos y fallos. */
function paintBankTally() {
  const el = $("bank-tally");
  el.classList.toggle("hidden", !session.bank);
  if (!session.bank) return;
  const done = session.correct + session.wrong;
  el.textContent = `Llevas ${done} de ${session.items.length} · ✅ ${session.correct} aciertos · ❌ ${session.wrong} fallos`;
}

function renderCurrentItem() {
  const item = ensureRenderable(session.items[session.i]);
  session.items[session.i] = item;
  session.selection = null;
  session.answered = false;
  session.itemStart = Date.now();

  $("lesson-progress").style.width = `${(session.i / session.items.length) * 100}%`;
  $("hearts-count").textContent = session.hearts;
  paintBankTally();
  $("feedback").classList.remove("show", "good", "bad");
  $("check-foot").classList.remove("hidden");
  const check = $("check-btn");
  check.disabled = true;
  check.textContent = "Comprobar";

  session.page = 1; session.groupBoxes = null;
  if (item.group && item.groupSize > 1) {
    // Un audio con varias preguntas: todas en la misma página (ver renderListenGroup).
    const page = session.items.slice(session.i, session.i + item.groupSize).filter((x) => x.group === item.group);
    session.page = page.length;
    session.groupSel = page.map(() => null);
    session.groupBoxes = renderListenGroup(page, $("lesson-question"), $("lesson-answer"), speakItem, skipListening, (idx, sel) => {
      session.groupSel[idx] = sel;
      check.disabled = session.groupSel.some((v) => v === null);
    });
    return;
  }
  renderQuestion(item, $("lesson-question"), speakItem, skipListening);
  const answerEl = $("lesson-answer");
  if (item.kind === "wordbank") {
    renderWordbank(item, answerEl, (words) => {
      session.selection = words;
      check.disabled = !words;
    });
  } else {
    renderOptions(item, answerEl, (i) => {
      session.selection = i;
      check.disabled = i === null;
    });
  }
}

// "Ahora no puedo escuchar": la pregunta de sonido pasa al final de la sesión, para
// responderla después. No cuenta como fallo ni como acierto; si es la última de la
// sesión (ya solo quedan listenings) se avisa en vez de dejarla en bucle.
function skipListening() {
  if (session.answered) return;
  const cur = session.items[session.i];
  const inGroup = (x) => x === cur || (cur.group && x.group === cur.group);
  const rest = session.items.slice(session.i).filter((x) => !inGroup(x));
  if (!rest.some((x) => x.kind !== "listen")) {
    alert("Solo quedan preguntas de sonido. Cuando puedas escuchar, responde; si no, sal con la ✕ y vuelve más tarde (la lección no se pierde).");
    return;
  }
  stopSpeech();
  // Se salta el audio entero (todas sus preguntas pendientes) y vuelve al final.
  const moved = session.items.filter((x, idx) => idx >= session.i && inGroup(x));
  session.items = [...session.items.filter((x, idx) => idx < session.i || !inGroup(x)), ...moved];
  moved.forEach((x) => { if (x.group) x.group.plays = 0; });
  renderCurrentItem();
}

// Corrección de una página con varias preguntas sobre el mismo audio: se puntúa cada
// pregunta por separado (acierto/fallo, vida, estadísticas) y se muestra un resumen.
function evaluateGroup() {
  const page = session.items.slice(session.i, session.i + session.page);
  const results = page.map((it, i) => {
    const good = session.groupSel[i] === it.correctIndex;
    markOptions(session.groupBoxes[i], it.correctIndex, session.groupSel[i]);
    logAnswer(it, good);
    if (good) session.correct++;
    else { session.wrong++; if (session.hearts !== Infinity) session.hearts = Math.max(0, session.hearts - 1); }
    return { it, good, mine: session.groupSel[i] };
  });
  $("hearts-count").textContent = session.hearts;
  const nGood = results.filter((r) => r.good).length;
  const allGood = nGood === results.length;
  session.verdict = { good: allGood, heartLost: false, excused: false };

  const fb = $("feedback");
  fb.classList.add("show", allGood ? "good" : "bad");
  $("feedback-icon").textContent = allGood ? "✓" : "✕";
  $("feedback-head").textContent = allGood ? "¡Todas correctas!" : `${nGood} de ${results.length} correctas`;
  const sol = $("feedback-solution");
  sol.textContent = "";
  const wrong = results.filter((r) => !r.good);
  sol.classList.toggle("hidden", !wrong.length);
  wrong.forEach((r) => {
    const n = results.indexOf(r) + 1;
    const line = document.createElement("span");
    line.textContent = `Pregunta ${n} · correcta: ${optionText(r.it.options[r.it.correctIndex])} · tu respuesta: ${optionText(r.it.options[r.mine])}`;
    sol.append(line, document.createElement("br"));
  });
  $("feedback-text").innerHTML = results.map((r, i) => `<b>${i + 1}.</b> ${r.it.explanation ?? ""}`).join("<br><br>")
    + `<br><br><b>Transcripción:</b><br>${transcriptText(page[0])}`;
  $("feedback-report").classList.add("hidden");
  $("feedback-report-panel").classList.add("hidden");
  $("check-foot").classList.add("hidden");
  const isLast = session.i + session.page >= session.items.length;
  $("feedback-next").textContent = session.hearts === 0 || isLast ? "Ver resultado" : "Continuar";
  $("feedback-next").focus();
}

function evaluate() {
  if (session.answered) return;
  session.answered = true;
  if (session.groupBoxes) return evaluateGroup();
  const item = session.items[session.i];
  const answerEl = $("lesson-answer");

  let good;
  if (item.kind === "wordbank") {
    const norm = (w) => w.join(" ").toLowerCase();
    good = Array.isArray(session.selection)
      && [item.answer, ...(item.alts ?? [])].some((ans) => norm(ans) === norm(session.selection));
    lockWordbank(answerEl);
  } else {
    good = session.selection === item.correctIndex;
    markOptions(answerEl, item.correctIndex, session.selection);
  }

  logAnswer(item, good);
  const heartLost = !good && session.hearts !== Infinity && session.hearts > 0;
  session.verdict = { good, heartLost, excused: false };
  if (good) session.correct++;
  else {
    session.wrong++;
    if (item.kind !== "wordbank" && session.selection !== null) session.failed.push({ item, mine: session.selection });
    if (session.hearts !== Infinity) session.hearts = Math.max(0, session.hearts - 1);
  }
  $("hearts-count").textContent = session.hearts;
  paintBankTally();

  // Solo las preguntas reales tienen id estable entre sesiones (las generadas se
  // recrean cada vez, no hay "la misma" que repasar). Se guarda mientras se siga
  // fallando; se quita en cuanto se acierta -- la lista es "lo que sigue pendiente".
  if (item.isReal && item.id) {
    const seen = store.seenIds;
    if (!seen.includes(item.id)) { seen.push(item.id); store.seenIds = seen; setSeenIds(seen); }
    const missed = store.missedIds;
    const idx = missed.indexOf(item.id);
    if (!good && idx === -1) { missed.push(item.id); store.missedIds = missed; }
    else if (good && idx !== -1) { missed.splice(idx, 1); store.missedIds = missed; }
    // Una pregunta ya reportada antes no debe penalizar otra vez: el fallo puede ser del banco.
    if (!good && store.reportedIds.some((r) => r.id === item.id)) excuseWrong(item);
  }

  const fb = $("feedback");
  const isSjt = item.kind === "sjt";
  fb.classList.add("show", good ? "good" : "bad");
  $("feedback-icon").textContent = good ? "✓" : "✕";
  $("feedback-head").textContent = good
    ? (isSjt ? "Opción más alineada" : "¡Correcto!")
    : (isSjt ? "Hay una opción más alineada" : "Incorrecto");

  const sol = $("feedback-solution");
  if (!good) {
    sol.classList.remove("hidden");
    const correctLabel = item.kind === "wordbank"
      ? item.answer.join(" ")
      : optionText(item.options[item.correctIndex]) || `la marcada como correcta arriba (opción ${"ABCDEF"[item.correctIndex]})`;
    const mine = item.kind === "wordbank"
      ? (Array.isArray(session.selection) ? session.selection.join(" ") : "")
      : optionText(item.options[session.selection]);
    sol.textContent = `Respuesta correcta: ${correctLabel}`;
    if (mine) {
      const yours = document.createElement("span");
      yours.className = "feedback__yours";
      yours.textContent = `Tu respuesta: ${mine}`;
      sol.append(document.createElement("br"), yours);
    }
  } else {
    sol.classList.add("hidden");
  }

  let text = item.explanation ?? "";
  if (item.optionNotes) text += optionNotesHtml(item, session.selection);
  if (item.kind === "listen") text += `<br><br><b>Transcripción:</b><br>${transcriptText(item)}`;
  $("feedback-text").innerHTML = text;

  const reportBtn = $("feedback-report");
  $("feedback-report-panel").classList.add("hidden");
  if (item.isReal && item.id) {
    reportBtn.classList.remove("hidden");
    reportBtn.disabled = false;
    reportBtn.textContent = "⚠️ Reportar fallo en esta pregunta";
    reportBtn.dataset.id = item.id;
    // Imagen que no carga: fallo objetivo, se registra solo (no depende de que el
    // usuario se acuerde de reportarlo) y el botón ya lo refleja.
    if (currentImageBroken(item)) {
      saveReport(item, "imagen", { auto: true });
      reportBtn.textContent = "✓ Imagen rota registrada automáticamente";
      reportBtn.disabled = true;
    }
  } else {
    reportBtn.classList.add("hidden");
  }

  $("check-foot").classList.add("hidden");
  const isLast = session.i === session.items.length - 1;
  const outOfHearts = session.hearts === 0;
  $("feedback-next").textContent = outOfHearts ? "Ver resultado" : isLast ? "Ver resultado" : "Continuar";
  $("feedback-next").focus();
}

const MOTIVOS = {
  imagen: "Falta la imagen o no se ve",
  clave: "Respuesta correcta mal",
  enunciado: "Enunciado u opciones raros",
  otro: "Otro motivo",
};

// true si la pregunta lleva imagen y el <img> ya terminó de cargar sin píxeles (404 o
// fichero corrupto). Se llama tras responder, con la imagen ya tenida tiempo de cargar.
function currentImageBroken(item) {
  if (!item.image) return false;
  const img = $("lesson-question").querySelector("img");
  // Solo cuenta como rota si ya se reintentó la carga (un fallo de red suelto no es un fallo
  // de la pregunta) y sigue sin píxeles.
  return !img || (Boolean(img.dataset.retry) && img.complete && img.naturalWidth === 0);
}

function logAnswer(item, good) {
  const now = Date.now();
  const ms = Math.min(stats.MAX_MS, Math.max(0, now - (session.itemStart || now)));
  store.answerLog = stats.pushEntry(store.answerLog, {
    t: now, ms, ok: good ? 1 : 0,
    src: item.source ?? item.block ?? "otro", cat: item.family ?? "", r: item.isReal ? 1 : 0, s: session.startedAt,
  });
}

// Una pregunta reportada (clave dudosa, imagen rota...) no cuenta como fallo: se quita de
// "Repasar fallos", se devuelve la vida perdida y no entra en el % de la lección.
function excuseWrong(item) {
  const v = session.verdict;
  if (!v || v.good || v.excused || session.items[session.i] !== item) return;
  v.excused = true;
  session.excused++;
  const log = store.answerLog;
  if (log.length) { log[log.length - 1].x = 1; store.answerLog = log; }
  store.missedIds = store.missedIds.filter((id) => id !== item.id);
  if (v.heartLost) {
    session.hearts++;
    $("hearts-count").textContent = session.hearts;
    const last = session.i === session.items.length - 1;
    $("feedback-next").textContent = last ? "Ver resultado" : "Continuar";
  }
}

function saveReport(item, motivo, { auto = false } = {}) {
  excuseWrong(item);
  const list = store.reportedIds;
  const prev = list.find((r) => r.id === item.id);
  // Un reporte manual pisa a uno automático; uno automático nunca pisa a uno manual.
  if (prev && auto && !prev.auto) return;
  const entry = {
    id: item.id, ts: Date.now(), motivo, auto,
    elegida: Number.isInteger(session.selection) ? session.selection : null,
    imgOk: item.image ? !currentImageBroken(item) : null,
    prompt: String(item.prompt ?? "").slice(0, 240),
  };
  if (prev) Object.assign(prev, entry); else list.push(entry);
  store.reportedIds = list;
}

function nextItem() {
  stopSpeech();
  if (session.hearts === 0) return finish();
  session.i += session.page || 1;
  if (session.i >= session.items.length) return finish();
  renderCurrentItem();
}

function finish() {
  stopSpeech();
  const total = session.items.length;
  const graded = total - session.excused;
  const pct = graded > 0 ? Math.round((session.correct / graded) * 100) : 100;
  const passed = pct >= PASS_THRESHOLD * 100;
  const ranOut = session.hearts === 0;

  // XP: 10 por acierto + 20 de bonus al superar una lección del camino.
  const xpGain = session.correct * 10 + (passed && session.lessonIndex !== null ? 20 : 0);
  store.xp = store.xp + xpGain;
  bumpStreak();

  // Calibra el ritmo real: minutos por pregunta de esta sesión (se ignoran las que
  // quedaron abiertas mucho rato, que no reflejan tiempo de estudio).
  const mins = (Date.now() - session.startedAt) / 60000;
  if (session.startedAt && total > 0 && mins > 0.2 && mins < 40) {
    store.qMins = [...store.qMins, mins / total].slice(-10);
  }

  if (session.lessonIndex !== null) {
    const key = LESSONS[session.lessonIndex].key;
    const prog = store.progress;
    if (pct > (prog[key] ?? 0)) { prog[key] = pct; store.progress = prog; }
  }

  const stillMissed = session.bank ? englishBankCounts(session.bank, store.missedIds).missed
    : session.review ? store.missedIds.length : null;

  $("results-spark").textContent = ranOut ? "💔" : passed ? (pct === 100 ? "🌟" : "🎉") : "💪";
  const cov = realCoverage();
  $("results-title").textContent = session.unseen
    ? "Sesión de reales completada"
    : session.review
    ? (stillMissed === 0 ? "¡Repaso completo!" : "Repaso terminado")
    : ranOut
      ? "Te has quedado sin vidas"
      : pct === 100 ? "¡Perfecto!" : passed ? "¡Lección superada!" : "Casi";
  $("results-sub").textContent = session.unseen
    ? `Llevas ${cov.seen}/${cov.total} preguntas reales vistas${cov.unseen ? ` (te faltan ${cov.unseen})` : " — ¡todas!"}.`
    : session.review
    ? (stillMissed === 0
        ? "Ya no te queda ninguna pregunta pendiente de repasar."
        : `Te quedan ${stillMissed} pregunta${stillMissed === 1 ? "" : "s"} por dominar. Repite el repaso cuando quieras.`)
    : ranOut
      ? "Repite la lección: los fallos se explican uno a uno."
      : passed
        ? (session.lessonIndex !== null ? "Has desbloqueado la siguiente lección." : "Buen trabajo. Sigue practicando.")
        : `Necesitas un ${PASS_THRESHOLD * 100} % para superar la lección. Repasa las explicaciones y repite.`;
  const failsEl = $("results-fails");
  failsEl.classList.toggle("hidden", !(session.bank && session.failed.length));
  if (session.bank && session.failed.length) {
    failsEl.innerHTML = `<div class="card__title">Tus fallos explicados (${session.failed.length})</div>${failCardsHtml(session.failed)}`;
  }
  if (session.bank) {
    const net = session.correct - WRONG_PENALTY * session.wrong, need = total / 2;
    $("results-sub").textContent = `${session.correct} aciertos y ${session.wrong} fallos de ${total}. Nota: ${session.correct} − ${fmtNum(WRONG_PENALTY)}×${session.wrong} = ${fmtNum(net)} de ${total}. Hay que llegar a ${fmtNum(need)}: ${net >= need ? "APROBADO" : "NO llegas"}.`;
  }
  $("results-xp").textContent = `+${xpGain}`;
  $("results-acc").textContent = `${pct} %`;
  $("results-acc-badge").className = `badge ${passed ? "badge--acc" : "badge--fail"}`;
  $("results-repeat").classList.toggle("hidden",
    session.blockIds ? false : session.bank ? store.engMode === "missed" && stillMissed === 0
      : session.unseen ? cov.unseen === 0 : stillMissed === 0);
  show("results");
}

function bumpStreak() {
  const t = today();
  if (store.lastPlay === t) return;
  store.streak = store.lastPlay === yesterday() ? store.streak + 1 : 1;
  store.lastPlay = t;
}

/* ============================== práctica ============================== */
function renderPractice() {
  const tier = store.practiceTier;
  document.querySelectorAll("#practice-tier button").forEach((b) =>
    b.setAttribute("aria-pressed", String(Number(b.dataset.tier) === tier)));
  $("practice-blocks").innerHTML = Object.keys(SOURCES)
    .map((s) => `<button type="button" class="btn btn--ghost btn--wide" data-practice="${s}">${SOURCE_LABELS[s]}</button>`)
    .join("");
  $("practice-blocks").querySelectorAll("[data-practice]").forEach((b) =>
    b.addEventListener("click", () => startPractice(b.dataset.practice, store.practiceTier)));

  const level = store.listenLevel;
  document.querySelectorAll("#practice-listen-level button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.level === level)));

  paintOrigenFilter("#practice-origen-filter");
  renderEnglishBank();
}

function renderEnglishBank() {
  const { engBank: bank, engMode: mode } = store;
  document.querySelectorAll("#eng-bank button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.bank === bank)));
  document.querySelectorAll("#eng-mode button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  const { total, missed } = englishBankCounts(bank, store.missedIds);
  const n = mode === "missed" ? missed : total;
  $("eng-count").textContent = total === 0
    ? "El banco aún no está cargado: desbloquea las preguntas reales primero."
    : mode === "missed"
      ? (missed ? `${missed} fallo${missed === 1 ? "" : "s"} pendiente${missed === 1 ? "" : "s"} de ${total}.` : `Ningún fallo pendiente (${total} preguntas en el banco).`)
      : `${total} preguntas, ${missed} fallada${missed === 1 ? "" : "s"} pendiente${missed === 1 ? "" : "s"}.`;
  $("eng-start").disabled = n === 0;
  $("eng-fails").classList.add("hidden");
}

/** Un mismo valor persistente (store.origenFilter), pintado en dos sitios (Práctica
 *  libre y Ajustes) -- ver Tarea 1. */
function paintOrigenFilter(selector) {
  const val = store.origenFilter;
  document.querySelectorAll(`${selector} button`).forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.origen === val)));
}

/* ============================== perfil ============================== */
function renderProfile() {
  const progress = store.progress;
  $("p-streak").textContent = store.streak;
  $("p-xp").textContent = store.xp;
  $("p-lessons").textContent = `${totalPassed(progress)}/${LESSONS.length}`;
  $("p-days").textContent = daysLeft();

  const missed = store.missedIds.length;
  $("p-review-count").textContent = missed
    ? `${missed} pregunta${missed === 1 ? "" : "s"} real${missed === 1 ? "" : "es"} pendiente${missed === 1 ? "" : "s"} de repasar`
    : "Ninguna pregunta pendiente de repasar. Sigue practicando y las que falles aparecerán aquí.";
  $("p-review-btn").disabled = missed === 0;
  $("p-worlds").innerHTML = WORLDS.map((w, i) => {
    const wp = worldProgress(progress, w.id);
    const pct = Math.round((wp.lessonsDone / wp.lessonsTotal) * 100);
    const locked = !worldUnlocked(progress, i);
    return `<div class="progress-item">
      <div class="progress-item__head"><span>${locked ? "🔒 " : wp.complete ? "🏆 " : ""}${w.name}</span><span>${wp.lessonsDone}/${wp.lessonsTotal}</span></div>
      <div class="progress-item__bar"><div class="progress-item__fill" style="width:${pct}%;background:${w.color}"></div></div>
    </div>`;
  }).join("");
}

/* ============================== estadísticas ============================== */
const CAT_LABEL = {
  sinonimos_antonimos: "Sinónimos/antónimos", analogias: "Analogías", secuencia_num_letras: "Secuencias núm./letras",
  razonamiento_numerico: "Razonamiento numérico", series_numeros: "Series de números", matrices: "Matrices",
  series_figuras: "Series de figuras", cubos: "Cubos", domino: "Dominó", relojes: "Relojes",
  figuras_no_relacionadas: "Figuras no relacionadas", ingles_b1: "Inglés B1", ingles_b2: "Inglés B2",
  competencias_conductuales: "Conductuales",
};
const fmtS = (s) => (s >= 90 ? `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")} s` : `${Math.round(s)} s`);
const fmtPct = (x) => (x == null ? "—" : `${Math.round(x * 100)} %`);
const fmtH = (h) => { const m = Math.round(Math.abs(h) * 60); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min` : `${m} min`; };
const DAY_NAMES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const bestRun = (es) => { let best = 0, run = 0; for (const e of es) { if (e.x) continue; run = e.ok ? run + 1 : 0; best = Math.max(best, run); } return best; };
const fmtWhen = (t) => new Date(t).toLocaleString("es-ES", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function statBars(rows, { value, text, color = "var(--blue)" }) {
  const max = Math.max(1, ...rows.map(value));
  return rows.map((r) => `<div class="progress-item">
    <div class="progress-item__head"><span>${r.label}</span><span>${text(r)}</span></div>
    <div class="progress-item__bar"><div class="progress-item__fill" style="width:${Math.round((value(r) / max) * 100)}%;background:${color}"></div></div>
  </div>`).join("");
}
const statBox = (icon, val, lbl) => `<div class="stat-box"><span aria-hidden="true">${icon}</span><div><div class="stat-box__val">${val}</div><div class="stat-box__lbl">${lbl}</div></div></div>`;

function renderStats() {
  const now = Date.now();
  const all = store.answerLog;
  const root = $("stats-body");
  if (!all.length) {
    root.innerHTML = `<div class="card"><p class="note">Aún no hay datos. Haz una lección o una práctica y aquí verás cuántas haces, a qué velocidad y cuánto te falta.</p></div>`;
    return;
  }
  const sm = stats.summary(all, now);
  const cards = [];

  cards.push(`<div class="card"><div class="card__title">Resumen</div><div class="stat-grid">
    ${statBox("🧮", sm.total, "Preguntas respondidas")}
    ${statBox("🎯", fmtPct(sm.acc), "Acierto global")}
    ${statBox("⏱️", fmtS(sm.medS), "Mediana por pregunta")}
    ${statBox("📅", sm.today, "Hoy")}
    ${statBox("🗓️", sm.last7, "Últimos 7 días")}
    ${statBox("⚡", `${fmtS(sm.fastS)} / ${fmtS(sm.slowS)}`, "Más rápida / más lenta")}
    ${statBox("🕒", fmtH(sm.activeS / 3600), "Tiempo respondiendo")}
    ${statBox("🏅", bestRun(all), "Mejor racha de aciertos")}
  </div></div>`);

  // Estimación: lo que queda de camino + reales sin ver, a tu ritmo real.
  const remainingLessons = LESSONS.length - totalPassed(store.progress);
  const cov = realCoverage();
  const examAt = examMs(store.examDate);
  const availableH = examAt > now ? studyHoursBetween(now, examAt, hoursForDay, windowForDay) : 0;
  const pace = stats.estimate(all, 0, null);
  let needSPerQ = null;
  if (pace) {
    const rows = [
      { label: `Lo que queda del camino (${remainingLessons} lecciones)`, q: remainingLessons * QUESTIONS_PER_LESSON },
      { label: `Reales que aún no has visto (${cov.unseen})`, q: cov.unseen },
    ].map((r) => ({ ...r, est: stats.estimate(all, r.q, null) }));
    const both = stats.estimate(all, rows[0].q + rows[1].q, availableH);
    const enough = both.slackHours >= 0;
    if (both.questions > 0 && availableH > 0) needSPerQ = (availableH * 3600) / both.questions;
    cards.push(`<div class="card"><div class="card__title">Estimación a tu ritmo</div>
      <div class="stat-grid">
        ${statBox("🐢", fmtS(pace.sPerQ), "Por pregunta (con explicaciones)")}
        ${statBox("🚀", Math.round(pace.qPerHour), "Preguntas por hora")}
      </div>
      <div class="progress-list" style="margin-top:12px">
        ${rows.map((r) => `<div class="progress-item"><div class="progress-item__head"><span>${r.label}</span><span>≈ ${fmtH(r.est.hours)}</span></div></div>`).join("")}
        <div class="progress-item"><div class="progress-item__head"><span><b>Total</b></span><span><b>≈ ${fmtH(both.hours)}</b></span></div></div>
      </div>
      <p class="note" style="margin-top:10px">Hasta el examen te quedan ~${fmtH(availableH)} de estudio según tu calendario: ${enough ? `sobran ~${fmtH(both.slackHours)}` : `faltan ~${fmtH(both.slackHours)}`}. Usa ${fmtS(pace.sPerQ)} por pregunta, lo medido en tus últimas sesiones.</p></div>`);
  }

  const b = stats.speedBuckets(all);
  const trend = stats.speedTrend(all);
  const trendText = !trend
    ? "Con 20 preguntas o más verás si vas ganando velocidad."
    : (() => {
      const d = Math.round(trend.delta);
      return `Tendencia: tu mediana pasó de ${fmtS(trend.from)} a ${fmtS(trend.to)} ${d === 0 ? "(igual)" : d < 0 ? `(${-d} s más rápido)` : `(${d} s más lento)`}.`;
    })();
  cards.push(`<div class="card"><div class="card__title">Rápidas y lentas</div>
    <div class="progress-list">${statBars([
      { label: `Rápidas (menos de ${stats.FAST_S} s)`, n: b.fast },
      { label: `Normales (${stats.FAST_S}–${stats.SLOW_S} s)`, n: b.mid },
      { label: `Lentas (más de ${stats.SLOW_S} s)`, n: b.slow },
    ], { value: (r) => r.n, text: (r) => `${r.n} · ${Math.round((r.n / sm.total) * 100)} %`, color: "var(--green)" })}</div>
    <p class="note" style="margin-top:10px">${trendText}</p></div>`);

  // ---- curvas ----
  const cum = stats.downsample(stats.cumulativeSeries(all), 120);
  cards.push(`<div class="card"><div class="card__title">Curva de respondidas</div>
    <p class="note">Preguntas acumuladas desde que empezaste a medir. Toca la gráfica para leer un punto.</p>
    ${lineChart(cum.map((c) => ({ x: c.t, y: c.n, tip: `${c.n} preguntas · ${fmtWhen(c.t)}` })), {
      title: "Preguntas respondidas acumuladas", yFmt: (v) => String(Math.round(v)),
      xTicks: stats.dayTicks(cum[0].t, cum[cum.length - 1].t).map((t) => ({ x: t, label: `${DAY_NAMES[new Date(t).getDay()]} ${new Date(t).getDate()}` })),
    })}</div>`);

  const roll = stats.downsample(stats.rollingMedianS(all, 10), 120);
  cards.push(`<div class="card"><div class="card__title">Tu velocidad de respuesta</div>
    <p class="note">Mediana de las últimas 10 respuestas, en segundos. Bajar es ir más rápido.</p>
    ${lineChart(roll.map((r) => ({ x: r.i, y: r.v, tip: `Respuesta ${r.i}: ${fmtS(r.v)} · ${fmtWhen(r.t)}` })), {
      title: "Segundos por respuesta (mediana móvil)", yFmt: (v) => `${Math.round(v)} s`,
    })}</div>`);

  const sesAll = stats.sessions(all, 40).reverse();
  if (sesAll.length >= 2) {
    cards.push(`<div class="card"><div class="card__title">Ritmo real por sesión</div>
      <p class="note">Segundos por pregunta contando explicaciones y pausas${needSPerQ ? `. La línea verde es lo que necesitas para acabar a tiempo (${fmtS(needSPerQ)})` : ""}.</p>
      ${lineChart(sesAll.map((x, i) => ({ x: i, y: x.sPerQ, tip: `${fmtWhen(x.start)} · ${Math.round(x.sPerQ)} s/preg · ${x.n} preg` })), {
        title: "Segundos por pregunta en cada sesión", area: false, yFmt: (v) => `${Math.round(v)} s`,
        ref: needSPerQ ? { y: needSPerQ, label: `Objetivo ${Math.round(needSPerQ)} s` } : null,
      })}</div>`);
  }

  const accRoll = stats.downsample(stats.rollingAcc(all.filter((e) => !e.x), 20), 120);
  cards.push(`<div class="card"><div class="card__title">Curva de aciertos</div>
    <p class="note">Porcentaje de acierto de las últimas 20 preguntas.</p>
    ${lineChart(accRoll.map((r) => ({ x: r.i, y: r.v * 100, tip: `${Math.round(r.v * 100)} % · ${fmtWhen(r.t)}` })), {
      title: "Acierto móvil", yMax: 100, yFmt: (v) => `${Math.round(v)} %`,
    })}</div>`);

  const days = stats.byDay(all, now, 7);
  cards.push(`<div class="card"><div class="card__title">Preguntas por día</div>
    ${columnChart(days.map((d) => ({ label: `${DAY_NAMES[d.day.getDay()]} ${d.day.getDate()}`, value: d.n,
      tip: `${d.n} preg · ${fmtPct(d.acc)} · ${d.n ? fmtS(d.medS) : "—"}` })), { title: "Preguntas respondidas por día" })}</div>`);

  const ses = stats.sessions(all, 10);
  const avgN = Math.round(ses.reduce((t, x) => t + x.n, 0) / ses.length);
  cards.push(`<div class="card"><div class="card__title">Cada vez que entras</div>
    <p class="note">Haces de media ${avgN} pregunta${avgN === 1 ? "" : "s"} por sesión (últimas ${ses.length}).</p>
    <div class="progress-list" style="margin-top:10px">${statBars(ses.map((x) => ({
      ...x, label: new Date(x.start).toLocaleString("es-ES", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    })), {
      value: (r) => r.n, text: (r) => `${r.n} preg · ${fmtH(r.wallS / 3600)} · ${Math.round(r.sPerQ)} s/preg · ${fmtPct(r.acc)}`,
    })}</div></div>`);

  const src = stats.bySource(all).map((r) => ({ ...r, label: SOURCE_LABELS[r.key] ?? r.key }));
  cards.push(`<div class="card"><div class="card__title">Por bloque</div><div class="progress-list">${statBars(src, {
    value: (r) => r.medS, text: (r) => `${fmtS(r.medS)} · ${fmtPct(r.acc)} · ${r.n}`,
  })}</div><p class="note" style="margin-top:10px">La barra es la mediana de tiempo; después, acierto y nº de preguntas.</p></div>`);

  const cat = stats.byCategory(all.filter((e) => e.r).map((e) => ({ ...e, cat: e.cat.replace(/^real-/, "") })), 3)
    .map((r) => ({ ...r, label: CAT_LABEL[r.key] ?? r.key }));
  if (cat.length) {
    cards.push(`<div class="card"><div class="card__title">Preguntas reales por tipo</div>
      <p class="note">De más lento a más rápido (mínimo 3 respondidas).</p>
      <div class="progress-list" style="margin-top:10px">${statBars(cat, {
        value: (r) => r.medS, text: (r) => `${fmtS(r.medS)} · ${fmtPct(r.acc)} · ${r.n}`,
      })}</div></div>`);
  }

  const o = stats.byOrigin(all);
  const parts = stats.byDaypart(all).map((r) => ({ ...r, label: r.key }));
  cards.push(`<div class="card"><div class="card__title">Reales vs generadas</div><div class="stat-grid">
    ${statBox("📄", o.real.n, `Reales · ${fmtPct(o.real.acc)} · ${o.real.n ? fmtS(o.real.medS) : "—"}`)}
    ${statBox("⚙️", o.gen.n, `Generadas · ${fmtPct(o.gen.acc)} · ${o.gen.n ? fmtS(o.gen.medS) : "—"}`)}
  </div></div>
  <div class="card"><div class="card__title">Franja del día</div><div class="progress-list">${statBars(parts, {
    value: (r) => r.n, text: (r) => `${r.n} · ${fmtPct(r.acc)} · ${fmtS(r.medS)}`,
  })}</div></div>`);

  root.innerHTML = cards.join("");
  bindCharts(root);
}

/* ============================== speaking ============================== */
const sp = { timer: null, left: 120, running: false };
function newPrompt() { $("speak-prompt").textContent = choice(SPEAKING_PROMPTS); }
function paintSpeakClock() {
  const m = String(Math.floor(sp.left / 60)).padStart(2, "0");
  const s = String(sp.left % 60).padStart(2, "0");
  const el = $("speak-clock");
  el.textContent = `${m}:${s}`;
  el.classList.toggle("warn", sp.left <= 15);
}
function resetSpeak() { clearInterval(sp.timer); sp.running = false; sp.left = 120; paintSpeakClock(); $("speak-timer").textContent = "Iniciar 2 min"; }
function toggleSpeak() {
  if (sp.running) { clearInterval(sp.timer); sp.running = false; $("speak-timer").textContent = "Reanudar"; return; }
  sp.running = true; $("speak-timer").textContent = "Pausar";
  sp.timer = setInterval(() => {
    sp.left--; paintSpeakClock();
    if (sp.left <= 0) resetSpeak();
  }, 1000);
}

/* ============================== competencias (familiarización) ============================== */
// Cuestionarios de personalidad reales: sin corrección, sin vidas ni XP (ver data/competencias.js).
const comp = { kind: null, items: [], i: 0, selected: null };

function startCompetencias(kind) {
  comp.kind = kind;
  comp.items = kind === "likert" ? shuffle(LIKERT_ITEMS) : shuffle(FORCED_CHOICE_ITEMS);
  comp.i = 0;
  $("comp-kicker").textContent = kind === "likert"
    ? "Competencias · Autoevaluación (A-D)"
    : "Competencias · Elección forzada (A/B)";
  $("comp-done").classList.add("hidden");
  $("comp-question").classList.remove("hidden");
  $("comp-answer").classList.remove("hidden");
  $("comp-foot").classList.remove("hidden");
  show("competencias");
  renderCompItem();
}

function renderCompItem() {
  const item = comp.items[comp.i];
  comp.selected = null;
  $("comp-progress").style.width = `${(comp.i / comp.items.length) * 100}%`;
  $("comp-question").innerHTML = `<p class="question">${item.prompt}</p>`;
  const options = comp.kind === "likert" ? LIKERT_SCALE : item.options;
  const next = $("comp-next-btn");
  next.disabled = true;
  next.textContent = comp.i === comp.items.length - 1 ? "Terminar" : "Siguiente";
  renderOptions({ kind: "text", options }, $("comp-answer"), (i) => {
    comp.selected = i;
    next.disabled = i === null;
  });
}

function nextCompItem() {
  comp.i++;
  if (comp.i >= comp.items.length) {
    $("comp-question").classList.add("hidden");
    $("comp-answer").classList.add("hidden");
    $("comp-foot").classList.add("hidden");
    $("comp-done").classList.remove("hidden");
    $("comp-progress").style.width = "100%";
    return;
  }
  renderCompItem();
}

/* ============================== ajustes ============================== */
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
function paintStudyDays() {
  const end = new Date(`${store.examDate}T00:00:00`);
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const over = store.studyDays;
  let html = "";
  for (; d < end; d.setDate(d.getDate() + 1)) {
    const k = dayKey(d);
    html += `<label class="study-day"><span>${DIAS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}</span>
      <input type="number" min="0" max="16" step="0.5" data-day="${k}" placeholder="${defaultHoursForDay(new Date(d))}" value="${Number.isFinite(over[k]) ? over[k] : ""}"></label>`;
  }
  $("study-days").innerHTML = html || `<p class="note">No quedan días hasta el examen.</p>`;
}

function renderSettings() {
  applyTheme();
  document.querySelectorAll("#hearts-picker button").forEach((b) =>
    b.setAttribute("aria-pressed", String((b.dataset.hearts === "on") === store.heartsOn)));
  $("exam-date").value = store.examDate;
  $("study-hours").value = store.studyHours;
  paintStudyDays();
  $("app-version").textContent = APP_VERSION;
  paintOrigenFilter("#settings-origen-filter");

  const revisionCount = REAL.filter((q) => q.status === "revision").length;
  const reportedCount = store.reportedIds.length;
  $("q-summary").textContent = revisionCount || reportedCount
    ? `${revisionCount} pendientes de revisión, ${reportedCount} reportadas por ti.`
    : "Nada pendiente ahora mismo.";
}

/* ============================== calidad de preguntas ============================== */
function qualityCard(q, note, { showCorrect = false } = {}) {
  const img = q.image ? `<img class="qcard__img" src="./public/assets/exams/${q.image}" alt="Figura de la pregunta" loading="lazy">` : "";
  const opts = q.options
    .map((o, i) => `<li>${"ABCDEF"[i]}) ${optionText(o)}${showCorrect && i === q.correctIndex ? " ✓" : ""}</li>`)
    .join("");
  return `<div class="qcard">
    <div class="qcard__id">${q.id}</div>
    <p class="qcard__prompt">${q.prompt}</p>
    ${img}
    <ul class="qcard__opts">${opts}</ul>
    <p class="note">${note}</p>
  </div>`;
}

function renderQuality() {
  const revisionItems = REAL.filter((q) => q.status === "revision");
  $("q-revision-count").textContent = revisionItems.length;
  $("q-revision-list").innerHTML = revisionItems.length
    ? revisionItems.map((q) => qualityCard(q, q.notaRevision ?? "Sin nota.")).join("")
    : `<p class="note">Ninguna pregunta pendiente de revisión ahora mismo.</p>`;

  const reported = store.reportedIds;
  $("q-reported-count").textContent = reported.length;
  $("q-reported-list").innerHTML = reported.length
    ? reported
        .map((r) => {
          const q = REAL.find((x) => x.id === r.id);
          const when = new Date(r.ts).toLocaleDateString("es-ES");
          const motivo = `<span class="qcard__motivo">${MOTIVOS[r.motivo] ?? "Sin motivo (reporte antiguo)"}${r.auto ? " · automático" : ""}</span>`;
          const elegida = Number.isInteger(r.elegida) ? ` Marcaste ${"ABCDEF"[r.elegida]}.` : "";
          const note = `Reportada el ${when}.${elegida}`;
          const body = q
            ? qualityCard(q, note, { showCorrect: true })
            : `<div class="qcard"><div class="qcard__id">${r.id}</div>${r.prompt ? `<p class="qcard__prompt">${r.prompt}</p>` : ""}<p class="note">Ya no existe en el banco actual. ${note}</p></div>`;
          const actions = `<div class="qcard__actions"><button type="button" class="btn btn--ghost" data-resolver="${r.id}">✓ Ya está arreglada, quitar</button></div>`;
          return `<div class="qwrap">${motivo}${body}${actions}</div>`;
        })
        .join("")
    : `<p class="note">No has reportado ninguna pregunta todavía.</p>`;

  // Comprobación en vivo: si la imagen no carga ahora mismo, se avisa en la tarjeta.
  document.querySelectorAll("#q-reported-list .qcard__img, #q-revision-list .qcard__img").forEach((img) => {
    const warn = () => img.insertAdjacentHTML("afterend", `<p class="qcard__warn">⚠️ Esta imagen no carga (${img.getAttribute("src")})</p>`);
    if (img.complete && img.naturalWidth === 0) warn();
    else img.addEventListener("error", warn, { once: true });
  });
}

function copyQualityReport() {
  const revisionItems = REAL.filter((q) => q.status === "revision");
  const reported = store.reportedIds;
  const lines = [`Informe de calidad — Entrenador AENA — ${new Date().toLocaleString("es-ES")}`];
  lines.push(`\nPendientes de revisión (${revisionItems.length}):`);
  for (const q of revisionItems) lines.push(`- ${q.id}: ${q.notaRevision ?? "(sin nota)"}`);
  lines.push(`\nReportadas por ti (${reported.length}):`);
  for (const r of reported) {
    const q = REAL.find((x) => x.id === r.id);
    const motivo = MOTIVOS[r.motivo] ?? "sin motivo";
    const extra = [
      r.auto ? "detectado automáticamente" : null,
      r.imgOk === false ? `imagen rota (${q?.image ?? "?"})` : null,
      Number.isInteger(r.elegida) ? `marqué ${"ABCDEF"[r.elegida]}` : null,
      q && Number.isInteger(q.correctIndex) ? `clave actual ${"ABCDEF"[q.correctIndex]}` : null,
    ].filter(Boolean).join("; ");
    lines.push(`- ${r.id} [${motivo}] (${new Date(r.ts).toLocaleDateString("es-ES")})${extra ? ` {${extra}}` : ""}: ${q ? `"${q.prompt}"` : `${r.prompt ? `"${r.prompt}" ` : ""}— ya no existe en el banco`}`);
  }
  const text = lines.join("\n");
  const status = $("q-copy-status");
  navigator.clipboard?.writeText(text)
    .then(() => { status.textContent = "Copiado al portapapeles."; })
    .catch(() => { status.textContent = "No se pudo copiar automáticamente. Abre la consola del navegador y copia desde ahí."; console.log(text); });
}

/* ============================== navegación ============================== */
let studyView = null;

function goto(name) {
  if (name === "study") studyView.open();
  if (name === "path") renderPath();
  if (name === "practice") renderPractice();
  if (name === "profile") renderProfile();
  if (name === "stats") renderStats();
  if (name === "settings") renderSettings();
  if (name === "quality") renderQuality();
  if (name === "speaking") { newPrompt(); resetSpeak(); }
  show(name);
  // La barra se mide contra los nodos, que solo tienen tamaño con la pantalla ya visible.
  if (name === "path") requestAnimationFrame(refreshPlan);
}

/* ============================== arranque ============================== */
function init() {
  applyTheme();
  setSeenIds(store.seenIds);

  document.querySelectorAll(".navbtn").forEach((b) =>
    b.addEventListener("click", () => goto(b.dataset.nav)));

  $("p-review-btn").addEventListener("click", startReview);
  $("settings-quality-btn").addEventListener("click", () => goto("quality"));
  $("quality-back").addEventListener("click", () => goto("settings"));
  $("q-copy-btn").addEventListener("click", copyQualityReport);
  $("feedback-report").addEventListener("click", () => {
    $("feedback-report-panel").classList.toggle("hidden");
  });
  $("feedback-report-panel").addEventListener("click", (e) => {
    const motivo = e.target.closest("[data-motivo]")?.dataset.motivo;
    const item = session.items[session.i];
    if (!motivo || !item?.id) return;
    saveReport(item, motivo);
    $("feedback-report-panel").classList.add("hidden");
    const btn = $("feedback-report");
    btn.textContent = `✓ Reportado: ${MOTIVOS[motivo]}`;
    btn.disabled = true;
  });
  $("q-reported-list").addEventListener("click", (e) => {
    const id = e.target.closest("[data-resolver]")?.dataset.resolver;
    if (!id) return;
    store.reportedIds = store.reportedIds.filter((r) => r.id !== id);
    renderQuality();
    renderSettings();
  });

  $("check-btn").addEventListener("click", evaluate);
  $("feedback-next").addEventListener("click", nextItem);
  $("lesson-quit").addEventListener("click", () => {
    stopSpeech();
    if (session.i > 0 && !window.confirm("¿Salir de la lección? Perderás el progreso de esta sesión.")) return;
    goto(session.blockIds ? "study" : "path");
  });

  $("results-continue").addEventListener("click", () => goto(session.blockIds ? "study" : "path"));
  $("results-repeat").addEventListener("click", () => {
    if (session.lessonIndex !== null) startLesson(session.lessonIndex);
    else if (session.blockIds) startEnglishBlock(session.blockIds, session.blockLabel);
    else if (session.bank) startEnglishBank();
    else if (session.unseen) startUnseen();
    else if (session.review) startReview();
    else startPractice(session.practice.source, session.practice.tier);
  });

  document.querySelectorAll("#practice-tier button").forEach((b) =>
    b.addEventListener("click", () => { store.practiceTier = Number(b.dataset.tier); renderPractice(); }));
  document.querySelectorAll("#eng-bank button").forEach((b) =>
    b.addEventListener("click", () => { store.engBank = b.dataset.bank; renderEnglishBank(); }));
  document.querySelectorAll("#eng-mode button").forEach((b) =>
    b.addEventListener("click", () => { store.engMode = b.dataset.mode; renderEnglishBank(); }));
  $("eng-start").addEventListener("click", startEnglishBank);
  $("eng-guide-btn").addEventListener("click", () => goto("study"));
  $("study-back").addEventListener("click", () => goto("practice"));
  studyView = createStudy($("study-body"), {
    items: () => REAL,
    seen: () => store.seenIds,
    missed: () => store.missedIds,
    bank: () => (store.engBank === "b2" ? "b2" : "b1"),
    setBank: (b) => { store.engBank = b; },
    startBlock: startEnglishBlock,
  });
  $("eng-fails-btn").addEventListener("click", () => {
    const box = $("eng-fails");
    if (!box.classList.contains("hidden")) { box.classList.add("hidden"); return; }
    const items = buildEnglishBankLesson(store.engBank, { onlyMissed: true, missedIds: store.missedIds });
    box.innerHTML = failCardsHtml(items.map((item) => ({ item, mine: null })));
    box.classList.remove("hidden");
  });
  document.querySelectorAll("#practice-listen-level button").forEach((b) =>
    b.addEventListener("click", () => { store.listenLevel = b.dataset.level; renderPractice(); }));
  document.querySelectorAll("#practice-origen-filter button, #settings-origen-filter button").forEach((b) =>
    b.addEventListener("click", () => {
      store.origenFilter = b.dataset.origen;
      paintOrigenFilter("#practice-origen-filter");
      paintOrigenFilter("#settings-origen-filter");
    }));

  $("comp-start-likert").addEventListener("click", () => startCompetencias("likert"));
  $("comp-start-forced").addEventListener("click", () => startCompetencias("forced"));
  $("comp-next-btn").addEventListener("click", nextCompItem);
  $("comp-quit").addEventListener("click", () => {
    if (comp.i > 0 && comp.i < comp.items.length && !window.confirm("¿Salir? No se guarda nada porque no hay progreso que perder.")) return;
    goto("practice");
  });

  $("speak-timer").addEventListener("click", toggleSpeak);
  $("speak-new").addEventListener("click", () => { newPrompt(); resetSpeak(); });

  document.querySelectorAll("#theme-picker button").forEach((b) =>
    b.addEventListener("click", () => { store.theme = b.dataset.themeSet; applyTheme(); }));
  document.querySelectorAll("#hearts-picker button").forEach((b) =>
    b.addEventListener("click", () => { store.heartsOn = b.dataset.hearts === "on"; renderSettings(); }));
  $("exam-date").addEventListener("change", (e) => {
    if (e.target.value) { store.examDate = e.target.value; renderPath(); }
  });
  $("study-hours").addEventListener("change", (e) => {
    const h = Number(e.target.value);
    if (h > 0 && h <= 16) { store.studyHours = h; renderPath(); paintStudyDays(); }
  });
  $("study-days").addEventListener("change", (e) => {
    const k = e.target.dataset.day;
    if (!k) return;
    const map = store.studyDays;
    const h = e.target.value === "" ? NaN : Number(e.target.value);
    if (Number.isFinite(h) && h >= 0 && h <= 16) map[k] = h; else delete map[k];
    store.studyDays = map;
    renderPath();
  });

  // Botón flotante del ritmo: abre/cierra el detalle y salta a mi lección u objetivo.
  $("plan-pill").addEventListener("click", () => {
    const pop = $("plan-pop");
    pop.classList.toggle("hidden");
    $("plan-pill").setAttribute("aria-expanded", String(!pop.classList.contains("hidden")));
  });
  $("plan-pop").addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]")?.dataset.go;
    if (!go) return;
    if (go === "review") { $("plan-pop").classList.add("hidden"); startReview(); return; }
    if (go === "unseen") { $("plan-pop").classList.add("hidden"); startUnseen(); return; }
    const path = $("path");
    const y = go === "target"
      ? Number(path.dataset.targetY)
      : (path.querySelector(".node--current")?.getBoundingClientRect().top ?? 0) - path.getBoundingClientRect().top + path.scrollTop;
    path.scrollTo({ top: Math.max(0, y - path.clientHeight / 2), behavior: "smooth" });
    $("plan-pop").classList.add("hidden");
    $("plan-pill").setAttribute("aria-expanded", "false");
  });
  window.addEventListener("resize", () => { if ($("screen-path").classList.contains("active")) refreshPlan(); });

  $("reset-progress").addEventListener("click", () => {
    if (!window.confirm("¿Reiniciar todo el progreso (camino, racha y XP)? No se puede deshacer.")) return;
    Object.keys(localStorage).filter((k) => k.startsWith(K)).forEach((k) => localStorage.removeItem(k));
    applyTheme(); goto("path");
  });

  $("check-update").addEventListener("click", checkForUpdate);
  $("force-update").addEventListener("click", hardResetApp);
  $("update-reload").addEventListener("click", cleanReload);

  goto("path");
}

/* ============================== service worker / actualizaciones ==============================
   Cache-first: si esta pestaña quedó abierta días (típico en una PWA instalada), puede
   seguir sirviendo JS/datos viejos aunque haya un fix en el servidor. Aquí:
   - se registra el SW al cargar y se le pide comprobar actualización cada vez que la
     pestaña vuelve a primer plano (no solo confiar en el intervalo ~24h del navegador);
   - "Buscar actualizaciones" en Ajustes hace lo mismo a demanda, con feedback visible;
   - cuando un SW nuevo toma el control (nunca en la primera visita: ver
     hadControllerAtLoad), se avisa con un banner en vez de recargar solo y tirar una
     lección a medias. */
let swRegistration = null;

function initServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const hadControllerAtLoad = Boolean(navigator.serviceWorker.controller);
  let refreshed = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadControllerAtLoad || refreshed) return;
    refreshed = true;
    $("update-status").textContent = "";
    $("update-banner").hidden = false;
  });

  // Esto corre al cargar la página, ANTES de la pantalla de contraseña. Antes colgaba de
  // init() (que solo se ejecuta tras desbloquear, con el evento "load" ya pasado), así que
  // el service worker nunca se registraba ni se comprobaba la versión: la causa de que la
  // app se quedara en versiones viejas.
  const start = () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then((reg) => {
        swRegistration = reg;
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") { reg.update().catch(() => {}); checkServerVersion(); }
        });
      })
      .catch(() => {});
    checkServerVersion();
    setInterval(checkServerVersion, 5 * 60 * 1000);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
}

/** Red de seguridad independiente del service worker: pide version.js al servidor sin
 *  caché y, si su versión no es la del código que está corriendo, avisa con el banner. */
async function checkServerVersion() {
  try {
    const res = await fetch(`./js/version.js?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const m = /APP_VERSION\s*=\s*"([^"]+)"/.exec(await res.text());
    if (m && m[1] !== APP_VERSION) {
      // Aún en la pantalla de contraseña no hay nada que perder: se actualiza solo (una vez
      // por versión, para no entrar en bucle si el servidor aún está publicando).
      if ($("gate-overlay") && sessionStorage.getItem("aena-autoupdate") !== m[1]) {
        sessionStorage.setItem("aena-autoupdate", m[1]);
        cleanReload();
        return;
      }
      $("update-status").textContent = "";
      $("update-banner").hidden = false;
    }
  } catch { /* sin red: nada que comparar */ }
}

/** Desregistra el service worker, borra sus cachés y recarga (el progreso vive en
 *  localStorage y no se toca). Es lo que hace "Actualizar ahora" del banner. */
function cleanReload() {
  const done = () => window.location.reload();
  if (!("serviceWorker" in navigator)) { done(); return; }
  navigator.serviceWorker.getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .then(() => ("caches" in window ? caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith("aena-img")).map((k) => caches.delete(k)))) : null))
    .finally(done);
}

function checkForUpdate() {
  const statusEl = $("update-status");
  if (!swRegistration) { statusEl.textContent = "Todavía no hay una versión instalada para comparar."; return; }
  statusEl.textContent = "Buscando actualizaciones…";
  // "updatefound" salta en cuanto el navegador compara byte a byte service-worker.js y
  // ve que cambió -- eso es rápido (una petición de red), pase lo que pase después. NO
  // esperar a que además termine de instalar+precachear (~24 ficheros: puede tardar
  // varios segundos en 4G) para decidir si hay o no actualización -- ese fue el bug: un
  // timeout corto decía "ya tienes la última" mientras la descarga seguía en marcha.
  let found = false;
  const onFound = () => {
    found = true;
    statusEl.textContent = "Hay una versión nueva descargándose… dale un momento, no cierres la app.";
  };
  swRegistration.addEventListener("updatefound", onFound, { once: true });
  swRegistration.update()
    .then(() => {
      setTimeout(() => {
        swRegistration.removeEventListener("updatefound", onFound);
        if (!found) statusEl.textContent = "Ya tienes la última versión.";
      }, 4000);
    })
    .catch(() => {
      swRegistration.removeEventListener("updatefound", onFound);
      statusEl.textContent = "No se pudo comprobar (¿sin conexión?).";
    });
}

/** Vía de escape si, aun así, se queda pillada en una versión vieja: desregistra el
 *  service worker, borra su caché y recarga desde cero. El progreso no se toca (vive
 *  en localStorage, aparte de la caché del service worker). */
function hardResetApp() {
  if (!window.confirm("Esto fuerza una descarga completa de la app (no borra tu progreso). ¿Continuar?")) return;
  const statusEl = $("update-status");
  statusEl.textContent = "Forzando actualización…";
  const done = () => window.location.reload();
  if (!("serviceWorker" in navigator)) { done(); return; }
  navigator.serviceWorker.getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .then(() => ("caches" in window ? caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) : null))
    .finally(done);
}

/* ============================== pantalla de acceso ============================== */
// Repo público: las preguntas reales viajan cifradas en data/real.enc.json
// (AES-GCM-256, clave derivada por PBKDF2-SHA256 con el salt/iteraciones del propio
// archivo — ver scripts/encrypt.mjs). La contraseña nunca se guarda ni se compara en
// claro: si es incorrecta, el descifrado falla (el tag de autenticación de AES-GCM no
// valida) y ese error es la señal de "contraseña incorrecta".
function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function decryptReal(password) {
  const res = await fetch("./data/real.enc.json");
  const { ciphertext, salt, iv, iterations } = await res.json();
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64ToBytes(salt), iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(iv) }, key, b64ToBytes(ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function checkGate() {
  const overlay = $("gate-overlay");
  const input = $("gate-password");
  const error = $("gate-error");
  const submit = $("gate-submit");
  const tryUnlock = async () => {
    if (!input.value) return;
    submit.disabled = true;
    error.classList.add("hidden");
    try {
      loadReal(await decryptReal(input.value));
      overlay.remove();
      init();
    } catch {
      error.classList.remove("hidden");
      input.value = "";
      input.focus();
    } finally {
      submit.disabled = false;
    }
  };
  submit.addEventListener("click", tryUnlock);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  input.focus();
}
document.addEventListener("DOMContentLoaded", () => { initServiceWorker(); checkGate(); });
