import test from "node:test";
import assert from "node:assert/strict";
import {
  branchFormData,
  productFormData,
} from "./helpers";
import {
  isValidUploadedImage,
  MAX_UPLOAD_BYTES,
  parseBranchForm,
  parseCatalogLabelForm,
  parseProductForm,
  slugify,
  sniffImage,
} from "../src/lib/admin-validation";

test("slugify normalizes accents, case, spaces and fallbacks", () => {
  assert.equal(slugify("  Freno Delantero "), "freno-delantero");
  assert.equal(slugify("Aceite 10W-40!"), "aceite-10w-40");
  assert.equal(slugify("María & José"), "maria-jose");
  assert.equal(slugify(""), "registro");
  assert.equal(slugify("Ñandú"), "nandu");
});

test("sniffImage validates magic bytes and rejects impostors", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
  assert.equal(sniffImage(jpeg)?.mime, "image/jpeg");
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(sniffImage(png)?.ext, "png");
  const webp = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
  ]);
  assert.equal(sniffImage(webp)?.ext, "webp");
  const avif = new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]);
  assert.equal(sniffImage(avif)?.ext, "avif");
  assert.equal(sniffImage(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])), null);
  assert.equal(sniffImage(new Uint8Array([])), null);
});

test("isValidUploadedImage enforces size and real signature", () => {
  const png = { ext: "png" as const, mime: "image/png" };
  assert.deepEqual(
    isValidUploadedImage({ size: 100, claimedType: "image/jpeg", sniffed: png }),
    { ok: true },
  );
  assert.equal(
    isValidUploadedImage({ size: 0, claimedType: "image/png", sniffed: png }).ok,
    false,
  );
  assert.equal(
    isValidUploadedImage({
      size: MAX_UPLOAD_BYTES + 1,
      claimedType: "image/png",
      sniffed: png,
    }).ok,
    false,
  );
  assert.equal(
    isValidUploadedImage({
      size: 5,
      claimedType: "text/html",
      sniffed: null,
    }).ok,
    false,
  );
});

test("parseProductForm accepts a valid product with normalized branches", () => {
  const form = productFormData({
    name: "Kit de cadena",
    sku: "KC-001",
    base_price: "125.356",
    category_id: "10000000-0000-4000-8000-000000000001",
    brand_id: "10000000-0000-4000-8000-000000000002",
    general_status: "available",
    branch: {
      id: "00000000-0000-4000-8000-000000000001",
      available: "true",
      status: "promotion",
      branch_price: "100",
      branch_promo_price: "90",
    },
    branchOff: {
      id: "00000000-0000-4000-8000-000000000002",
      available: "",
      status: "available",
    },
  });
  const parsed = parseProductForm(form);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.data.base_price, 125.36);
  assert.equal(parsed.data.description, "");
  assert.equal(parsed.data.featured, false);
  assert.equal(parsed.data.branches.length, 2);
  const on = parsed.data.branches.find((item) => item.branch_id.includes("001"));
  assert.equal(on?.available, true);
  assert.equal(on?.status, "promotion");
  assert.equal(on?.branch_promo_price, 90);
  const off = parsed.data.branches.find((item) => item.branch_id.includes("002"));
  assert.equal(off?.available, false);
  assert.equal(off?.status, "out_of_stock");
});

test("parseProductForm rejects invalid price, promo and publish rules", () => {
  const base = {
    name: "Pedal",
    sku: "PDL-1",
    base_price: "100",
    category_id: "10000000-0000-4000-8000-000000000001",
    brand_id: "10000000-0000-4000-8000-000000000002",
  };
  assert.equal(
    parseProductForm(productFormData({ ...base, promo_price: "100" })).ok,
    false,
  );
  assert.equal(
    parseProductForm(
      productFormData({ ...base, general_status: "promotion" }),
    ).ok,
    false,
  );
  assert.equal(
    parseProductForm(
      productFormData({ ...base, published: "true", base_price: "" }),
    ).ok,
    false,
  );
  assert.equal(
    parseProductForm(
      productFormData({ ...base, published: "true", review: "pending" }),
    ).ok,
    false,
  );
  assert.equal(
    parseProductForm(
      productFormData({
        ...base,
        source_url: "https://tienda.example.com/pieza",
        review: "manual",
      }),
    ).ok,
    false,
  );
  assert.equal(
    parseProductForm(
      productFormData({
        ...base,
        source_url: "http://insegura.example.com",
      }),
    ).ok,
    false,
  );
  assert.equal(
    parseProductForm(productFormData({ ...base, name: "   " })).ok,
    false,
  );
});

test("parseProductForm fails when a branch promotion is not lower", () => {
  const parsed = parseProductForm(
    productFormData({
      name: "Amortiguador",
      sku: "AM-1",
      base_price: "100",
      category_id: "10000000-0000-4000-8000-000000000001",
      brand_id: "10000000-0000-4000-8000-000000000002",
      branch: {
        id: "00000000-0000-4000-8000-000000000001",
        available: "true",
        status: "promotion",
        branch_price: "100",
        branch_promo_price: "100",
      },
    }),
  );
  assert.equal(parsed.ok, false);
});

test("parseBranchForm validates required fields and optional formats", () => {
  const valid = branchFormData({
    name: "Suyapa",
    city: "La Paz",
    whatsapp_number: "50499887766",
  });
  assert.equal(parseBranchForm(valid).ok, true);
  assert.equal(
    parseBranchForm(branchFormData({ name: "", city: "La Paz" })).ok,
    false,
  );
  assert.equal(
    parseBranchForm(
      branchFormData({ name: "X", city: "", whatsapp_number: "abc" }),
    ).ok,
    false,
  );
  assert.equal(
    parseBranchForm(
      branchFormData({
        name: "X",
        city: "Y",
        google_maps_url: "http://maps.example.com",
      }),
    ).ok,
    false,
  );
});

test("parseCatalogLabelForm requires a name and flags active state", () => {
  const form = new FormData();
  form.set("active", "on");
  assert.equal(parseCatalogLabelForm(form).ok, false);
  form.set("name", "  Frenos ");
  const parsed = parseCatalogLabelForm(form);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.data.name, "Frenos");
    assert.equal(parsed.data.active, true);
  }
});