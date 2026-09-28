import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer, hasSupabase } from "./supabase/server";
import { slugify } from "./admin-validation";

export type AdminSession = {
  client: SupabaseClient;
  userId: string;
  name: string;
};

export type AdminImageRow = {
  id: string;
  url: string;
  source_url: string | null;
  license_or_permission: string | null;
  alt_text: string;
  position: number;
  is_primary: boolean;
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  base_price: number | null;
  promo_price: number | null;
  general_status: string;
  featured: boolean;
  published: boolean;
  source_url: string | null;
  source_name: string | null;
  source_checked_at: string | null;
  source_review_status: string;
  source_reviewed_by: string | null;
  category_id: string;
  brand_id: string;
  updated_at: string;
  category_name: string | null;
  brand_name: string | null;
  images: AdminImageRow[];
  branches: {
    branch_id: string;
    available: boolean;
    status: string;
    branch_price: number | null;
    branch_promo_price: number | null;
    branch_name: string;
  }[];
};

export type AdminReviewRow = {
  id: string;
  branch_id: string;
  branch_name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "hidden" | "rejected";
  admin_response: string | null;
  moderation_reason: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
};

// Public pages never receive admin data; this guard is only for /admin.
export async function requireAdmin(): Promise<AdminSession> {
  if (!hasSupabase()) redirect("/admin/login");
  const client = await createSupabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin, error } = await client
    .from("admin_users")
    .select("id,name")
    .eq("id", user.id)
    .eq("active", true)
    .eq("role", "admin")
    .maybeSingle<{ id: string; name: string }>();
  if (error || !admin) redirect("/admin/login");
  return { client, userId: user.id, name: admin.name };
}

export async function currentAdminSession(): Promise<AdminSession | null> {
  if (!hasSupabase()) return null;
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

export function internalImageUrl(bucket: string, objectPath: string): string {
  return `/images/${bucket}/${objectPath}`;
}

export async function promoteCandidateToPublic(
  client: SupabaseClient,
  candidatePath: string,
): Promise<{ ok: boolean; publicUrl?: string; error?: string }> {
  const fileName = candidatePath.split("/").pop() ?? candidatePath;
  const publicPath = `products/${fileName}`;
  const { error: copyError } = await client.storage
    .from("catalog-candidates")
    .copy(candidatePath, publicPath, { destinationBucket: "catalog-public" });
  if (copyError)
    return {
      ok: false,
      error: copyError.message,
    };
  await client.storage.from("catalog-candidates").remove([candidatePath]);
  const { data } = client.storage
    .from("catalog-public")
    .getPublicUrl(publicPath);
  return { ok: true, publicUrl: data.publicUrl };
}

function storageObjectFromUrl(
  url: string,
): { bucket: string; objectPath: string } | null {
  let candidate: string | null = null;
  if (url.startsWith("/images/")) {
    candidate = url.replace(/^\/images\//, "");
  } else {
    const marker = "/storage/v1/object/public/";
    const index = url.indexOf(marker);
    if (index === -1) return null;
    candidate = url.slice(index + marker.length);
  }
  const [bucket, ...rest] = candidate.split("/");
  if (bucket !== "catalog-candidates" && bucket !== "catalog-public")
    return null;
  const objectPath = rest.join("/");
  if (!objectPath) return null;
  return { bucket, objectPath };
}

export async function removeStoredImages(
  client: SupabaseClient,
  urls: string[],
): Promise<void> {
  for (const url of urls) {
    const object = storageObjectFromUrl(url);
    if (!object) continue;
    await client.storage.from(object.bucket).remove([object.objectPath]);
  }
}

export function uniqueSlug(base: string, taken: Set<string>): string {
  const slug = slugify(base);
  if (!taken.has(slug)) return slug;
  for (let index = 2; index < 1000; index++) {
    const candidate = `${slug}-${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

export async function takenSlugs(
  client: SupabaseClient,
): Promise<Set<string>> {
  const { data } = await client.from("products").select("slug");
  return new Set((data ?? []).map((row) => row.slug));
}

export async function listCategories(client: SupabaseClient) {
  const { data, error } = await client
    .from("categories")
    .select("id,name,slug,active")
    .order("name");
  if (error) throw new Error("No se pudieron cargar las categorías.");
  return (data ?? []) as { id: string; name: string; slug: string; active: boolean }[];
}

export async function listBrands(client: SupabaseClient) {
  const { data, error } = await client
    .from("brands")
    .select("id,name,slug,active")
    .order("name");
  if (error) throw new Error("No se pudieron cargar las marcas.");
  return (data ?? []) as { id: string; name: string; slug: string; active: boolean }[];
}

export async function listBranches(client: SupabaseClient) {
  const { data, error } = await client
    .from("branches")
    .select("*")
    .order("name");
  if (error) throw new Error("No se pudieron cargar las sucursales.");
  return (data ?? []) as {
    id: string;
    name: string;
    slug: string;
    city: string;
    address: string | null;
    reference: string | null;
    schedule: string | null;
    whatsapp_number: string | null;
    phone: string | null;
    google_maps_url: string | null;
    map_embed_url: string | null;
    active: boolean;
  }[];
}

export async function listProducts(
  client: SupabaseClient,
  filters: {
    query?: string;
    review?: string;
    published?: string;
    category_id?: string;
    brand_id?: string;
  } = {},
) {
  let query = client
    .from("products")
    .select(
      "id,name,slug,sku,description,base_price,promo_price,general_status,featured,published,source_review_status,source_url,source_name,source_checked_at,category_id,brand_id,updated_at,brands(name),categories(name),product_images(url)",
    )
    .order("updated_at", { ascending: false });
  if (filters.category_id) query = query.eq("category_id", filters.category_id);
  if (filters.brand_id) query = query.eq("brand_id", filters.brand_id);
  if (filters.review) query = query.eq("source_review_status", filters.review);
  if (filters.published === "true") query = query.eq("published", true);
  if (filters.published === "false") query = query.eq("published", false);
  const { data, error } = await query.limit(200);
  if (error) throw new Error("No se pudo cargar la lista de productos.");
  const rows = (data ?? []) as (Record<string, unknown>)[];
  let result = rows.map((row) => ({
    ...row,
    images: (row.product_images as { url: string }[] | null) ?? [],
    category_name:
      (row.categories as { name: string } | null)?.name ?? null,
    brand_name: (row.brands as { name: string } | null)?.name ?? null,
  })) as unknown as AdminProductRow[];
  if (filters.query) {
    const needle = filters.query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    result = result.filter((product) =>
      [product.name, product.sku, product.brand_name, product.category_name]
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

export async function getProduct(
  client: SupabaseClient,
  id: string,
): Promise<AdminProductRow | null> {
  const { data, error } = await client
    .from("products")
    .select(
      "id,name,slug,sku,description,base_price,promo_price,general_status,featured,published,source_review_status,source_url,source_name,source_checked_at,source_reviewed_by,category_id,brand_id,updated_at,brands(name),categories(name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el producto.");
  if (!data) return null;
  const product = {
    ...data,
    brand_name: (data.brands as { name: string }[] | null)?.[0]?.name ?? null,
    category_name:
      (data.categories as { name: string }[] | null)?.[0]?.name ?? null,
  } as unknown as AdminProductRow;
  const [images, branches] = await Promise.all([
    client
      .from("product_images")
      .select("*")
      .eq("product_id", id)
      .order("position"),
    client
      .from("product_branches")
      .select("branch_id,available,status,branch_price,branch_promo_price,branches(name)")
      .eq("product_id", id),
  ]);
  product.images = (images.data ?? []) as AdminImageRow[];
  product.branches = ((branches.data ?? []) as unknown as {
    branch_id: string;
    available: boolean;
    status: string;
    branch_price: number | null;
    branch_promo_price: number | null;
    branches: { name: string }[] | null;
  }[]).map((row) => ({
    ...row,
    branch_name: row.branches?.[0]?.name ?? "",
  }));
  return product;
}

export async function listReviewQueue(client: SupabaseClient) {
  const { data, error } = await client
    .from("products")
    .select(
      "id,name,slug,sku,description,base_price,promo_price,general_status,featured,published,source_review_status,source_url,source_name,source_checked_at,category_id,brand_id,updated_at,brands(name),categories(name)",
    )
    .eq("source_review_status", "pending")
    .order("source_checked_at", { ascending: false });
  if (error) throw new Error("No se pudo cargar la cola de revisión.");
  const rows = (data ?? []) as (Record<string, unknown>)[];
  return rows.map((row) => ({
    ...row,
    category_name: (row.categories as { name: string } | null)?.name ?? null,
    brand_name: (row.brands as { name: string } | null)?.name ?? null,
  })) as unknown as AdminProductRow[];
}

export async function listReviews(
  client: SupabaseClient,
  status?: string,
): Promise<AdminReviewRow[]> {
  let query = client
    .from("reviews")
    .select("id,branch_id,rating,comment,status,admin_response,moderation_reason,moderated_by,moderated_at,responded_by,responded_at,created_at,branches(name)")
    .order("created_at", { ascending: false });
  if (status && ["pending", "approved", "hidden", "rejected"].includes(status))
    query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error("No se pudieron cargar las reseñas.");
  return ((data ?? []) as unknown as (Omit<AdminReviewRow, "branch_name"> & { branches: { name: string }[] | null })[]).map((row) => ({
    ...row,
    branch_name: row.branches?.[0]?.name ?? "Sucursal",
  })) as AdminReviewRow[];
}
