// Render de ítems: texto, figuras SVG, matrices, listening y banco de palabras.
// No contiene lógica de progresión (eso vive en app.js).

const KEYS = ["A", "B", "C", "D", "E", "F"];

/* ------------------------------- figuras ------------------------------- */
const DOT_POS = [[20, 20], [36, 20], [52, 20], [20, 36], [36, 36], [52, 36], [20, 52], [36, 52], [52, 52]];

function polyPoints(n, r = 24, cx = 36, cy = 36) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function fig(spec) {
  const svg = (inner, label) =>
    `<svg width="72" height="72" viewBox="0 0 72 72" role="img" aria-label="${label}">${inner}</svg>`;

  if (spec.k === "arrow") {
    return svg(
      `<g transform="rotate(${spec.a} 36 36)"><line x1="16" y1="36" x2="52" y2="36" stroke="var(--blue)" stroke-width="6" stroke-linecap="round"/><path d="M50 26 L64 36 L50 46 Z" fill="var(--blue)"/></g>`,
      `Flecha girada ${spec.a} grados`);
  }
  if (spec.k === "dots") {
    let d = "";
    for (let i = 0; i < spec.n && i < 9; i++) d += `<circle cx="${DOT_POS[i][0]}" cy="${DOT_POS[i][1]}" r="6" fill="var(--purple)"/>`;
    return svg(d, `${spec.n} puntos`);
  }
  if (spec.k === "poly") {
    return svg(`<polygon points="${polyPoints(spec.n)}" fill="none" stroke="var(--green)" stroke-width="5" stroke-linejoin="round"/>`,
      `Polígono de ${spec.n} lados`);
  }
  if (spec.k === "sqfill") {
    const m = [[18, 18], [54, 18], [54, 54], [18, 54]][spec.p];
    return svg(
      `<rect x="14" y="14" width="44" height="44" fill="${spec.fill ? "var(--orange)" : "none"}" stroke="var(--orange)" stroke-width="5"/><circle cx="${m[0]}" cy="${m[1]}" r="6" fill="${spec.fill ? "#fff" : "var(--orange)"}"/>`,
      `Cuadrado ${spec.fill ? "relleno" : "sin relleno"}, punto en esquina ${spec.p + 1}`);
  }
  if (spec.k === "combo") {
    const inner = [];
    inner.push(`<polygon points="${polyPoints(spec.n)}" fill="${spec.fill ? "var(--blue)" : "none"}" stroke="var(--blue)" stroke-width="5" stroke-linejoin="round"/>`);
    const dotFill = spec.fill ? "#fff" : "var(--blue)";
    const centers = [[36, 36], [26, 40], [46, 40], [31, 28], [41, 28], [36, 48], [36, 24]];
    for (let i = 0; i < spec.dots && i < centers.length; i++) {
      inner.push(`<circle cx="${centers[i][0]}" cy="${centers[i][1]}" r="4" fill="${dotFill}"/>`);
    }
    const body = spec.rot !== undefined ? `<g transform="rotate(${spec.rot} 36 36)">${inner.join("")}</g>` : inner.join("");
    return svg(body, `Figura de ${spec.n} lados, ${spec.fill ? "rellena" : "sin relleno"}, ${spec.dots} puntos${spec.rot !== undefined ? `, girada ${spec.rot} grados` : ""}`);
  }
  if (spec.k === "grid") {
    let d = "";
    for (let i = 0; i < 9; i++) {
      const x = 8 + (i % 3) * 19, y = 8 + Math.floor(i / 3) * 19;
      d += `<rect x="${x}" y="${y}" width="17" height="17" rx="3" fill="${spec.cells[i] ? "var(--green)" : "none"}" stroke="var(--border-strong)" stroke-width="2"/>`;
    }
    return svg(d, `Rejilla con ${spec.cells.filter(Boolean).length} casillas pintadas`);
  }
  return "";
}

/* ------------------------------- enunciado ------------------------------- */
const REAL_BADGE = `<span class="badge-real" title="Pregunta tal cual apareció en una convocatoria oficial">REAL · examen oficial</span>`;

export function renderQuestion(item, el, onListen) {
  const badge = item.isReal ? REAL_BADGE : "";
  if (item.kind === "figure-series") {
    el.innerHTML = `${badge}<p class="question">¿Qué figura continúa la serie?</p>
      <div class="figrow">${item.seq.map((f) => `<div class="fig">${fig(f)}</div>`).join("")}<div class="qmark" aria-label="incógnita">?</div></div>`;
  } else if (item.kind === "matrix") {
    el.innerHTML = `${badge}<p class="question">¿Qué figura completa la matriz?</p>
      <div class="matrix">${item.cells.map((c) => `<div class="mcell">${c ? fig(c) : '<span class="qmark" aria-label="incógnita">?</span>'}</div>`).join("")}</div>`;
  } else if (item.kind === "figure-real") {
    el.innerHTML = `${badge}<p class="question">${item.prompt}</p>
      <div class="figreal"><img src="./public/assets/exams/${item.image}" alt="Figura del examen real" loading="lazy"></div>`;
  } else if (item.kind === "listen") {
    el.innerHTML = `${badge}<p class="question">${item.prompt}</p>
      <button type="button" class="btn btn--blue" id="listen-btn"><span aria-hidden="true">🔊</span> Escuchar</button>
      <p class="note" style="margin-top:8px">Puedes repetirlo las veces que quieras.</p>`;
    el.querySelector("#listen-btn")?.addEventListener("click", () => onListen(item.audio));
  } else {
    el.innerHTML = `${badge}<p class="question">${item.prompt}</p>`;
  }
}

/* ------------------------------- respuestas ------------------------------- */
/** Opciones tipo test. onChange(index|null) informa de la selección actual. */
export function renderOptions(item, el, onChange) {
  const isFig = item.kind === "figure-series" || item.kind === "matrix";
  el.className = isFig ? "options options--figs" : "options";
  el.innerHTML = item.options
    .map((o, i) => {
      const content = isFig ? `<span class="fig">${fig(o)}</span>` : `<span>${o}</span>`;
      return `<button type="button" class="option" data-i="${i}" aria-pressed="false"><span class="option__key">${KEYS[i]}</span>${content}</button>`;
    })
    .join("");
  let selected = null;
  el.querySelectorAll(".option").forEach((btn) => {
    btn.addEventListener("click", () => {
      selected = Number(btn.dataset.i);
      el.querySelectorAll(".option").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      onChange(selected);
    });
  });
}

/** Banco de palabras: se construye la frase tocando fichas. */
export function renderWordbank(item, el, onChange) {
  el.className = "wordbank";
  el.innerHTML = `
    <div class="wordbank__answer" id="wb-answer" aria-label="Tu respuesta"></div>
    <div class="wordbank__pool" id="wb-pool" aria-label="Palabras disponibles"></div>`;
  const answerEl = el.querySelector("#wb-answer");
  const poolEl = el.querySelector("#wb-pool");
  const chosen = [];
  const used = new Set();

  const paint = () => {
    answerEl.innerHTML = chosen
      .map((c) => `<button type="button" class="tile" data-pos="${c.id}">${c.word}</button>`)
      .join("");
    poolEl.innerHTML = item.tokens
      .map((w, i) => used.has(i)
        ? `<span class="tile tile--placeholder" aria-hidden="true">${w}</span>`
        : `<button type="button" class="tile" data-pool="${i}">${w}</button>`)
      .join("");
    answerEl.querySelectorAll("[data-pos]").forEach((b) => b.addEventListener("click", () => {
      const id = Number(b.dataset.pos);
      const idx = chosen.findIndex((c) => c.id === id);
      if (idx >= 0) { used.delete(chosen[idx].id); chosen.splice(idx, 1); paint(); }
    }));
    poolEl.querySelectorAll("[data-pool]").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.pool);
      used.add(i); chosen.push({ id: i, word: item.tokens[i] }); paint();
    }));
    onChange(chosen.length ? chosen.map((c) => c.word) : null);
  };
  paint();
}

/** Marca visualmente acierto/error (color + icono + texto, nunca solo color). */
export function markOptions(el, correctIndex, chosenIndex) {
  const btns = el.querySelectorAll(".option");
  btns.forEach((b) => { b.disabled = true; b.setAttribute("aria-pressed", "false"); });
  btns[correctIndex]?.classList.add("is-correct");
  if (chosenIndex !== null && chosenIndex !== correctIndex) btns[chosenIndex]?.classList.add("is-wrong");
}

export function lockWordbank(el) {
  el.querySelectorAll("button").forEach((b) => { b.disabled = true; });
}

/* ------------------------------- audio ------------------------------- */
export function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch (e) { /* sin Web Speech el listening sigue siendo legible tras responder */ }
}
export function stopSpeech() {
  try { window.speechSynthesis.cancel(); } catch (e) { /* no-op */ }
}
