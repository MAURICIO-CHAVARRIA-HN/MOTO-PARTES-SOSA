#!/usr/bin/env node
// Restauración de Rancing Mau desde un respaldo hecho con scripts/backup-backend.mjs.
//
// ADVERTENCIA: borra e inserta en la instancia de DESTINO. Usar SOLO sobre una
// instancia de prueba destinada al ensayo de recuperación, nunca contra la de
// producción ni contra datos que se deban conservar.
//
// Uso:
//   node scripts/restore-backend.mjs <carpeta-del-respaldo> --confirm="<fecha del manifest>"
//
// Requiere RESTORE_URL y RESTORE_SERVICE_ROLE_KEY con la clave de servicio de la
// instancia de destino. Rechaza ejecutarse si el destino coincide con el origen.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, basename, extname } from "node:path";
import { createClient } from "@supabase/supabase-js";

const backupDir = resolve(process.argv[2] || "");
const manifestPath = join(backupDir, "manifest.json");
if (!existsSync(manifestPath)) {
  console.error("Respaldo inválido: no existe", manifestPath);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const confirmFlag = process.argv.find((a) => a.startsWith("--confirm="));
const expected = confirmFlag ? confirmFlag.slice("--confirm=".length) : "";
if (!expected) {
  console.error('Falta --confirm="<fecha del manifest>".');
  process.exit(1);
}
console.log("Respaldo de origen:", manifest.origin, "· creado:", manifest.created_at);

const RESTORE_URL = process.env.RESTORE_URL;
const RESTORE_KEY = process.env.RESTORE_SERVICE_ROLE_KEY;
if (!RESTORE_URL || !RESTORE_KEY) {
  console.error("Faltan RESTORE_URL y RESTORE_SERVICE_ROLE_KEY (instancia de destino).");
  process.exit(1);
}
if (RESTORE_URL === manifest.origin) {
  console.error("El destino es el mismo del origen; el ensayo requiere otra instancia.");
  process.exit(1);
}
console.log("Destino:", RESTORE_URL);

// Orden de inserción respetando claves foráneas (padres antes que hijos).
const ORDER = [
  "admin_users",
  "categories",
  "brands",
  "branches",
  "products",
  "product_images",
  "product_branches",
  "motorcycles",
  "spare_parts",
  "compatibility",
  "reviews",
  "page_views_daily",
  "admin_audit_log",
];
const orderedTables = ORDER.filter((t) => manifest.tables[t]);

function readLine(ask) {
  return new Promise((resolvePromise) => {
    process.stdout.write(ask);
    process.stdin.once("data", (d) => resolvePromise(String(d).trim()));
  });
}

async function truncate(client, table) {
  let { error } = await client.from(table).delete().neq("id", "00000000-0000-4000-8000-000000000000");
  if (error && /invalid input syntax/i.test(error.message)) {
    ({ error } = await client.from(table).delete().lt("id", Number.MAX_SAFE_INTEGER));
  }
  if (error && /Could not find/ && table === "page_views_daily") {
    ({ error } = await client.from(table).delete().gt("day", "0001-01-01"));
  }
  if (error && !/does not exist/i.test(error.message)) {
    console.error(`   limpiando ${table}: ${error.message}`);
  }
}

async function insertRows(client, table, rows) {
  console.log(`  · ${table}: ${rows.length} filas`);
  if (!rows.length) return;
  if (table === "admin_audit_log") {
    for (const row of rows) delete row.id;
  }
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await client.from(table).insert(rows.slice(i, i + 500), { defaultToNull: false });
    if (error) console.error(`   insert ${table}: ${error.message}`);
  }
}

const MIME_BY_EXT = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
};

async function restoreStorage(client) {
  for (const bucket of Object.keys(manifest.buckets || {})) {
    const dir = join(backupDir, "storage", bucket);
    if (!existsSync(dir)) continue;
    const remaining = [...Object.keys(readdirSync(dir).reduce((acc, e) => ((acc[e] = 1), acc), {}))];
    console.log(`  · storage ${bucket}: ${remaining.length} archivos`);
    for (const file of remaining) {
      const full = join(dir, file);
      if (!statSync(full).isFile()) continue;
      const name = file.replace(/__/g, "/");
      const contentType = MIME_BY_EXT[extname(full).toLowerCase()] || "application/octet-stream";
      const { error } = await client.storage.from(bucket).upload(name, readFileSync(full), {
        upsert: true,
        contentType,
      });
      if (error) console.error(`   subida ${bucket}/${name}: ${error.message}`);
    }
  }
}

(async () => {
  const answer = await readLine(`¿Escribir "${expected}" para restaurar sobre el destino? `);
  if (answer !== expected) {
    console.error("Confirmación incorrecta. No se tocó el destino.");
    process.exit(1);
  }
  const client = createClient(RESTORE_URL, RESTORE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const table of orderedTables.slice().reverse()) {
    await truncate(client, table);
  }
  for (const table of orderedTables) {
    const file = resolve(manifest.out, basename(manifest.tables[table].file));
    await insertRows(client, table, JSON.parse(readFileSync(file, "utf8")));
  }
  await restoreStorage(client);
  console.log("Restauración finalizada. Revisar catálogo, sucursales, reseñas y fotografías en el destino.");
})().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});