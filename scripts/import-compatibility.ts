import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  buildCompatImport,
  parseDataset,
  renderCompatSeedSql,
} from "../src/lib/compat-data";
import type { CompatImport } from "../src/lib/compat-data";

const DATASET_PATH = resolve("docs/data/km-motos-compatibilidad.json");
const SEED_PATH = resolve("supabase/seeds/compatibilidad.sql");

const CHUNK = 500;

function hasSupabase() {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

async function upsertDirect(rows: CompatImport) {
  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const reported = { motorcycles: 0, spare_parts: 0, compatibility: 0 };

  for (let i = 0; i < rows.motorcycles.length; i += CHUNK) {
    const { error } = await client
      .from("motorcycles")
      .upsert(rows.motorcycles.slice(i, i + CHUNK), {
        onConflict: "km_handle",
      });
    if (error) throw new Error(`motorcycles: ${error.message}`);
    reported.motorcycles += Math.min(CHUNK, rows.motorcycles.length - i);
  }

  for (let i = 0; i < rows.spare_parts.length; i += CHUNK) {
    const { error } = await client
      .from("spare_parts")
      .upsert(rows.spare_parts.slice(i, i + CHUNK), { onConflict: "km_id" });
    if (error) throw new Error(`spare_parts: ${error.message}`);
    reported.spare_parts += Math.min(CHUNK, rows.spare_parts.length - i);
  }

  for (let i = 0; i < rows.compatibility.length; i += CHUNK) {
    const { error } = await client
      .from("compatibility")
      .upsert(rows.compatibility.slice(i, i + CHUNK), {
        onConflict: "spare_part_id,motorcycle_id",
      });
    if (error) throw new Error(`compatibility: ${error.message}`);
    reported.compatibility += Math.min(CHUNK, rows.compatibility.length - i);
  }

  return reported;
}

async function run() {
  const raw = JSON.parse(readFileSync(DATASET_PATH, "utf8"));
  const dataset = parseDataset(raw);
  const imported = buildCompatImport(dataset);

  if (hasSupabase()) {
    const reported = await upsertDirect(imported);
    console.log(
      `Importado en Supabase: ${reported.motorcycles} modelos, ${reported.spare_parts} repuestos, ${reported.compatibility} compatibilidades.`,
    );
    return;
  }

  mkdirSync(resolve("supabase/seeds"), { recursive: true });
  writeFileSync(SEED_PATH, renderCompatSeedSql(imported), "utf8");
  console.log(`Seed SQL generado en: ${SEED_PATH}`);
  console.log(
    `(${imported.motorcycles.length} modelos, ${imported.spare_parts.length} repuestos, ${imported.compatibility.length} compatibilidades).`,
  );
  console.log(
    "Supabase sin configurar. Ejecuta el seed en el SQL editor tras aplicar la migración.",
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});