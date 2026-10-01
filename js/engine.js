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
  if (spec.k === "clock") {
    // hora 12 -> 0° (arriba), hora 3 -> 90° (derecha), ... hora H -> H*30° en sentido horario.
    const angle = (((spec.hour % 12) + 12) % 12) * 30;
    return svg(
      `<circle cx="36" cy="36" r="30" fill="none" stroke="var(--border-strong)" stroke-width="3"/>
       <g transform="rotate(${angle} 36 36)"><line x1="36" y1="36" x2="36" y2="14" stroke="var(--blue)" stroke-width="5" stroke-linecap="round"/></g>
       <circle cx="36" cy="36" r="3" fill="var(--blue)"/>`,
      `Reloj marcando las ${spec.hour}`);
  }
  if (spec.k === "domino") {
    // Distribución de puntos estándar de dominó (0-6) en una rejilla 3x3 local a cada mitad.
    const cols = [12, 20, 28], rows = [27, 36, 45];
    const layout = { 0: [], 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
      6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
    const half = (value, dx) => (layout[value] ?? []).map(([c, r]) =>
      `<circle cx="${cols[c] + dx}" cy="${rows[r]}" r="2.8" fill="var(--purple)"/>`).join("");
    return svg(
      `<rect x="4" y="18" width="64" height="36" rx="5" fill="none" stroke="var(--border-strong)" stroke-width="3"/>
       <line x1="36" y1="18" x2="36" y2="54" stroke="var(--border-strong)" stroke-width="2"/>
       ${half(spec.a, 0)}${half(spec.b, 32)}`,
      `Ficha de dominó, ${spec.a} contra ${spec.b}`);
  }
  return "";
}

/* ------------------------------- enunciado ------------------------------- */
// Tarea 1: TODO ítem no oficial lleva badge, siempre, no solo las figuras generadas
// (antes era la única categoría marcada aparte de REAL) -- que nunca se estudie sin
// saber si lo que hay delante es un examen real, una variante de uno, o inventado
// desde cero. Las tres píldoras comparten formato (mismo tamaño/posición) para que se
// note igual de claro, pero con color propio: oro=oficial, azul=variante, gris=generada.
const BADGE_BY_ORIGEN = {
  oficial: `<span class="badge-real" title="Pregunta tal cual apareció en una convocatoria oficial">REAL · EXAMEN OFICIAL</span>`,
  variante: `<span class="badge-variante" title="Parametrizada a partir de un ítem oficial: misma estructura, datos cambiados">VARIANTE · basada en examen real</span>`,
  generada: `<span class="badge-generated" title="Escrita desde cero imitando el estilo del examen, no es del examen real">GENERADA · práctica</span>`,
};

export function renderQuestion(item, el, onListen, onSkip) {
  const badge = BADGE_BY_ORIGEN[item.origen] ?? "";
  if (item.kind === "listen") return renderListenQuestion(item, el, badge, onListen, onSkip);
  if (item.kind === "figure-series") {
    el.innerHTML = `${badge}<p class="question">¿Qué figura continúa la serie?</p>
      <div class="figrow">${item.seq.map((f) => `<div class="fig">${fig(f)}</div>`).join("")}<div class="qmark" aria-label="incógnita">?</div></div>`;
  } else if (item.kind === "matrix") {
    el.innerHTML = `${badge}<p class="question">¿Qué figura completa la matriz?</p>
      <div class="matrix">${item.cells.map((c) => `<div class="mcell">${c ? fig(c) : '<span class="qmark" aria-label="incógnita">?</span>'}</div>`).join("")}</div>`;
  } else if (item.kind === "figure-real") {
    el.innerHTML = `${badge}<p class="question">${item.prompt}</p>
      <div class="figreal"><img src="./public/assets/exams/${item.image}" alt="Figura del examen real" onerror="if(!this.dataset.retry){this.dataset.retry='1';var u=this.src.split('?')[0];setTimeout(()=>{this.src=u+'?r='+Date.now();},600);}"></div>`;
  } else {
    el.innerHTML = `${badge}<p class="question">${item.prompt}</p>`;
  }
}

// Tarea 3: máximo 2 reproducciones por ítem, contando la reproducción automática al
// mostrar la pregunta como la primera -- después de agotarlas, el botón se desactiva
// (nunca "las veces que quieras": eso era lo que hacía trivial acertar sin escuchar).
const MAX_LISTEN_PLAYS = 2;

function renderListenQuestion(item, el, badge, onListen, onSkip) {
  const levelBadge = item.level ? `<span class="badge-generated" style="margin-left:6px">${LEVEL_LABEL[item.level] ?? `Nivel ${item.level}`}</span>` : "";
  el.innerHTML = `${badge}${levelBadge}<p class="question">${item.prompt}</p>
    <button type="button" class="btn btn--blue" id="listen-btn"><span aria-hidden="true">🔊</span> <span id="listen-btn-label">Escuchar</span></button>
    <p class="note" id="listen-plays-note" style="margin-top:8px"></p>
    <p class="note" id="listen-fail-note" style="margin-top:4px;color:var(--red,#ea2b2b)" hidden>No se ha podido reproducir el audio. Prueba con Escuchar otra vez (revisa el volumen y el modo silencio) o salta la pregunta.</p>
    ${onSkip ? `<button type="button" class="btn btn--ghost" id="listen-skip" style="margin-top:8px">⏭ Ahora no puedo escuchar: saltar y volver luego</button>` : ""}`;
  const btn = el.querySelector("#listen-btn");
  const note = el.querySelector("#listen-plays-note");
  let plays = 0;
  const paint = () => {
    const left = MAX_LISTEN_PLAYS - plays;
    note.textContent = left > 0
      ? `Te quedan ${left} reproducción${left === 1 ? "" : "es"}.`
      : `Sin reproducciones restantes: responde con lo que has escuchado.`;
    btn.disabled = left <= 0;
  };
  const failNote = el.querySelector("#listen-fail-note");
  const play = () => {
    if (plays >= MAX_LISTEN_PLAYS) return;
    plays++;
    failNote.hidden = true;
    paint();
    // Si el navegador no llega a reproducirlo, no se gasta la reproducción.
    onListen(item, {
      onfail: (info) => {
        if (!btn.isConnected) return;
        plays = Math.max(0, plays - 1);
        failNote.textContent = `No se ha podido reproducir el audio (${info ?? "sin datos"}). Prueba con Escuchar otra vez (revisa el volumen y el modo silencio) o salta la pregunta.`;
        failNote.hidden = false; paint();
      },
    });
  };
  btn.addEventListener("click", play);
  el.querySelector("#listen-skip")?.addEventListener("click", () => onSkip());
  paint();
  play(); // la primera reproducción es automática al mostrar la pregunta
}

const LEVEL_LABEL = { A: "Nivel A · B1 bajo", B: "Nivel B · B1", C: "Nivel C · B2", D: "Nivel D · B2 alto" };

/* ------------------------------- respuestas ------------------------------- */
// Una opción del banco real puede ser un string (caso normal) o un objeto
// { text, asset } cuando la opción en sí es una imagen (gráfico/plano/esquema), con
// o sin texto que la acompañe. optionText/optionAsset normalizan ambas formas: úsalas
// en vez de leer `o` a pelo en cualquier sitio que muestre o compare opciones.
export function optionText(o) {
  return typeof o === "string" ? o : (o?.text ?? "");
}
export function optionAsset(o) {
  return typeof o === "string" ? null : (o?.asset ?? null);
}

/** Lightbox mínimo para ampliar una imagen de opción con un toque (móvil-friendly). */
function openLightbox(src, alt) {
  let box = document.getElementById("img-lightbox");
  if (!box) {
    box = document.createElement("div");
    box.id = "img-lightbox";
    box.className = "lightbox";
    box.innerHTML = `<img alt="">`;
    box.addEventListener("click", () => box.classList.remove("show"));
    document.body.appendChild(box);
  }
  box.querySelector("img").src = src;
  box.querySelector("img").alt = alt;
  box.classList.add("show");
}

/** Opciones tipo test. onChange(index|null) informa de la selección actual. */
export function renderOptions(item, el, onChange) {
  const isFig = item.kind === "figure-series" || item.kind === "matrix";
  el.className = isFig ? "options options--figs" : "options";
  el.innerHTML = item.options
    .map((o, i) => {
      if (isFig) return `<button type="button" class="option" data-i="${i}" aria-pressed="false"><span class="option__key">${KEYS[i]}</span><span class="fig">${fig(o)}</span></button>`;
      const asset = optionAsset(o);
      const text = optionText(o);
      const label = text || `Opción ${KEYS[i]}`;
      if (!asset) return `<button type="button" class="option" data-i="${i}" aria-pressed="false"><span class="option__key">${KEYS[i]}</span><span>${text}</span></button>`;
      // Una opción-imagen no puede ser un <button> anidando otro <button> (el botón de
      // zoom): un <button> dentro de otro es HTML inválido y el parser cierra el de
      // fuera en cuanto encuentra el de dentro, rompiendo la selección. Se usa un <div
      // role="button"> con manejo de teclado propio en su lugar.
      const img = `<span class="option__imgwrap"><img class="option__img" src="./public/assets/exams/${asset}" alt="${label}" loading="lazy"><span class="option__zoom" data-zoom="${i}" role="button" tabindex="0" aria-label="Ampliar imagen de la opción ${KEYS[i]}">🔍</span></span>`;
      return `<div class="option option--img" data-i="${i}" role="button" tabindex="0" aria-pressed="false"><span class="option__key">${KEYS[i]}</span>${img}${text ? `<span>${text}</span>` : ""}</div>`;
    })
    .join("");
  let selected = null;
  el.querySelectorAll(".option").forEach((opt) => {
    const activate = () => {
      selected = Number(opt.dataset.i);
      el.querySelectorAll(".option").forEach((o) => o.setAttribute("aria-pressed", String(o === opt)));
      onChange(selected);
    };
    opt.addEventListener("click", activate);
    if (opt.tagName !== "BUTTON") {
      opt.addEventListener("keydown", (e) => {
        if (e.target.closest(".option__zoom")) return; // el zoom gestiona su propia tecla
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
      });
    }
  });
  el.querySelectorAll(".option__zoom").forEach((btn) => {
    const openZoom = (e) => {
      e.stopPropagation();
      const i = Number(btn.dataset.zoom);
      const o = item.options[i];
      openLightbox(`./public/assets/exams/${optionAsset(o)}`, optionText(o) || `Opción ${KEYS[i]}`);
    };
    btn.addEventListener("click", openZoom);
    btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openZoom(e); } });
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
  // .option--img es un <div role="button">, no un <button>: `.disabled` no existe en
  // un div (no-op silencioso), así que el bloqueo real para esas opciones va por
  // aria-disabled + pointer-events, además de quitarlas del orden de tabulación.
  btns.forEach((b) => {
    b.disabled = true;
    b.setAttribute("aria-disabled", "true");
    b.style.pointerEvents = "none";
    b.tabIndex = -1;
    b.setAttribute("aria-pressed", "false");
  });
  btns[correctIndex]?.classList.add("is-correct");
  if (chosenIndex !== null && chosenIndex !== correctIndex) btns[chosenIndex]?.classList.add("is-wrong");
}

export function lockWordbank(el) {
  el.querySelectorAll("button").forEach((b) => { b.disabled = true; });
}

/* ------------------------------- audio ------------------------------- */
// Tarea 3: velocidad natural por nivel (B1 140-160 ppm, B2 165-190 ppm) y acento
// variado por turno. SpeechSynthesis no expone ni la velocidad real en palabras por
// minuto ni garantiza qué voces trae cada navegador/SO -- `rate` es un multiplicador
// relativo a la voz por defecto (1 = su ritmo normal), así que esto es el mejor
// esfuerzo posible: se apunta al centro de cada rango asumiendo una voz "normal" de
// referencia, no una cifra de ppm verificable en runtime.
const RATE_BY_LEVEL = { A: 0.92, B: 0.98, C: 1.08, D: 1.15 };

// Variantes de accent -> lang(es) de voz a probar en orden (con fallback a inglés
// británico genérico si el navegador no trae esa variante instalada). "en-GB-SCT"
// (escocés) casi nunca tiene voz propia en los motores TTS habituales: se queda con la
// voz en-GB disponible -- el acento real depende del catálogo de voces del SO, esto es
// lo máximo que Web Speech permite pedir.
const ACCENT_LANGS = {
  "en-GB": ["en-GB"], "en-US": ["en-US"], "en-IE": ["en-IE", "en-GB"],
  "en-AU": ["en-AU", "en-GB"], "en-IN": ["en-IN", "en-GB"], "en-GB-SCT": ["en-GB"],
};

// Las voces se cargan de forma asíncrona (sobre todo en Chrome/Android): pedirlas al
// arrancar evita que la primera pregunta de listening salga sin voz inglesa.
try { window.speechSynthesis?.getVoices?.(); window.speechSynthesis?.addEventListener?.("voiceschanged", () => {}); } catch (e) { /* no-op */ }

function pickVoice(accentId) {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  // Las voces de red (localService:false, p. ej. las "Google" de Android) fallan con
  // synthesis-failed si no hay datos descargados o conexión: se prefieren las locales.
  const best = (pred) => voices.find((x) => pred(x) && x.localService) ?? voices.find(pred);
  for (const lang of (ACCENT_LANGS[accentId] ?? ["en-GB"])) {
    const v = best((x) => x.lang === lang || x.lang?.replace("_", "-") === lang);
    if (v) return v;
  }
  return best((x) => x.lang?.toLowerCase().startsWith("en")) ?? null;
}

// Varias llamadas seguidas a speechSynthesis.speak() sin cancel() entre medias se
// encolan y se reproducen en orden -- así se simulan varias voces/turnos con un único
// motor TTS, sin necesitar encadenar promesas por onend.
// Chrome/Android descartan en silencio las utterances que se encolan en el mismo tick
// que un cancel() y recogen con el GC las que nadie referencia: de ahí el retardo y
// `live` (que además evita que el audio "no suene" sin avisar).
const live = [];
function queueTurn(text, accentId, rate, hooks, stage = 0) {
  const u = new SpeechSynthesisUtterance(text);
  // Escalones de reintento: 0 voz elegida · 1 solo idioma en-US a ritmo normal · 2 nada
  // (voz y idioma por defecto del sistema: peor acento, pero suena).
  const voice = stage === 0 ? pickVoice(accentId) : null;
  if (voice) { u.voice = voice; u.lang = voice.lang; } else if (stage === 1) { u.lang = "en-US"; } else if (stage === 0) { u.lang = (ACCENT_LANGS[accentId] ?? ["en-GB"])[0]; }
  u.rate = stage === 0 ? rate : 1;
  u.onstart = () => hooks?.onstart?.();
  u.onend = () => { const i = live.indexOf(u); if (i >= 0) live.splice(i, 1); };
  u.onerror = (e) => { const i = live.indexOf(u); if (i >= 0) live.splice(i, 1); if (e?.error !== "canceled" && e?.error !== "interrupted") hooks?.onerror?.(e); };
  live.push(u);
  window.speechSynthesis.speak(u);
}

/**
 * Reproduce un ítem de listening completo (monólogo o diálogo multivoz).
 * `hooks.onstart` se llama cuando el audio empieza de verdad y `hooks.onfail(info)` si el
 * navegador no llega a reproducirlo (sin motor TTS, bloqueado o error); `info` describe
 * por qué (nº de voces y código de error) para poder diagnosticarlo en el móvil.
 * Si falla (voz listada pero no instalada, típico en Android) se reintenta sin voz fija
 * y, si sigue fallando, con la voz y el idioma por defecto del sistema.
 */
export function speakItem(item, hooks = {}) {
  const synth = window.speechSynthesis;
  const nVoices = () => { try { return synth.getVoices().length; } catch (e) { return 0; } };
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") { hooks.onfail?.("este navegador no tiene síntesis de voz"); return; }
  const localVoices = () => { try { return synth.getVoices().filter((v) => v.localService).length; } catch (e) { return 0; } };
  const rate = RATE_BY_LEVEL[item.level] ?? 1;
  let started = false, finished = false, lastError = "";
  const fail = () => {
    if (finished) return;
    finished = true;
    hooks.onfail?.(`voces: ${nVoices()} (${localVoices()} locales)${lastError ? `, error: ${lastError}` : ", sin respuesta del motor"}`);
  };
  const run = (stage) => {
    let runDone = false;
    const onstart = () => { started = true; hooks.onstart?.(); };
    const onerror = (e) => {
      if (started || runDone) return;
      runDone = true;
      lastError = e?.error ?? "desconocido";
      if (stage < 2) { synth.cancel(); setTimeout(() => run(stage + 1), 150); } else fail();
    };
    try {
      synth.resume(); // Chrome a veces deja el motor en pausa tras un cancel()
      if (Array.isArray(item.turns) && item.turns.length) {
        item.turns.forEach((t, i) => queueTurn(t.text, t.accent, rate, i === 0 ? { onstart, onerror } : { onerror }, stage));
      } else {
        queueTurn(item.audio, item.accent ?? "en-GB", rate, { onstart, onerror }, stage);
      }
    } catch (e) { lastError = String(e?.name ?? e); fail(); return; }
    setTimeout(() => { if (!started && !runDone && !synth.speaking && !synth.pending) onerror({ error: "no-arranca" }); }, 2500);
  };
  try {
    synth.cancel();
    setTimeout(() => run(0), 150);
  } catch (e) { lastError = String(e?.name ?? e); fail(); }
}

/** Transcripción para mostrar tras responder (nunca antes, ver renderListenQuestion). */
export function transcriptText(item) {
  if (Array.isArray(item.turns) && item.turns.length) {
    return item.turns.map((t) => `<b>${t.speaker ?? "?"}:</b> ${t.text}`).join("<br>");
  }
  return item.audio;
}

export function stopSpeech() {
  try { live.length = 0; window.speechSynthesis.cancel(); } catch (e) { /* no-op */ }
}
