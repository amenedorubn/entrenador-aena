// Gráficas de línea en SVG en línea (sin librerías). Devuelven HTML como texto; la
// interacción (toque/ratón -> lectura del punto) la añade bindCharts() tras insertarlo.
// Una sola serie por gráfica: el título de la tarjeta la nombra, así que no hay leyenda.

const W = 320, H = 150, PAD = { l: 42, r: 10, t: 10, b: 22 };
const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const r1 = (n) => Math.round(n * 10) / 10;

/** Redondea el máximo a un valor "bonito" para el eje (1, 2, 5 x 10^k). */
export function niceMax(v) {
  if (!(v > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

/**
 * pts: [{ x, y, tip }] con x creciente (cualquier unidad). xTicks: [{ x, label }].
 * opts: { yMax, yFmt, ref: { y, label }, area, title } -- title es el aria-label.
 */
export function lineChart(pts, opts = {}) {
  if (pts.length < 2) return `<p class="note">Aún hay pocos datos para dibujar la curva.</p>`;
  const { yFmt = String, ref = null, area = true, title = "Gráfica", xTicks = [] } = opts;
  const x0 = pts[0].x, x1 = pts[pts.length - 1].x || 1;
  const yTop = opts.yMax ?? niceMax(Math.max(...pts.map((p) => p.y), ref ? ref.y : 0));
  const sx = (x) => PAD.l + ((x - x0) / Math.max(1e-9, x1 - x0)) * IW;
  const sy = (y) => PAD.t + IH - (Math.min(y, yTop) / yTop) * IH;

  const grid = [0, 0.5, 1].map((f) => {
    const y = PAD.t + IH - f * IH;
    return `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${r1(y)}" y2="${r1(y)}" stroke="var(--border)" stroke-width="1"/>
      <text x="${PAD.l - 6}" y="${r1(y + 3.5)}" text-anchor="end" font-size="10" fill="var(--muted)">${esc(yFmt(yTop * f))}</text>`;
  }).join("");
  const ticks = xTicks.map((t) =>
    `<text x="${r1(sx(t.x))}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--muted)">${esc(t.label)}</text>`).join("");
  const line = pts.map((p, i) => `${i ? "L" : "M"}${r1(sx(p.x))} ${r1(sy(p.y))}`).join("");
  const areaPath = area
    ? `<path d="${line}L${r1(sx(x1))} ${PAD.t + IH}L${r1(sx(x0))} ${PAD.t + IH}Z" fill="var(--blue)" opacity=".14"/>` : "";
  const refLine = ref
    ? `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${r1(sy(ref.y))}" y2="${r1(sy(ref.y))}" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="5 4"/>
       <text x="${W - PAD.r}" y="${r1(sy(ref.y) - 4)}" text-anchor="end" font-size="10" font-weight="700" fill="var(--text-strong)">${esc(ref.label)}</text>` : "";
  const last = pts[pts.length - 1];
  const data = pts.map((p) => [r1(sx(p.x)), r1(sy(p.y)), p.tip ?? yFmt(p.y)]);

  return `<div class="chart" data-pts="${esc(JSON.stringify(data))}">
    <div class="chart__read" aria-live="polite">${esc(last.tip ?? yFmt(last.y))}</div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}" preserveAspectRatio="xMidYMid meet">
      ${grid}${areaPath}${refLine}
      <path d="${line}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <line class="chart__cross" x1="0" x2="0" y1="${PAD.t}" y2="${PAD.t + IH}" stroke="var(--muted)" stroke-width="1" visibility="hidden"/>
      <circle class="chart__dot" cx="${r1(sx(last.x))}" cy="${r1(sy(last.y))}" r="4" fill="var(--blue)" stroke="var(--surface, #fff)" stroke-width="2"/>
      ${ticks}
    </svg></div>`;
}

/** Columnas verticales: items [{ label, value, tip }]. Una sola serie, baseline común. */
export function columnChart(items, opts = {}) {
  const { yFmt = String, title = "Gráfica" } = opts;
  const yTop = niceMax(Math.max(...items.map((i) => i.value), 1));
  const bw = IW / items.length;
  const cols = items.map((it, i) => {
    const h = (it.value / yTop) * IH;
    const x = PAD.l + i * bw + bw * 0.2;
    return `<g><title>${esc(it.tip ?? `${it.label}: ${yFmt(it.value)}`)}</title>
      ${h > 0 ? `<rect x="${r1(x)}" y="${r1(PAD.t + IH - h)}" width="${r1(bw * 0.6)}" height="${r1(h)}" rx="4" fill="var(--blue)"/>` : ""}
      <text x="${r1(x + bw * 0.3)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--muted)">${esc(it.label)}</text>
      ${it.value > 0 ? `<text x="${r1(x + bw * 0.3)}" y="${r1(PAD.t + IH - h - 4)}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-strong)">${esc(yFmt(it.value))}</text>` : ""}</g>`;
  }).join("");
  const grid = [0, 1].map((f) => {
    const y = PAD.t + IH - f * IH;
    return `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${r1(y)}" y2="${r1(y)}" stroke="var(--border)" stroke-width="1"/>
      <text x="${PAD.l - 6}" y="${r1(y + 3.5)}" text-anchor="end" font-size="10" fill="var(--muted)">${esc(yFmt(yTop * f))}</text>`;
  }).join("");
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${grid}${cols}</svg></div>`;
}

/** Hace interactivas las gráficas de línea de `root`: un toque/movimiento lee el punto más cercano. */
export function bindCharts(root) {
  root.querySelectorAll(".chart[data-pts]").forEach((el) => {
    let pts;
    try { pts = JSON.parse(el.dataset.pts); } catch { return; }
    const svg = el.querySelector("svg"), cross = el.querySelector(".chart__cross"),
      dot = el.querySelector(".chart__dot"), read = el.querySelector(".chart__read");
    const at = (ev) => {
      const r = svg.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * W;
      let best = pts[0];
      for (const p of pts) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
      cross.setAttribute("x1", best[0]); cross.setAttribute("x2", best[0]); cross.setAttribute("visibility", "visible");
      dot.setAttribute("cx", best[0]); dot.setAttribute("cy", best[1]);
      read.textContent = best[2];
    };
    svg.style.touchAction = "pan-y";
    svg.addEventListener("pointerdown", at);
    svg.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.buttons) at(e); });
  });
}
