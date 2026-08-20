import {
  WORLDS, LESSONS, PASS_THRESHOLD, QUESTIONS_PER_LESSON, HEARTS,
  isPassed, lessonState, currentLessonIndex, unitProgress, worldProgress, worldUnlocked, totalPassed,
} from "./curriculum.js";
import { buildLesson, makeItem, SOURCE_LABELS, SOURCES } from "./content.js";
import { renderQuestion, renderOptions, renderWordbank, markOptions, lockWordbank, speak, stopSpeech } from "./engine.js";
import { SPEAKING_PROMPTS } from "../data/english.js";
import { LIKERT_SCALE, LIKERT_ITEMS, FORCED_CHOICE_ITEMS } from "../data/competencias.js";
import { loadReal } from "../data/real.js";
import { choice, shuffle } from "./rng.js";

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
};

/* ============================== utilidades DOM ============================== */
const $ = (id) => document.getElementById(id);
const SCREENS = ["path", "practice", "speaking", "profile", "settings", "lesson", "results", "competencias"];
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
  lessonIndex: null, practice: null, selection: null, answered: false,
};

function startLesson(index) {
  const l = LESSONS[index];
  session.lessonIndex = index;
  session.practice = null;
  session.items = buildLesson(l.sources, l.tier, QUESTIONS_PER_LESSON);
  beginSession(`Mundo ${l.worldIndex + 1} · Unidad ${l.unitIndex + 1} · Lección ${l.lessonIndex + 1}`);
}

function startPractice(source, tier) {
  session.lessonIndex = null;
  session.practice = { source, tier };
  session.items = buildLesson([source], tier, QUESTIONS_PER_LESSON);
  beginSession(`Práctica libre · ${SOURCE_LABELS[source]} · nivel ${tier}`);
}

function beginSession(kicker) {
  session.i = 0; session.correct = 0;
  session.hearts = store.heartsOn && session.practice === null ? HEARTS : Infinity;
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

  renderQuestion(item, $("lesson-question"), speak);
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
  if (item.kind === "listen") speak(item.audio);
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
    sol.textContent = `Respuesta correcta: ${item.kind === "wordbank" ? item.answer.join(" ") : item.options[item.correctIndex]}`;
  } else {
    sol.classList.add("hidden");
  }

  let text = item.explanation ?? "";
  if (item.kind === "listen") text += `<br><br><b>Transcripción:</b> ${item.audio}`;
  $("feedback-text").innerHTML = text;

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

  $("results-spark").textContent = ranOut ? "💔" : passed ? (pct === 100 ? "🌟" : "🎉") : "💪";
  $("results-title").textContent = ranOut
    ? "Te has quedado sin vidas"
    : pct === 100 ? "¡Perfecto!" : passed ? "¡Lección superada!" : "Casi";
  $("results-sub").textContent = ranOut
    ? "Repite la lección: los fallos se explican uno a uno."
    : passed
      ? (session.lessonIndex !== null ? "Has desbloqueado la siguiente lección." : "Buen trabajo. Sigue practicando.")
      : `Necesitas un ${PASS_THRESHOLD * 100} % para superar la lección. Repasa las explicaciones y repite.`;
  $("results-xp").textContent = `+${xpGain}`;
  $("results-acc").textContent = `${pct} %`;
  $("results-acc-badge").className = `badge ${passed ? "badge--acc" : "badge--fail"}`;
  $("results-repeat").classList.toggle("hidden", false);
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
}

/* ============================== perfil ============================== */
function renderProfile() {
  const progress = store.progress;
  $("p-streak").textContent = store.streak;
  $("p-xp").textContent = store.xp;
  $("p-lessons").textContent = `${totalPassed(progress)}/${LESSONS.length}`;
  $("p-days").textContent = daysLeft();
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
}

/* ============================== navegación ============================== */
function goto(name) {
  if (name === "path") renderPath();
  if (name === "practice") renderPractice();
  if (name === "profile") renderProfile();
  if (name === "settings") renderSettings();
  if (name === "speaking") { newPrompt(); resetSpeak(); }
  show(name);
}

/* ============================== arranque ============================== */
function init() {
  applyTheme();

  document.querySelectorAll(".navbtn").forEach((b) =>
    b.addEventListener("click", () => goto(b.dataset.nav)));

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
    else startPractice(session.practice.source, session.practice.tier);
  });

  document.querySelectorAll("#practice-tier button").forEach((b) =>
    b.addEventListener("click", () => { store.practiceTier = Number(b.dataset.tier); renderPractice(); }));

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

  goto("path");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  }
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
