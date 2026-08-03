# Prompt para Claude Code — App de preparación oposición Aena (Niveles A-B)

Copia todo este archivo como primer mensaje en Claude Code. Adjunta también el archivo
`entrenador_aena.html` (contiene los bancos de preguntas ya verificados) como semilla.

---

## Objetivo

Crea una **web app tipo Duolingo** para preparar las pruebas selectivas de Aena (Selección
Externa Niveles A y B, convocatoria 01/07/2026). Es de uso personal. Debe ser:

- **Estática** (sin backend), desplegable en **GitHub Pages**.
- **PWA** instalable en móvil/tablet/desktop ("Añadir a pantalla de inicio"), con offline básico.
- Accesible desde cualquier dispositivo con una URL, sin login.

Crea el repositorio, inicializa git, deja todo listo para `git push` y para activar GitHub
Pages, y explícame los pasos exactos para publicarlo. NO introduzcas mis credenciales tú;
si hace falta autenticación, indícame qué ejecutar yo.

## Contenido de las pruebas (3 fases)

**Fase 1 — Aptitudes** con **modos de dificultad: fácil / medio / difícil / mix**. Tres bloques:
- **Verbal**: sinónimos, antónimos, analogías, series de letras y mixtas (letra+número),
  series intercaladas, deducción lógica (silogismos), palabra intrusa.
- **Numérico**: series (aritméticas, geométricas, doble patrón, ×n+k, intercaladas, primos,
  factoriales), porcentajes y descuentos encadenados, proporciones/mezclas, problemas de
  velocidad/tiempo/edades, combinatoria básica.
- **Abstracto**: series de figuras (rotación 45°/90°, conteo, nº de lados, relleno, doble
  transformación) y **matrices 3×3 tipo Raven**.

**Fase 2 — Competencias conductuales (APTO/NO APTO)**: ejercicios de **juicio situacional**
alineados a las competencias de la ocupación IC03-A (capacidad de análisis, sentido de
efectividad, trabajo en equipo, sensibilidad hacia el cliente, sensibilidad medioambiental,
comunicación). Muestra un aviso: el test real es un cuestionario de personalidad; la clave es
responder **entero, con honestidad y coherencia**; esto entrena a reconocer las competencias.

**Fase 3 — Inglés (B1 requisito / B2 mérito)**:
- **Grammar** (nivel B2): condicionales, inversión, gerundio/infinitivo, relativos, phrasal verbs.
- **Listening**: avisos de aeropuerto leídos con **Web Speech API** (`SpeechSynthesisUtterance`,
  `lang='en-GB'`), botón "Escuchar" repetible, transcripción tras responder.
- **Speaking**: pantalla de práctica con prompts tipo entrevista, cronómetro de 2 min y guía de
  estructura y conectores (sin autocorrección).

## Requisito crítico de CORRECCIÓN (no negociable)

Errores en las respuestas rompen la utilidad. Por eso:

- **Numérico y abstracto → genera por procedimiento.** El generador crea el enunciado Y calcula
  la solución con la misma regla, de modo que la respuesta correcta lo es **por construcción**.
  Ejemplos de reglas por dificultad:
  - *Fácil*: serie aritmética `a, a+d, a+2d…`; % simple; rotación 90°; conteo +1.
  - *Medio*: geométrica `×r`; diferencias crecientes (+1,+2,+3…); rotación 45°; nº de lados +1.
  - *Difícil*: `×n+k`; series intercaladas; matriz 3×3 (regla por fila y columna); doble
    transformación (rotación + relleno alternante).
- **Verbal, grammar, SJT y listening → bancos curados** (JSON) con **muestreo aleatorio** cada
  sesión y opciones barajadas. Amplía los bancos (objetivo ≥30 verbal, ≥30 grammar, ≥25 SJT,
  ≥15 listening) para que casi nunca se repita.
- Incluye un archivo de **tests** (por ejemplo con Vitest o un test runner ligero) que verifique:
  (a) que cada generador devuelve una respuesta consistente con su regla, y (b) que en todos los
  ítems curados el índice de respuesta correcta apunta a la opción esperada. Los tests deben pasar.
- Porta los bancos ya verificados desde `entrenador_aena.html` (adjunto). Están comprobados con
  cálculo independiente; consérvalos como base y amplíalos, sin alterar respuestas correctas.

## Frescura y modos

- Fase 1: selector de dificultad (fácil/medio/difícil/mix). "Mix" combina niveles y bloques.
- Cada sesión: N preguntas (configurable, p. ej. 10) muestreadas/generadas de nuevo → distinto
  cada vez. Barajar opciones siempre.

## Diseño (sistema Duolingo, con correcciones de accesibilidad)

Usa estos tokens (del design.md adjunto), pero **corrige** lo que el propio documento marca como
fallo de contraste:

```
--primary:      #a5ed6e   (verde lima; CTAs, acierto)
--on-primary:   #111111
--background:   #ddf4ff   (azul cielo claro)
--text:         #3c3c3c
--text-muted:   #777777   (SOLO etiquetas/hints, nunca texto de cuerpo ni enlaces)
--accent:       #1cb0f6   (NO usar el cian solo para enlaces: subráyalo o dale otro
                           indicador; su contraste sobre el fondo no cumple AA)
```

- Tipografía: **Nunito** (Google Fonts) como sustituta libre de "duolingo-sans" (bold 600-700,
  scannable). Indica en el README que se usa Nunito por ser propietaria la original.
- Radios ~12px, sombras suaves, motion 300ms `ease`.
- **Accesibilidad obligatoria**: foco visible (outline 2px), targets ≥44×44px, nunca color como
  único indicador de estado (acierto/error/deshabilitado → también icono/texto/borde), responsive
  a móvil, `prefers-reduced-motion` respetado.
- No reproduzcas el logo ni contenido propietario de Duolingo; es un diseño *inspirado en*.

## Gamificación (opcional pero recomendada)

Racha diaria, XP por sesión, meta diaria y anillo de progreso por bloque. Persistencia en
`localStorage` (mejor %, racha, XP). Botón de reinicio de progreso.

## Arquitectura sugerida

```
/ (repo)
  index.html
  manifest.webmanifest        # PWA
  service-worker.js           # offline básico (cachear estáticos)
  /icons                      # iconos PWA
  /css/styles.css             # tokens Duolingo + a11y
  /js/app.js                  # motor: rutas/pantallas, sesión, progreso
  /js/engine.js               # render de ítems (texto, figuras SVG, matriz, listening)
  /js/generators.js           # generadores numérico + abstracto (por dificultad)
  /data/verbal.js
  /data/grammar.js
  /data/sjt.js
  /data/listening.js
  /data/speaking.js
  /test/                      # tests de correccion (generadores + bancos)
  README.md                   # cómo correr, cómo desplegar en Pages, cómo añadir preguntas
  .nojekyll
```

## Entregables

1. Repo funcionando en local (dame el comando para servirlo, p. ej. `npx serve`).
2. Tests de corrección pasando.
3. PWA instalable + manifest + service worker.
4. README con: pasos de despliegue en GitHub Pages, y cómo ampliar los bancos de preguntas.
5. Primer commit hecho y lista de pasos para `git push` y activar Pages (los ejecuto yo).

Empieza proponiéndome la estructura de archivos y el data model de una pregunta antes de generar
todo el código, y luego constrúyelo.
