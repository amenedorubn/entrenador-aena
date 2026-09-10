#!/usr/bin/env node
// Fase A del motor de variantes: agrupa los 710 ítems oficiales (data/real.source.js,
// gitignored) en familias y dice, por familia, si es parametrizable de verdad y cuántas
// variantes admite de forma realista. NO genera nada -- es solo el inventario que hay
// que revisar antes de tocar scripts/generar-variantes.mjs.
//
// Uso: node scripts/inventario-semillas.mjs
// Salida: reports/SEMILLAS.md + resumen por stdout.

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "real.source.js");
const REPORT_PATH = path.join(ROOT, "reports", "SEMILLAS.md");

if (!existsSync(SOURCE_PATH)) {
  console.error("data/real.source.js no existe en este checkout (gitignored). Nada que inventariar.");
  process.exit(0);
}

const { REAL } = await import(pathToFileURL(SOURCE_PATH));

/* ------------------------- categorías de figura: excluidas siempre ------------------------- */
// Coincide con FIGURE_CATEGORIES de data/real.js. cubos no tiene ítems hoy en el banco
// pero se deja listado por si algún día los hay -- no se toca de todos modos.
const FIGURE_CATEGORIES = new Set(["matrices", "series_figuras", "cubos", "domino", "relojes", "figuras_no_relacionadas"]);

/* -------------------- sub-clasificación de razonamiento_numerico (texto puro) -------------------- */
// Heurística por regex sobre el prompt. Solo se aplica a ítems SIN imagen -- los que sí
// la traen (gráfico de barras, tabla...) se excluyen aparte, aunque compartan categoría,
// porque su dato real vive en un PNG que no se puede regenerar de forma fiable.
const NUMERIC_RULES = [
  ["algebraico", /^Si:\s*[A-Z]|▲|■|[A-Z]\s*[+\-:]\s*[A-Z].*=/],
  ["probabilidad", /probabilidad|dado de seis caras|urna|bolas/i],
  ["porcentajes", /%|por ciento|descuento/i],
  ["edades", /años?\b.*(tiene|tenía|cumpl|edad)|cumplir[eé]|cumplirá/i],
  ["trabajo_velocidad", /trabajador|obrero|electricist|km\/h|kil[oó]metros por hora|velocidad media|d[ií]as? tardar|construye|instalaci[oó]n/i],
  ["proporciones", /proporci[oó]n|reparto|ratio|regla de tres|\b\d\/\d\b|se reparten/i],
];
function classifyNumeric(prompt) {
  for (const [name, re] of NUMERIC_RULES) if (re.test(prompt)) return name;
  return "aritmetica_general";
}

/* ------------------------------------- definición de familias ------------------------------------- */
// Cada regla se evalúa en orden contra (categoría, item) y devuelve el id de familia.
// `parametrizable` es la clasificación final que va al informe: "si" | "no" | "parcial"
// (parcial = técnicamente se puede, pero necesita un recurso curado -- léxico o banco
// de reglas gramaticales -- en vez de una fórmula pura, así que el riesgo de perder
// fidelidad es mayor).
function buildFamilies(items) {
  const families = new Map(); // familyId -> { items:[], parametrizable, nota }
  const add = (id, item, parametrizable, nota) => {
    if (!families.has(id)) families.set(id, { items: [], parametrizable, nota });
    families.get(id).items.push(item);
  };

  for (const it of items) {
    if (FIGURE_CATEGORIES.has(it.category)) {
      add(`figura_${it.category}`, it, "no", "Figura/imagen. La generación de figuras no es fiable (decisión ya tomada) -- no se toca.");
      continue;
    }
    if (it.category === "series_numeros") {
      add("series_numeros", it, "no",
        "El nombre sugiere serie numérica en TEXTO, pero los 60 ítems reales son imagen (prompt \"ver imagen\", opciones A/B/C/D): funcionalmente es una categoría de figura aunque no esté en FIGURE_CATEGORIES. Tratada como figura: no se toca.");
      continue;
    }
    if (it.category === "secuencia_num_letras") {
      add("secuencia_num_letras", it, "no",
        "Mismo caso que series_numeros: los 39 ítems son imagen (prompt \"ver imagen\", opciones A/B/C/D), pese a que el nombre de categoría sugiere texto parametrizable. No se toca.");
      continue;
    }
    if (it.category === "razonamiento_numerico") {
      if (it.image) {
        add("razonamiento_numerico_grafico", it, "no",
          "Dato real en un gráfico/tabla de imagen (barras, series temporales, encuestas...) -- sin OCR/lectura de gráfico fiable no se puede parametrizar sin arriesgar inventar el dato. No se toca.");
        continue;
      }
      const sub = classifyNumeric(it.prompt);
      add(`razonamiento_numerico_${sub}`, it, "si",
        "Word problem en texto puro, resultado computable con código -- la respuesta se calcula, nunca se copia de la semilla (regla dura de la Fase B).");
      continue;
    }
    if (it.category === "sinonimos_antonimos") {
      add("sinonimos_antonimos", it, "parcial",
        "Parametrizable en el sentido de \"misma relación (sinónimo/antónimo), mismo registro, otra palabra\" -- pero NO se puede recalcular un sinónimo con una fórmula: hace falta un léxico ya vetado (data/lexicon.js tiene hoy 130 sinónimos + 46 antónimos por `sense`) del que tirar. La variante no es un \"clon numérico\" de la semilla, es la semilla más cercana en dificultad/sense servida como plantilla de formato; el origenId es una vinculación aproximada, no una derivación exacta.");
      continue;
    }
    if (it.category === "analogias") {
      add("analogias", it, "parcial",
        "Mismo caso que sinónimos/antónimos: la relación (parte-todo, causa-efecto...) es parametrizable, el par de palabras concreto no se calcula, sale de un pool vetado (data/lexicon.js ANALOGY_RELATIONS, hoy 14 relaciones / 84 pares). origenId por cercanía de dificultad, no por derivación exacta.");
      continue;
    }
    if (it.category === "ingles_b1" || it.category === "ingles_b2") {
      add(`${it.category}_gramatica_cloze`, it, "parcial",
        "Parametrizable cambiando sujeto/objeto/contexto de la frase manteniendo el MISMO punto gramatical (ya se hizo a mano para 17 ítems en la Tarea 2) -- pero identificar qué punto gramatical evalúa cada semilla es clasificación semántica, no una fórmula: hace falta revisar cada ítem (o grupo) a mano antes de generar, no un cálculo automático como en numérico.");
      continue;
    }
    add(`otros_${it.category}`, it, "no", "Categoría no contemplada en las reglas de la Fase A -- revisar a mano antes de decidir.");
  }
  return families;
}

const families = buildFamilies(REAL);

/* ------------------------------------- estimación de volumen ------------------------------------- */
// Rango de variantes REALISTAS por semilla, no por familia entera -- es una nota de
// diseño para la Fase B (que exigirá 3-8/semilla), no una promesa de cuántas se van a
// generar. Numérico admite más rango porque los "knobs" (magnitudes, nombres, unidades)
// son más numerosos y seguros de variar que en verbal/inglés.
function estimateRange(familyId, parametrizable) {
  if (parametrizable === "no") return "0 (no se toca)";
  if (familyId.startsWith("razonamiento_numerico_")) return "5-8 por semilla (magnitudes, nombres, unidades, orden de datos)";
  if (familyId === "sinonimos_antonimos" || familyId === "analogias") return "2-4 por semilla (limitado por cuántas entradas del mismo sense/relación hay en el léxico vetado)";
  if (familyId.endsWith("_gramatica_cloze")) return "3-5 por semilla (contexto/sujeto/objeto variable, la forma gramatical exigida no cambia)";
  return "-";
}

/* ------------------------------------------- informe ------------------------------------------- */
let md = `# Inventario de semillas para el motor de variantes\n\n`;
md += `Generado por \`scripts/inventario-semillas.mjs\` sobre \`data/real.source.js\` (${REAL.length} ítems oficiales). Fase A únicamente -- no se ha generado ninguna variante.\n\n`;

const rows = [...families.entries()].sort((a, b) => b[1].items.length - a[1].items.length);
const totalParametrizable = rows.filter(([, f]) => f.parametrizable !== "no").reduce((n, [, f]) => n + f.items.length, 0);
const totalNo = rows.filter(([, f]) => f.parametrizable === "no").reduce((n, [, f]) => n + f.items.length, 0);

md += `## Resumen\n\n`;
md += `- Total ítems oficiales: **${REAL.length}**\n`;
md += `- Parametrizables (sí + parcial): **${totalParametrizable}**\n`;
md += `- No parametrizables (figuras, imagen, sin regla): **${totalNo}**\n\n`;

md += `## Correcciones al encargo (léelas antes de la tabla)\n\n`;
md += `1. **\`series_numeros\` (60 ítems) y \`secuencia_num_letras\` (39 ítems) NO son parametrizables**, pese a estar en la lista de "sí son parametrizables" del encargo. Los 99 ítems reales de ambas categorías son 100% imagen (el \`prompt\` es literalmente "¿qué número/letra falta? (ver imagen)" y las opciones son letras A/B/C/D que remiten a la figura) -- funcionalmente son categorías de figura aunque el nombre no lo diga y no estén en \`FIGURE_CATEGORIES\`. Tratadas como figura: **no se tocan**.\n`;
md += `2. **11 de los 40 ítems de \`razonamiento_numerico\` dependen de una imagen** (gráfico de barras, series temporales, encuestas) -- el dato real no está en el texto, está en el PNG. Se excluyen de la generación por el mismo motivo que las figuras (no hay lectura de gráfico fiable): quedan **29** ítems de texto puro realmente parametrizables en esta categoría.\n`;
md += `3. **\`sinónimos/antónimos\` y \`analogías\` (217 ítems) son parametrizables solo "parcial"**: no hay fórmula que calcule un sinónimo. La variante saldría de un léxico ya vetado (\`data/lexicon.js\`: 130 sinónimos, 46 antónimos, 14 relaciones de analogía/84 pares) filtrado por \`sense\`/dificultad de la semilla, no de una transformación de sus valores. El \`origenId\` sería una vinculación por cercanía, no una derivación exacta -- lo aviso porque cambia lo que "variante" significa para esta familia frente a numérico.\n`;
md += `4. **Inglés (95 ítems, \`ingles_b1\`/\`ingles_b2\`) es parametrizable, pero no automáticamente**: cambiar sujeto/contexto manteniendo el mismo punto gramatical exige saber QUÉ punto gramatical evalúa cada semilla (tiempo verbal, voz pasiva, phrasal verb...) -- eso es clasificación semántica que hay que hacer ítem a ítem (o por lotes reconocibles) antes de poder generar, no una fórmula.\n`;
md += `5. **Competencias conductuales: no hay ninguna en \`data/real.source.js\`** (0 ítems con categoría \`competencias_conductuales\`) -- el banco de SJT (\`data/sjt.js\`) ya es \`origen: "generada"\` y vive aparte. Nada que excluir aquí, nada que hacer.\n\n`;

md += `## Por familia\n\n`;
md += `| Familia | Categoría origen | Ítems | Parametrizable | Rango realista por semilla |\n`;
md += `|---|---|---|---|---|\n`;
for (const [famId, f] of rows) {
  const cats = [...new Set(f.items.map((i) => i.category))].join(", ");
  const p = f.parametrizable === "si" ? "✅ sí" : f.parametrizable === "parcial" ? "🟡 parcial" : "❌ no";
  md += `| \`${famId}\` | ${cats} | ${f.items.length} | ${p} | ${estimateRange(famId, f.parametrizable)} |\n`;
}

md += `\n## Detalle y ejemplos por familia\n\n`;
for (const [famId, f] of rows) {
  md += `### \`${famId}\` (${f.items.length} ítems)\n\n`;
  md += `${f.nota}\n\n`;
  md += `Ejemplos:\n`;
  for (const it of f.items.slice(0, 3)) {
    md += `- \`${it.id}\`: ${it.prompt.replace(/\n/g, " ").slice(0, 140)}${it.prompt.length > 140 ? "…" : ""}\n`;
  }
  md += `\n`;
}

mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, md, "utf8");

console.log(`Total: ${REAL.length} | parametrizables: ${totalParametrizable} | no: ${totalNo}`);
for (const [famId, f] of rows) console.log(`  ${famId}: ${f.items.length} (${f.parametrizable})`);
console.log(`\nInforme completo: ${path.relative(ROOT, REPORT_PATH)}`);
