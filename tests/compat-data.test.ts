import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCompatImport,
  deterministicUuid,
  motorcycleKmHandle,
  parseDataset,
  renderCompatSeedSql,
  type CompatibilityDataset,
} from "../src/lib/compat-data";

const dataset: CompatibilityDataset = {
  motorcycles: [
    {
      id: "moto-cg125",
      brand: "Honda",
      model: "CG125",
      engine_cc: 125,
      year_or_generation: null,
      source_url: "https://www.kmmotos.com/collections/cg125",
    },
    {
      id: "moto-ft150",
      brand: "Italika",
      model: "FT150",
      engine_cc: 150,
      year_or_generation: null,
      source_url: "https://www.kmmotos.com/collections/ft150",
    },
  ],
  spare_parts: [
    {
      id: "rep-0001",
      km_id: 7918850212068,
      name: "CATARINA 41T CG125",
      code: "KM-CAF0001",
      category: "catarinas",
      brand: "KM Motos",
      measurements: null,
      price_hnl: 120,
      image_url: "https://cdn.shopify.com/x.png",
      source_url: "https://www.kmmotos.com/products/catarina-41t-cg125",
      source_name: "KM Motos",
      source_checked_at: "2026-09-22",
      description: "Catarina para CG125.",
    },
  ],
  compatibility: [
    {
      spare_part_id: "rep-0001",
      motorcycle_id: "moto-cg125",
      motorcycle_name: "Honda CG125",
      compatibility_level: "confirmada",
      reason: "El repuesto aparece en la colección oficial.",
      evidence_url: "https://www.kmmotos.com/collections/cg125",
      notes: "Verificar antes de instalar.",
    },
  ],
};

test("parseDataset accepts a valid dataset and rejects broken ones", () => {
  assert.equal(parseDataset(dataset).motorcycles.length, 2);
  assert.throws(() => parseDataset({ motorcycles: "nope" }), /Datos de compatibilidad inválidos/);
  assert.throws(
    () => parseDataset({ motorcycles: [], spare_parts: [{ bogus: 1 }] }),
    /Datos de compatibilidad inválidos/,
  );
});

test("motorcycleKmHandle strips the moto- prefix", () => {
  assert.equal(motorcycleKmHandle("moto-cg125"), "cg125");
  assert.equal(motorcycleKmHandle("moto-ft150"), "ft150");
});

test("deterministicUuid is stable and well-formed", () => {
  const first = deterministicUuid("ns", "cg125");
  const second = deterministicUuid("ns", "cg125");
  const other = deterministicUuid("ns", "ft150");
  assert.equal(first, second);
  assert.notEqual(first, other);
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  assert.match(first, pattern);
  assert.match(other, pattern);
});

test("buildCompatImport maps motorcycles, spare parts and compatibility", () => {
  const imported = buildCompatImport(dataset);
  assert.equal(imported.motorcycles.length, 2);
  assert.equal(imported.spare_parts.length, 1);
  assert.equal(imported.compatibility.length, 1);

  const motor = imported.motorcycles.find((row) => row.km_handle === "cg125");
  assert.ok(motor);
  assert.equal(motor.name, "Honda CG125");
  assert.equal(motor.engine_cc, 125);
  assert.equal(motor.active, true);

  const part = imported.spare_parts[0];
  assert.equal(part.km_id, 7918850212068);
  assert.equal(part.category, "catarinas");

  // The compatibility link must match the stable motor/part ids.
  const [compat] = imported.compatibility;
  assert.equal(compat.motorcycle_id, motor.id);
  assert.equal(compat.spare_part_id, part.id);
  assert.equal(compat.compatibility_level, "confirmada");
});

test("buildCompatImport throws when a compatibility links to a missing part", () => {
  const broken: CompatibilityDataset = {
    ...dataset,
    compatibility: [
      {
        spare_part_id: "rep-9999",
        motorcycle_id: "moto-cg125",
        motorcycle_name: "X",
        compatibility_level: "confirmada",
        reason: "",
        evidence_url: "https://www.kmmotos.com/collections/cg125",
        notes: "",
      },
    ],
  };
  assert.throws(() => buildCompatImport(broken), /Repuesto de compatibilidad sin datos/);
});

test("renderCompatSeedSql escapes single quotes and emits the three inserts", () => {
  const imported = buildCompatImport(dataset);
  const sql = renderCompatSeedSql(imported);
  assert.match(sql, /insert into public\.motorcycles/);
  assert.match(sql, /insert into public\.spare_parts/);
  assert.match(sql, /insert into public\.compatibility/);
  assert.match(sql, /on conflict \(km_handle\) do update/);
  assert.match(sql, /on conflict \(km_id\) do update/);
  assert.match(sql, /on conflict \(spare_part_id, motorcycle_id\) do update/);
  assert.ok(sql.includes("O'Brien") === false);
});

test("renderCompatSeedSql handles apostrophes in names", () => {
  const withQuote: CompatibilityDataset = {
    ...dataset,
    spare_parts: [
      {
        ...dataset.spare_parts[0],
        name: "CABLE D'ACELERADOR",
        code: "KM-X'1",
      },
    ],
  };
  const sql = renderCompatSeedSql(buildCompatImport(withQuote));
  assert.ok(sql.includes("CABLE D''ACELERADOR"));
  assert.ok(sql.includes("KM-X''1"));
});