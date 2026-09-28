import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MotorcycleSummary = {
  id: string;
  km_handle: string;
  name: string;
  brand: string;
  model: string;
  engine_cc: number | null;
  year_or_generation: string | null;
  source_url: string | null;
  parts_count: number;
};

export type SparePartSummary = {
  id: string;
  km_id: number;
  name: string;
  code: string | null;
  category: string;
  brand: string | null;
  price_hnl: number | null;
  image_url: string | null;
  source_url: string | null;
  models_count: number;
};

export type SparePartDetail = SparePartSummary & {
  measurements: string | null;
  description: string | null;
  source_name: string | null;
  source_checked_at: string | null;
  models: {
    motorcycle_id: string;
    motorcycle_name: string;
    compatibility_level: string;
    evidence_url: string | null;
    notes: string | null;
  }[];
};

export type CompatibilitySummary = {
  total_motorcycles: number;
  total_spare_parts: number;
  total_compatibility: number;
  by_category: { category: string; count: number }[];
  by_model: { motorcycle_name: string; count: number }[];
};

async function compatibilityLinks(
  client: SupabaseClient,
): Promise<{ spare_part_id: string; motorcycle_id: string }[]> {
  const { data, error } = await client
    .from("compatibility")
    .select("spare_part_id,motorcycle_id");
  if (error)
    throw new Error("No se pudieron cargar los enlaces de compatibilidad.");
  return (data ?? []) as { spare_part_id: string; motorcycle_id: string }[];
}

export async function compatibilitySummary(
  client: SupabaseClient,
): Promise<CompatibilitySummary> {
  const [motorcycles, spareParts, links] = await Promise.all([
    client
      .from("motorcycles")
      .select(
        "id,km_handle,name,brand,model,engine_cc,year_or_generation,source_url",
      )
      .eq("active", true)
      .order("name"),
    client
      .from("spare_parts")
      .select("id,km_id,name,code,category,brand,price_hnl,image_url,source_url")
      .eq("active", true),
    compatibilityLinks(client),
  ]);
  if (motorcycles.error || spareParts.error)
    throw new Error("No se pudo cargar el resumen de compatibilidad.");

  const categories = new Map<string, number>();
  const models = new Map<string, number>();
  const activePartIds = new Set(
    ((spareParts.data ?? []) as { id: string }[]).map((row) => row.id),
  );
  const activeModelIds = new Set(
    ((motorcycles.data ?? []) as { id: string }[]).map((row) => row.id),
  );
  const partCategory = new Map(
    ((spareParts.data ?? []) as { id: string; category: string }[]).map(
      (row) => [row.id, row.category],
    ),
  );
  const modelName = new Map(
    ((motorcycles.data ?? []) as { id: string; name: string }[]).map(
      (row) => [row.id, row.name],
    ),
  );

  for (const link of links) {
    if (activePartIds.has(link.spare_part_id)) {
      const category = partCategory.get(link.spare_part_id) ?? "otros";
      categories.set(category, (categories.get(category) ?? 0) + 1);
    }
    if (activeModelIds.has(link.motorcycle_id)) {
      const name = modelName.get(link.motorcycle_id) ?? "";
      models.set(name, (models.get(name) ?? 0) + 1);
    }
  }

  return {
    total_motorcycles: motorcycles.data?.length ?? 0,
    total_spare_parts: spareParts.data?.length ?? 0,
    total_compatibility: links.length,
    by_category: Array.from(categories.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    by_model: Array.from(models.entries())
      .map(([motorcycle_name, count]) => ({ motorcycle_name, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function listMotorcycles(
  client: SupabaseClient,
): Promise<MotorcycleSummary[]> {
  const [motorcycles, links] = await Promise.all([
    client
      .from("motorcycles")
      .select("id,km_handle,name,brand,model,engine_cc,year_or_generation,source_url")
      .eq("active", true)
      .order("brand")
      .order("model"),
    compatibilityLinks(client),
  ]);
  if (motorcycles.error)
    throw new Error("No se pudieron cargar los modelos de motocicleta.");

  const counts = new Map<string, number>();
  for (const link of links)
    counts.set(link.motorcycle_id, (counts.get(link.motorcycle_id) ?? 0) + 1);

  return ((motorcycles.data ?? []) as Record<string, unknown>[]).map((row) => ({
    ...row,
    parts_count: counts.get(row.id as string) ?? 0,
  })) as unknown as MotorcycleSummary[];
}

export async function getMotorcycle(
  client: SupabaseClient,
  id: string,
): Promise<(MotorcycleSummary & { spare_parts: SparePartSummary[] }) | null> {
  const { data: motorcycle, error } = await client
    .from("motorcycles")
    .select("id,km_handle,name,brand,model,engine_cc,year_or_generation,source_url")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el modelo.");
  if (!motorcycle) return null;

  const { data, error: linksError } = await client
    .from("compatibility")
    .select(
      "spare_part_id,spare_parts(id,km_id,name,code,category,brand,price_hnl,image_url,source_url)",
    )
    .eq("motorcycle_id", id);
  if (linksError)
    throw new Error("No se pudieron cargar los repuestos compatibles.");

  const rows = (data ?? []) as unknown as {
    spare_part_id: string;
    spare_parts: Record<string, unknown> | Record<string, unknown>[] | null;
  }[];
  const spareParts = rows
    .map((row) =>
      Array.isArray(row.spare_parts)
        ? row.spare_parts[0] ?? null
        : row.spare_parts,
    )
    .filter(Boolean)
    .map((part) => ({ ...part, models_count: 0 })) as unknown as Omit<
    SparePartSummary,
    "models_count"
  >[];

  return {
    ...(motorcycle as unknown as MotorcycleSummary),
    parts_count: spareParts.length,
    spare_parts: spareParts.map((part) => ({ ...part, models_count: 0 })),
  };
}

export async function listSpareParts(
  client: SupabaseClient,
  filters: { query?: string; category?: string } = {},
): Promise<SparePartSummary[]> {
  let query = client
    .from("spare_parts")
    .select("id,km_id,name,code,category,brand,price_hnl,image_url,source_url")
    .eq("active", true)
    .order("category")
    .order("name")
    .limit(200);
  if (filters.category) query = query.eq("category", filters.category);
  const { data, error } = await query;
  if (error) throw new Error("No se pudo cargar la lista de repuestos.");

  const links = await compatibilityLinks(client);
  const counts = new Map<string, number>();
  for (const link of links)
    counts.set(link.spare_part_id, (counts.get(link.spare_part_id) ?? 0) + 1);

  let result = (data ?? []).map((row) => ({
    ...row,
    models_count: counts.get(row.id as string) ?? 0,
  })) as unknown as SparePartSummary[];

  if (filters.query) {
    const needle = filters.query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    result = result.filter((part) =>
      [part.name, part.code, part.category, part.brand]
        .filter(Boolean)
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(needle),
    );
  }
  return result;
}

export async function getSparePart(
  client: SupabaseClient,
  id: string,
): Promise<SparePartDetail | null> {
  const { data: part, error } = await client
    .from("spare_parts")
    .select(
      "id,km_id,name,code,category,brand,measurements,price_hnl,image_url,source_url,source_name,source_checked_at,description",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el repuesto.");
  if (!part) return null;

  const { data: models, error: modelsError } = await client
    .from("compatibility")
    .select("motorcycle_id,motorcycles(id,name),compatibility_level,evidence_url,notes")
    .eq("spare_part_id", id)
    .order("motorcycle_id");
  if (modelsError)
    throw new Error("No se pudieron cargar los modelos compatibles.");

  const modelsRows = (models ?? []) as unknown as {
    motorcycle_id: string;
    motorcycles: { name: string } | { name: string }[] | null;
    compatibility_level: string;
    evidence_url: string | null;
    notes: string | null;
  }[];
  const detail = {
    ...(part as unknown as Omit<SparePartDetail, "models" | "models_count">),
    models: modelsRows.map((row) => {
      const name = Array.isArray(row.motorcycles)
        ? row.motorcycles[0]?.name
        : row.motorcycles?.name;
      return {
        motorcycle_id: row.motorcycle_id,
        motorcycle_name: name ?? "",
        compatibility_level: row.compatibility_level,
        evidence_url: row.evidence_url,
        notes: row.notes,
      };
    }),
    models_count: modelsRows.length,
  };
  return detail;
}