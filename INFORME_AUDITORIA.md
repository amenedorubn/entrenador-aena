# INFORME_AUDITORIA.md

Generado por `scripts/audit-banco.mjs` el 2026-09-07. No modifica datos. Complementa a `reports/questions-audit.md` (generado por `scripts/validate-questions.mjs`, que ya corre en cada ronda de edición).

Total preguntas en `data/real.source.js`: **710**.

## 1. Total por examen/fuente

| fuente | total | con imagen | en revisión |
|---|---|---|---|
| EXAMENES AENA_opos/20240317_Examen AENA.pdf | 55 | 22 | 0 |
| EXAMENES AENA_opos/Aptitudes | 53 | 19 | 0 |
| EXAMENES AENA_opos/B1 | 50 | 0 | 0 |
| EXAMENES AENA_opos/B2 | 45 | 0 | 0 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/DOMINO.pdf | clave: EXAMENES AENA_opos/fwdtestconvocatoriaaena/TEST DOMINO RESUELTO.pdf | 19 | 19 | 0 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/FIGURAS NO RELACIONADAS.pdf | 50 | 50 | 3 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/MATRICES FIGURAS.pdf | 60 | 60 | 0 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/RELOJES.pdf | 40 | 40 | 0 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/SECUENCIA NUMEROS LETRAS.pdf | 39 | 39 | 0 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/SERIES NUMEROS.pdf | 60 | 60 | 0 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/TEST ANALOGIAS COMPLEJAS.pdf | 60 | 0 | 0 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/TEST ANALOGIAS SIMPLES.pdf | 59 | 0 | 0 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/TEST ANTONIMOS SINONIMOS.pdf | 60 | 0 | 0 |
| EXAMENES AENA_opos/fwdtestconvocatoriaaena/TEST SERIES FIGURAS.pdf | 60 | 60 | 5 |

## 2. Cómo se vincula el asset a la pregunta

El campo `image` de cada pregunta es un **nombre de fichero explícito** (p. ej. `aptitudes/whatsapp_item42.jpeg`), asignado pregunta a pregunta, no derivado de la posición del ítem dentro del array `REAL` ni de un índice compartido. La resolución en runtime es directa: `js/engine.js:77` construye `./public/assets/exams/${item.image}`.

369 de 710 preguntas traen `image`. 71 fotos son compartidas por más de una pregunta (normal: una misma foto de examen a veces contiene 2 ítems, p. ej. matrices consecutivas recortadas de la misma página):

- `aptitudes/whatsapp_item21_22.jpeg` → `wa-aptitudes-21`, `wa-aptitudes-22`
- `aptitudes/whatsapp_item23_24.jpeg` → `wa-aptitudes-23`, `wa-aptitudes-24`
- `aptitudes/whatsapp_item25_26.jpeg` → `wa-aptitudes-25`, `wa-aptitudes-26`
- `aptitudes/whatsapp_item27_28.jpeg` → `wa-aptitudes-27`, `wa-aptitudes-28`
- `aptitudes/whatsapp_item29_30.jpeg` → `wa-aptitudes-29`, `wa-aptitudes-30`
- `aptitudes/whatsapp_item31_32.jpeg` → `wa-aptitudes-31`, `wa-aptitudes-32`
- `aptitudes/whatsapp_item33_34.jpeg` → `wa-aptitudes-33`, `wa-aptitudes-34`
- `examen20240317/p6.png` → `ex20240317-21`, `ex20240317-22`
- `examen20240317/p7.png` → `ex20240317-23`, `ex20240317-24`
- `examen20240317/p8.png` → `ex20240317-25`, `ex20240317-26`
- `examen20240317/p9.png` → `ex20240317-27`, `ex20240317-28`
- `examen20240317/p10.png` → `ex20240317-29`, `ex20240317-30`
- `examen20240317/p11.png` → `ex20240317-31`, `ex20240317-32`
- `examen20240317/p12.png` → `ex20240317-33`, `ex20240317-34`
- `examen20240317/p16.png` → `ex20240317-42`, `ex20240317-44`
- `examen20240317/p18.png` → `ex20240317-48`, `ex20240317-49`
- `series_numeros/p2.png` → `series-num-c1-1`, `series-num-c1-2`, `series-num-c1-3`, `series-num-c1-4`, `series-num-c1-5`, `series-num-c1-6`, `series-num-c1-8`, `series-num-c1-9`, `series-num-c1-10`, `series-num-c1-7`
- `series_numeros/p3.png` → `series-num-c1-11`, `series-num-c1-13`, `series-num-c1-16`, `series-num-c1-17`, `series-num-c1-18`, `series-num-c1-19`, `series-num-c1-20`, `series-num-c1-21`, `series-num-c1-12`, `series-num-c1-14`, `series-num-c1-15`
- `series_numeros/p4.png` → `series-num-c1-23`, `series-num-c1-24`, `series-num-c1-25`, `series-num-c1-26`, `series-num-c1-27`, `series-num-c1-28`, `series-num-c1-29`, `series-num-c1-30`, `series-num-c1-22`
- `series_numeros/p5.png` → `series-num-c2-1`, `series-num-c2-2`, `series-num-c2-3`, `series-num-c2-4`
- `series_numeros/p6.png` → `series-num-c2-5`, `series-num-c2-6`, `series-num-c2-7`, `series-num-c2-8`, `series-num-c2-9`
- `series_numeros/p7.png` → `series-num-c2-10`, `series-num-c2-11`, `series-num-c2-12`
- `series_numeros/p8.png` → `series-num-c2-13`, `series-num-c2-14`, `series-num-c2-15`, `series-num-c2-16`
- `series_numeros/p9.png` → `series-num-c2-17`, `series-num-c2-18`, `series-num-c2-19`
- `series_numeros/p10.png` → `series-num-c2-20`, `series-num-c2-21`, `series-num-c2-22`, `series-num-c2-23`
- `series_numeros/p11.png` → `series-num-c2-24`, `series-num-c2-25`, `series-num-c2-26`, `series-num-c2-27`, `series-num-c2-28`, `series-num-c2-29`, `series-num-c2-30`
- `relojes/p2.png` → `relojes-c1-1`, `relojes-c1-2`, `relojes-c1-3`, `relojes-c1-4`, `relojes-c2-1`, `relojes-c2-2`, `relojes-c2-3`, `relojes-c2-4`
- `relojes/p3.png` → `relojes-c1-5`, `relojes-c1-6`, `relojes-c1-7`, `relojes-c2-5`, `relojes-c2-6`, `relojes-c2-8`, `relojes-c1-8`, `relojes-c2-7`
- `relojes/p4.png` → `relojes-c1-9`, `relojes-c1-10`, `relojes-c1-11`, `relojes-c1-12`, `relojes-c2-10`, `relojes-c2-11`, `relojes-c2-9`, `relojes-c2-12`
- `relojes/p5.png` → `relojes-c1-13`, `relojes-c1-14`, `relojes-c1-15`, `relojes-c2-13`, `relojes-c2-14`, `relojes-c2-15`, `relojes-c2-16`, `relojes-c1-16`
- `relojes/p6.png` → `relojes-c1-17`, `relojes-c1-18`, `relojes-c1-19`, `relojes-c1-20`, `relojes-c2-17`, `relojes-c2-18`, `relojes-c2-19`, `relojes-c2-20`
- `matrices/p2.png` → `matrices-c1-1`, `matrices-c1-2`, `matrices-c1-3`, `matrices-c1-4`, `matrices-c1-5`, `matrices-c1-6`, `matrices-c1-7`
- `matrices/p3.png` → `matrices-c1-8`, `matrices-c1-9`, `matrices-c1-10`, `matrices-c1-11`, `matrices-c1-13`, `matrices-c1-14`, `matrices-c1-12`
- `matrices/p4.png` → `matrices-c1-15`, `matrices-c1-16`, `matrices-c1-17`, `matrices-c1-18`, `matrices-c1-19`, `matrices-c1-20`
- `matrices/p5.png` → `matrices-c1-21`, `matrices-c1-22`, `matrices-c1-23`, `matrices-c1-24`, `matrices-c1-26`, `matrices-c1-25`
- `matrices/p6.png` → `matrices-c1-27`, `matrices-c1-28`, `matrices-c1-29`, `matrices-c1-30`
- `matrices/p7.png` → `matrices-c2-1`, `matrices-c2-3`, `matrices-c2-4`, `matrices-c2-5`, `matrices-c2-6`, `matrices-c2-2`
- `matrices/p8.png` → `matrices-c2-7`, `matrices-c2-8`, `matrices-c2-9`, `matrices-c2-10`, `matrices-c2-11`, `matrices-c2-12`
- `matrices/p9.png` → `matrices-c2-14`, `matrices-c2-15`, `matrices-c2-16`, `matrices-c2-18`, `matrices-c2-13`, `matrices-c2-17`
- `matrices/p10.png` → `matrices-c2-19`, `matrices-c2-20`, `matrices-c2-21`, `matrices-c2-22`, `matrices-c2-23`, `matrices-c2-24`
- `matrices/p11.png` → `matrices-c2-25`, `matrices-c2-28`, `matrices-c2-29`, `matrices-c2-26`, `matrices-c2-27`, `matrices-c2-30`
- `figuras_no_relacionadas/p2.png` → `fnr-c1-1`, `fnr-c1-2`, `fnr-c1-4`, `fnr-c1-6`, `fnr-c1-7`, `fnr-c1-8`, `fnr-c1-9`, `fnr-c1-10`, `fnr-c1-11`, `fnr-c1-5`, `fnr-c1-3`
- `figuras_no_relacionadas/p3.png` → `fnr-c1-12`, `fnr-c1-13`, `fnr-c1-14`, `fnr-c1-15`, `fnr-c1-16`, `fnr-c1-17`, `fnr-c1-18`, `fnr-c1-20`, `fnr-c1-21`, `fnr-c1-22`, `fnr-c1-23`, `fnr-c1-19`
- `figuras_no_relacionadas/p4.png` → `fnr-c1-25`, `fnr-c2-1`, `fnr-c2-2`, `fnr-c2-3`, `fnr-c2-4`, `fnr-c2-6`, `fnr-c2-7`, `fnr-c2-8`, `fnr-c1-24`, `fnr-c2-5`
- `figuras_no_relacionadas/p5.png` → `fnr-c2-10`, `fnr-c2-11`, `fnr-c2-12`, `fnr-c2-14`, `fnr-c2-15`, `fnr-c2-16`, `fnr-c2-17`, `fnr-c2-18`, `fnr-c2-20`, `fnr-c2-9`, `fnr-c2-13`, `fnr-c2-19`
- `figuras_no_relacionadas/p6.png` → `fnr-c2-22`, `fnr-c2-23`, `fnr-c2-24`, `fnr-c2-25`, `fnr-c2-21`
- `test_series_figuras/p3.png` → `tsf-c1-1`, `tsf-c1-2`, `tsf-c1-3`, `tsf-c1-5`, `tsf-c1-4`
- `test_series_figuras/p4.png` → `tsf-c1-6`, `tsf-c1-7`, `tsf-c1-8`, `tsf-c1-9`, `tsf-c1-10`
- `test_series_figuras/p5.png` → `tsf-c1-11`, `tsf-c1-12`, `tsf-c1-13`, `tsf-c1-14`, `tsf-c1-15`, `tsf-c1-16`
- `test_series_figuras/p6.png` → `tsf-c1-17`, `tsf-c1-18`, `tsf-c1-19`, `tsf-c1-20`, `tsf-c1-21`, `tsf-c1-22`
- `test_series_figuras/p7.png` → `tsf-c1-24`, `tsf-c1-25`, `tsf-c1-27`, `tsf-c1-28`, `tsf-c1-23`, `tsf-c1-26`
- `test_series_figuras/p8.png` → `tsf-c1-29`, `tsf-c1-30`
- `test_series_figuras/p9.png` → `tsf-c2-2`, `tsf-c2-4`, `tsf-c2-5`, `tsf-c2-3`, `tsf-c2-1`
- `test_series_figuras/p10.png` → `tsf-c2-6`, `tsf-c2-7`, `tsf-c2-9`, `tsf-c2-10`, `tsf-c2-8`
- `test_series_figuras/p11.png` → `tsf-c2-11`, `tsf-c2-12`, `tsf-c2-13`, `tsf-c2-14`, `tsf-c2-15`, `tsf-c2-16`
- `test_series_figuras/p12.png` → `tsf-c2-17`, `tsf-c2-18`, `tsf-c2-19`, `tsf-c2-20`, `tsf-c2-21`, `tsf-c2-22`
- `test_series_figuras/p13.png` → `tsf-c2-23`, `tsf-c2-24`, `tsf-c2-25`, `tsf-c2-26`, `tsf-c2-27`, `tsf-c2-28`
- `test_series_figuras/p14.png` → `tsf-c2-29`, `tsf-c2-30`
- `secuencia_num_letras/p2.png` → `snl-c1-1`, `snl-c1-2`, `snl-c1-3`, `snl-c1-4`, `snl-c1-5`, `snl-c1-6`, `snl-c1-7`, `snl-c1-8`
- `secuencia_num_letras/p3.png` → `snl-c1-9`, `snl-c1-10`, `snl-c1-11`, `snl-c1-12`, `snl-c1-13`, `snl-c1-14`, `snl-c1-15`, `snl-c1-16`, `snl-c1-17`
- `secuencia_num_letras/p4.png` → `snl-c1-18`, `snl-c1-19`, `snl-c1-20`
- `secuencia_num_letras/p5.png` → `snl-c2-1`, `snl-c2-2`, `snl-c2-3`, `snl-c2-4`, `snl-c2-5`, `snl-c2-6`, `snl-c2-7`, `snl-c2-8`
- `secuencia_num_letras/p6.png` → `snl-c2-9`, `snl-c2-10`, `snl-c2-11`, `snl-c2-12`, `snl-c2-13`, `snl-c2-14`, `snl-c2-15`, `snl-c2-16`
- `secuencia_num_letras/p7.png` → `snl-c2-18`, `snl-c2-19`, `snl-c2-20`
- `domino/p2.png` → `domino-c1-1`, `domino-c1-2`
- `domino/p3.png` → `domino-c1-3`, `domino-c1-4`
- `domino/p4.png` → `domino-c1-5`, `domino-c1-6`, `domino-c1-7`
- `domino/p5.png` → `domino-c1-8`, `domino-c1-9`, `domino-c1-10`
- `domino/p6.png` → `domino-c1-11`, `domino-c1-12`, `domino-c1-13`, `domino-c1-14`
- `domino/p7.png` → `domino-c1-15`, `domino-c1-16`, `domino-c1-17`
- `domino/p8.png` → `domino-c1-18`, `domino-c1-20`

## 3. Distribución de nº de opciones

| nº opciones | preguntas |
|---|---|
| 4 | 650 |
| 5 | 60 |

60 preguntas tienen un nº de opciones distinto de 4 (todas con 5; ninguna con 6+):

- `matrices-c1-1` (5 opciones)
- `matrices-c1-2` (5 opciones)
- `matrices-c1-3` (5 opciones)
- `matrices-c1-4` (5 opciones)
- `matrices-c1-5` (5 opciones)
- `matrices-c1-6` (5 opciones)
- `matrices-c1-7` (5 opciones)
- `matrices-c1-8` (5 opciones)
- `matrices-c1-9` (5 opciones)
- `matrices-c1-10` (5 opciones)
- `matrices-c1-11` (5 opciones)
- `matrices-c1-13` (5 opciones)
- `matrices-c1-14` (5 opciones)
- `matrices-c1-15` (5 opciones)
- `matrices-c1-16` (5 opciones)
- `matrices-c1-17` (5 opciones)
- `matrices-c1-18` (5 opciones)
- `matrices-c1-19` (5 opciones)
- `matrices-c1-21` (5 opciones)
- `matrices-c1-22` (5 opciones)
- `matrices-c1-23` (5 opciones)
- `matrices-c1-24` (5 opciones)
- `matrices-c1-26` (5 opciones)
- `matrices-c1-27` (5 opciones)
- `matrices-c1-28` (5 opciones)
- `matrices-c1-29` (5 opciones)
- `matrices-c1-30` (5 opciones)
- `matrices-c2-1` (5 opciones)
- `matrices-c2-3` (5 opciones)
- `matrices-c2-4` (5 opciones)
- `matrices-c2-5` (5 opciones)
- `matrices-c2-6` (5 opciones)
- `matrices-c2-7` (5 opciones)
- `matrices-c2-8` (5 opciones)
- `matrices-c2-9` (5 opciones)
- `matrices-c2-10` (5 opciones)
- `matrices-c2-11` (5 opciones)
- `matrices-c2-12` (5 opciones)
- `matrices-c2-14` (5 opciones)
- `matrices-c2-15` (5 opciones)
- `matrices-c2-16` (5 opciones)
- `matrices-c2-18` (5 opciones)
- `matrices-c2-19` (5 opciones)
- `matrices-c2-20` (5 opciones)
- `matrices-c2-21` (5 opciones)
- `matrices-c2-22` (5 opciones)
- `matrices-c2-23` (5 opciones)
- `matrices-c2-24` (5 opciones)
- `matrices-c2-25` (5 opciones)
- `matrices-c2-28` (5 opciones)
- `matrices-c2-29` (5 opciones)
- `matrices-c1-12` (5 opciones)
- `matrices-c1-20` (5 opciones)
- `matrices-c1-25` (5 opciones)
- `matrices-c2-2` (5 opciones)
- `matrices-c2-13` (5 opciones)
- `matrices-c2-17` (5 opciones)
- `matrices-c2-26` (5 opciones)
- `matrices-c2-27` (5 opciones)
- `matrices-c2-30` (5 opciones)

**Nota de renderizado:** `js/engine.js` (`renderOptions`, `KEYS = ["A".."F"]`) itera `item.options` completo y no trunca a 4; no hay ningún `slice(0,4)` ni grid de 4 columnas fijas en el camino de preguntas reales (`.options { display:grid; gap:12px }`, sin `grid-template-columns` fijo — ese fijo de 2 columnas solo existe en `.options--figs`, que es para las figuras SVG *generadas*, no para el banco real). `test/real-content.test.js` ya exige 2–6 opciones. **No se ha reproducido el truncado a 4 descrito.**

## 4. Preguntas que citan figura/gráfico/tabla/plano sin asset

0 encontradas.

## 5. Assets huérfanos en disco

43 de 123 ficheros en `public/assets/exams/` no están referenciados por ninguna pregunta:

- `cubos/`: 12 (p10.png, p11.png, p12.png, p13.png, p2.png, p3.png, p4.png, p5.png, p6.png, p7.png, p8.png, p9.png)
- `domino/`: 9 (p1.png, p10.png, p11.png, p12.png, p13.png, p14.png, p15.png, p16.png, p9.png)
- `relojes/`: 5 (p10.png, p11.png, p7.png, p8.png, p9.png)
- `test_domino_resuelto/`: 13 (p1.png, p10.png, p11.png, p12.png, p13.png, p2.png, p3.png, p4.png, p5.png, p6.png, p7.png, p8.png, p9.png)
- `test_relojes/`: 3 (p2.png, p3.png, p4.png)
- `test_series_figuras/`: 1 (p2.png)

Coincide con `data/matching_report.json` → `archivos_pendientes: 9`: son páginas ya recortadas de exámenes (cubos, dominó, matrices, relojes, figuras no relacionadas, series de figuras) todavía no transcritas a preguntas en `real.source.js`. **No es un bug**: es trabajo de captura pendiente, no imágenes perdidas de preguntas existentes.

## 6. correctIndex fuera de rango

0 encontradas.

## 7. Duplicados (prompt normalizado + imagen)

0 grupos encontrados.

## 8. Patrón de desfase off-by-one (imagen de N = imagen "prestada" de N-1)

0 sospechosos encontrados. El binding es explícito por pregunta, no hay evidencia de desalineación sistemática en el estado actual del banco.

## Diagnóstico y contexto (no generado, escrito a mano tras revisar el código)

Ver el mensaje del informe en la conversación: el commit `9920f12` (2026-08-20, "Bloque A") ya corrigió exactamente un caso de imagen cruzada real (wa-aptitudes-21/22) y recuperó gráficos perdidos; `da5ae56` ("Bloque B") ya corrigió una repetición de preguntas dentro de lección; `f669148` subió `CACHE_VERSION` a v7 para forzar que los dispositivos con la app ya instalada como PWA recogieran esos fixes. Este informe (generado 2.5 semanas después) no reproduce ninguno de los tres fallos tal como se describieron. Detalle y recomendación en el mensaje de esta sesión.
