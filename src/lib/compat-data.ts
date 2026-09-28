import { createHash } from "node:crypto";
import { z } from "zod";

const motorcycleSchema = z.object({
  id: z.string(),
  brand: z.string(),
  model: z.string(),
  engine_cc: z.number().nullable(),
  year_or_generation: z.string().nullable(),
  source_url: z.string(),
});

const sparePartSchema = z.object({
  id: z.string(),
  km_id: z.number(),
  name: z.string(),
  code: z.string().nullable(),
  category: z.string(),
  brand: z.string(),
  measurements: z.string().nullable(),
  price_hnl: z.number().nullable(),
  image_url: z.string(),
  source_url: z.string(),
  source_name: z.string(),
  source_checked_at: z.string(),
  description: z.string(),
});

const compatibilitySchema = z.object({
  spare_part_id: z.string(),
  motorcycle_id: z.string(),
  motorcycle_name: z.string(),
  compatibility_level: z.string(),
  reason: z.string(),
  evidence_url: z.string(),
  notes: z.string(),
});

const datasetSchema = z.object({
  motorcycles: z.array(motorcycleSchema),
  spare_parts: z.array(sparePartSchema),
  compatibility: z.array(compatibilitySchema),
});

export type CompatibilityDataset = z.infer<typeof datasetSchema>;
export type MotorcycleRow = z.infer<typeof motorcycleSchema>;
export type SparePartRow = z.infer<typeof sparePartSchema>;
export type CompatibilityRow = z.infer<typeof compatibilitySchema>;

export function parseDataset(raw: unknown): CompatibilityDataset {
  const parsed = datasetSchema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues[0];
    throw new Error(
      `Datos de compatibilidad inválidos: ${detail?.path.join(".") ?? "?"} — ${detail?.message ?? "error"}`,
    );
  }
  return parsed.data;
}

// Returns the KM Motos collection handle for a motorcycle record id.
export function motorcycleKmHandle(id: string): string {
  return id.replace(/^moto-/, "");
}

// Deterministic UUID v3-like from a namespace + key so re-imports never
// duplicate rows and the compatibility links are stable across runs.
export function deterministicUuid(namespace: string, key: string): string {
  const hash = createHash("md5").update(`${namespace}:${key}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x30;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type CompatImportMotorcycle = {
  id: string;
  km_handle: string;
  name: string;
  brand: string;
  model: string;
  engine_cc: number | null;
  year_or_generation: string | null;
  source_url: string;
  active: boolean;
};

export type CompatImportSparePart = {
  id: string;
  km_id: number;
  name: string;
  code: string | null;
  category: string;
  brand: string;
  measurements: string | null;
  price_hnl: number | null;
  image_url: string | null;
  source_url: string;
  source_name: string;
  source_checked_at: string;
  description: string;
  active: boolean;
};

export type CompatImportCompatibility = {
  spare_part_id: string;
  motorcycle_id: string;
  compatibility_level: string;
  reason: string;
  evidence_url: string;
  notes: string;
};

export type CompatImport = {
  motorcycles: CompatImportMotorcycle[];
  spare_parts: CompatImportSparePart[];
  compatibility: CompatImportCompatibility[];
};

const MOTORCYCLE_NS = "rancing-mau:compat:motorcycle";
const SPARE_PART_NS = "rancing-mau:compat:spare_part";

export function buildCompatImport(dataset: CompatibilityDataset): CompatImport {
  const motorcycles = dataset.motorcycles.map((row) => ({
    id: deterministicUuid(MOTORCYCLE_NS, row.id),
    km_handle: motorcycleKmHandle(row.id),
    name: `${row.brand} ${row.model}`.trim(),
    brand: row.brand,
    model: row.model,
    engine_cc: row.engine_cc,
    year_or_generation: row.year_or_generation,
    source_url: row.source_url,
    active: true,
  }));

  const spareParts = dataset.spare_parts.map((row) => ({
    id: deterministicUuid(SPARE_PART_NS, String(row.km_id)),
    km_id: row.km_id,
    name: row.name,
    code: row.code,
    category: row.category,
    brand: row.brand,
    measurements: row.measurements,
    price_hnl: row.price_hnl,
    image_url: row.image_url === "" ? null : row.image_url,
    source_url: row.source_url,
    source_name: row.source_name,
    source_checked_at: row.source_checked_at,
    description: row.description,
    active: true,
  }));

  const compatibility = dataset.compatibility.map((row) => ({
    spare_part_id: deterministicUuidFromLegacyPartId(row.spare_part_id, dataset),
    motorcycle_id: deterministicUuid(MOTORCYCLE_NS, row.motorcycle_id),
    compatibility_level: row.compatibility_level,
    reason: row.reason,
    evidence_url: row.evidence_url,
    notes: row.notes,
  }));

  return { motorcycles, spare_parts: spareParts, compatibility };
}

// Resolves a legacy spare part record id (rep-0001 style) to the stable UUID.
function deterministicUuidFromLegacyPartId(
  legacyId: string,
  dataset: CompatibilityDataset,
): string {
  const match = dataset.spare_parts.find((part) => part.id === legacyId);
  if (!match) throw new Error(`Repuesto de compatibilidad sin datos: ${legacyId}`);
  return deterministicUuid(SPARE_PART_NS, String(match.km_id));
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function renderCompatSeedSql(import_: CompatImport): string {
  const motorcycleSql = import_.motorcycles
    .map(
      (row) =>
        `  (${[
          sqlLiteral(row.id),
          sqlLiteral(row.km_handle),
          sqlLiteral(row.name),
          sqlLiteral(row.brand),
          sqlLiteral(row.model),
          sqlLiteral(row.engine_cc),
          sqlLiteral(row.year_or_generation),
          sqlLiteral(row.source_url),
        ].join(", ")}),`,
    )
    .join("\n")
    .slice(0, -1);

  const sparePartSql = import_.spare_parts
    .map(
      (row) =>
        `  (${[
          sqlLiteral(row.id),
          sqlLiteral(row.km_id),
          sqlLiteral(row.name),
          sqlLiteral(row.code),
          sqlLiteral(row.category),
          sqlLiteral(row.brand),
          sqlLiteral(row.measurements),
          sqlLiteral(row.price_hnl),
          sqlLiteral(row.image_url),
          sqlLiteral(row.source_url),
          sqlLiteral(row.source_name),
          sqlLiteral(row.source_checked_at),
          sqlLiteral(row.description),
        ].join(", ")}),`,
    )
    .join("\n")
    .slice(0, -1);

  const compatibilitySql = import_.compatibility
    .map(
      (row) =>
        `  (${[
          sqlLiteral(row.spare_part_id),
          sqlLiteral(row.motorcycle_id),
          sqlLiteral(row.compatibility_level),
          sqlLiteral(row.reason),
          sqlLiteral(row.evidence_url),
          sqlLiteral(row.notes),
        ].join(", ")}),`,
    )
    .join("\n")
    .slice(0, -1);

  return `-- Seed de compatibilidad KM Motos (generado automáticamente).
-- Ejecutar en el SQL editor de Supabase con la migración de compatibilidad aplicada.

begin;

insert into public.motorcycles (id, km_handle, name, brand, model, engine_cc, year_or_generation, source_url, active) values
${motorcycleSql}
on conflict (km_handle) do update set
  name = excluded.name,
  brand = excluded.brand,
  model = excluded.model,
  engine_cc = excluded.engine_cc,
  year_or_generation = excluded.year_or_generation,
  source_url = excluded.source_url,
  active = excluded.active;

insert into public.spare_parts (id, km_id, name, code, category, brand, measurements, price_hnl, image_url, source_url, source_name, source_checked_at, description, active) values
${sparePartSql}
on conflict (km_id) do update set
  name = excluded.name,
  code = excluded.code,
  category = excluded.category,
  brand = excluded.brand,
  measurements = excluded.measurements,
  price_hnl = excluded.price_hnl,
  image_url = excluded.image_url,
  source_url = excluded.source_url,
  source_name = excluded.source_name,
  source_checked_at = excluded.source_checked_at,
  description = excluded.description,
  active = excluded.active;

insert into public.compatibility (spare_part_id, motorcycle_id, compatibility_level, reason, evidence_url, notes) values
${compatibilitySql}
on conflict (spare_part_id, motorcycle_id) do update set
  compatibility_level = excluded.compatibility_level,
  reason = excluded.reason,
  evidence_url = excluded.evidence_url,
  notes = excluded.notes;

commit;
`;
}