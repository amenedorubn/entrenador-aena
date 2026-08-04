// Cifra data/real.source.js (texto plano, gitignored) -> data/real.enc.json (lo que
// se sube al repo). Usa Web Crypto nativa (misma API que el navegador en js/app.js),
// AES-GCM-256 con clave derivada por PBKDF2-SHA256.
//
// Uso:  AENA_PW="la contraseña de acceso" node scripts/encrypt.mjs
//
// La contraseña se lee SOLO de la variable de entorno: nunca se escribe aquí ni en
// ningún archivo. salt/iv/iterations no son secretos y viajan en claro en el JSON
// de salida; lo único que protegen son el salt/iv de ESTE cifrado, no la contraseña.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ITERATIONS = 250_000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = path.join(__dirname, "..", "data", "real.source.js");
const OUT_PATH = path.join(__dirname, "..", "data", "real.enc.json");

const password = process.env.AENA_PW;
if (!password) {
  console.error("Falta la variable de entorno AENA_PW. Uso: AENA_PW=\"...\" node scripts/encrypt.mjs");
  process.exit(1);
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

async function deriveKey(pw, salt, iterations) {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

async function main() {
  const { REAL } = await import(`file://${SOURCE_PATH.replace(/\\/g, "/")}?t=${Date.now()}`);
  if (!Array.isArray(REAL) || REAL.length === 0) {
    console.error(`No se encontró un array REAL con contenido en ${SOURCE_PATH}`);
    process.exit(1);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);

  const plaintext = new TextEncoder().encode(JSON.stringify(REAL));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  const out = {
    ciphertext: toBase64(ciphertext),
    salt: toBase64(salt),
    iv: toBase64(iv),
    iterations: ITERATIONS,
  };
  await writeFile(OUT_PATH, JSON.stringify(out), "utf8");
  console.log(`Cifrados ${REAL.length} ítems -> ${path.relative(process.cwd(), OUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
