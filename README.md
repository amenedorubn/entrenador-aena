# Entrenador Aena · Niveles A-B

App tipo Duolingo para preparar las pruebas selectivas de Aena (Selección Externa
Niveles A y B, convocatoria 01/07/2026). Estática, instalable como PWA con offline
básico y desplegada en GitHub Pages. Sin backend ni login.

**En vivo:** https://amenedorubn.github.io/entrenador-aena/

## Cómo funciona la progresión

Replica el modelo de la app real: **mundo → unidad → lección**.

- **5 mundos** de dificultad creciente (nivel 1 a 5). Cada mundo tiene su temática y color.
- Cada mundo contiene **unidades** temáticas, con su banner y su trofeo.
- Cada unidad contiene **lecciones**: los círculos del camino. Estados: completada (✓),
  disponible (⭐ con burbuja «Empezar») y bloqueada (🔒).
- Una lección se supera con **≥80 % de aciertos**; eso desbloquea la siguiente.
- Superadas todas las lecciones de una unidad se gana su **trofeo**; superadas todas las
  unidades, el mundo se completa y se desbloquea el siguiente.
- **158 lecciones** en total, de 10 preguntas cada una.

Los cinco mundos:

| # | Mundo | Nivel | Contenido |
|---|-------|-------|-----------|
| 1 | Despegue | 1 | Bases de aptitud e inglés B1 |
| 2 | Ascenso | 2 | Reglas compuestas y primeras competencias |
| 3 | Crucero | 3 | Nivel examen · B2 |
| 4 | Aproximación | 4 | Por encima del examen · B2+ |
| 5 | Aterrizaje | 5 | Nivel élite · C1 |

Además hay **Práctica libre**: cualquier bloque, a cualquiera de los 5 niveles, sin vidas
y sin afectar al camino. Preguntas nuevas cada vez, así que sirve para repetir tantas
veces al día como quieras.

## Contenido y dificultad

Casi todo el contenido se **genera por procedimiento**, así que no se agota: cada sesión
trae preguntas nuevas aunque practiques varias veces al día durante meses.

- **Numérico** — 26 familias repartidas en 5 niveles: series aritméticas y geométricas,
  diferencias crecientes, ×n+k, intercaladas, cuadrados, Fibonacci, primos, operaciones
  alternas, segunda diferencia, porcentajes encadenados, mezclas, edades, ritmos de
  trabajo, interés compuesto, media ponderada, repartos proporcionales, combinatoria
  (permutaciones, combinaciones, anagramas, comités), probabilidad simple y compuesta,
  matrices numéricas, ángulos de reloj y problemas multi-paso con IVA.
- **Abstracto** — 12 familias: rotaciones (fijas y aceleradas), conteo, número de lados,
  doble transformación, matrices 3×3 de uno, dos y tres atributos, y **operaciones
  booleanas AND/OR/XOR sobre rejillas** en el nivel máximo.
- **Verbal** — generado a partir de un léxico con marcas semánticas: sinónimos, antónimos,
  analogías por tipo de relación, palabra intrusa, series de letras (simples, mixtas
  letra-número e intercaladas) y **silogismos y condicionales** con validez lógica fijada
  por forma (Barbara, Darii, Disamis, modus ponens/tollens, y las falacias de término
  medio no distribuido, afirmación del consecuente y negación del antecedente).
- **Conductual (Fase 2)** — 45 situaciones de competencias transversales del sector
  público y del entorno aeroportuario. No se limita a una ocupación concreta porque el
  examen es común. En los niveles altos las opciones incorrectas son deliberadamente
  plausibles.
- **Inglés (Fase 3)** — gramática de B1 a C1, **corrección de errores**, y sobre todo
  **producción escrita**: traducción ES→EN construyendo la frase con fichas, como en
  Duolingo. Listening con avisos de aeropuerto (curados y generados con números
  aleatorios) leídos por la Web Speech API en `en-GB`. Speaking con prompts de entrevista
  y cronómetro de 2 minutos.

## Corrección de respuestas

Es el requisito crítico: una respuesta mal marcada rompe la utilidad de la app.

- **Los generadores calculan enunciado y solución con la misma regla**, así que la
  respuesta correcta lo es *por construcción*, no por una tabla escrita a mano.
- **El léxico lleva marcas de campo semántico (`sense`)**. Los distractores se toman
  siempre de entradas con un `sense` distinto, de modo que un distractor **nunca** puede
  ser también una respuesta válida. Lo mismo con las analogías (términos de otras
  relaciones) y con la palabra intrusa (categorías disjuntas).
- **Las matrices lógicas verifican unicidad**: las dos filas visibles deben descartar
  todas las demás operaciones booleanas, o el enunciado se regenera. Sin esa comprobación
  una matriz podía admitir dos reglas y la respuesta no sería única.
- **83 tests** (Vitest) cubren esto: recomputan la regla de forma independiente a partir
  del propio enunciado generado, verifican que no hay opciones duplicadas ni distractores
  ambiguos, y comprueban la integridad de los bancos y del desbloqueo del camino.

```bash
npm test
```

## Diseño

Réplica del sistema visual de Duolingo (sin afiliación, sin logo ni contenido propietario):
camino de nodos serpenteante, banners de unidad, botones «sticker» con borde inferior 3D,
hoja de corrección verde/roja al pie, barra superior con racha/gemas/vidas y nav inferior.
**Tema claro y oscuro**, seleccionable o siguiendo al sistema.

Paleta de la app real: `#58cc02` verde, `#1cb0f6` azul, `#ff4b4b` rojo, `#ffc800` amarillo,
`#ce82ff` morado; superficies `#ffffff` (claro) y `#131f24` (oscuro).
Tipografía **Nunito** (la original, «Feather», es propietaria).

Correcciones de accesibilidad respecto a la referencia:

- El estado nunca depende solo del color: acierto/error llevan también icono (✓/✕), texto
  y borde.
- Foco visible en todo elemento interactivo, targets ≥44 px.
- Se respeta `prefers-reduced-motion`.
- Las figuras SVG llevan `aria-label` descriptivo.

## Estructura

```
index.html                  pantallas: camino, lección, resultados, práctica, speaking, progreso, ajustes
css/styles.css              sistema visual + tema claro/oscuro
js/curriculum.js            mundos, unidades, lecciones y reglas de desbloqueo
js/content.js               dispatcher: (fuente, nivel) → pregunta
js/gen-numeric.js           26 familias numéricas
js/gen-abstract.js          12 familias abstractas
js/gen-verbal.js            verbal: léxico, series de letras, silogismos
js/gen-english.js           grammar, writing, error correction, listening
js/rng.js                   utilidades y construcción de opciones sin duplicados
js/engine.js                render de ítems (texto, SVG, matrices, banco de palabras)
js/app.js                   navegación, sesión, vidas, XP, racha, tema
data/lexicon.js             léxico verbal con marcas semánticas
data/english.js             bancos de inglés
data/sjt.js                 banco conductual
test/                       tests de corrección (Vitest)
scripts/make-icons.mjs      genera los iconos PWA sin dependencias
```

## Desarrollo local

Node.js (probado con v24). No hay build: son módulos ES nativos.

```bash
npm install     # única dependencia de desarrollo: vitest
npm test        # tests de corrección
npm run serve   # sirve en http://localhost:3000
```

Sírvelo por HTTP (no `file://`) para que se registre el service worker y puedas probar la
instalación como PWA.

## Desplegar

Ya está publicado en GitHub Pages desde la rama `main`, carpeta raíz. Para actualizar:

```bash
git add -A && git commit -m "..." && git push
```

Pages reconstruye solo en 1-2 minutos. El repo incluye `.nojekyll` (necesario para que se
sirvan `/js` y `/data` tal cual) y todas las rutas son relativas.

## Ampliar el contenido

- **Añadir preguntas a un banco** (`data/english.js`, `data/sjt.js`): copia la forma de un
  ítem existente. `correctIndex` es el índice (0-3) de la opción correcta *antes* de
  barajar; el barajado ocurre en tiempo de ejecución.
- **Añadir vocabulario** (`data/lexicon.js`): cada entrada necesita un `sense` **único**.
  Si repites un `sense`, los tests fallan — es justo la comprobación que impide que un
  distractor sea también correcto.
- **Añadir una familia de generador**: escribe la función en el `gen-*.js` que
  corresponda, regístrala en el objeto `*_FAMILIES` bajo su nivel, y añade un test que
  recompute su regla desde el enunciado.
- **Cambiar la estructura del curso** (`js/curriculum.js`): las unidades declaran qué
  fuentes usan y cuántas lecciones tienen; el camino se construye solo.

Después de cualquier cambio: `npm test`.

## Notas

- El progreso (camino, racha, XP) vive solo en el `localStorage` del navegador. No hay
  cuenta ni sincronización entre dispositivos. Ajustes → «Reiniciar todo el progreso» lo borra.
- Las **vidas** se pueden desactivar en Ajustes; a diferencia de Duolingo no hay espera ni
  pago para recuperarlas: al quedarte sin ellas simplemente terminas la lección y puedes
  repetirla en el momento.
- La **fecha del examen** es configurable en Ajustes y alimenta la cuenta atrás.
- La Fase 2 real es un cuestionario de personalidad APTO/NO APTO: esta app entrena a
  reconocer las competencias, pero en el examen lo que cuenta es responderlo **entero,
  con honestidad y coherencia**.
