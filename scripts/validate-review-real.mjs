// Explicit, opt-in integration test. Requires a local server connected to Supabase.
// Run: node --env-file=.env.local scripts/validate-review-real.mjs --run-real
import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

assert(process.argv.includes("--run-real"), "Pass --run-real to create and clean up real test records.");
const origin = process.env.ADMIN_TEST_ORIGIN || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(origin).hostname), "Use a local server.");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const run = randomUUID();
const sku = `QA-SOURCE-${run}`;
const title = `PRUEBA NO VENTA Filtro NS200 ${run.slice(0, 8)}`;
const source = "https://www.kmmotos.com/products/filtro-de-aceite-ns200-rs200-as200-dominar-400-250-pulsar-n250-n160-pulsar-ns400z-ktm-duke";
const categoryId = randomUUID();
const brandId = randomUUID();
let userId;
let browser;
let page;
const ownedImages = new Map();
const cleanupErrors = [];

async function checked(query) {
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function snapshot() {
  const records = {};
  for (const table of ["products", "categories", "brands", "branches", "product_images", "product_branches", "admin_users"]) {
    const rows = await checked(db.from(table).select("*").order("id"));
    records[table] = { count: rows.length, hash: createHash("sha256").update(JSON.stringify(rows)).digest("hex") };
  }
  for (const table of ["motorcycles", "spare_parts", "compatibility"]) {
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    records[table] = count;
  }
  return records;
}

async function product() {
  return checked(db.from("products").select("*").eq("sku", sku).single());
}

async function visible(expected) {
  const rows = await checked(anon.from("public_catalog").select("*").eq("sku", sku));
  assert.equal(rows.length, expected ? 1 : 0);
  if (expected) assert.equal("source_url" in rows[0], false);
}

async function rememberImages(id) {
  const rows = await checked(db.from("product_images").select("url").eq("product_id", id));
  for (const { url } of rows) {
    const match = url.match(/(?:\/images\/|\/storage\/v1\/object\/public\/)(catalog-candidates|catalog-public)\/(.+)$/);
    if (match) {
      ownedImages.set(`${match[1]}/${match[2]}`, { bucket: match[1], path: match[2] });
      if (match[1] === "catalog-candidates") {
        const path = `products/${match[2].split("/").pop()}`;
        ownedImages.set(`catalog-public/${path}`, { bucket: "catalog-public", path });
      }
    }
  }
  return rows;
}

async function queueDecision(label, status) {
  await page.goto(`${origin}/admin/revision`);
  const row = page.getByRole("row").filter({ hasText: sku });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: label, exact: true }).click();
  await expect(row).toHaveCount(0);
  const item = await product();
  assert.equal(item.source_review_status, status);
  assert.equal(item.source_reviewed_by, userId);
  assert(item.source_reviewed_at);
  assert.equal(item.published, false);
  await visible(false);
  console.log(`PASS: cola → ${status}, autor/fecha registrados, oculto al público`);
}

const before = await snapshot();
try {
  const response = await fetch(`${source}.js`, { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200);
  const external = await response.json();
  assert(external.variants.some((v) => v.sku === "KM-FF0003"));
  console.log(`Fuente comprobada: KM-FF0003, referencia ${external.price / 100} (moneda del comercio; no precio aprobado del negocio).`);

  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1365, height: 1000 } });
  page.setDefaultTimeout(25000);
  page.on("dialog", (dialog) => dialog.accept());
  // A test card authored here, not a third-party product photograph.
  await page.setContent('<div style="width:500px;height:300px;background:#eee;display:grid;place-items:center;font:30px sans-serif">PRUEBA TÉCNICA · NO VENTA</div>');
  const image = await page.locator("div").screenshot();

  const email = `qa-review-${run}@example.com`;
  const password = randomBytes(32).toString("base64url");
  const created = await checked(db.auth.admin.createUser({ email, password, email_confirm: true }));
  userId = created.user.id;
  await checked(db.from("admin_users").insert({ id: userId, name: `QA temporal ${run.slice(0, 8)}` }));
  await checked(db.from("categories").insert({ id: categoryId, name: `QA filtros ${run.slice(0, 8)}`, slug: `qa-${run}` }));
  await checked(db.from("brands").insert({ id: brandId, name: `QA referencia ${run.slice(0, 8)}`, slug: `qa-${run}` }));

  await page.goto(`${origin}/admin/login`);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(`${origin}/admin`);
  console.log("PASS: login por formulario con Auth real");

  await page.goto(`${origin}/admin/productos/nuevo`);
  await page.locator('[name="name"]').fill(title);
  await page.locator('[name="sku"]').fill(sku);
  await page.locator('textarea[name="description"]').fill("Ensayo técnico temporal basado en la ficha KM-FF0003. Precio de referencia; no constituye oferta del negocio. Imagen propia de prueba.");
  await page.locator('[name="category_id"]').selectOption(categoryId);
  await page.locator('[name="brand_id"]').selectOption(brandId);
  await page.locator('[name="base_price"]').fill(String(external.price / 100));
  await page.locator('[name="general_status"]').selectOption("out_of_stock");
  await page.locator('[name="imagen"]').setInputFiles({ name: "qa-review.png", mimeType: "image/png", buffer: image });
  await page.getByRole("button", { name: "Registrar fuente de internet" }).click();
  await page.locator('[name="source_url"]').fill(source);
  await page.locator('[name="source_name"]').fill("KM Motos");
  await page.locator('[name="source_checked_at"]').fill(new Date().toISOString().slice(0, 10));
  await page.locator('[name="source_review_status"]').selectOption("pending");
  await page.getByRole("button", { name: "Crear producto", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/productos\/[a-f0-9-]{36}$/);
  let item = await product();
  const editUrl = `${origin}/admin/productos/${item.id}`;
  assert.equal(item.source_review_status, "pending");
  const images = await rememberImages(item.id);
  assert.match(images[0].url, /^\/images\/catalog-candidates\//);
  await visible(false);
  const outsider = await browser.newContext();
  assert.notEqual((await outsider.request.get(`${origin}${images[0].url}`, { maxRedirects: 0 })).status(), 200);
  await outsider.close();
  console.log("PASS: candidato pendiente, imagen privada, ausente del catálogo anónimo");

  // Both publication paths must reject a pending source.
  await page.locator('[name="published"]').check();
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByText("Para publicar se necesita precio y un estado de revisión aprobado o manual.", { exact: true })).toBeVisible();
  await visible(false);
  await page.goto(`${origin}/admin/productos`);
  let row = page.getByRole("row").filter({ hasText: sku });
  await row.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(row.getByText(/precio|revisión/i).last()).toBeVisible();
  assert.equal((await product()).published, false);
  console.log("PASS: publicar pendiente bloqueado desde ficha y listado");

  await queueDecision("Rechazar", "rejected");
  await page.goto(editUrl);
  await page.locator('[name="published"]').check();
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByText("Para publicar se necesita precio y un estado de revisión aprobado o manual.", { exact: true })).toBeVisible();
  assert.equal((await product()).published, false);
  await page.locator('[name="published"]').uncheck();
  await page.locator('[name="source_review_status"]').selectOption("pending");
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByText("Producto guardado.", { exact: true })).toBeVisible();
  await queueDecision("Aprobar fuente", "approved");
  await expect(page.getByRole("heading", { name: "Revisión de fuentes externas" })).toBeVisible();
  await page.screenshot({ path: "test-results/review-real-approved.png", fullPage: true });

  await page.goto(editUrl);
  await page.locator('[name="published"]').check();
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByText("Producto guardado y publicado.", { exact: true })).toBeVisible();
  item = await product();
  assert.equal(item.published, true);
  await visible(true);
  const publicImages = await rememberImages(item.id);
  assert.match(publicImages[0].url, /\/storage\/v1\/object\/public\/catalog-public\//);
  const { error: candidateError } = await db.storage.from("catalog-candidates").download(images[0].url.split("catalog-candidates/")[1]);
  assert(candidateError, "Candidate must be removed after promotion");
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${origin}/catalogo`);
  await expect(publicPage.getByRole("link", { name: title, exact: true }).first()).toBeVisible();
  await publicPage.goto(`${origin}/producto/${item.slug}`);
  await expect(publicPage.getByRole("heading", { name: title, exact: true })).toBeVisible();
  const photo = publicPage.getByRole("img", { name: title, exact: true }).first();
  await expect(photo).toBeVisible();
  await expect.poll(() => photo.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
  await publicPage.screenshot({ path: "test-results/review-real-public.png", fullPage: true });
  await publicContext.close();
  console.log("PASS: aprobado → publicado, imagen promovida, catálogo y ficha anónimos renderizados");

  await page.goto(`${origin}/admin/productos`);
  row = page.getByRole("row").filter({ hasText: sku });
  const deletion = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/admin/productos");
  await row.getByRole("button", { name: "Eliminar", exact: true }).click();
  await (await deletion).finished();
  await expect(page.getByRole("heading", { name: "Productos", exact: true })).toBeVisible();
  await expect(row).toHaveCount(0);
  await visible(false);
  for (const { bucket, path } of ownedImages.values()) {
    const { error } = await db.storage.from(bucket).download(path);
    assert(error, `Orphan object in ${bucket}`);
  }
  const audit = await checked(db.from("admin_audit_log").select("action,actor_id").eq("record_id", item.id));
  assert(audit.some((a) => a.action === "INSERT" && a.actor_id === userId));
  assert(audit.some((a) => a.action === "UPDATE" && a.actor_id === userId));
  assert(audit.some((a) => a.action === "DELETE" && a.actor_id === userId));
  console.log("PASS: eliminación desde panel, limpieza de ambos buckets, auditoría real");
} catch (error) {
  if (page) await page.screenshot({ path: "test-results/review-real-failure.png", fullPage: true }).catch(() => {});
  throw error;
} finally {
  // Exact run-owned targets only. Keep the audit trail.
  async function clean(label, action) {
    try { await action(); } catch (error) { cleanupErrors.push(`${label}: ${error.message}`); }
  }
  await clean("product", async () => {
    const rows = await checked(db.from("products").select("id").eq("sku", sku));
    for (const row of rows) await rememberImages(row.id);
    await checked(db.from("products").delete().eq("sku", sku));
  });
  for (const { bucket, path } of ownedImages.values()) {
    await clean("storage", () => checked(db.storage.from(bucket).remove([path])));
  }
  await clean("category", () => checked(db.from("categories").delete().eq("id", categoryId)));
  await clean("brand", () => checked(db.from("brands").delete().eq("id", brandId)));
  if (userId) await clean("temporary auth user", () => checked(db.auth.admin.deleteUser(userId)));
  await browser?.close();
  assert.deepEqual(cleanupErrors, [], "Cleanup must finish successfully");
  assert.deepEqual(await snapshot(), before, "Existing business data must remain unchanged");
  console.log("PASS: cuenta temporal eliminada; datos originales idénticos; compatibilidad intacta");
}
