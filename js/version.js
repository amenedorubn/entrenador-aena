// Versión visible de la app (Ajustes → Acerca de) y usada para depurar caché de
// service worker: si lo que ve el usuario en Ajustes no coincide con la última
// entrada de este archivo en el historial de git, su navegador está sirviendo una
// versión vieja desde caché y "Buscar actualizaciones" (o cerrar del todo la PWA y
// reabrirla) es el siguiente paso, no un bug de datos.
//
// Sube esto A LA VEZ que CACHE_VERSION en service-worker.js cada vez que cambie algo
// que el usuario pueda notar (datos, UI, lógica) — si solo subes una de las dos, el
// indicador de versión deja de servir para diagnosticar caché desactualizada.
export const APP_VERSION = "v12 · 2026-09-07";
