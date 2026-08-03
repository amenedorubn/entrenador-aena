import { VERBAL } from "../data/verbal.js";
import { GRAMMAR } from "../data/grammar.js";
import { SJT } from "../data/sjt.js";
import { LISTENING } from "../data/listening.js";
import { SPEAKING_PROMPTS } from "../data/speaking.js";
import { generateNumeric, generateAbstract, shuffle, choice } from "./generators.js";
import { renderBody, renderOptions, markAnswered, speak } from "./engine.js";

/* ============================== almacenamiento ============================== */
const PREFIX = "aena_";
function get(key, fallback) { try { const v = localStorage.getItem(PREFIX + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
function set(key, val) { try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) { /* almacenamiento no disponible (modo privado, etc.): la app sigue funcionando sin persistencia */ } }
function todayStr(d = new Date()) { return d.toISOString().slice(0, 10); }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return todayStr(d); }

/* ============================== estado ============================== */
const NAMES = { verbal: "Verbal", num: "Numérico", abs: "Abstracto", sim: "Simulacro Fase 1", grammar: "Grammar", listen: "Listening", sjt: "Conductual" };
const BLOCKS = Object.keys(NAMES);
const EXAM_DATE = new Date("2026-10-03T09:00:00");

const state = {
  deck: [], i: 0, correct: 0, mode: "verbal", answered: false,
  difficulty: get("difficulty", "dificil"),
  qcount: get("qcount", 10),
  timer: null, secs: 0, countdown: false, remaining: 0,
  spTimer: null, spLeft: 120, spRunning: false,
};

/* ============================== construcción de sesión ============================== */
function shuffleBankItem(it, kind) {
  const items = it.options.map((t, idx) => ({ text: t, correct: idx === it.correctIndex }));
  const shuffled = shuffle(items);
  return { kind, prompt: it.prompt, options: shuffled.map((x) => x.text), correctIndex: shuffled.findIndex((x) => x.correct), explanation: it.explanation, audio: it.audio };
}
function sampleBank(bank, n, kind, difficulty) {
  const pool = difficulty && difficulty !== "mix" ? bank.filter((x) => x.difficulty === difficulty) : bank;
  const source = pool.length >= n ? pool : bank; // si el filtro deja pocos ítems, se usa el banco completo
  return shuffle(source).slice(0, n).map((it) => shuffleBankItem(it, kind));
}
function buildDeck(block, difficulty, n) {
  if (block === "verbal") return sampleBank(VERBAL, n, "text", difficulty);
  if (block === "grammar") return sampleBank(GRAMMAR, n, "text", "mix");
  if (block === "sjt") return sampleBank(SJT, n, "sjt", "mix");
  if (block === "listen") return sampleBank(LISTENING, n, "listen", "mix");
  if (block === "num") return Array.from({ length: n }, () => generateNumeric(difficulty));
  if (block === "abs") return Array.from({ length: n }, () => generateAbstract(difficulty));
  if (block === "sim") {
    const third = Math.max(1, Math.round(n / 3));
    const deck = [
      ...sampleBank(VERBAL, third, "text", "mix"),
      ...Array.from({ length: third }, () => generateNumeric("mix")),
      ...Array.from({ length: n - 2 * third }, () => generateAbstract("mix")),
    ];
    return shuffle(deck);
  }
  return [];
}

/* ============================== DOM refs ============================== */
const $ = (id) => document.getElementById(id);
const screens = ["home", "session", "speaking", "results"];
function show(id) { screens.forEach((s) => $(s).classList.toggle("hidden", s !== id)); window.scrollTo(0, 0); }

/* ============================== sesión ============================== */
function start(block) {
  state.mode = block;
  state.deck = buildDeck(block, state.difficulty, state.qcount);
  state.i = 0; state.correct = 0;
  show("session");
  $("who").textContent = NAMES[block] || block;
  const intro = $("intro");
  if (block === "sjt") {
    intro.style.display = "block";
    intro.innerHTML = `<b>Cómo funciona la Fase 2.</b> El examen real es un cuestionario de personalidad APTO/NO APTO: respóndelo <b>entero</b> y con <b>honestidad y coherencia</b>. Esto es entrenamiento de juicio situacional para que reconozcas las competencias que valora Aena en IC03-A. Marca la opción más alineada.`;
  } else {
    intro.style.display = "none";
  }
  state.countdown = block === "sim";
  state.secs = 0; state.remaining = 600;
  startClock();
  render();
}
function startClock() {
  clearInterval(state.timer);
  updateClock();
  state.timer = setInterval(() => {
    if (state.countdown) { state.remaining--; updateClock(); if (state.remaining <= 0) return finish(); }
    else { state.secs++; updateClock(); }
  }, 1000);
}
function updateClock() {
  const t = state.countdown ? state.remaining : state.secs;
  const m = String(Math.floor(t / 60)).padStart(2, "0"), s = String(t % 60).padStart(2, "0");
  const el = $("clock");
  el.textContent = `${m}:${s}`;
  el.classList.toggle("warn", state.countdown && state.remaining <= 60);
}
function render() {
  state.answered = false;
  const item = state.deck[state.i];
  $("qnum").textContent = `Pregunta ${state.i + 1} de ${state.deck.length}`;
  $("pfill").style.width = `${(state.i / state.deck.length) * 100}%`;
  const nx = $("next"); nx.disabled = true; nx.textContent = state.i === state.deck.length - 1 ? "Ver resultado" : "Siguiente";
  const exp = $("explain"); exp.className = "explain"; exp.innerHTML = "";
  renderBody(item, $("qbody"));
  renderOptions(item, $("opts"), answer);
}
function answer(idx) {
  if (state.answered) return;
  state.answered = true;
  const item = state.deck[state.i];
  markAnswered($("opts"), item.correctIndex, idx);
  const good = idx === item.correctIndex;
  if (good) { state.correct++; addXp(10); }
  const exp = $("explain");
  if (item.kind === "sjt") {
    exp.className = "explain show " + (good ? "good" : "info");
    exp.innerHTML = (good ? "<b>Opción más alineada.</b> " : "<b>Hay una opción más alineada.</b> ") + item.explanation;
  } else {
    exp.className = "explain show " + (good ? "good" : "bad");
    exp.innerHTML = (good ? "<b>Correcto.</b> " : "<b>Incorrecto.</b> ") + item.explanation;
    if (item.kind === "listen") exp.innerHTML += `<div style="margin-top:8px"><b>Transcripción:</b> ${item.audio}</div>`;
  }
  $("next").disabled = false;
}
function next() { if (!state.answered) return; state.i++; if (state.i >= state.deck.length) finish(); else render(); }
function finish() {
  clearInterval(state.timer);
  const total = state.deck.length, pct = total ? Math.round((state.correct / total) * 100) : 0;
  $("rscore").textContent = `${state.correct}/${total}`;
  $("rpct").textContent = `${pct} %`;
  let msg;
  if (state.mode === "sjt") {
    msg = pct >= 80 ? "Alineación alta con las competencias evaluadas. Recuerda: el test real es de personalidad, respóndelo con honestidad." : pct >= 50 ? "Vas reconociendo las competencias clave. Repasa las explicaciones de los fallos." : "Repasa con calma cada situación y su explicación antes de repetir.";
  } else if (pct >= 80) msg = "Nivel de aprobado holgado. Ahora baja el tiempo por pregunta.";
  else if (pct >= 50) msg = "Vas encaminado. Repasa los fallos y repite el bloque.";
  else msg = "Toca base: hazlo despacio leyendo cada explicación, luego repite.";
  $("rmsg").textContent = msg;
  saveBest(state.mode, pct);
  addXp(20);
  bumpStreak();
  show("results");
}
function repeat() { start(state.mode); }
function quit() { clearInterval(state.timer); goHome(); }
function goHome() {
  clearInterval(state.timer); clearInterval(state.spTimer);
  try { window.speechSynthesis.cancel(); } catch (e) { /* no-op */ }
  show("home");
  refreshHome();
}

/* ============================== progreso / gamificación ============================== */
function saveBest(block, pct) {
  const prev = get("best_" + block, 0);
  if (pct > prev) set("best_" + block, pct);
}
function addXp(n) {
  const today = todayStr();
  if (get("xp_today_date", "") !== today) { set("xp_today_date", today); set("xp_today", 0); }
  set("xp_today", get("xp_today", 0) + n);
  set("xp_total", get("xp_total", 0) + n);
}
function bumpStreak() {
  const today = todayStr();
  const last = get("last_play", "");
  if (last === today) return;
  const streak = last === yesterdayStr() ? get("streak", 0) + 1 : 1;
  set("streak", streak);
  set("last_play", today);
}
function resetProgress() {
  if (!window.confirm("¿Reiniciar todo el progreso (racha, XP, mejores puntuaciones)? No se puede deshacer.")) return;
  Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
  refreshHome();
}

const RING_R = 16, RING_C = 2 * Math.PI * RING_R;
function refreshHome() {
  $("days").textContent = Math.max(0, Math.ceil((EXAM_DATE - new Date()) / 86400000));
  $("streak-val").textContent = get("streak", 0);
  const today = todayStr();
  const xpToday = get("xp_today_date", "") === today ? get("xp_today", 0) : 0;
  $("xp-val").textContent = `${xpToday}/50`;
  BLOCKS.forEach((b) => {
    const pct = get("best_" + b, 0);
    const bestEl = $("best-" + b);
    if (bestEl) bestEl.textContent = pct > 0 ? `Mejor: ${pct} %` : "Aún sin intentos";
    const ring = document.querySelector(`.ring[data-block="${b}"] .fill`);
    if (ring) {
      ring.style.strokeDasharray = `${RING_C}`;
      ring.style.strokeDashoffset = `${RING_C * (1 - pct / 100)}`;
    }
  });
  syncDifficultyUI();
  $("qcount").value = String(state.qcount);
}
function syncDifficultyUI() {
  document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.diff === state.difficulty));
  });
}

/* ============================== speaking ============================== */
function openSpeaking() { show("speaking"); newPrompt(); resetSpeakTimer(); }
function newPrompt() { $("sprompt").textContent = choice(SPEAKING_PROMPTS); }
function resetSpeakTimer() { clearInterval(state.spTimer); state.spRunning = false; state.spLeft = 120; renderSpeakClock(); $("stimerbtn").textContent = "Iniciar 2 min"; }
function renderSpeakClock() {
  const m = String(Math.floor(state.spLeft / 60)).padStart(2, "0"), s = String(state.spLeft % 60).padStart(2, "0");
  const el = $("sclock"); el.textContent = `${m}:${s}`; el.classList.toggle("warn", state.spLeft <= 15);
}
function toggleSpeakTimer() {
  const b = $("stimerbtn");
  if (state.spRunning) { clearInterval(state.spTimer); state.spRunning = false; b.textContent = "Reanudar"; return; }
  state.spRunning = true; b.textContent = "Pausar";
  state.spTimer = setInterval(() => {
    state.spLeft--; renderSpeakClock();
    if (state.spLeft <= 0) { clearInterval(state.spTimer); state.spRunning = false; b.textContent = "Iniciar 2 min"; state.spLeft = 120; }
  }, 1000);
}

/* ============================== arranque / wiring ============================== */
function wireHome() {
  document.querySelectorAll("[data-start]").forEach((btn) => btn.addEventListener("click", () => start(btn.dataset.start)));
  $("open-speaking").addEventListener("click", openSpeaking);
  document.querySelectorAll(".diff-btn").forEach((btn) => btn.addEventListener("click", () => { state.difficulty = btn.dataset.diff; set("difficulty", state.difficulty); syncDifficultyUI(); }));
  $("qcount").addEventListener("change", (e) => { state.qcount = Number(e.target.value); set("qcount", state.qcount); });
  $("reset-progress").addEventListener("click", resetProgress);
}
function wireSession() {
  $("quit-btn").addEventListener("click", quit);
  $("next").addEventListener("click", next);
}
function wireSpeaking() {
  $("speaking-home").addEventListener("click", goHome);
  $("stimerbtn").addEventListener("click", toggleSpeakTimer);
  $("newprompt-btn").addEventListener("click", newPrompt);
}
function wireResults() {
  $("results-home").addEventListener("click", goHome);
  $("repeat-btn").addEventListener("click", repeat);
}

function init() {
  wireHome(); wireSession(); wireSpeaking(); wireResults();
  refreshHome();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => { /* offline no crítico */ }));
  }
}
document.addEventListener("DOMContentLoaded", init);
