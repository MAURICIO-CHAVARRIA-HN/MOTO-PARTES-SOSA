export type ProductFormOverrides = {
  name?: string;
  sku?: string;
  description?: string;
  base_price?: string;
  promo_price?: string;
  category_id?: string;
  brand_id?: string;
  general_status?: string;
  featured?: string;
  published?: string;
  review?: string;
  source_url?: string;
  source_name?: string;
  source_checked_at?: string;
  branch?: {
    id: string;
    available?: string;
    status?: string;
    branch_price?: string;
    branch_promo_price?: string;
  } | null;
  branchOff?: {
    id: string;
    available?: string;
    status?: string;
    branch_price?: string;
    branch_promo_price?: string;
  } | null;
};

export function productFormData(overrides: ProductFormOverrides = {}): FormData {
  const form = new FormData();
  form.set("name", overrides.name ?? "Producto de prueba");
  form.set("sku", overrides.sku ?? "PRUEBA-1");
  form.set("description", overrides.description ?? "");
  form.set("base_price", overrides.base_price ?? "100");
  form.set("promo_price", overrides.promo_price ?? "");
  form.set(
    "category_id",
    overrides.category_id ?? "10000000-0000-4000-8000-000000000001",
  );
  form.set(
    "brand_id",
    overrides.brand_id ?? "10000000-0000-4000-8000-000000000002",
  );
  form.set("general_status", overrides.general_status ?? "available");
  form.set("featured", overrides.featured ?? "");
  form.set("published", overrides.published ?? "");
  form.set(
    "source_review_status",
    overrides.review ?? "manual",
  );
  form.set("source_url", overrides.source_url ?? "");
  form.set("source_name", overrides.source_name ?? "");
  form.set("source_checked_at", overrides.source_checked_at ?? "");
  for (const entry of [overrides.branch, overrides.branchOff]) {
    if (!entry) continue;
    const { id, ...rest } = entry;
    form.set(`branch_${id}_available`, rest.available ?? "true");
    form.set(`branch_${id}_status`, rest.status ?? "available");
    form.set(`branch_${id}_branch_price`, rest.branch_price ?? "");
    form.set(`branch_${id}_branch_promo_price`, rest.branch_promo_price ?? "");
  }
  return form;
}

export function branchFormData(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.set("name", overrides.name ?? "Sucursal prueba");
  form.set("city", overrides.city ?? "La Paz");
  form.set("address", overrides.address ?? "");
  form.set("reference", overrides.reference ?? "");
  form.set("schedule", overrides.schedule ?? "");
  form.set("whatsapp_number", overrides.whatsapp_number ?? "");
  form.set("phone", overrides.phone ?? "");
  form.set("google_maps_url", overrides.google_maps_url ?? "");
  form.set("map_embed_url", overrides.map_embed_url ?? "");
  form.set("active", overrides.active ?? "");
  return form;
}