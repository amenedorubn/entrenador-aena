// Motor de render de ítems: texto, figuras SVG, matriz 3×3 y listening.
// No contiene lógica de negocio (eso vive en app.js); solo pinta lo que le pasan.

const KEYS = ["A", "B", "C", "D"];

/** Dibuja una figura abstracta a partir de su spec {k,...}. */
export function fig(spec) {
  const s = 72, c = 36;
  if (spec.k === "arrow") {
    return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="Flecha rotada ${spec.a} grados"><g transform="rotate(${spec.a} ${c} ${c})"><line x1="16" y1="36" x2="52" y2="36" stroke="#000437" stroke-width="5" stroke-linecap="round"/><path d="M52 26 L64 36 L52 46 Z" fill="#000437"/></g></svg>`;
  }
  if (spec.k === "dots") {
    let d = "";
    const pos = [[20, 20], [36, 20], [52, 20], [20, 36], [36, 36], [52, 36], [20, 52], [36, 52], [52, 52]];
    for (let i = 0; i < spec.n && i < pos.length; i++) { const p = pos[i]; d += `<circle cx="${p[0]}" cy="${p[1]}" r="5.5" fill="#1cb0f6"/>`; }
    return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="${spec.n} puntos">${d}</svg>`;
  }
  if (spec.k === "poly") {
    const n = spec.n, r = 24, pts = [];
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; pts.push([c + r * Math.cos(a), c + r * Math.sin(a)]); }
    return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="Polígono de ${n} lados"><polygon points="${pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")}" fill="none" stroke="#58cc02" stroke-width="4" stroke-linejoin="round"/></svg>`;
  }
  if (spec.k === "sqfill") {
    const m = [[18, 18], [54, 18], [54, 54], [18, 54]][spec.p];
    const f = spec.fill ? "#000437" : "none";
    const dc = spec.fill ? "#ffffff" : "#000437";
    return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="Cuadrado con punto en posición ${spec.p}, relleno ${spec.fill}"><rect x="14" y="14" width="44" height="44" fill="${f}" stroke="#000437" stroke-width="4"/><circle cx="${m[0]}" cy="${m[1]}" r="6" fill="${dc}"/></svg>`;
  }
  return "";
}

/** Pinta el cuerpo de la pregunta (enunciado / figuras / matriz / audio). */
export function renderBody(item, bodyEl, opts = {}) {
  if (item.kind === "figure-series") {
    bodyEl.innerHTML = `<div class="q">¿Qué figura continúa la serie?</div><div class="figrow">${item.seq.map((f) => `<div class="fig">${fig(f)}</div>`).join("")}<div class="qmark" aria-hidden="true">?</div></div>`;
  } else if (item.kind === "matrix") {
    bodyEl.innerHTML = `<div class="q">¿Qué figura completa la matriz?</div><div class="matrix">${item.cells.map((cc) => `<div class="mcell">${cc ? fig(cc) : '<span class="qmark" aria-hidden="true">?</span>'}</div>`).join("")}</div>`;
  } else if (item.kind === "listen") {
    bodyEl.innerHTML = `<div class="q">${item.prompt}</div><div style="margin:12px 0"><button type="button" class="btn ghost" id="listen-btn">▶ Escuchar</button> <span class="muted">Puedes repetir las veces que quieras.</span></div>`;
    const btn = bodyEl.querySelector("#listen-btn");
    if (btn) btn.addEventListener("click", () => speak(item.audio));
  } else {
    bodyEl.innerHTML = `<div class="q">${item.prompt}</div>`;
  }
}

/** Pinta las opciones de respuesta y engancha el click. onSelect(idx) se llama una vez. */
export function renderOptions(item, optsEl, onSelect) {
  const isFig = item.kind === "figure-series" || item.kind === "matrix";
  optsEl.className = isFig ? "opts figs" : "opts";
  optsEl.innerHTML = item.options.map((o, idx) => {
    const label = isFig ? `<span class="fig">${fig(o)}</span>` : `<span>${o}</span>`;
    return `<button type="button" class="opt${isFig ? " figopt" : ""}" data-idx="${idx}" aria-label="Opción ${KEYS[idx]}"><span class="k">${KEYS[idx]}</span>${label}</button>`;
  }).join("");
  optsEl.querySelectorAll(".opt").forEach((btn) => {
    btn.addEventListener("click", () => onSelect(Number(btn.dataset.idx)), { once: true });
  });
}

/** Aplica estilos de acierto/error tras responder (color + icono + texto, nunca solo color). */
export function markAnswered(optsEl, correctIndex, chosenIndex) {
  const btns = optsEl.querySelectorAll(".opt");
  btns.forEach((b) => b.setAttribute("disabled", ""));
  btns[correctIndex].classList.add("correct");
  if (chosenIndex !== correctIndex) btns[chosenIndex].classList.add("wrong");
}

/** Web Speech API — inglés británico, repetible. */
export function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch (e) { /* Web Speech no disponible: el listening sigue siendo legible por texto tras responder */ }
}
