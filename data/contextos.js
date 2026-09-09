// Pool de contextos "de la vida cotidiana" para preguntas generadas/variantes (aptitudes
// e inglés). El examen real de AENA ambienta sus psicotécnicos en escenas neutras
// (granja, ropa por edades, encuestas de televisión, precios de supermercado...), no en
// un aeropuerto -- ver auditoría en scripts/audit-contextos.mjs. Aeropuerto entra aquí
// como UN dominio más entre 13, nunca como el marco por defecto: elegir uniformemente
// entre los 13 mantiene su peso en ~7.7 %, muy por debajo de la cuota dura del 15 %
// (ver test/context-quota.test.js).
export const CONTEXT_DOMAINS = [
  { id: "supermercado", label: "Supermercado y precios" },
  { id: "granja", label: "Granja y animales" },
  { id: "colegio", label: "Colegio e institutos" },
  { id: "transporte", label: "Transporte urbano (metro/bus)" },
  { id: "deporte", label: "Deporte y competiciones" },
  { id: "sanidad", label: "Sanidad y consultas" },
  { id: "meteorologia", label: "Meteorología" },
  { id: "banca", label: "Banca y ahorro" },
  { id: "cine", label: "Cine y ocio" },
  { id: "biblioteca", label: "Biblioteca y libros" },
  { id: "obra", label: "Obra y reformas" },
  { id: "hosteleria", label: "Hostelería" },
  { id: "aeropuerto", label: "Aeropuerto" }, // uno más, no el marco por defecto
];

export const AIRPORT_DOMAIN_ID = "aeropuerto";

// Léxico usado por scripts/audit-contextos.mjs para medir qué % de ítems generados
// quedó ambientado en un aeropuerto, en español e inglés (incluye variantes con y sin
// tilde/guion para no fallar por normalización de texto).
export const AIRPORT_LEXICON = [
  "aeropuerto", "vuelo", "vuelos", "avion", "avión", "aviones", "pasajero", "pasajeros",
  "terminal", "embarque", "equipaje", "equipajes", "facturacion", "facturación", "pista",
  "aerolinea", "aerolínea", "aerolíneas", "maleta", "maletas", "mostrador de facturación",
  "boarding", "flight", "flights", "gate", "luggage", "runway", "check-in", "checkin",
  "airport", "shuttle", "baggage", "passenger", "passengers", "suitcase", "departure",
  "departures", "arrivals",
];

/** Elección uniforme entre los 13 dominios -- ver nota de cuota arriba. */
export function pickContextDomain(chooseFn) {
  return chooseFn(CONTEXT_DOMAINS);
}
