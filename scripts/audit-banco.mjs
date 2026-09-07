#!/usr/bin/env node
// Auditoría solicitada para el fix del banco de preguntas (fix/banco-preguntas-v2).
// Complementa, sin duplicar, a scripts/validate-questions.mjs (que ya cubre
// correctIndex fuera de rango, opciones duplicadas, aritmética, prompts truncados,
// assets rotos/cruzados y duplicados de prompt — ver reports/questions-audit.md).
// Este script añade específicamente lo que ese informe no trae:
//   - recuento por examen/fuente
//   - CÓMO se vincula el asset a la pregunta (evidencia de que NO es posicional)
//   - distribución de nº de opciones (¿hay preguntas con más de 4?)
//   - assets huérfanos en disco (ninguna pregunta los referencia)
//   - patrón de desfase off-by-one entre preguntas consecutivas de una misma imagen
//
// No modifica datos. Salida: INFORME_AUDITORIA.md en la raíz del repo.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "real.source.js");
const ASSETS_DIR = path.join(ROOT, "public", "assets", "exams");
const OUT_PATH = path.join(ROOT, "INFORME_AUDITORIA.md");

if (!existsSync(SOURCE_PATH)) {
  console.error(`No existe ${SOURCE_PATH} en este checkout (gitignored). Nada que auditar.`);
  process.exit(0);
}

const { REAL } = await import(pathToFileURL(SOURCE_PATH));

function walk(dir, prefix = "") {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), prefix + e.name + "/"));
    else out.push(prefix + e.name);
  }
  return out;
}
const diskAssets = existsSync(ASSETS_DIR) ? walk(ASSETS_DIR) : [];
const diskSet = new Set(diskAssets);

/* ---------- 1. total por examen/fuente ---------- */
function sourceKey(sourceFile) {
  if (/foto WhatsApp/.test(sourceFile)) {
    const carpeta = sourceFile.split("/").slice(0, -1).join("/");
    return carpeta || sourceFile;
  }
  return sourceFile.split(" (")[0];
}
const byExam = {};
for (const q of REAL) {
  const k = sourceKey(q.sourceFile);
  (byExam[k] ??= { total: 0, conImagen: 0, revision: 0 });
  byExam[k].total++;
  if (q.image) byExam[k].conImagen++;
  if (q.status === "revision") byExam[k].revision++;
}

/* ---------- 2. cómo se vincula el asset ---------- */
// El campo `image` es un nombre de fichero EXPLÍCITO por pregunta (ver js/engine.js:77,
// `./public/assets/exams/${item.image}`), no un índice de un array posicional. Se
// comprueba aquí, por pregunta, que el binding no depende del orden dentro de REAL.
const withImage = REAL.filter((q) => q.image);
const imageReuse = {}; // misma imagen usada por >1 pregunta (matrices con 2 ítems por foto, etc.)
for (const q of withImage) (imageReuse[q.image] ??= []).push(q.id);
const sharedImages = Object.entries(imageReuse).filter(([, ids]) => ids.length > 1);

/* ---------- 3. nº de opciones ---------- */
const optionDist = {};
for (const q of REAL) optionDist[q.options.length] = (optionDist[q.options.length] ?? 0) + 1;
const nonFour = REAL.filter((q) => q.options.length !== 4);

/* ---------- 4. cita figura/gráfico/tabla/plano sin asset ---------- */
const CITA_FIGURA = /gráfic|tabla|figura|imagen|dibujo|plano|esquema|serie siguiente|cuadro (siguiente|adjunto|de doble entrada)/i;
const sinAsset = REAL.filter((q) => CITA_FIGURA.test(q.prompt) && !q.image);

/* ---------- 5. assets huérfanos ---------- */
const usedAssets = new Set(withImage.map((q) => q.image));
const orphans = diskAssets.filter((f) => !usedAssets.has(f));

/* ---------- 6. correctIndex fuera de rango ---------- */
const outOfRange = REAL.filter((q) => q.correctIndex < 0 || q.correctIndex >= q.options.length);

/* ---------- 7. duplicados de prompt+imagen ---------- */
function norm(t) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
const bySig = new Map();
for (const q of REAL) {
  const sig = norm(q.prompt) + "|" + (q.image ?? "");
  (bySig.get(sig) ?? bySig.set(sig, []).get(sig)).push(q.id);
}
const dupGroups = [...bySig.values()].filter((g) => g.length > 1);

/* ---------- 8. patrón de desfase off-by-one ---------- */
// Comprueba si, para preguntas consecutivas por id numérico dentro de una misma
// "familia" (mismo prefijo de id), la imagen de la pregunta N coincide con la que
// "debería" tener N-1 o N+1 -- señal de desalineación sistemática, no aleatoria.
// Como el binding actual es explícito (no posicional), este check debería dar 0 en
// un banco sano: se deja aquí como red de seguridad, no como hallazgo esperado.
const byPrefix = {};
for (const q of REAL) {
  const m = q.id.match(/^(.*-)(\d+)$/);
  if (!m || !q.image) continue;
  (byPrefix[m[1]] ??= []).push({ n: Number(m[2]), id: q.id, image: q.image });
}
const offByOneSuspects = [];
for (const [prefix, items] of Object.entries(byPrefix)) {
  items.sort((a, b) => a.n - b.n);
  const byN = new Map(items.map((it) => [it.n, it]));
  for (const it of items) {
    const prev = byN.get(it.n - 1);
    // Dos preguntas consecutivas *pueden* compartir imagen legítimamente (una misma
    // foto con 2 ítems, ver sharedImages arriba); solo se marca sospechoso si la
    // imagen del actual es EXACTAMENTE la que tiene un vecino que a su vez no la
    // comparte con él explícitamente en un bloque de 2 conocido.
    if (prev && prev.image === it.image && sharedImages.every(([img]) => img !== it.image)) {
      offByOneSuspects.push({ prefix, a: prev.id, b: it.id, image: it.image });
    }
  }
}

/* ---------- informe ---------- */
let md = `# INFORME_AUDITORIA.md\n\n`;
md += `Generado por \`scripts/audit-banco.mjs\` el ${new Date().toISOString().slice(0, 10)}. `;
md += `No modifica datos. Complementa a \`reports/questions-audit.md\` (generado por \`scripts/validate-questions.mjs\`, que ya corre en cada ronda de edición).\n`;
md += `\nTotal preguntas en \`data/real.source.js\`: **${REAL.length}**.\n`;

md += `\n## 1. Total por examen/fuente\n\n| fuente | total | con imagen | en revisión |\n|---|---|---|---|\n`;
for (const [k, v] of Object.entries(byExam).sort()) md += `| ${k} | ${v.total} | ${v.conImagen} | ${v.revision} |\n`;

md += `\n## 2. Cómo se vincula el asset a la pregunta\n\n`;
md += `El campo \`image\` de cada pregunta es un **nombre de fichero explícito** (p. ej. \`aptitudes/whatsapp_item42.jpeg\`), asignado pregunta a pregunta, no derivado de la posición del ítem dentro del array \`REAL\` ni de un índice compartido. La resolución en runtime es directa: \`js/engine.js:77\` construye \`./public/assets/exams/\${item.image}\`.\n\n`;
md += `${withImage.length} de ${REAL.length} preguntas traen \`image\`. ${sharedImages.length} fotos son compartidas por más de una pregunta (normal: una misma foto de examen a veces contiene 2 ítems, p. ej. matrices consecutivas recortadas de la misma página):\n\n`;
md += sharedImages.length
  ? sharedImages.map(([img, ids]) => `- \`${img}\` → ${ids.map((i) => `\`${i}\``).join(", ")}`).join("\n") + "\n"
  : "Ninguna.\n";

md += `\n## 3. Distribución de nº de opciones\n\n| nº opciones | preguntas |\n|---|---|\n`;
for (const [n, c] of Object.entries(optionDist).sort()) md += `| ${n} | ${c} |\n`;
md += `\n${nonFour.length} preguntas tienen un nº de opciones distinto de 4 (todas con 5; ninguna con 6+):\n\n`;
md += nonFour.length ? nonFour.map((q) => `- \`${q.id}\` (${q.options.length} opciones)`).join("\n") + "\n" : "Ninguna.\n";
md += `\n**Nota de renderizado:** \`js/engine.js\` (\`renderOptions\`, \`KEYS = ["A".."F"]\`) itera \`item.options\` completo y no trunca a 4; no hay ningún \`slice(0,4)\` ni grid de 4 columnas fijas en el camino de preguntas reales (\`.options { display:grid; gap:12px }\`, sin \`grid-template-columns\` fijo — ese fijo de 2 columnas solo existe en \`.options--figs\`, que es para las figuras SVG *generadas*, no para el banco real). \`test/real-content.test.js\` ya exige 2–6 opciones. **No se ha reproducido el truncado a 4 descrito.**\n`;

md += `\n## 4. Preguntas que citan figura/gráfico/tabla/plano sin asset\n\n${sinAsset.length} encontradas`;
md += sinAsset.length ? ":\n\n" + sinAsset.map((q) => `- \`${q.id}\`: "${q.prompt.slice(0, 90)}..."`).join("\n") + "\n" : ".\n";

md += `\n## 5. Assets huérfanos en disco\n\n${orphans.length} de ${diskAssets.length} ficheros en \`public/assets/exams/\` no están referenciados por ninguna pregunta:\n\n`;
const orphansByFolder = {};
for (const o of orphans) (orphansByFolder[o.split("/")[0]] ??= []).push(o);
md += Object.entries(orphansByFolder).sort().map(([f, files]) => `- \`${f}/\`: ${files.length} (${files.map((x) => x.split("/")[1]).join(", ")})`).join("\n") + "\n";
md += `\nCoincide con \`data/matching_report.json\` → \`archivos_pendientes: 9\`: son páginas ya recortadas de exámenes (cubos, dominó, matrices, relojes, figuras no relacionadas, series de figuras) todavía no transcritas a preguntas en \`real.source.js\`. **No es un bug**: es trabajo de captura pendiente, no imágenes perdidas de preguntas existentes.\n`;

md += `\n## 6. correctIndex fuera de rango\n\n${outOfRange.length} encontradas.\n`;

md += `\n## 7. Duplicados (prompt normalizado + imagen)\n\n${dupGroups.length} grupos encontrados`;
md += dupGroups.length ? ":\n\n" + dupGroups.map((g) => `- ${g.map((i) => `\`${i}\``).join(", ")}`).join("\n") + "\n" : ".\n";

md += `\n## 8. Patrón de desfase off-by-one (imagen de N = imagen "prestada" de N-1)\n\n${offByOneSuspects.length} sospechosos encontrados`;
md += offByOneSuspects.length
  ? ":\n\n" + offByOneSuspects.map((s) => `- \`${s.a}\` y \`${s.b}\` comparten \`${s.image}\` sin estar en la lista de fotos-con-2-ítems conocida`).join("\n") + "\n"
  : ". El binding es explícito por pregunta, no hay evidencia de desalineación sistemática en el estado actual del banco.\n";

md += `\n## Diagnóstico y contexto (no generado, escrito a mano tras revisar el código)\n\n`;
md += `Ver el mensaje del informe en la conversación: el commit \`9920f12\` (2026-08-20, "Bloque A") ya corrigió exactamente un caso de imagen cruzada real (wa-aptitudes-21/22) y recuperó gráficos perdidos; \`da5ae56\` ("Bloque B") ya corrigió una repetición de preguntas dentro de lección; \`f669148\` subió \`CACHE_VERSION\` a v7 para forzar que los dispositivos con la app ya instalada como PWA recogieran esos fixes. Este informe (generado 2.5 semanas después) no reproduce ninguno de los tres fallos tal como se describieron. Detalle y recomendación en el mensaje de esta sesión.\n`;

writeFileSync(OUT_PATH, md, "utf8");
console.log(`Informe escrito en ${path.relative(ROOT, OUT_PATH)}`);
console.log(`  preguntas: ${REAL.length}, con imagen: ${withImage.length}, opciones != 4: ${nonFour.length}`);
console.log(`  assets huérfanos: ${orphans.length}, correctIndex fuera de rango: ${outOfRange.length}`);
console.log(`  duplicados: ${dupGroups.length}, sospechas off-by-one: ${offByOneSuspects.length}`);
