// Guía de estudio de Inglés oficial. Las reglas y consejos son material genérico (van en
// claro); las preguntas, sus respuestas y explicaciones salen del banco ya descifrado
// (REAL), así que nada de texto de examen vive aquí. Se agrupa por el campo `tema` de
// cada pregunta (ver data/real.source.js).

const MACRO = {
  "Tiempos verbales": ["Tiempos verbales: present perfect", "Tiempos verbales: past simple", "Tiempos verbales: pasado", "Tiempos verbales: pasado continuo", "Tiempos verbales: presente simple", "Tiempos verbales: present perfect continuous", "Tiempos verbales: past perfect", "Futuro: planes", "Used to / hábitos pasados", "Verbos estáticos"],
  "Condicionales, wish y estilo indirecto": ["Condicionales y oraciones temporales", "Condicionales y wish", "Estilo indirecto"],
  "Voz pasiva": ["Voz pasiva"],
  "Verbos modales": ["Verbos modales"],
  "Cuantificadores, contables e incontables": ["Cuantificadores y contables", "Incontables", "Contables y envases"],
  "Pronombres, relativos, artículos y comparativos": ["Pronombres y posesivos", "Pronombres relativos", "Artículos", "Comparativos y superlativos", "Have got / preguntas", "Question tags", "Preguntas de sujeto", "Adverbios de frecuencia", "Adverbios de grado", "Adjetivos -ed / -ing", "Negación y any-/no-"],
  "Gerundio, infinitivo e imperativo": ["Gerundio e infinitivo", "Imperativo"],
  "Preposiciones y conectores": ["Preposiciones", "Conectores"],
  "Vocabulario: collocations, phrasal verbs y palabras": ["Collocations (make / do / take)", "Collocations", "Phrasal verbs", "Palabras confundibles", "Vocabulario por campos", "Vocabulario: cocina", "Formación de palabras"],
};
const macroOf = (t) => Object.entries(MACRO).find(([, v]) => v.includes(t))?.[0] ?? "Otros";

const GUIDE = {
  "Tiempos verbales": [
    "Past simple = hecho terminado con marca de tiempo (yesterday, last week, on Saturday, «she never came»).",
    "Present perfect (have/has + participio) = desde el pasado hasta ahora: how long, for, since, hasta ahora.",
    "Present perfect continuous = duración con resultado visible: «tired because he has been writing all day».",
    "Past continuous (was/were + -ing) = acción en curso, y lo interrumpe un past simple: «called me while I was waiting».",
    "Past perfect (had + participio) = anterior a otro hecho del pasado: «hadn’t taken her phone, so couldn’t call».",
    "Futuro: plan ya organizado → be going to / present continuous («already booked»). will = decisión espontánea o predicción.",
    "Verbos estáticos (understand, know, believe, like, want) NO se usan en continuo.",
    "Concordancia: sujeto singular (everything, Maria, the car) → was / goes / has.",
  ],
  "Condicionales, wish y estilo indirecto": [
    "1.º condicional: if + presente simple → will + infinitivo. Tras when/if/as soon as NUNCA will.",
    "2.º condicional: if + pasado simple → would/could + infinitivo («If I won…, I’d go»). Nunca «would» en la cláusula if.",
    "I wish + pasado simple / could = deseo irreal sobre el presente.",
    "Estilo indirecto: el tiempo retrocede un paso: am going → was going; can → could; will → would; present → past.",
  ],
  "Voz pasiva": [
    "be + participio. Presente: is delivered · Pasado: was taken · Futuro: will be delivered.",
    "Si el sujeto no puede hacer la acción (la foto, los muebles), es pasiva.",
  ],
  "Verbos modales": [
    "can = habilidad · may = posibilidad/permiso · should = consejo · must = obligación.",
    "Deducción: must be (seguro que sí) · can’t be (imposible, p. ej. tiene 17 años).",
    "Pasado de can para un logro puntual: was/were able to (no «could»). Pasado de have to = had to.",
  ],
  "Cuantificadores, contables e incontables": [
    "Incontables frecuentes: advice, flour, sugar, money, sleep, information, furniture. Sin plural, sin «a».",
    "many / few / too many → contables plurales · much / little / too much → incontables.",
    "some → afirmativas · any → negativas e interrogativas · hardly any = casi nada.",
    "«a lot» y «plenty» necesitan of delante del sustantivo.",
    "Envases: tins of sardines/beans (latas) · packets · cartons · jars.",
  ],
  "Pronombres, relativos, artículos y comparativos": [
    "Adjetivo posesivo (my, her) lleva sustantivo · pronombre posesivo (mine, hers) va solo.",
    "Relativos: who (personas), which (cosas), that (no va tras coma). Entre comas = which/who.",
    "Frecuencia: antes del verbo principal, después de to be (usually go, is always late).",
    "Comparativos: as + adj + as (igualdad) · taller than · the tallest (nunca «the most tallest»).",
    "Adjetivos extremos (useless, impossible) → completely/totally, no «very».",
    "Question tag: afirmativa → tag negativo (live, don’t they?). have you got: auxiliar + sujeto + got.",
    "Pregunta cuyo sujeto es who/which one: sin do/does («Which one lives…?»).",
    "-ed = cómo me siento (stressed) · -ing = lo que lo causa (stressful).",
    "Any- con verbo negativo, nunca doble negación (didn’t eat anything).",
    "the University of Oxford (nombres con of llevan the).",
  ],
  "Gerundio, infinitivo e imperativo": [
    "let + objeto + infinitivo SIN to · promise/decide/want + to + infinitivo · how + to + infinitivo.",
    "look forward TO + gerundio (to es preposición): looking forward to seeing.",
    "Imperativo afirmativo = infinitivo sin to: «Be on time!».",
  ],
  "Preposiciones y conectores": [
    "Adjetivo + preposición: interested IN · pleased WITH · keen ON · good AT · apologize FOR · in charge OF · responsible FOR.",
    "Contraste: although / even though / though + ORACIÓN · despite / in spite of + SUSTANTIVO o -ing.",
    "Causa: because + oración · because of / due to / owing to + sustantivo · since / as + oración.",
    "Tiempo: after / before / when + oración; en el futuro, presente simple.",
  ],
  "Vocabulario: collocations, phrasal verbs y palabras": [
    "Collocations: do the washing-up, do a favor, make an appointment, meet a deadline, put effort into, fast asleep, carry out a survey.",
    "Phrasal verbs: call off (cancelar) · put off (aplazar) · tidy up (ordenar) · put out (apagar) · carry out (realizar).",
    "Falsos amigos: sensible = sensato / sensitive = sensible · laboral NO existe (working conditions).",
    "Prefijo de polite = im- (impolite). Antes de p/m/b se escribe im-.",
    "Cocina: bake/roast (horno) · fry/stir-fry (sartén) · boil (hervir) · peel (pelar) · stir (remover).",
    "Lugares y cosas: library (se pide prestado) vs bookshop (se compra) · balcony / basement / landing · chef / cooker / cuisine.",
    "Trip = viaje concreto (a trip to…) · travel es incontable.",
  ],
};


const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const L = "ABCD";
const BANKS = { b1: ["ingles_b1", "Inglés B1", "ítems 140–189"], b2: ["ingles_b2", "Inglés B2", "ítems 1–50"] };

function bankHtml(items, cat, title, rangeLabel) {
  const qs = items.filter((q) => q.category === cat && q.tema)
    .sort((a, b) => Number(a.id.split("-").pop()) - Number(b.id.split("-").pop()));
  if (!qs.length) return "";
  const groups = {};
  for (const q of qs) (groups[macroOf(q.tema)] ??= []).push(q);
  const order = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  const total = qs.length;
  const bars = order.map(([m, g]) => `<div class="progress-item"><div class="progress-item__head"><span>${esc(m)}</span><span>${g.length} · ${Math.round((g.length / total) * 100)} %</span></div>
    <div class="progress-item__bar"><div class="progress-item__fill" style="width:${(g.length / order[0][1].length) * 100}%;background:var(--blue)"></div></div></div>`).join("");
  const sections = order.map(([m, g], i) => `<div class="card" style="margin-top:10px"><div class="card__title">${i + 1}. ${esc(m)} · ${g.length} de ${total}</div>
    <b>Qué te tienes que aprender</b><ul>${(GUIDE[m] ?? []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    <details><summary><b>Ver las ${g.length} preguntas con su regla</b></summary>
    ${g.map((q) => `<p style="margin-top:10px"><b>${q.id.split("-").pop()}.</b> ${esc(q.prompt).replace("___", "_____")}<br>
      <b>✅ ${L[q.correctIndex]}) ${esc(q.options[q.correctIndex])}</b> · <span class="note">${esc(q.tema)}</span><br><span class="note">${esc(q.explanation ?? "")}</span></p>`).join("")}
    </details></div>`).join("");
  return `<h2 style="margin:18px 0 4px">${title} <span class="note">${rangeLabel} · ${total} preguntas</span></h2>
    <div class="card"><div class="card__title">Qué cae y cuánto</div><div class="progress-list">${bars}</div></div>${sections}`;
}

/** HTML de la guía. bank: "b1" | "b2" | "all". penalty: puntos que resta cada fallo. */
export function guideHtml(bank, items, penalty = 0.2) {
  const keys = bank === "all" ? ["b1", "b2"] : [bank];
  const body = keys.map((k) => bankHtml(items, ...BANKS[k])).join("");
  if (!body) return `<p class="note">La guía se genera con las preguntas del banco: desbloquéalas primero.</p>`;
  const p = String(penalty).replace(".", ",");
  const guess = Math.round((0.25 - 0.75 * penalty) * 100) / 100;
  return `<div class="card"><b>Cómo se puntúa (supuesto)</b><br>+1 por acierto y −${p} por error (frase del cuadernillo, pendiente de confirmar en las bases); se aprueba con la mitad de la nota máxima. Con 4 opciones, responder al azar rinde ${guess > 0 ? "+" : ""}${String(guess).replace(".", ",")} de media${guess > 0 ? ": no dejes ninguna en blanco" : ""}.</div>
  ${body}
  <h2 style="margin:22px 0 4px">Las 10 trampas que más se repiten</h2>
  <div class="card"><ol style="margin:0;padding-left:20px">
  <li>Tras <b>when / if / as soon as</b> en futuro: presente simple, nunca will.</li>
  <li><b>Past simple</b> si hay marca de tiempo terminada; <b>present perfect</b> si es «hasta ahora».</li>
  <li>Sujeto singular → <b>was / goes / has</b> (everything, the car, Maria).</li>
  <li><b>Although / even though</b> + oración; <b>despite / in spite of</b> + sustantivo.</li>
  <li><b>Due to / because of</b> + sustantivo; <b>because / since</b> + oración.</li>
  <li>Incontables sin plural: <b>advice, furniture, money, sleep, flour</b>.</li>
  <li><b>Look forward to + -ing</b>; <b>let + infinitivo sin to</b>.</li>
  <li>Estilo indirecto: retrocede un tiempo (<b>am going → was going</b>, <b>can → could</b>).</li>
  <li>Falsos amigos: <b>sensible ≠ sensitive</b>; <b>laboral</b> no existe.</li>
  <li>Las colocaciones se memorizan: <b>do</b> the washing-up / a favor, <b>make</b> an appointment, <b>meet</b> a deadline.</li></ol></div>`;
}
