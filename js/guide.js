// Guía de estudio de Inglés oficial. Las reglas y consejos son material genérico (van en
// claro); las preguntas salen del banco ya descifrado (REAL), así que nada de texto de
// examen vive aquí. Se agrupa por el campo `tema` de cada pregunta (ver data/real.source.js).
// La pantalla que lo usa es js/study.js.

export const MACRO = {
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

export const GUIDE = {
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



export const BANKS = { b1: ["ingles_b1", "Inglés B1", "ítems 140–189"], b2: ["ingles_b2", "Inglés B2", "ítems 1–50"] };

const idNum = (q) => Number(q.id.split("-").pop());

/** Bloques de estudio de un banco ("b1" | "b2"), del que más cae al que menos:
 *  [{ name, items, rules }]. Solo cuentan preguntas con `tema`. */
export function studyBlocks(bank, items) {
  const cat = BANKS[bank][0];
  const groups = {};
  for (const q of items) {
    if (q.category !== cat || !q.tema) continue;
    (groups[macroOf(q.tema)] ??= []).push(q);
  }
  return Object.entries(groups)
    .map(([name, qs]) => ({ name, items: qs.sort((a, b) => idNum(a) - idNum(b)), rules: GUIDE[name] ?? [] }))
    .sort((a, b) => b.items.length - a.items.length);
}

export const TRAPS = [
  "Tras <b>when / if / as soon as</b> en futuro: presente simple, nunca will.",
  "<b>Past simple</b> si hay marca de tiempo terminada; <b>present perfect</b> si es «hasta ahora».",
  "Sujeto singular → <b>was / goes / has</b> (everything, the car, Maria).",
  "<b>Although / even though</b> + oración; <b>despite / in spite of</b> + sustantivo.",
  "<b>Due to / because of</b> + sustantivo; <b>because / since</b> + oración.",
  "Incontables sin plural: <b>advice, furniture, money, sleep, flour</b>.",
  "<b>Look forward to + -ing</b>; <b>let + infinitivo sin to</b>.",
  "Estilo indirecto: retrocede un tiempo (<b>am going → was going</b>, <b>can → could</b>).",
  "Falsos amigos: <b>sensible ≠ sensitive</b>; <b>laboral</b> no existe.",
  "Las colocaciones se memorizan: <b>do</b> the washing-up / a favor, <b>make</b> an appointment, <b>meet</b> a deadline.",
];
