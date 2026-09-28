import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("migration applies and isolates published data, roles and source metadata", async () => {
  const db = new PGlite();
  try {
    // Supabase-owned schemas mocked locally; all application SQL is the real migration.
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated;
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid,bucket_id text); alter table storage.objects enable row level security;`);
    for (const file of [
      "202609210001_initial.sql",
      "202609211000_admin.sql",
      "202609221000_compatibility.sql",
      "202609231000_reviews_analytics.sql",
    ]) {
      await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
    }
    assert.equal(
      (await db.query("select * from public.branches")).rows.length,
      3,
    );
    assert.equal(
      (await db.query("select * from public.reviews")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.page_views_daily")).rows.length,
      0,
    );
    for (const table of ["motorcycles", "spare_parts", "compatibility"]) {
      assert.equal(
        (await db.query(`select * from public.${table}`)).rows.length,
        0,
      );
    }
    await db.exec(`insert into public.motorcycles(km_handle,name,brand,model)
      values ('cg125','Honda CG125','Honda','CG125');
      insert into public.spare_parts(km_id,name,category,brand)
      values (1,'Catarina CG125','catarinas','KM Motos');
      insert into public.compatibility(spare_part_id,motorcycle_id,compatibility_level)
      select s.id,m.id,'confirmada' from public.spare_parts s cross join public.motorcycles m;`);
    await assert.rejects(
      db.exec("insert into public.motorcycles(km_handle,name,brand,model) values ('cg125','Honda CG125','Honda','CG125')"),
      /duplicate key/,
    );
    const index = await db.query<{ count: number }>(
      "select count(*) as count from pg_indexes where schemaname = 'public' and indexname = 'products_featured_published'",
    );
    assert.equal(Number(index.rows[0].count), 1);
    await db.exec(`insert into public.categories(id,name,slug) values ('10000000-0000-4000-8000-000000000001','Prueba','prueba');
      insert into public.brands(id,name,slug) values ('10000000-0000-4000-8000-000000000002','Prueba','prueba');
      insert into public.products(id,name,slug,sku,base_price,category_id,brand_id,published) values
      ('10000000-0000-4000-8000-000000000003','Producto aprobado','producto-aprobado','TEST-1',100,'10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',true);
      insert into public.product_images(product_id,url,alt_text) values ('10000000-0000-4000-8000-000000000003','/images/test.webp','Prueba');
      insert into public.products(name,slug,sku,base_price,category_id,brand_id,source_review_status) values
      ('Pendiente','pendiente','TEST-2',100,'10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','pending');`);
    await assert.rejects(
      db.exec(
        "update public.products set published = true where sku = 'TEST-2'",
      ),
      /check constraint/,
    );
    await db.exec("set role anon");
    const visible = await db.query<Record<string, unknown>>(
      "select * from public.public_catalog",
    );
    assert.equal(visible.rows.length, 1);
    assert.equal(visible.rows[0].sku, "TEST-1");
    assert.equal("source_url" in visible.rows[0], false);
    assert.equal(
      (await db.query("select * from public.public_reviews")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select * from public.reviews"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select * from public.products"),
      /permission denied/,
    );
    await db.exec("reset role; set role authenticated;");
    assert.equal(
      (await db.query("select * from public.products")).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(
        "insert into public.brands(name,slug) values ('Intruso','intruso')",
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.exec(`insert into public.reviews(branch_id,rating,comment,dedupe_key,visitor_token_hash)
        values ('00000000-0000-4000-8000-000000000001',5,'Reseña intrusa que no debe entrar','intrusa','intrusa')`),
      /row-level security/,
    );
    await assert.rejects(
      db.exec(
        "insert into public.admin_users(id,name) values (gen_random_uuid(),'Intruso')",
      ),
      /permission denied/,
    );
    await db.exec("reset role");
    await db.exec("set role service_role; select public.increment_page_view('2026-09-23','/catalogo'); reset role;");
    assert.equal(
      (await db.query<{ views: number }>("select views from public.page_views_daily where path = '/catalogo'")).rows[0].views,
      1,
    );
    assert.ok(
      (await db.query("select * from public.admin_audit_log")).rows.length > 0,
    );
  } finally {
    await db.close();
  }
});
