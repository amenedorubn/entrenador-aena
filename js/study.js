// Pantalla de estudio de Inglés oficial (B1 / B2). Un único flujo, de lo que más cae a lo
// que menos, con las técnicas que mejor funcionan para memorizar:
//   1. Aprende: reglas cortas del tema (poco texto, en tarjetas).
//   2. Tarjetas de memoria: recuerdo activo -- ves el enunciado, piensas la respuesta y
//      luego la destapas; las que no sabes vuelven a salir en la misma sesión.
//   3. Examen del bloque: las mismas preguntas reales con la sesión normal de la app
//      (corrección, explicación completa, fallos que se repasan con "solo fallos").
// El progreso por tema sale de lo que ya guarda la app: dominada = respondida alguna vez y
// no está entre las falladas pendientes.
import { studyBlocks, BANKS, TRAPS } from "./guide.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const blank = (p) => esc(p).replace("___", '<span class="study-blank">_____</span>');
const shuffled = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const LETTER = "ABCD";

/**
 * ctx: { items(): banco descifrado, seen(): ids vistos, missed(): ids fallados,
 *        bank(): "b1"|"b2", setBank(b), startBlock(ids, label), back() }
 */
export function createStudy(root, ctx) {
  const st = { view: "home", block: null, cards: null };

  const stats = (b) => {
    const seen = new Set(ctx.seen()), missed = new Set(ctx.missed());
    const dom = b.items.filter((q) => seen.has(q.id) && !missed.has(q.id)).length;
    return { total: b.items.length, dom, missed: b.items.filter((q) => missed.has(q.id)).length, started: b.items.some((q) => seen.has(q.id)) };
  };
  const blocks = () => studyBlocks(ctx.bank(), ctx.items());
  const current = () => blocks().find((b) => b.name === st.block);
  const bar = (pct, color = "var(--green)") => `<div class="progress-item__bar"><div class="progress-item__fill" style="width:${pct}%;background:${color}"></div></div>`;

  /* ---------------------------- inicio ---------------------------- */
  function home() {
    const bs = blocks();
    const grand = bs.reduce((n, b) => n + b.items.length, 0);
    if (!grand) {
      root.innerHTML = `<p class="note">La guía se genera con las preguntas del banco: desbloquéalas primero.</p>`;
      return;
    }
    const rows = bs.map((b) => ({ b, s: stats(b) }));
    const next = [...rows].sort((x, y) => (y.s.total - y.s.dom) - (x.s.total - x.s.dom))[0];
    const allDone = next.s.total - next.s.dom === 0;
    root.innerHTML = `
      <div class="segmented study-tabs" role="group" aria-label="Banco">
        ${Object.entries(BANKS).map(([k, v]) => `<button type="button" data-bank="${k}" aria-pressed="${ctx.bank() === k}">${v[1]}</button>`).join("")}
      </div>
      <p class="note">${BANKS[ctx.bank()][2]} · ${grand} preguntas. Está ordenado por lo que más cae: empieza por arriba.</p>
      ${allDone
        ? `<div class="card study-cta"><b>🎉 Has dominado todos los temas de este banco.</b></div>`
        : `<button type="button" class="btn btn--green btn--wide" data-block="${esc(next.b.name)}">▶ Empezar por: ${esc(next.b.name)}<small class="study-sub">${next.s.total - next.s.dom} por dominar</small></button>`}
      <div class="study-list">${rows.map(({ b, s }) => {
        const pct = Math.round((s.dom / s.total) * 100);
        const state = s.dom === s.total ? "✅" : s.started ? "🟡" : "⚪";
        return `<button type="button" class="study-row" data-block="${esc(b.name)}">
          <div class="study-row__head"><span>${state} <b>${esc(b.name)}</b></span><span class="study-weight">${b.items.length} <small>(${Math.round((b.items.length / grand) * 100)} %)</small></span></div>
          ${bar(pct)}
          <div class="note">Dominadas ${s.dom} de ${s.total}${s.missed ? ` · ${s.missed} fallada${s.missed === 1 ? "" : "s"}` : ""}</div></button>`;
      }).join("")}</div>
      <button type="button" class="btn btn--ghost btn--wide" data-act="traps" style="margin-top:14px">⚠️ Las 10 trampas más repetidas</button>`;
  }

  /* ---------------------------- tema ---------------------------- */
  function block() {
    const b = current();
    if (!b) { st.view = "home"; return render(); }
    const s = stats(b);
    root.innerHTML = `
      <button type="button" class="link-btn" data-act="home">← Todos los temas</button>
      <h2 class="study-title">${esc(b.name)}</h2>
      <p class="note">${b.items.length} preguntas de este tipo · dominadas ${s.dom}</p>
      ${bar(Math.round((s.dom / s.total) * 100))}

      <div class="card"><div class="card__title">1 · Aprende lo esencial</div>
        <ol class="study-rules">${b.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ol></div>

      <button type="button" class="btn btn--blue btn--wide" data-act="cards">2 · Tarjetas de memoria<small class="study-sub">${b.items.length} tarjetas · piensa antes de mirar</small></button>
      <button type="button" class="btn btn--green btn--wide" data-act="exam" style="margin-top:10px">3 · Examen del bloque<small class="study-sub">${b.items.length} preguntas reales</small></button>
      ${s.missed ? `<button type="button" class="btn btn--ghost btn--wide" data-act="exam-missed" style="margin-top:10px">Solo mis ${s.missed} fallo${s.missed === 1 ? "" : "s"} de este tema</button>` : ""}

      <details class="card" style="margin-top:14px"><summary><b>Ver las ${b.items.length} preguntas resueltas</b></summary>
        ${b.items.map((q) => `<p class="study-solved"><b>${q.id.split("-").pop()}.</b> ${blank(q.prompt)}<br><b class="study-ok">✅ ${LETTER[q.correctIndex]}) ${esc(q.options[q.correctIndex])}</b><br><span class="note">${esc(q.explanation ?? "")}</span></p>`).join("")}
      </details>`;
  }

  /* ---------------------------- tarjetas ---------------------------- */
  function startCards() {
    const b = current();
    st.cards = { queue: shuffled(b.items), total: b.items.length, known: 0, shown: false };
    st.view = "cards";
    render();
  }

  function cards() {
    const c = st.cards, b = current();
    if (!c.queue.length) {
      root.innerHTML = `<div class="study-end"><div class="study-end__icon">🎉</div><h2>Tarjetas hechas</h2>
        <p class="note">Has acertado en tu cabeza las ${c.total} de «${esc(b.name)}». Ahora ponlas a prueba como en el examen.</p>
        <button type="button" class="btn btn--green btn--wide" data-act="exam">3 · Examen del bloque</button>
        <button type="button" class="btn btn--ghost btn--wide" data-act="cards" style="margin-top:10px">Repetir las tarjetas</button>
        <button type="button" class="btn btn--ghost btn--wide" data-act="block" style="margin-top:10px">Volver al tema</button></div>`;
      return;
    }
    const q = c.queue[0];
    const back = c.shown ? `
      <div class="study-answer"><span class="study-ok">✅ ${LETTER[q.correctIndex]}) ${esc(q.options[q.correctIndex])}</span></div>
      <p class="study-rule">${esc(q.explanation ?? "")}</p>
      <details class="study-why"><summary>¿Por qué las otras no?</summary>
        ${q.options.map((o, i) => i === q.correctIndex ? "" : `<p><b>${LETTER[i]}) ${esc(o)}</b><br>${esc(q.optionNotes?.[i] ?? "")}</p>`).join("")}</details>` : "";
    root.innerHTML = `
      <button type="button" class="link-btn" data-act="block">← ${esc(b.name)}</button>
      <div class="study-count">${c.total - c.queue.length} hechas · quedan ${c.queue.length}</div>
      ${bar(Math.round(((c.total - c.queue.length) / c.total) * 100), "var(--blue)")}
      <div class="study-card">
        <div class="study-card__tag">${esc(q.tema)}</div>
        <div class="study-card__q">${blank(q.prompt)}</div>
        ${c.shown ? "" : `<div class="note">Piensa la respuesta antes de destapar. Si la dices en voz alta, se te queda mejor.</div>`}
        ${back}
      </div>
      ${c.shown
        ? `<div class="row study-grade"><button type="button" class="btn btn--ghost" data-grade="again">😕 Otra vez</button><button type="button" class="btn btn--green" data-grade="known">✅ Lo sabía</button></div>`
        : `<button type="button" class="btn btn--blue btn--wide" data-act="reveal">Mostrar respuesta</button>`}`;
  }

  /* ---------------------------- trampas ---------------------------- */
  function traps() {
    root.innerHTML = `<button type="button" class="link-btn" data-act="home">← Todos los temas</button>
      <h2 class="study-title">Las 10 trampas más repetidas</h2>
      <div class="card"><ol class="study-rules">${TRAPS.map((t) => `<li>${t}</li>`).join("")}</ol></div>`;
  }

  /* ---------------------------- navegación ---------------------------- */
  function render() {
    ({ home, block, cards, traps })[st.view]();
    root.closest(".page")?.scrollTo?.(0, 0);
  }

  root.addEventListener("click", (e) => {
    const bankBtn = e.target.closest("[data-bank]");
    if (bankBtn) { ctx.setBank(bankBtn.dataset.bank); st.view = "home"; return render(); }
    const blockBtn = e.target.closest("[data-block]");
    if (blockBtn) { st.block = blockBtn.dataset.block; st.view = "block"; return render(); }
    const grade = e.target.closest("[data-grade]");
    if (grade) {
      const c = st.cards, q = c.queue.shift();
      if (grade.dataset.grade === "again") c.queue.splice(Math.min(3, c.queue.length), 0, q);
      c.shown = false;
      return render();
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    const b = current();
    if (act === "home") { st.view = "home"; render(); }
    else if (act === "block") { st.view = "block"; render(); }
    else if (act === "traps") { st.view = "traps"; render(); }
    else if (act === "cards") startCards();
    else if (act === "reveal") { st.cards.shown = true; render(); }
    else if (act === "exam") ctx.startBlock(b.items.map((q) => q.id), b.name);
    else if (act === "exam-missed") {
      const missed = new Set(ctx.missed());
      ctx.startBlock(b.items.filter((q) => missed.has(q.id)).map((q) => q.id), `${b.name} · solo fallos`);
    }
  });

  return {
    open() { st.view = st.block && current() ? "block" : "home"; render(); },
    refresh() { render(); },
  };
}
