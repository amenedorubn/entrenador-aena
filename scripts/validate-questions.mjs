#!/usr/bin/env node
// Auditoría de data/real.source.js (banco de preguntas reales en claro, gitignored).
// Recorre REAL y reporta, sin borrar ni modificar nada:
//   (a) correctIndex fuera de rango
//   (b) opciones duplicadas dentro del mismo ítem
//   (c) enunciados aritméticos puros (sumas "en total", descuentos/porcentajes simples)
//       cuyo resultado calculado no coincide con options[correctIndex]
//   (d) prompts que parecen truncados (no terminan en puntuación, o cortan a media frase)
//   (e) preguntas que citan un gráfico/tabla/figura pero no tienen imagen válida
//       (campo `image` ausente o archivo inexistente en public/assets/exams/) -> requiresAsset
//   (f) referencias a imágenes rotas en general (aunque no citen gráfico en el prompt)
//   (g) posibles imágenes cruzadas: el asset no pertenece a la carpeta esperada para su sourceFile
//   (h) dependencia implícita de datos externos sin palabra-gancho tipo "gráfico/tabla/figura"
//       (señal blanda: "se entrevistaron a N", "sobre el porcentaje", "puede afirmarse
//       que", categorías entre paréntesis separadas por "/" o "x"... — se reporta para
//       revisión semántica manual, no se auto-marca revision)
//   (i) duplicados por firma normalizada de prompt (+ imagen, para no confundir el
//       prompt genérico de las preguntas de figura con un duplicado real)
//
// Uso: node scripts/validate-questions.mjs
// Salida: reports/questions-audit.md + resumen por stdout. Exit code 0 siempre
// (es un informe, no un gate de CI) salvo error de lectura del propio fichero fuente.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "real.source.js");
const ASSETS_DIR = path.join(ROOT, "public", "assets", "exams");
const REPORT_PATH = path.join(ROOT, "reports", "questions-audit.md");

if (!existsSync(SOURCE_PATH)) {
  console.error(
    "data/real.source.js no existe en este checkout (es gitignored). " +
    "Nada que validar: pide el fichero por el canal habitual antes de correr esto."
  );
  process.exit(0);
}

const { REAL, FIGURE_CATEGORIES, CATEGORY_SOURCE } = await import(pathToFileURL(SOURCE_PATH));

/* ------------------------------- assets en disco ------------------------------- */
function walk(dir, prefix = "") {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), prefix + e.name + "/"));
    else out.push(prefix + e.name);
  }
  return out;
}
const diskAssets = new Set(existsSync(ASSETS_DIR) ? walk(ASSETS_DIR) : []);

// Carpeta de assets esperada según el sourceFile del ítem (ver data/matching_report.json).
// Si el sourceFile del ítem no contiene ninguno de los patrones de una entrada, esa
// carpeta se descarta como candidata -> permite detectar imágenes "cruzadas" (el asset
// de un ítem apunta a la carpeta de otro examen).
const FOLDER_SOURCE_HINTS = [
  { folder: "aptitudes", hints: ["Aptitudes/"] },
  { folder: "examen20240317", hints: ["20240317_Examen AENA.pdf"] },
  { folder: "domino", hints: ["DOMINO.pdf"] },
  { folder: "matrices", hints: ["MATRICES FIGURAS.pdf"] },
  { folder: "relojes", hints: ["RELOJES.pdf"] },
  { folder: "secuencia_num_letras", hints: ["SECUENCIA NUMEROS LETRAS.pdf"] },
  { folder: "series_numeros", hints: ["SERIES NUMEROS.pdf"] },
  { folder: "test_series_figuras", hints: ["TEST SERIES FIGURAS.pdf"] },
  { folder: "figuras_no_relacionadas", hints: ["FIGURAS NO RELACIONADAS.pdf"] },
  { folder: "cubos", hints: ["CUBOS.pdf"] },
  { folder: "test_relojes", hints: ["TEST RELOJES.pdf"] },
  { folder: "test_domino_resuelto", hints: ["TEST DOMINO RESUELTO.pdf"] },
];

/* ------------------------------- (d) prompts truncados ------------------------------- */
const DANGLING_WORDS = new Set([
  "y", "o", "de", "del", "el", "la", "los", "las", "que", "a", "en", "con", "un", "una",
  "es", "son", "por", "para", "su", "sus", "al",
]);
// Dos formatos del banco terminan sin puntuación a propósito (ver data/matching_report.json):
//  - vocabulario: "Señale la opción que contenga el sinónimo/antónimo de la palabra dada: Palabra"
//  - analogías de doble hueco: "... es a grande como... es a pequeño"
// Se excluyen explícitamente para no generar ruido; el resto de finales "raros" sí se reportan.
const KNOWN_INTENTIONAL_FORMATS = [
  /:\s*[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]*$/,
  /^\.\.\..*es a [\wáéíóúñ]+$/i,
];
function looksTruncated(prompt) {
  const p = prompt.trim();
  if (p.length < 12) return "demasiado corto";
  if (KNOWN_INTENTIONAL_FORMATS.some((re) => re.test(p))) return null;
  const lastChar = p[p.length - 1];
  const endsOk = ["?", ".", "!", ")", ":", "…"].includes(lastChar);
  if (!endsOk) {
    const words = p.split(/\s+/);
    const last = words[words.length - 1].toLowerCase().replace(/[.,;:]+$/, "");
    if (DANGLING_WORDS.has(last)) return `corta tras "${last}"`;
  }
  return null;
}

/* ------------------------------- (c) aritmética simple ------------------------------- */
const LEG_COUNTS = {
  vaca: 4, vacas: 4, pollo: 2, pollos: 2, oveja: 4, ovejas: 4, gallina: 2, gallinas: 2,
  caballo: 4, caballos: 4, perro: 4, perros: 4, gato: 4, gatos: 4, persona: 2, personas: 2,
  araña: 8, arañas: 8, cerdo: 4, cerdos: 4, pato: 2, patos: 2,
};
function parseNumber(s) {
  return Number(s.replace(/\./g, "").replace(",", "."));
}

/** "cuántos/cuántas ... en total" con conteo de patas de animales. */
function checkLegsTotal(prompt) {
  if (!/patas/i.test(prompt) || !/en total/i.test(prompt)) return null;
  const re = /(\d+)\s+([a-záéíóúñ]+)/gi;
  let m, total = 0, matched = false;
  while ((m = re.exec(prompt))) {
    const n = Number(m[1]);
    const animal = m[2].toLowerCase();
    if (LEG_COUNTS[animal] !== undefined) { total += n * LEG_COUNTS[animal]; matched = true; }
  }
  return matched ? total : null;
}

/**
 * Descuento/porcentaje simple, solo para los dos patrones inequívocos donde el número
 * dado en el prompt es directamente la base sobre la que se calcula el porcentaje:
 *   - "¿A cuánto asciende el descuento/aumento?" -> importe = base * pct/100
 *   - "se reduce/rebaja un D%. ¿Cuál será el precio final?" -> final = base * (1 - pct/100)
 * Se excluyen a propósito los patrones "X representa un D% del total" (el número dado
 * puede ser la parte o el complementario de la parte -> ambiguo sin resolver la frase
 * completa, y forzarlo generaba falsos positivos verificados contra el examen real).
 */
function checkPercentSimple(prompt) {
  const baseM = prompt.match(/(\d[\d.,]*)\s*(?:euros?|€|kilos?|gramos?)/i);
  const pctM = prompt.match(/(\d[\d.,]*)\s*%/);
  if (!baseM || !pctM) return null;
  const base = parseNumber(baseM[1]);
  const pct = parseNumber(pctM[1]);
  if (/¿a cuánto asciende (el|la) (descuento|aumento|rebaja)/i.test(prompt)) {
    return { expected: base * (pct / 100) };
  }
  if (/(descuento|reduce|rebaja)/i.test(prompt) && /¿cuál será el precio/i.test(prompt)) {
    return { expected: base * (1 - pct / 100) };
  }
  return null;
}

function numberInOptions(options, value, tolerance = 0.5) {
  return options.some((o) => {
    const n = parseNumber(String(o).replace(/[^\d.,]/g, ""));
    return Number.isFinite(n) && Math.abs(n - value) <= tolerance;
  });
}

// Registro manual de trabajo de recuperación/auditoría hecho a mano en cada ronda (no
// se puede derivar solo de REAL en el momento de correr el script). Añade una entrada
// nueva arriba cada vez que recuperes imágenes, resuelvas needs_review, etc. — si no,
// la siguiente ejecución de este script pisa cualquier nota que hubieras escrito a mano
// directamente en el .md.
const SESSION_LOG = [
  {
    date: "2026-08-20 (ronda 2)",
    notes: [
      "Detector requiresAsset ampliado con patrones de dependencia implícita (ver (h) más abajo) — cubre el caso que se escapó: wa-aptitudes-42 (\"Se entrevistaron a 200 ancianos...\") no usa ninguna palabra tipo gráfico/tabla/figura.",
      "Pasada semántica manual sobre las 40 preguntas de razonamiento_numerico (única categoría con riesgo real de dependencia oculta: verbal/inglés son autocontenidas por construcción, y las categorías de figura ya exigen imagen). Resultado: 40/40 resueltas — o bien autocontenidas, o bien con gráfico recuperado.",
      "Bloque recuperado con imagen nueva (recortada de la foto original y verificada visualmente contra la clave): wa-aptitudes-21/22 (imagen que tenía asignada antes NO era la suya — mostraba la página de los ítems 50-53; corregida), wa-aptitudes-42, wa-aptitudes-49, wa-aptitudes-53, wa-aptitudes-55. Los 3 últimos salen de needs_review/status:\"revision\" de la ronda anterior.",
      "Excluidos permanentemente (sin fuente recuperable): ninguno nuevo esta ronda — los 3 que estaban en revision se recuperaron todos.",
      "(h) marca ex20240317-38 (ciclista, +5km/día) por \"de los siguientes\" — falso positivo revisado a mano: es una progresión aritmética autocontenida (10 + 5×13 = 75km, opción D), no depende de ningún gráfico. Queda en el pool.",
      "Bug de repetición dentro de una misma lección: content.js elegía cada ítem con Math.random() independiente por pregunta, sin memoria de lo ya servido -> podía repetir el mismo id real o la misma pregunta generada dos veces en una lección. Fix: buildLesson/makeItem ahora reciben una `session` (ids reales ya usados + firmas normalizadas ya usadas) y consumen cada bloque de REAL barajado una vez (Fisher-Yates) sin reemplazo; los generadores reintentan hasta 10 veces ante colisión de firma y si no, se descarta esa pregunta y la lección se acorta en vez de repetir.",
      "Añadido check (i) al validador: 0 duplicados reales en las 710 preguntas (una comprobación ingenua solo por texto daba 60 falsos positivos en categorías de figura, resueltos incluyendo `image` en la firma).",
    ],
  },
];

/* ------------------------------- (i) duplicados de todo el banco ------------------------------- */
function normalizeSignature(text) {
  return text
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/* ------------------------------- recorrido principal ------------------------------- */
const findings = { outOfRange: [], dupOptions: [], arithmeticMismatch: [], truncated: [], missingAsset: [], brokenImage: [], crossedImage: [], implicitDependency: [] };
// Duplicados por firma normalizada del prompt. Incluye el campo `image` en la firma:
// las preguntas de figura comparten prompt genérico ("¿Qué figura completa...") y lo
// que las distingue de verdad es la imagen, así que sin esto casi todas las preguntas
// de matrices/relojes/figuras_no_relacionadas/test_series_figuras (mismo prompt
// genérico, imagen distinta) saldrían como falsos positivos.
const bySignature = new Map();
for (const it of REAL) {
  const sig = normalizeSignature(it.prompt) + "|" + (it.image ?? "");
  if (!bySignature.has(sig)) bySignature.set(sig, []);
  bySignature.get(sig).push(it);
}
const CONFIDENCE_RANK = { alta: 2, media: 1, baja: 0 };
const duplicateGroups = [...bySignature.values()].filter((g) => g.length > 1);
const byCategory = {};

for (const it of REAL) {
  byCategory[it.category] ??= { total: 0, revision: 0 };
  byCategory[it.category].total++;

  // (a)
  if (it.correctIndex < 0 || it.correctIndex >= it.options.length) {
    findings.outOfRange.push(it);
  }

  // (b)
  if (new Set(it.options).size !== it.options.length) {
    findings.dupOptions.push(it);
  }

  // (c)
  const legs = checkLegsTotal(it.prompt);
  if (legs !== null && it.correctIndex < it.options.length) {
    if (!numberInOptions(it.options, legs)) findings.arithmeticMismatch.push({ ...it, expected: legs });
    else {
      const got = parseNumber(String(it.options[it.correctIndex]).replace(/[^\d.,]/g, ""));
      if (Number.isFinite(got) && Math.abs(got - legs) > 0.5) findings.arithmeticMismatch.push({ ...it, expected: legs });
    }
  }
  const pct = checkPercentSimple(it.prompt);
  if (pct && it.correctIndex < it.options.length) {
    const got = parseNumber(String(it.options[it.correctIndex]).replace(/[^\d.,]/g, ""));
    if (Number.isFinite(got) && Number.isFinite(pct.expected) && Math.abs(got - pct.expected) > Math.max(1, pct.expected * 0.01)) {
      findings.arithmeticMismatch.push({ ...it, expected: Math.round(pct.expected * 100) / 100 });
    }
  }

  // (d)
  const trunc = looksTruncated(it.prompt);
  if (trunc) findings.truncated.push({ ...it, reason: trunc });

  // (e) + (f): cita gráfico/tabla/figura sin asset válido, o cualquier imagen rota.
  // "cuadro" se restringe a la acepción "tabla/gráfico" (p. ej. "el cuadro siguiente");
  // en este banco "cuadro"/"cuadros" aparece siempre como "pintura" (obras de arte,
  // museo, precio de catálogo) y generaba falsos positivos si se matcheaba en bruto.
  //
  // IMPLICIT_DEPENDENCY amplía la red a enunciados que dependen de datos externos SIN
  // usar ninguna de las palabras de citesGraphic (el caso que se escapó la ronda
  // anterior: "Se entrevistaron a 200 ancianos... ¿cuántos NO ven documentales?" no
  // dice "gráfico" en ningún sitio). Es una señal blanda -> no basta con no tener
  // imagen para marcar revision automáticamente (dispara en problemas de porcentajes
  // 100% autocontenidos), así que se reporta aparte en (h) para revisión semántica,
  // no se mezcla con (e).
  const citesGraphic = /gráfic|tabla|figura|imagen|dibujo|serie siguiente|cuadro (siguiente|adjunto|de doble entrada)/i.test(it.prompt);
  const IMPLICIT_DEPENDENCY = /se entrevistaron a \d|de los \d+ (?:que|encuestados|entrevistados)|sobre el porcentaje|según los datos|según los resultados|en la muestra|puede afirmarse que|de los siguientes|\([^)]*\/[^)]*\)|\([^)]*\bx\b[^)]*\)/i;
  const impliesExternalData = IMPLICIT_DEPENDENCY.test(it.prompt);
  const hasImageField = !!it.image;
  const imageExists = hasImageField && diskAssets.has(it.image);
  if (citesGraphic && (!hasImageField || !imageExists)) {
    findings.missingAsset.push({ ...it, reason: !hasImageField ? "sin campo image" : "archivo no existe" });
  } else if (hasImageField && !imageExists) {
    findings.brokenImage.push(it);
  } else if (!citesGraphic && impliesExternalData && !hasImageField) {
    findings.implicitDependency.push(it);
  }

  // (g): cruce de imagen — la carpeta del asset no encaja con el sourceFile del ítem
  if (hasImageField) {
    const folder = it.image.split("/")[0];
    const entry = FOLDER_SOURCE_HINTS.find((f) => f.folder === folder);
    if (entry && !entry.hints.some((h) => it.sourceFile.includes(h))) {
      findings.crossedImage.push({ ...it, folder });
    }
  }
}

const revisionIds = new Set([
  ...findings.outOfRange, ...findings.dupOptions, ...findings.arithmeticMismatch,
  ...findings.missingAsset, ...findings.crossedImage,
].map((it) => it.id));
const alreadyMarked = [...revisionIds].filter((id) => REAL.find((r) => r.id === id)?.status === "revision");
const stillPending = [...revisionIds].filter((id) => !alreadyMarked.includes(id));
for (const it of REAL) if (revisionIds.has(it.id) || it.status === "revision") byCategory[it.category].revision++;

/* ------------------------------- informe ------------------------------- */
function section(title, items, render) {
  let out = `\n## ${title} (${items.length})\n\n`;
  if (!items.length) return out + "Ninguno.\n";
  for (const it of items) out += render(it) + "\n";
  return out;
}

let md = `# Auditoría de preguntas reales (data/real.source.js)\n\n`;
md += `Generado por \`scripts/validate-questions.mjs\`. Total de ítems: ${REAL.length}. `;
md += `Ítems con hallazgos que ameritan \`status: "revision"\`: ${revisionIds.size} `;
md += `(${alreadyMarked.length} ya marcados y excluidos del pool por content.js, ${stillPending.length} pendientes de marcar).\n`;
if (stillPending.length) {
  md += `\n**Pendientes de marcar:** ${stillPending.map((id) => `\`${id}\``).join(", ")}\n`;
}
md += `\n_(f) y (g) parten de ${diskAssets.size} assets encontrados en public/assets/exams/._\n`;

md += `\n## Registro de sesiones (trabajo manual, no derivable de REAL)\n`;
for (const entry of SESSION_LOG) {
  md += `\n### ${entry.date}\n\n`;
  for (const note of entry.notes) md += `- ${note}\n`;
}

md += section("(a) correctIndex fuera de rango", findings.outOfRange,
  (it) => `- \`${it.id}\`: correctIndex=${it.correctIndex}, ${it.options.length} opciones — "${it.prompt.slice(0, 80)}..."`);

md += section("(b) opciones duplicadas", findings.dupOptions,
  (it) => `- \`${it.id}\`: [${it.options.join(" | ")}]`);

md += section("(c) aritmética simple: el resultado calculado no coincide con la opción marcada", findings.arithmeticMismatch,
  (it) => `- \`${it.id}\`: calculado=${it.expected}, marcada=${it.options[it.correctIndex]} (opciones: [${it.options.join(" | ")}]) — "${it.prompt}"`);

md += section("(d) prompts que parecen truncados", findings.truncated,
  (it) => `- \`${it.id}\` (${it.reason}): "${it.prompt}"`);

md += section("(e) citan gráfico/tabla/figura sin asset válido (requiresAsset)", findings.missingAsset,
  (it) => `- \`${it.id}\` [${it.category}] (${it.reason})${it.status === "revision" ? " — ya marcado `status: \"revision\"`" : " — **pendiente de marcar**"}: "${it.prompt.slice(0, 90)}..."`);

md += section("(f) imagen rota (no cita gráfico en el prompt, pero el archivo no existe)", findings.brokenImage,
  (it) => `- \`${it.id}\`: image="${it.image}"`);

md += section("(g) posible imagen cruzada (carpeta del asset no encaja con sourceFile)", findings.crossedImage,
  (it) => `- \`${it.id}\`: image="${it.image}" (carpeta "${it.folder}") — sourceFile="${it.sourceFile}"`);

md += section("(h) posible dependencia de datos externos sin palabra-gancho (señal blanda, revisar a mano)", findings.implicitDependency,
  (it) => `- \`${it.id}\` [${it.category}]: "${it.prompt.slice(0, 110)}..."`);

md += `\n## (i) duplicados por firma normalizada de prompt (${duplicateGroups.length} grupos)\n\n`;
md += duplicateGroups.length
  ? "Se conserva el de mayor confidence de cada grupo; el resto se marcaría `status: \"revision\"`.\n\n" +
    duplicateGroups.map((g) => {
      const sorted = [...g].sort((a, b) => (CONFIDENCE_RANK[b.confidence] ?? -1) - (CONFIDENCE_RANK[a.confidence] ?? -1));
      const [keep, ...rest] = sorted;
      return `- conserva \`${keep.id}\` (${keep.confidence}) — descarta ${rest.map((r) => `\`${r.id}\` (${r.confidence})`).join(", ")}`;
    }).join("\n") + "\n"
  : "Ninguno. (Nota: una comprobación ingenua solo por texto de prompt da 60 falsos positivos en categorías de figura — matrices/relojes/figuras_no_relacionadas/test_series_figuras comparten prompt genérico \"¿Qué figura completa...?\" pero cada una trae una imagen distinta. La firma real incluye el campo `image` precisamente para no confundir eso con un duplicado.)\n";

md += `\n## Ítems fuera del pool por categoría\n\n`;
md += `| categoría | total | en revisión |\n|---|---|---|\n`;
for (const [cat, n] of Object.entries(byCategory).sort()) md += `| ${cat} | ${n.total} | ${n.revision} |\n`;

mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, md, "utf8");

console.log(`Auditoría escrita en ${path.relative(ROOT, REPORT_PATH)}`);
console.log(`  (a) correctIndex fuera de rango: ${findings.outOfRange.length}`);
console.log(`  (b) opciones duplicadas: ${findings.dupOptions.length}`);
console.log(`  (c) aritmética no coincide: ${findings.arithmeticMismatch.length}`);
console.log(`  (d) prompts truncados: ${findings.truncated.length}`);
console.log(`  (e) gráfico sin asset válido: ${findings.missingAsset.length}`);
console.log(`  (f) imagen rota: ${findings.brokenImage.length}`);
console.log(`  (g) posible imagen cruzada: ${findings.crossedImage.length}`);
console.log(`  (h) dependencia implícita (señal blanda): ${findings.implicitDependency.length}`);
console.log(`  (i) grupos duplicados: ${duplicateGroups.length}`);
console.log(`  total propuesto para revision: ${revisionIds.size}`);
