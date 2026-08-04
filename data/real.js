// Punto de acceso a las preguntas reales de examen para el resto de la app.
// El contenido en sí (texto de preguntas, opciones, respuestas) vive cifrado en
// data/real.enc.json — este archivo se sirve en claro porque no contiene datos
// sensibles: FIGURE_CATEGORIES/CATEGORY_SOURCE son solo nombres de categoría, y
// REAL empieza vacío hasta que app.js descifra el bloque en el navegador con la
// contraseña del usuario y llama a loadReal(). Ver data/real.source.js (gitignored)
// y scripts/encrypt.mjs para el origen en texto plano y el proceso de cifrado.

export const FIGURE_CATEGORIES = new Set([
  "matrices", "series_figuras", "cubos", "domino", "relojes", "figuras_no_relacionadas", "series_numeros",
]);

// Categoría real -> fuente del curriculum (content.js/curriculum.js) que la consume.
export const CATEGORY_SOURCE = {
  sinonimos_antonimos: "verbal", analogias: "verbal", secuencia_num_letras: "verbal",
  razonamiento_numerico: "num", series_numeros: "num",
  matrices: "abs", series_figuras: "abs", cubos: "abs", domino: "abs", relojes: "abs", figuras_no_relacionadas: "abs",
  ingles_b1: "grammar", ingles_b2: "grammar",
  competencias_conductuales: "sjt",
};

export let REAL = [];

/** Sustituye el banco de preguntas reales tras descifrarlo (ver js/app.js). */
export function loadReal(items) {
  REAL = items;
}
