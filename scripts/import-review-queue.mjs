#!/usr/bin/env node
// Importa docs/data/contenido-candidato-33.json a la COLA DE REVISIÓN de
// "MOTO PARTES SOSA" en Supabase (gestor Rancing Mau / admin). NO publica:
// - published=false, source_review_status='pending' → aparece en /admin/revision
// - base_price/promo_price NULL (no inventamos precios de venta; el precio del
//   JSON es REFERENCIA del proveedor externo, no el de venta del negocio)
// - SIN imagen, SIN asignación de sucursal, SIN disponibilidad (todo pendiente)
// - SKU provisional auto-generado PEND-### (el dueño lo reemplaza al revisar)
// - Las categorías y marcas referenciadas se crean si no existen; las que el
//   borrador marca como "por confirmar" quedan marcadas en el reporte y con
//   active=false para que no salgan al catálogo público sin validar.
//
// Idempotente: upsert por SKU provisional; no duplica si se corre 2 veces.
//
// Uso:
//   node --experimental-strip-types scripts/import-review-queue.mjs   (no; es .mjs)
//   node scripts/import-review-queue.mjs --dry-run                    # solo reporta
//   node scripts/import-review-queue.mjs                               # inserta
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DATASET = resolve("docs/data/contenido-candidato-33.json");
const REPORT = resolve("docs/data/import-review-report.json");

function slugify(text) {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
      .slice(0, 80) || "item"
  );
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function parseDataset() {
  const raw = JSON.parse(readFileSync(DATASET, "utf8"));
  const rows = Array.isArray(raw) ? raw : raw.candidates ?? raw.items ?? [];
  return rows.map((p, i) => ({
    ref: p.reference_id ?? i + 1,
    name: String(p.name_draft ?? "").trim(),
    description: String(p.description_draft ?? "").trim(),
    category: String(p.category_reference ?? "").trim(),
    brand: String(p.brand_reference ?? "").trim(),
    ref_price: p.reference_price_hnl ?? null,
    source_name: p.source_name ?? null,
    source_url: p.source_url ?? null,
    source_note: p.source_note ?? null,
    checked_at: p.source_checked_at ? new Date(`${p.source_checked_at}T12:00:00Z`).toISOString() : null,
  }));
}

const DRY = process.argv.includes("--dry-run") || process.argv.includes("--dry");

const client = DRY
  ? null
  : createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

const report = {
  dry_run: DRY,
  candidates: 0,
  categories: [],
  brands: [],
  imported: [],
  skipped: [],
};

const BRAND_POR_CONFIRMAR = ["por confirmar", "por confirmar (genérica)"];
const categoryCache = new Map();
const brandCache = new Map();

async function ensureCategory(name) {
  const key = name || "Por clasificar";
  const slug = slugify(key);
  if (categoryCache.has(slug)) return categoryCache.get(slug);
  if (DRY) {
    categoryCache.set(slug, `cat:${slug}`);
    report.categories.push({ name: key, slug, provisional: true });
    return categoryCache.get(slug);
  }
  const bySlug = await client.from("categories").select("id").eq("slug", slug).maybeSingle();
  if (bySlug.data) {
    categoryCache.set(slug, bySlug.data.id);
    return bySlug.data.id;
  }
  // Categorías no estandarizadas del borrador → por confirmar (inactivas)
  const { data, error } = await client
    .from("categories")
    .insert({ name: name || "Por clasificar", slug, active: false })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const existing = await client.from("categories").select("id").eq("slug", slug).maybeSingle();
      categoryCache.set(slug, existing.data?.id);
      return existing.data?.id;
    }
    throw new Error(`categoría ${name}: ${error.message}`);
  }
  report.categories.push({ name: name || "Por clasificar", slug, provisional: true });
  categoryCache.set(slug, data.id);
  return data.id;
}

async function ensureBrand(name) {
  const isPending = BRAND_POR_CONFIRMAR.some((x) => name.toLowerCase().includes(x)) || !name;
  const finalName = isPending && !name ? "Por confirmar" : name;
  const slug = slugify(finalName) + (isPending ? "-por-confirmar" : "");
  if (brandCache.has(slug)) return brandCache.get(slug);
  if (DRY) {
    brandCache.set(slug, `br:${slug}`);
    report.brands.push({ name: finalName, slug, provisional: isPending });
    return brandCache.get(slug);
  }
  const bySlug = await client.from("brands").select("id").eq("slug", slug).maybeSingle();
  if (bySlug.data) {
    brandCache.set(slug, bySlug.data.id);
    return bySlug.data.id;
  }
  const { data, error } = await client
    .from("brands")
    .insert({ name: finalName, slug, active: !isPending })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const existing = await client.from("brands").select("id").eq("slug", slug).maybeSingle();
      brandCache.set(slug, existing.data?.id);
      return existing.data?.id;
    }
    throw new Error(`marca ${name}: ${error.message}`);
  }
  report.brands.push({ name: finalName, slug, provisional: isPending });
  brandCache.set(slug, data.id);
  return data.id;
}

async function run() {
  const rows = parseDataset();
  report.candidates = rows.length;

  const resolved = [];
  for (const r of rows) {
    const categoryId = await ensureCategory(r.category);
    const brandId = await ensureBrand(r.brand);
    const sku = `PEND-${String(r.ref).padStart(3, "0")}`;
    const slug = `${slugify(r.name)}-${String(r.ref).padStart(3, "0")}`;
    resolved.push({ ...r, sku, slug, categoryId, brandId });
  }

  if (DRY) {
    for (const r of resolved) {
      report.imported.push({
        ref: r.ref,
        sku: r.sku,
        name: r.name,
        category: r.category || "Por clasificar",
        brand: r.brand || "Por confirmar",
      });
    }
  } else {
    for (const batch of chunk(resolved, 25)) {
      const payload = batch.map((r) => ({
        name: r.name,
        slug: r.slug,
        sku: r.sku,
        description: r.description || "",
        base_price: null,
        promo_price: null,
        price_country: "HN",
        category_id: r.categoryId,
        brand_id: r.brandId,
        general_status: "available",
        featured: false,
        published: false,
        source_review_status: "pending",
        source_name: r.source_name,
        source_url: r.source_url,
        source_checked_at: r.checked_at,
      }));
      const { error } = await client
        .from("products")
        .upsert(payload, { onConflict: "sku" });
      if (error) {
        for (const r of batch) report.skipped.push({ ref: r.ref, reason: error.message });
      } else {
        for (const r of batch) {
          report.imported.push({
            ref: r.ref,
            sku: r.sku,
            name: r.name,
            action: "insertado/actualizado",
          });
        }
      }
    }
  }

  writeFileSync(REPORT, JSON.stringify(report, null, 2));
  const headline = DRY
    ? `[DRY-RUN] ${report.candidates} candidatos listos para la cola de revisión`
    : `Importados a la cola de revisión: ${report.imported.length}`;
  console.log(headline);
  console.log("Categorías:", report.categories.map((c) => `${c.name}${c.provisional ? " (por confirmar)" : ""}`).join(" · ") || "—");
  console.log("Marcas:", report.brands.map((b) => `${b.name}${b.provisional ? " (por confirmar)" : ""}`).join(" · ") || "—");
  for (const r of report.imported) console.log(`  · ${r.sku} — ${r.name} [${r.category} / ${r.brand}]`);
  if (report.skipped.length) {
    console.log(`Omitidos: ${report.skipped.length}`);
    for (const s of report.skipped) console.log(`  · #${s.ref}: ${s.reason}`);
  }
  console.log("Detalle completo:", REPORT);
}

run().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});