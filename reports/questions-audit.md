# Auditoría de preguntas reales (data/real.source.js)

Generado por `scripts/validate-questions.mjs`. Total de ítems: 710. Ítems con hallazgos que ameritan `status: "revision"`: 0 (0 ya marcados y excluidos del pool por content.js, 0 pendientes de marcar).

_(f) y (g) parten de 123 assets encontrados en public/assets/exams/._

## Registro de sesiones (trabajo manual, no derivable de REAL)

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
| analogias | 125 | 0 |
| domino | 19 | 0 |
| figuras_no_relacionadas | 50 | 0 |
| ingles_b1 | 50 | 0 |
| ingles_b2 | 45 | 0 |
| matrices | 73 | 0 |
| razonamiento_numerico | 40 | 0 |
| relojes | 40 | 0 |
| secuencia_num_letras | 39 | 0 |
| series_figuras | 77 | 0 |
| series_numeros | 60 | 0 |
| sinonimos_antonimos | 92 | 0 |
