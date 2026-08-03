# Entrenador Aena · Niveles A-B

Web app tipo Duolingo para preparar las pruebas selectivas de Aena (Selección Externa
Niveles A y B, convocatoria 01/07/2026). De uso personal, estática, instalable como PWA
(offline básico) y desplegable en GitHub Pages sin backend ni login.

Cubre las tres fases del proceso:

- **Fase 1 · Aptitudes** — verbal, numérico y abstracto, con selector de dificultad
  (fácil / medio / difícil / mix) y un simulacro cronometrado (10 min) que mezcla los tres bloques.
- **Fase 2 · Competencias conductuales** — juicio situacional alineado a las competencias
  de la ocupación IC03-A. El examen real es un cuestionario de personalidad: esta app
  entrena a reconocer las competencias, no lo sustituye.
- **Fase 3 · Inglés (B1 requisito · B2 mérito)** — grammar, listening (Web Speech API) y
  speaking (prompts con cronómetro y guía de estructura).

## Corrección de respuestas

- **Numérico y abstracto se generan por procedimiento** (`js/generators.js`): cada
  generador calcula el enunciado y la solución con la misma regla, así que la respuesta
  correcta lo es por construcción. Reglas por dificultad:
  - Fácil: serie aritmética, % simple, rotación 90°, conteo +1.
  - Medio: serie geométrica, diferencias crecientes, rotación 45°, nº de lados +1,
    porcentajes encadenados, proporciones/mezclas, edades.
  - Difícil: ×n+k, series intercaladas, matriz 3×3, doble transformación (rotación +
    relleno alternante), combinatoria, ritmos de trabajo, primos/factoriales.
- **Verbal, grammar, SJT y listening son bancos curados** (`data/*.js`) con muestreo
  aleatorio y opciones barajadas en cada sesión. Los primeros ítems de cada banco (los
  marcados en el propio archivo) proceden de `entrenador_aena.html`, ya verificados con
  cálculo independiente; se han ampliado sin tocar ninguna respuesta correcta.
  Cuotas actuales: 33 verbal, 33 grammar, 27 SJT, 17 listening.
- `test/` contiene los tests de corrección (Vitest): verifican que cada generador
  devuelve una respuesta consistente con su regla (recomputada de forma independiente a
  partir del propio enunciado) y que en todos los bancos curados el índice de respuesta
  correcta apunta a la opción esperada, sin duplicados. **Los tests deben pasar** antes
  de tocar nada de `js/generators.js` o `data/*.js`.

## Diseño

Sistema inspirado en Duolingo (no afiliado, sin logo ni contenido propietario), fuentes
en `Design duolingo/`. Tokens explícitos usados (`css/styles.css`):

```
--primary:    #a5ed6e   --on-primary: #111111   --background: #ddf4ff
--text:       #3c3c3c   --text-muted: #777777   --accent:     #1cb0f6
```

Con las correcciones de accesibilidad que el propio documento de diseño señala como
fallo de contraste:

- `--text-muted` (#777777, ratio ~3.5:1 sobre el fondo) se usa **solo** en
  etiquetas/hints/captions, nunca en párrafos ni enlaces.
- `--accent` (#1cb0f6, ratio ~2:1 sobre el fondo) **nunca** es el único indicador de
  enlace: va siempre subrayado y en negrita.
- Acierto / error / deshabilitado nunca dependen solo del color: llevan también icono
  (✓ / ✕), texto y borde grueso.
- Foco visible (outline 2px) en todo elemento interactivo, targets ≥44×44px, motion
  300ms `ease` respetando `prefers-reduced-motion`.

Tipografía: **Nunito** (Google Fonts) como sustituta libre de "duolingo-sans"
(propietaria del original).

## Estructura

```
index.html                 shell de la app (todas las pantallas)
manifest.webmanifest        PWA
service-worker.js           cache-first del shell, offline básico
icons/                      iconos PWA (generados con scripts/make-icons.mjs)
css/styles.css              tokens de diseño + componentes
js/app.js                   rutas, estado de sesión, racha/XP/localStorage
js/engine.js                render de ítems (texto, figuras SVG, matriz, listening)
js/generators.js            generadores numérico + abstracto por dificultad
data/*.js                   bancos curados (verbal, grammar, sjt, listening, speaking)
test/*.test.js              tests de corrección (Vitest)
scripts/make-icons.mjs      genera los PNG de icons/ sin dependencias (node scripts/make-icons.mjs)
```

## Desarrollo local

Requiere Node.js (usado: v24). No hay build step: son módulos ES nativos.

```bash
npm install        # instala vitest (única dependencia de desarrollo)
npm test           # corre los tests de corrección — deben pasar en verde
npm run serve      # sirve la app en http://localhost:3000 (npx serve .)
```

Abre la URL que indique `serve` en el navegador. Para probar la instalación como PWA,
sírvelo también así (Chrome/Edge exigen ese mismo origen para registrar el
service worker; `file://` no funciona).

## Desplegar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `entrenador-aena`), vacío, sin
   README ni licencia (ya los trae este proyecto).
2. Conéctalo y sube el primer commit (ya hecho localmente):
   ```bash
   git remote add origin https://github.com/<tu-usuario>/entrenador-aena.git
   git branch -M main
   git push -u origin main
   ```
3. En GitHub → **Settings → Pages** → *Build and deployment* → **Source: Deploy from a
   branch** → branch `main`, carpeta `/ (root)` → **Save**.
4. Espera 1-2 minutos; la URL pública aparece en esa misma página
   (`https://<tu-usuario>.github.io/entrenador-aena/`).
5. El repo ya incluye `.nojekyll` (necesario para que Pages sirva `/data` y `/js` tal
   cual, sin que Jekyll los ignore) y todas las rutas del proyecto son relativas, así
   que funciona igual en la raíz de un dominio o en un subpath de GitHub Pages.

No hace falta ninguna credencial ni token para estos pasos: `git push` te pedirá
autenticarte con tu cuenta de GitHub de la forma habitual (HTTPS + login del navegador,
o SSH si ya lo tienes configurado) — hazlo tú mismo, la app no necesita ni pide nada de eso.

## Ampliar los bancos de preguntas

Cada banco es un array de objetos en `data/*.js`:

```js
{ id: "v034", difficulty: "medio", prompt: "…", options: ["A","B","C","D"], correctIndex: 1, explanation: "…" }
```

- `id` único, `correctIndex` es el índice (0-3) de la opción correcta dentro de
  `options` **antes** de barajar (el barajado ocurre en tiempo de ejecución).
- `difficulty` (`"facil" | "medio" | "dificil"`) solo aplica al banco `verbal.js`, que
  participa en el selector de dificultad de Fase 1.
- Tras añadir ítems, corre `npm test`: si `correctIndex` está mal o faltan opciones, los
  tests de `test/banks.test.js` fallan.

Para tocar las reglas de los generadores numérico/abstracto, edita `js/generators.js` y
vuelve a correr `npm test` — `test/generators.test.js` recomputa la regla de forma
independiente a partir del propio enunciado generado, así que cualquier regresión en la
lógica se detecta ahí.

## Notas

- No reproduce el logo ni contenido propietario de Duolingo; es un diseño *inspirado
  en*, con corrección de accesibilidad respecto a la referencia.
- El progreso (racha, XP, mejores puntuaciones) vive solo en `localStorage` del
  navegador: no hay cuenta ni sincronización entre dispositivos. El botón "Reiniciar
  progreso" del menú lo borra todo.
