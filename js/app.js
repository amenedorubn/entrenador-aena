import {
  WORLDS, LESSONS, PASS_THRESHOLD, QUESTIONS_PER_LESSON, HEARTS,
  isPassed, lessonState, currentLessonIndex, unitProgress, worldProgress, worldUnlocked, totalPassed,
} from "./curriculum.js";
import { buildLesson, buildReviewLesson, makeItem, SOURCE_LABELS, SOURCES } from "./content.js";
import { renderQuestion, renderOptions, renderWordbank, markOptions, lockWordbank, speakItem, stopSpeech, optionText, transcriptText } from "./engine.js";
import { LEVELS as LISTEN_LEVELS, LEVEL_LABEL as LISTEN_LEVEL_LABEL } from "../data/listening.js";
import { SPEAKING_PROMPTS } from "../data/english.js";
import { LIKERT_SCALE, LIKERT_ITEMS, FORCED_CHOICE_ITEMS } from "../data/competencias.js";
import { loadReal, REAL } from "../data/real.js";
import { choice, shuffle } from "./rng.js";
import { APP_VERSION } from "./version.js";

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
  get missedIds() { return get("missedIds", []); },
  set missedIds(v) { set("missedIds", v); },
  // Preguntas reales que el propio usuario marcó con "Reportar fallo" tras responder.
  // [{ id, ts }]. Solo se guarda una vez por id (reportar dos veces actualiza ts).
  get reportedIds() { return get("reportedIds", []); },
  set reportedIds(v) { set("reportedIds", v); },
};

/* ============================== utilidades DOM ============================== */
const $ = (id) => document.getElementById(id);
const SCREENS = ["path", "practice", "speaking", "profile", "settings", "quality", "lesson", "results", "competencias"];
const NAV_SCREENS = new Set(["path", "practice", "speaking", "profile", "settings"]);

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
      html += `<div class="unit-banner" style="background:${w.color}">
          <div>
            <div class="unit-banner__eyebrow">Mundo ${wi + 1} · Unidad ${ui + 1}</div>
            <div class="unit-banner__title">${u.title}</div>
            <div class="unit-banner__sub">${u.subtitle}</div>
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
  container.querySelectorAll("[data-trophy]").forEach((b) =>
    b.addEventListener("click", () => alert("¡Unidad completada! Sigue avanzando por el camino.")));

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
  lessonIndex: null, practice: null, review: false, selection: null, answered: false,
};

function startLesson(index) {
  const l = LESSONS[index];
  session.lessonIndex = index;
  session.practice = null;
  session.review = false;
  session.items = buildLesson(l.sources, l.tier, QUESTIONS_PER_LESSON, { origenFilter: store.origenFilter });
  beginSession(`Mundo ${l.worldIndex + 1} · Unidad ${l.unitIndex + 1} · Lección ${l.lessonIndex + 1}`);
}

function startPractice(source, tier) {
  session.lessonIndex = null;
  session.practice = { source, tier };
  session.review = false;
  const opts = { origenFilter: store.origenFilter };
  if (source === "listen" && store.listenLevel !== "any") opts.level = store.listenLevel;
  session.items = buildLesson([source], tier, QUESTIONS_PER_LESSON, opts);
  const kicker = opts.level
    ? `Práctica libre · ${SOURCE_LABELS[source]} · ${LISTEN_LEVEL_LABEL[opts.level]}`
    : `Práctica libre · ${SOURCE_LABELS[source]} · nivel ${tier}`;
  beginSession(kicker);
}

/** Repasa exactamente las preguntas reales falladas la última vez (store.missedIds),
 *  sin límite de vidas -- el objetivo es verlas todas, no acertar una racha. */
function startReview() {
  const ids = store.missedIds;
  if (!ids.length) return;
  session.lessonIndex = null;
  session.practice = null;
  session.review = true;
  session.items = buildReviewLesson(ids);
  const n = session.items.length;
  beginSession(`Repasar fallos · ${n} pregunta${n === 1 ? "" : "s"}`);
}

function beginSession(kicker) {
  session.i = 0; session.correct = 0;
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

function renderCurrentItem() {
  const item = ensureRenderable(session.items[session.i]);
  session.items[session.i] = item;
  session.selection = null;
  session.answered = false;

  $("lesson-progress").style.width = `${(session.i / session.items.length) * 100}%`;
  $("hearts-count").textContent = session.hearts;
  $("feedback").classList.remove("show", "good", "bad");
  $("check-foot").classList.remove("hidden");
  const check = $("check-btn");
  check.disabled = true;
  check.textContent = "Comprobar";

  renderQuestion(item, $("lesson-question"), speakItem);
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

function evaluate() {
  if (session.answered) return;
  session.answered = true;
  const item = session.items[session.i];
  const answerEl = $("lesson-answer");

  let good;
  if (item.kind === "wordbank") {
    good = Array.isArray(session.selection) && session.selection.join(" ") === item.answer.join(" ");
    lockWordbank(answerEl);
  } else {
    good = session.selection === item.correctIndex;
    markOptions(answerEl, item.correctIndex, session.selection);
  }

  if (good) session.correct++;
  else if (session.hearts !== Infinity) session.hearts = Math.max(0, session.hearts - 1);
  $("hearts-count").textContent = session.hearts;

  // Solo las preguntas reales tienen id estable entre sesiones (las generadas se
  // recrean cada vez, no hay "la misma" que repasar). Se guarda mientras se siga
  // fallando; se quita en cuanto se acierta -- la lista es "lo que sigue pendiente".
  if (item.isReal && item.id) {
    const missed = store.missedIds;
    const idx = missed.indexOf(item.id);
    if (!good && idx === -1) { missed.push(item.id); store.missedIds = missed; }
    else if (good && idx !== -1) { missed.splice(idx, 1); store.missedIds = missed; }
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
    sol.textContent = `Respuesta correcta: ${correctLabel}`;
  } else {
    sol.classList.add("hidden");
  }

  let text = item.explanation ?? "";
  if (item.kind === "listen") text += `<br><br><b>Transcripción:</b><br>${transcriptText(item)}`;
  $("feedback-text").innerHTML = text;

  const reportBtn = $("feedback-report");
  if (item.isReal && item.id) {
    reportBtn.classList.remove("hidden");
    reportBtn.disabled = false;
    reportBtn.textContent = "⚠️ Reportar fallo en esta pregunta";
    reportBtn.dataset.id = item.id;
  } else {
    reportBtn.classList.add("hidden");
  }

  $("check-foot").classList.add("hidden");
  const isLast = session.i === session.items.length - 1;
  const outOfHearts = session.hearts === 0;
  $("feedback-next").textContent = outOfHearts ? "Ver resultado" : isLast ? "Ver resultado" : "Continuar";
  $("feedback-next").focus();
}

function nextItem() {
  stopSpeech();
  if (session.hearts === 0) return finish();
  session.i++;
  if (session.i >= session.items.length) return finish();
  renderCurrentItem();
}

function finish() {
  stopSpeech();
  const total = session.items.length;
  const pct = Math.round((session.correct / total) * 100);
  const passed = pct >= PASS_THRESHOLD * 100;
  const ranOut = session.hearts === 0;

  // XP: 10 por acierto + 20 de bonus al superar una lección del camino.
  const xpGain = session.correct * 10 + (passed && session.lessonIndex !== null ? 20 : 0);
  store.xp = store.xp + xpGain;
  bumpStreak();

  if (session.lessonIndex !== null) {
    const key = LESSONS[session.lessonIndex].key;
    const prog = store.progress;
    if (pct > (prog[key] ?? 0)) { prog[key] = pct; store.progress = prog; }
  }

  const stillMissed = session.review ? store.missedIds.length : null;

  $("results-spark").textContent = ranOut ? "💔" : passed ? (pct === 100 ? "🌟" : "🎉") : "💪";
  $("results-title").textContent = session.review
    ? (stillMissed === 0 ? "¡Repaso completo!" : "Repaso terminado")
    : ranOut
      ? "Te has quedado sin vidas"
      : pct === 100 ? "¡Perfecto!" : passed ? "¡Lección superada!" : "Casi";
  $("results-sub").textContent = session.review
    ? (stillMissed === 0
        ? "Ya no te queda ninguna pregunta pendiente de repasar."
        : `Te quedan ${stillMissed} pregunta${stillMissed === 1 ? "" : "s"} por dominar. Repite el repaso cuando quieras.`)
    : ranOut
      ? "Repite la lección: los fallos se explican uno a uno."
      : passed
        ? (session.lessonIndex !== null ? "Has desbloqueado la siguiente lección." : "Buen trabajo. Sigue practicando.")
        : `Necesitas un ${PASS_THRESHOLD * 100} % para superar la lección. Repasa las explicaciones y repite.`;
  $("results-xp").textContent = `+${xpGain}`;
  $("results-acc").textContent = `${pct} %`;
  $("results-acc-badge").className = `badge ${passed ? "badge--acc" : "badge--fail"}`;
  $("results-repeat").classList.toggle("hidden", stillMissed === 0);
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
function renderSettings() {
  applyTheme();
  document.querySelectorAll("#hearts-picker button").forEach((b) =>
    b.setAttribute("aria-pressed", String((b.dataset.hearts === "on") === store.heartsOn)));
  $("exam-date").value = store.examDate;
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
          return q
            ? qualityCard(q, `Reportada por ti el ${when}.`, { showCorrect: true })
            : `<div class="qcard"><div class="qcard__id">${r.id}</div><p class="note">Ya no existe en el banco actual (reportada el ${when}).</p></div>`;
        })
        .join("")
    : `<p class="note">No has reportado ninguna pregunta todavía.</p>`;
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
    lines.push(`- ${r.id} (${new Date(r.ts).toLocaleDateString("es-ES")})${q ? `: "${q.prompt}"` : " — ya no existe en el banco"}`);
  }
  const text = lines.join("\n");
  const status = $("q-copy-status");
  navigator.clipboard?.writeText(text)
    .then(() => { status.textContent = "Copiado al portapapeles."; })
    .catch(() => { status.textContent = "No se pudo copiar automáticamente. Abre la consola del navegador y copia desde ahí."; console.log(text); });
}

/* ============================== navegación ============================== */
function goto(name) {
  if (name === "path") renderPath();
  if (name === "practice") renderPractice();
  if (name === "profile") renderProfile();
  if (name === "settings") renderSettings();
  if (name === "quality") renderQuality();
  if (name === "speaking") { newPrompt(); resetSpeak(); }
  show(name);
}

/* ============================== arranque ============================== */
function init() {
  applyTheme();

  document.querySelectorAll(".navbtn").forEach((b) =>
    b.addEventListener("click", () => goto(b.dataset.nav)));

  $("p-review-btn").addEventListener("click", startReview);
  $("settings-quality-btn").addEventListener("click", () => goto("quality"));
  $("quality-back").addEventListener("click", () => goto("settings"));
  $("q-copy-btn").addEventListener("click", copyQualityReport);
  $("feedback-report").addEventListener("click", (e) => {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const list = store.reportedIds;
    const existing = list.find((r) => r.id === id);
    if (existing) existing.ts = Date.now();
    else list.push({ id, ts: Date.now() });
    store.reportedIds = list;
    e.currentTarget.textContent = "✓ Reportado, gracias";
    e.currentTarget.disabled = true;
  });

  $("check-btn").addEventListener("click", evaluate);
  $("feedback-next").addEventListener("click", nextItem);
  $("lesson-quit").addEventListener("click", () => {
    stopSpeech();
    if (session.i > 0 && !window.confirm("¿Salir de la lección? Perderás el progreso de esta sesión.")) return;
    goto("path");
  });

  $("results-continue").addEventListener("click", () => goto("path"));
  $("results-repeat").addEventListener("click", () => {
    if (session.lessonIndex !== null) startLesson(session.lessonIndex);
    else if (session.review) startReview();
    else startPractice(session.practice.source, session.practice.tier);
  });

  document.querySelectorAll("#practice-tier button").forEach((b) =>
    b.addEventListener("click", () => { store.practiceTier = Number(b.dataset.tier); renderPractice(); }));
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

  $("reset-progress").addEventListener("click", () => {
    if (!window.confirm("¿Reiniciar todo el progreso (camino, racha y XP)? No se puede deshacer.")) return;
    Object.keys(localStorage).filter((k) => k.startsWith(K)).forEach((k) => localStorage.removeItem(k));
    applyTheme(); goto("path");
  });

  $("check-update").addEventListener("click", checkForUpdate);
  $("force-update").addEventListener("click", hardResetApp);
  $("update-reload").addEventListener("click", () => window.location.reload());

  goto("path");
  initServiceWorker();
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

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then((reg) => {
        swRegistration = reg;
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      })
      .catch(() => {});
  });
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
document.addEventListener("DOMContentLoaded", checkGate);
