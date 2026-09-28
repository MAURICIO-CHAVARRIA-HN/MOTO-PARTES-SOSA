#!/usr/bin/env node
// Respaldo de Rancing Mau desde una instancia Supabase de origen.
// - Exporta las tablas de negocio a JSON (datos) mediante la REST API.
// - Descarga los objetos de Storage de los buckets de catálogo.
// - Escribe un manifest con nombres, conteos, marcas de tiempo y verificaciones.
//
// Uso:
//   node scripts/backup-backend.mjs [--out carpeta]
//
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno (o .env.local).
// NO escribe en la base: es de solo lectura sobre el origen.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

function loadEnv() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

const env = loadEnv();
const URL = process.env.SUPABASE_URL || env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (variables o .env.local).");
  process.exit(1);
}

const TABLES = [
  "admin_users",
  "admin_audit_log",
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
];
const BUCKETS = ["catalog-candidates", "catalog-public"];

const outArg = process.argv.find((a, i) => a === "--out" && process.argv[i + 1]);
const outDir = resolve(outArg ? process.argv[process.argv.indexOf("--out") + 1] : join(ROOT, "backups"));
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(outDir, stamp);
mkdirSync(backupDir, { recursive: true });

const client = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const report = {
  origin: URL,
  created_at: new Date().toISOString(),
  tables: {},
  buckets: {},
  out: backupDir,
};

async function exportTable(name) {
  let all = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await client.from(name).select("*").range(from, from + page - 1);
    if (error) throw new Error(`tabla ${name}: ${error.message}`);
    all = all.concat(data);
    if (!data || data.length < page) break;
    from += page;
  }
  const rel = join(backupDir, `${name}.json`);
  writeFileSync(rel, JSON.stringify(all, null, 2));
  report.tables[name] = { rows: all.length, file: relative(ROOT, rel) };
  console.log(`  · ${name}: ${all.length} filas`);
}

async function listRecursive(bucket, prefix = "") {
  const out = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`bucket ${bucket}: ${error.message}`);
    if (!data || data.length === 0) break;
    const dirs = data.filter((o) => o && o.metadata === null || (o && !o.metadata && o.id?.endsWith("/")));
    const files = data.filter((o) => o && o.metadata && o.metadata.size !== undefined && o.metadata.size !== null);
    out.push(...files.map((o) => ({ name: prefix ? `${prefix}/${o.name}` : o.name, size: o.metadata.size })));
    for (const d of dirs) {
      out.push(...await listRecursive(bucket, prefix ? `${prefix}/${d.name}` : d.name));
    }
    if (data.length < 1000) break;
    offset += data.length;
  }
  return out;
}

async function exportBucket(bucket) {
  const objects = await listRecursive(bucket);
  report.buckets[bucket] = { objects: objects.length, file: null };
  const dir = join(backupDir, "storage", bucket);
  mkdirSync(dir, { recursive: true });
  let downloaded = 0;
  for (const obj of objects) {
    const { data, error } = await client.storage.from(bucket).download(obj.name);
    if (error) {
      const msg = typeof error === "object" && error && error.message ? error.message : String(error);
      console.error(`    ! ${bucket}/${obj.name}: ${msg}`);
      continue;
    }
    const f = join(dir, obj.name.replace(/\//g, "__"));
    writeFileSync(f, Buffer.from(await data.arrayBuffer()));
    downloaded++;
  }
  report.buckets[bucket].downloaded = downloaded;
  report.buckets[bucket].file = relative(ROOT, dir);
  console.log(`  · ${bucket}: ${downloaded}/${objects.length} objetos`);
}

(async () => {
  console.log("Origen:", URL);
  console.log("Respaldo en:", backupDir);
  console.log("Tablas:");
  for (const t of TABLES) await exportTable(t);
  console.log("Storage:");
  for (const b of BUCKETS) await exportBucket(b);
  writeFileSync(join(backupDir, "manifest.json"), JSON.stringify(report, null, 2) + "\n");
  console.log("Manifest:", relative(ROOT, join(backupDir, "manifest.json")));
  let total = 0;
  for (const b of Object.values(report.buckets)) {
    if (b.file) total += dirSize(join(ROOT, b.file));
  }
  console.log("Total storage descargado:", human(total));
})().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});

function dirSize(dir) {
  let total = 0;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    total += statSync(p).isDirectory() ? dirSize(p) : statSync(p).size;
  }
  return total;
}
function human(n) {
  return (n / 1024).toFixed(1) + " KB";
}