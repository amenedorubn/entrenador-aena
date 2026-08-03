// Genera los iconos PWA (PNG) sin dependencias externas: rasteriza polígonos a mano
// y codifica PNG usando solo el módulo `zlib` de Node. Ejecutar: node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "icons");
mkdirSync(outDir, { recursive: true });

const GREEN = [88, 204, 2, 255];   // --eager-green #58cc02
const WHITE = [255, 255, 255, 255];

/* ---------------------------- canvas RGBA ---------------------------- */
function makeCanvas(w, h, bg) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set(bg, i * 4);
  return { w, h, data };
}
function setPx(cv, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return;
  const i = (y * cv.w + x) * 4;
  cv.data[i] = r; cv.data[i + 1] = g; cv.data[i + 2] = b; cv.data[i + 3] = a;
}

// Relleno par-impar (even-odd) de uno o varios subcaminos (para agujeros, p.ej. la "A").
function fillPolygons(cv, subpaths, color) {
  const edges = [];
  for (const pts of subpaths) {
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      if (y1 !== y2) edges.push([x1, y1, x2, y2]);
    }
  }
  let minY = Infinity, maxY = -Infinity;
  for (const [, y1, , y2] of edges) { minY = Math.min(minY, y1, y2); maxY = Math.max(maxY, y1, y2); }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const yc = y + 0.5;
    const xs = [];
    for (const [x1, y1, x2, y2] of edges) {
      if ((yc >= y1 && yc < y2) || (yc >= y2 && yc < y1)) {
        const t = (yc - y1) / (y2 - y1);
        xs.push(x1 + t * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) setPx(cv, x, y, color);
    }
  }
}
function fillRoundedSquare(cv, radius, color) {
  const { w, h } = cv;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = x < radius ? radius : x > w - radius ? w - radius : x;
      const cy = y < radius ? radius : y > h - radius ? h - radius : y;
      const dx = x - cx, dy = y - cy;
      const inCorner = (x < radius || x > w - radius) && (y < radius || y > h - radius);
      if (!inCorner || dx * dx + dy * dy <= radius * radius) setPx(cv, x, y, color);
    }
  }
}

// Letra "A" robusta como dos subcaminos (contorno + hueco), en coordenadas 0..1 (y hacia abajo).
const A_OUTER = [[0.50, 0.06], [0.86, 0.94], [0.68, 0.94], [0.60, 0.72], [0.40, 0.72], [0.32, 0.94], [0.14, 0.94]];
const A_HOLE = [[0.50, 0.32], [0.565, 0.60], [0.435, 0.60]];
function drawA(cv, pad) {
  const size = cv.w - pad * 2;
  const map = (p) => [pad + p[0] * size, pad + p[1] * size];
  fillPolygons(cv, [A_OUTER.map(map), A_HOLE.map(map)], WHITE);
}

/* ---------------------------- codificación PNG ---------------------------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePNG(cv) {
  const { w, h, data } = cv;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filtro "None"
    Buffer.from(data.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8bpc, RGBA
  const idat = deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------------------------- generación de iconos ---------------------------- */
function iconAny(size) {
  const cv = makeCanvas(size, size, [0, 0, 0, 0]);
  fillRoundedSquare(cv, Math.round(size * 0.18), GREEN);
  drawA(cv, Math.round(size * 0.22));
  return cv;
}
function iconMaskable(size) {
  const cv = makeCanvas(size, size, GREEN); // full-bleed, sin transparencia ni esquinas redondeadas
  drawA(cv, Math.round(size * 0.30)); // zona segura ~40% de margen total
  return cv;
}

const jobs = [
  ["icon-192.png", iconAny(192)],
  ["icon-512.png", iconAny(512)],
  ["icon-192-maskable.png", iconMaskable(192)],
  ["icon-512-maskable.png", iconMaskable(512)],
  ["apple-touch-icon.png", iconMaskable(180)],
];
for (const [name, cv] of jobs) {
  writeFileSync(join(outDir, name), encodePNG(cv));
  console.log("✓", name);
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#58cc02"/><path fill="#fff" fill-rule="evenodd" d="M32 4 55 60 43.5 60 38.5 46 25.5 46 20.5 60 9 60 32 4Zm0 18-4.5 12h9L32 22Z"/></svg>`;
writeFileSync(join(outDir, "favicon.svg"), favicon);
console.log("✓ favicon.svg");
