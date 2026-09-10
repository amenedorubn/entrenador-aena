# Auditoría de preguntas reales (data/real.source.js)

Generado por `scripts/validate-questions.mjs`. Total de ítems: 717. Ítems con hallazgos que ameritan `status: "revision"`: 0 (0 ya marcados y excluidos del pool por content.js, 0 pendientes de marcar).

_(f) y (g) parten de 123 assets encontrados en public/assets/exams/._

## Registro de sesiones (trabajo manual, no derivable de REAL)

### 2026-09-07 (ronda 4)

- La ronda 3 (mismo día, más abajo) se equivocó: concluyó 'no reproduce' para las categorías matrices/figuras_no_relacionadas/series_figuras basándose solo en heurísticas (rango, carpeta, duplicados). El usuario reportó que el bug seguía viéndose tras confirmar que sí tenía la versión nueva -> auditoría visual página a página (public/assets/exams/{matrices,figuras_no_relacionadas,test_series_figuras}/) contra scripts/build_figures_with_keys.py (data/raw_extracted/), que reveló el bug real: ese script generador calculaba la página de cada ítem con un items_per_page FIJO por categoría (6/12/3) en vez del recuento real por página, y fijaba 'options: LETTERS[:4]' para TODAS las categorías por un ternario roto (ambas ramas idénticas) aunque matrices/figuras_no_relacionadas/series_figuras no son todas de 4 opciones.
- matrices (60 ítems): es de 5 opciones (a-e) en TODA la página, confirmado visualmente en las 10 páginas (p2-p11). Página real por ítem ≠ la asumida (p.ej. matrices-c1-7 apuntaba a p3.png, la real es p2.png; los 30 ítems de Cuestionario 2 apuntaban a las páginas de Cuestionario 1 en vez de a p7-p11, que existían en disco pero huérfanas). Recalculada la página real de los 60 ítems y ampliadas sus opciones a 5. correctIndex ya era fiable (viene de la clave transcrita a mano en build_figures_with_keys.py, 'verificado visualmente' según su propio comentario) — no se tocó.
- series_figuras / tsf-* (60 ítems; ex20240317-*/wa-aptitudes-* de esta misma categoría NO vienen de este script, no se tocaron): p2.png resultó ser la portada de instrucciones del PDF, no la primera pregunta -> TODOS los ítems apuntaban a la página siguiente a la que debían. Recalculada la página real de los 60 ítems (4 opciones a-d en toda la categoría, confirmado en las 13 páginas p3-p14).
- figuras_no_relacionadas / fnr-* (50 ítems): items_per_page=12 asumido no encajaba con el límite real de página (p2 tiene 11 ítems, no 12; Cuestionario 2 empieza a mitad de p4, no en una página propia). Recalculada la página real de los 50 ítems (4 opciones a-d, confirmado en 5 páginas p2-p6).
- 11 ítems (6 tsf + 5 fnr) tenían la clave OCR marcando letra 'E', imposible en un test de 4 opciones a-d -> señal de clave corrupta/desalineada para esos ítems concretos. Resueltos con certeza cruzando imagen+explicación: tsf-c1-23 (progresión al cuadrado: 2,4,16,256 -> c), fnr-c1-5 (única letra de líneas rectas entre B/D/H/S -> c), fnr-c2-19 (única figura dividida en 4 partes -> c). Los 8 restantes NO se pudieron determinar sin ambigüedad -> marcados status:'revision' con notaRevision explicando el motivo exacto y la página del PDF a revisar a mano, en vez de adivinar la letra.
- Re-encriptado real.source.js -> real.enc.json y CACHE_VERSION/APP_VERSION subidos para que el fix llegue de verdad a la PWA instalada (ver ronda anterior sobre el problema de caché).

### 2026-09-07 (ronda 3, diagnóstico inicial — parcialmente incorrecto, ver ronda 4)

- Concluyó, solo con heurísticas (rango, carpeta, duplicados, sin abrir ninguna imagen), que los 3 fallos reportados no reproducían y que ya estaban corregidos desde el 20-ago. Esto resultó ser incorrecto para matrices/figuras_no_relacionadas/series_figuras (ver ronda 4): las heurísticas no podían detectar un items_per_page mal calculado ni un ternario de opciones roto, porque ninguna de las dos cosas produce un dato 'fuera de rango' en sí misma.
- Sí acertó en diagnosticar y arreglar un problema real y distinto: la PWA no avisaba de actualizaciones disponibles (cache-first sin comprobación activa) -> añadido indicador de versión en Ajustes + botón 'Buscar actualizaciones' + aviso 'Actualizar ahora' (js/app.js, js/version.js). Esto seguía siendo necesario aunque la causa principal del bug reportado fuera otra.
- Añadido soporte de opciones-imagen (schema: opción string u objeto {text,asset}; js/engine.js: optionText/optionAsset + render con zoom) sin ningún caso real que lo necesite todavía en el banco.

### 2026-08-20 (ronda 2)

- Detector requiresAsset ampliado con patrones de dependencia implícita (ver (h) más abajo) — cubre el caso que se escapó: wa-aptitudes-42 ("Se entrevistaron a 200 ancianos...") no usa ninguna palabra tipo gráfico/tabla/figura.
- Pasada semántica manual sobre las 40 preguntas de razonamiento_numerico (única categoría con riesgo real de dependencia oculta: verbal/inglés son autocontenidas por construcción, y las categorías de figura ya exigen imagen). Resultado: 40/40 resueltas — o bien autocontenidas, o bien con gráfico recuperado.
- Bloque recuperado con imagen nueva (recortada de la foto original y verificada visualmente contra la clave): wa-aptitudes-21/22 (imagen que tenía asignada antes NO era la suya — mostraba la página de los ítems 50-53; corregida), wa-aptitudes-42, wa-aptitudes-49, wa-aptitudes-53, wa-aptitudes-55. Los 3 últimos salen de needs_review/status:"revision" de la ronda anterior.
- Excluidos permanentemente (sin fuente recuperable): ninguno nuevo esta ronda — los 3 que estaban en revision se recuperaron todos.
- (h) marca ex20240317-38 (ciclista, +5km/día) por "de los siguientes" — falso positivo revisado a mano: es una progresión aritmética autocontenida (10 + 5×13 = 75km, opción D), no depende de ningún gráfico. Queda en el pool.
- Bug de repetición dentro de una misma lección: content.js elegía cada ítem con Math.random() independiente por pregunta, sin memoria de lo ya servido -> podía repetir el mismo id real o la misma pregunta generada dos veces en una lección. Fix: buildLesson/makeItem ahora reciben una `session` (ids reales ya usados + firmas normalizadas ya usadas) y consumen cada bloque de REAL barajado una vez (Fisher-Yates) sin reemplazo; los generadores reintentan hasta 10 veces ante colisión de firma y si no, se descarta esa pregunta y la lección se acorta en vez de repetir.
- Añadido check (i) al validador: 0 duplicados reales en las 710 preguntas (una comprobación ingenua solo por texto daba 60 falsos positivos en categorías de figura, resueltos incluyendo `image` en la firma).

## (a) correctIndex fuera de rango (0)

Ninguno.

## (b) opciones duplicadas (0)

Ninguno.

## (b2) opción con forma inválida (ni texto ni asset, o asset roto) (0)

Ninguno.

## (c) aritmética simple: el resultado calculado no coincide con la opción marcada (0)

Ninguno.

## (d) prompts que parecen truncados (0)

Ninguno.

## (e) citan gráfico/tabla/figura sin asset válido (requiresAsset) (0)

Ninguno.

## (f) imagen rota (no cita gráfico en el prompt, pero el archivo no existe) (0)

Ninguno.

## (g) posible imagen cruzada (carpeta del asset no encaja con sourceFile) (0)

Ninguno.

## (h) posible dependencia de datos externos sin palabra-gancho (señal blanda, revisar a mano) (1)

- `ex20240317-38` [razonamiento_numerico]: "Un ciclista entrena todos los días durante 2 semanas, el primer día recorrió 10 kilómetros. Cada día de los si..."

## (i) duplicados por firma normalizada de prompt (0 grupos)

Ninguno. (Nota: una comprobación ingenua solo por texto de prompt da 60 falsos positivos en categorías de figura — matrices/relojes/figuras_no_relacionadas/test_series_figuras comparten prompt genérico "¿Qué figura completa...?" pero cada una trae una imagen distinta. La firma real incluye el campo `image` precisamente para no confundir eso con un duplicado.)

## Ítems fuera del pool por categoría

| categoría | total | en revisión |
|---|---|---|
| analogias | 126 | 0 |
| domino | 19 | 0 |
| figuras_no_relacionadas | 50 | 3 |
| ingles_b1 | 50 | 0 |
| ingles_b2 | 50 | 0 |
| matrices | 73 | 0 |
| razonamiento_numerico | 40 | 0 |
| relojes | 40 | 0 |
| secuencia_num_letras | 39 | 0 |
| series_figuras | 77 | 5 |
| series_numeros | 60 | 0 |
| sinonimos_antonimos | 93 | 1 |
