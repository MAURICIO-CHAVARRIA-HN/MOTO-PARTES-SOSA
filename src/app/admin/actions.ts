"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer, hasSupabase } from "@/lib/supabase/server";
import {
  adminInitialState,
  parseBranchForm,
  parseCatalogLabelForm,
  parseProductForm,
  slugify,
  sniffImage,
  isValidUploadedImage,
} from "@/lib/admin-validation";
import {
  getProduct,
  internalImageUrl,
  promoteCandidateToPublic,
  removeStoredImages,
  requireAdmin,
  takenSlugs,
  uniqueSlug,
} from "@/lib/admin";
import type { AdminState } from "@/lib/admin-validation";

function refreshAdmin() {
  revalidatePath("/admin");
}

function refreshCatalog(paths: string[] = []) {
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/promociones");
  for (const path of new Set(paths)) revalidatePath(path);
}

export async function signIn(
  _state: { error: string },
  form: FormData,
): Promise<{ error: string }> {
  if (!hasSupabase())
    return {
      error: "El acceso administrativo está pendiente de configuración.",
    };
  const input = z
    .object({ email: z.email(), password: z.string().min(1).max(256) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!input.success) return { error: "Revisa el correo y la contraseña." };
  const client = await createSupabaseServer();
  const { data, error } = await client.auth.signInWithPassword(input.data);
  if (error || !data.user)
    return {
      error:
        "No se pudo iniciar sesión. Revisa tus datos o inténtalo más tarde.",
    };
  const { data: admin } = await client
    .from("admin_users")
    .select("id")
    .eq("id", data.user.id)
    .eq("active", true)
    .eq("role", "admin")
    .maybeSingle();
  if (!admin) {
    await client.auth.signOut();
    return {
      error:
        "No se pudo iniciar sesión. Revisa tus datos o inténtalo más tarde.",
    };
  }
  redirect("/admin");
}

export async function signOut() {
  const client = await createSupabaseServer();
  await client.auth.signOut();
  redirect("/admin/login");
}

async function uploadCandidateImage(
  client: Awaited<ReturnType<typeof requireAdmin>>["client"],
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const size = file.size;
  const sniffed = sniffImage(new Uint8Array(await file.arrayBuffer()));
  const check = isValidUploadedImage({
    size,
    claimedType: file.type,
    sniffed,
  });
  if (!check.ok) return { ok: false, error: check.error };
  const extension = sniffed!.ext;
  const path = `uploads/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await client.storage
    .from("catalog-candidates")
    .upload(path, bytes, { contentType: sniffed!.mime });
  if (error)
    return { ok: false, error: "No se pudo guardar la fotografía. Reintenta." };
  return { ok: true, path };
}

export async function saveProduct(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = parseProductForm(form);
  if (!parsed.ok) return { ...adminInitialState, ok: false, error: parsed.error };

  const editing = Boolean(parsed.data.id);
  const existing = editing
    ? await getProduct(session.client, parsed.data.id!)
    : null;
  if (editing && !existing)
    return {
      ...adminInitialState,
      ok: false,
      error: "El producto que intentas editar ya no existe.",
    };

  const file = form.get("imagen");
  const newFile = file instanceof File && file.size > 0 ? file : null;
  let candidatePath: string | null = null;
  if (newFile) {
    const upload = await uploadCandidateImage(session.client, newFile);
    if (!upload.ok)
      return { ...adminInitialState, ok: false, error: upload.error };
    candidatePath = upload.path;
  }

  const willPublish =
    parsed.data.published &&
    (parsed.data.source_review_status === "manual" ||
      parsed.data.source_review_status === "approved");
  let imageUrl: string | null = null;
  let photoPending: string | null = null;
  if (candidatePath) {
    if (willPublish) {
      const promotion = await promoteCandidateToPublic(
        session.client,
        candidatePath,
      );
      if (promotion.ok && promotion.publicUrl) imageUrl = promotion.publicUrl;
      else {
        imageUrl = internalImageUrl("catalog-candidates", candidatePath);
        photoPending =
          "La fotografía quedó en revisión; el producto no se mostrará hasta que la imagen esté aprobada.";
      }
    } else imageUrl = internalImageUrl("catalog-candidates", candidatePath);
  }
  const promotedImageIds = new Map<string, string>();
  if (willPublish && !candidatePath) {
    for (const image of existing?.images ?? []) {
      const match = image.url.match(/^\/images\/catalog-candidates\/(.+)$/);
      if (!match) continue;
      const promotion = await promoteCandidateToPublic(
        session.client,
        match[1],
      );
      if (!promotion.ok || !promotion.publicUrl) {
        photoPending =
          "La fotografía quedó en revisión; el producto no se mostrará hasta que la imagen esté aprobada.";
        break;
      }
      promotedImageIds.set(image.id, promotion.publicUrl);
    }
  }
  const published = willPublish ? !photoPending : parsed.data.published;

  const slugs = await takenSlugs(session.client);
  if (existing) slugs.delete(existing.slug);
  const slug = uniqueSlug(parsed.data.name, slugs);
  const productPayload = {
    name: parsed.data.name,
    slug,
    sku: parsed.data.sku,
    description: parsed.data.description,
    base_price: parsed.data.base_price,
    promo_price: parsed.data.promo_price,
    category_id: parsed.data.category_id,
    brand_id: parsed.data.brand_id,
    general_status: parsed.data.general_status,
    featured: parsed.data.featured,
    published,
    source_url: parsed.data.source_url,
    source_name: parsed.data.source_name,
    source_checked_at: parsed.data.source_checked_at,
    source_review_status: parsed.data.source_review_status,
  };

  let productId: string;
  if (editing) {
    const { data, error } = await session.client
      .from("products")
      .update(productPayload)
      .eq("id", parsed.data.id!)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error)
      return {
        ...adminInitialState,
        ok: false,
        error: friendlyConstraint(error.message),
      };
    productId = data!.id;
  } else {
    const { data, error } = await session.client
      .from("products")
      .insert(productPayload)
      .select("id")
      .single<{ id: string }>();
    if (error)
      return {
        ...adminInitialState,
        ok: false,
        error: friendlyConstraint(error.message),
      };
    productId = data.id;
    refreshCatalog([]);
  }

  await session.client
    .from("product_branches")
    .delete()
    .eq("product_id", productId);
  if (parsed.data.branches.length) {
    const { error: branchError } = await session.client
      .from("product_branches")
      .insert(
        parsed.data.branches.map((branch) => ({
          product_id: productId,
          branch_id: branch.branch_id,
          available: branch.available,
          status: branch.status,
          branch_price: branch.branch_price,
          branch_promo_price: branch.branch_promo_price,
        })),
      );
    if (branchError)
      return {
        ...adminInitialState,
        ok: false,
        error: "No se pudieron guardar las asignaciones de sucursal.",
      };
  }

  const removeImage = form.get("remove_image") !== null;
  if (candidatePath && imageUrl) {
    await removeStoredImages(
      session.client,
      existing?.images.map((image) => image.url) ?? [],
    );
    await session.client
      .from("product_images")
      .delete()
      .eq("product_id", productId);
    const { error: imageError } = await session.client.from("product_images").insert({
      product_id: productId,
      url: imageUrl,
      alt_text: parsed.data.name,
      position: 0,
      is_primary: true,
    });
    if (imageError)
      return {
        ...adminInitialState,
        ok: false,
        error: "El producto se guardó, pero la fotografía no se pudo registrar.",
      };
  } else if (removeImage && existing?.images.length) {
    await removeStoredImages(
      session.client,
      existing.images.map((image) => image.url),
    );
    await session.client
      .from("product_images")
      .delete()
      .eq("product_id", productId);
  } else {
    for (const [imageId, url] of promotedImageIds) {
      await session.client
        .from("product_images")
        .update({ url })
        .eq("id", imageId);
    }
  }

  refreshCatalog([`/producto/${slug}`]);
  refreshAdmin();
  if (!editing) redirect(`/admin/productos/${productId}`);
  return {
    ...adminInitialState,
    ok: true,
    message: photoPending ?? (parsed.data.published
      ? "Producto guardado y publicado."
      : "Producto guardado."),
  };
}

export async function setProductPublished(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = z
    .object({
      id: z.string().trim().uuid(),
      published: z.enum(["true", "false"]),
    })
    .safeParse({ id: form.get("id"), published: form.get("published") });
  if (!parsed.success) return { ...adminInitialState, ok: false, error: "Datos inválidos." };
  const product = await getProduct(session.client, parsed.data.id);
  if (!product)
    return { ...adminInitialState, ok: false, error: "El producto ya no existe." };
  const published = parsed.data.published === "true";
  if (
    published &&
    (product.base_price == null ||
      !["manual", "approved"].includes(product.source_review_status))
  )
    return {
      ...adminInitialState,
      ok: false,
      error:
        "Para publicar se necesita precio y un estado de revisión aprobado o manual.",
    };
  if (published) {
    for (const image of product.images) {
      const match = image.url.match(/^\/images\/catalog-candidates\/(.+)$/);
      if (!match) continue;
      const promotion = await promoteCandidateToPublic(
        session.client,
        match[1],
      );
      if (!promotion.ok || !promotion.publicUrl)
        return {
          ...adminInitialState,
          ok: false,
          error:
            "La fotografía no se pudo aprobar para publicar. Revisa el almacenamiento e inténtalo de nuevo.",
        };
      const { error: imageError } = await session.client
        .from("product_images")
        .update({ url: promotion.publicUrl })
        .eq("id", image.id);
      if (imageError)
        return {
          ...adminInitialState,
          ok: false,
          error:
            "La fotografía se copió, pero no se pudo actualizar el producto.",
        };
    }
  }
  const { error } = await session.client
    .from("products")
    .update({ published })
    .eq("id", parsed.data.id);
  if (error)
    return {
      ...adminInitialState,
      ok: false,
      error: "No se pudo cambiar la publicación.",
    };
  refreshCatalog([`/producto/${product.slug}`]);
  refreshAdmin();
  return {
    ...adminInitialState,
    ok: true,
    message: published ? "Producto publicado." : "Producto oculto.",
  };
}

export async function deleteProduct(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = z
    .object({ id: z.string().trim().uuid() })
    .safeParse({ id: form.get("id") });
  if (!parsed.success) return { ...adminInitialState, ok: false, error: "Datos inválidos." };
  const product = await getProduct(session.client, parsed.data.id);
  if (!product)
    return { ...adminInitialState, ok: false, error: "El producto ya no existe." };
  const { error } = await session.client
    .from("products")
    .delete()
    .eq("id", parsed.data.id);
  if (error)
    return { ...adminInitialState, ok: false, error: "No se pudo eliminar el producto." };
  await removeStoredImages(
    session.client,
    product.images.map((image) => image.url),
  );
  refreshCatalog([`/producto/${product.slug}`]);
  refreshAdmin();
  return { ...adminInitialState, ok: true, message: "Producto eliminado." };
}

async function upsertLabel(
  action: "categories" | "brands",
  session: Awaited<ReturnType<typeof requireAdmin>>,
  form: FormData,
): Promise<AdminState> {
  const parsed = parseCatalogLabelForm(form);
  if (!parsed.ok) return { ...adminInitialState, ok: false, error: parsed.error };
  const slug = slugify(parsed.data.name);
  const { data: existing } = await session.client
    .from(action)
    .select("id,slug")
    .eq("slug", slug)
    .neq("id", parsed.data.id ?? "00000000-0000-4000-8000-000000000000");
  if (existing?.length)
    return {
      ...adminInitialState,
      ok: false,
      error: "Ya existe un registro con ese nombre.",
    };
  if (parsed.data.id) {
    const { error } = await session.client
      .from(action)
      .update({ name: parsed.data.name, slug, active: parsed.data.active })
      .eq("id", parsed.data.id);
    if (error)
      return { ...adminInitialState, ok: false, error: "No se pudo guardar el registro." };
  } else {
    const { error } = await session.client
      .from(action)
      .insert({ name: parsed.data.name, slug, active: parsed.data.active });
    if (error)
      return { ...adminInitialState, ok: false, error: "No se pudo crear el registro." };
  }
  refreshCatalog([]);
  refreshAdmin();
  return { ...adminInitialState, ok: true, message: "Registro guardado." };
}

export async function saveCategory(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  return upsertLabel("categories", session, form);
}

export async function saveBrand(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  return upsertLabel("brands", session, form);
}

async function deleteLabel(
  action: "categories" | "brands",
  session: Awaited<ReturnType<typeof requireAdmin>>,
  form: FormData,
): Promise<AdminState> {
  const parsed = z
    .object({ id: z.string().trim().uuid() })
    .safeParse({ id: form.get("id") });
  if (!parsed.success) return { ...adminInitialState, ok: false, error: "Datos inválidos." };
  const column = action === "categories" ? "category_id" : "brand_id";
  const { count } = await session.client
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq(column, parsed.data.id);
  if (count)
    return {
      ...adminInitialState,
      ok: false,
      error: "Este registro está en uso por productos y no se puede eliminar.",
    };
  const { error } = await session.client
    .from(action)
    .delete()
    .eq("id", parsed.data.id);
  if (error)
    return { ...adminInitialState, ok: false, error: "No se pudo eliminar el registro." };
  refreshCatalog([]);
  refreshAdmin();
  return { ...adminInitialState, ok: true, message: "Registro eliminado." };
}

export async function deleteCategory(_state: AdminState, form: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  return deleteLabel("categories", session, form);
}

export async function deleteBrand(_state: AdminState, form: FormData): Promise<AdminState> {
  const session = await requireAdmin();
  return deleteLabel("brands", session, form);
}

export async function saveBranch(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = parseBranchForm(form);
  if (!parsed.ok) return { ...adminInitialState, ok: false, error: parsed.error };
  const slug = slugify(parsed.data.name);
  const { data: existing } = await session.client
    .from("branches")
    .select("id")
    .eq("slug", slug)
    .neq("id", parsed.data.id ?? "00000000-0000-4000-8000-000000000000");
  if (existing?.length)
    return {
      ...adminInitialState,
      ok: false,
      error: "Ya existe una sucursal con ese nombre.",
    };
  const payload = { ...parsed.data, slug };
  if (parsed.data.id) {
    const { error } = await session.client
      .from("branches")
      .update(payload)
      .eq("id", parsed.data.id);
    if (error)
      return { ...adminInitialState, ok: false, error: "No se pudo guardar la sucursal." };
  } else {
    const { error } = await session.client
      .from("branches")
      .insert(payload);
    if (error)
      return { ...adminInitialState, ok: false, error: "No se pudo crear la sucursal." };
  }
  refreshCatalog(["/sucursales"]);
  refreshAdmin();
  return { ...adminInitialState, ok: true, message: "Sucursal guardada." };
}

export async function deleteBranch(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = z
    .object({ id: z.string().trim().uuid() })
    .safeParse({ id: form.get("id") });
  if (!parsed.success) return { ...adminInitialState, ok: false, error: "Datos inválidos." };
  if (parsed.data.id === "00000000-0000-4000-8000-000000000001" ||
      parsed.data.id === "00000000-0000-4000-8000-000000000002" ||
      parsed.data.id === "00000000-0000-4000-8000-000000000003")
    return {
      ...adminInitialState,
      ok: false,
      error: "Las sucursales iniciales no se pueden eliminar; puedes ocultarlas.",
    };
  const { count } = await session.client
    .from("product_branches")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", parsed.data.id);
  if (count)
    return {
      ...adminInitialState,
      ok: false,
      error: "Esta sucursal tiene productos asignados y no se puede eliminar.",
    };
  const { error } = await session.client
    .from("branches")
    .delete()
    .eq("id", parsed.data.id);
  if (error)
    return { ...adminInitialState, ok: false, error: "No se pudo eliminar la sucursal." };
  refreshCatalog(["/sucursales"]);
  refreshAdmin();
  return { ...adminInitialState, ok: true, message: "Sucursal eliminada." };
}

export async function reviewSource(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = z
    .object({
      id: z.string().trim().uuid(),
      decision: z.enum(["approved", "rejected"]),
    })
    .safeParse({ id: form.get("id"), decision: form.get("decision") });
  if (!parsed.success) return { ...adminInitialState, ok: false, error: "Datos inválidos." };
  const product = await getProduct(session.client, parsed.data.id);
  if (!product)
    return { ...adminInitialState, ok: false, error: "El producto ya no existe." };
  if (parsed.data.decision === "approved" && !product.source_url)
    return {
      ...adminInitialState,
      ok: false,
      error: "El producto no tiene una fuente registrada para aprobar.",
    };
  const { error } = await session.client
    .from("products")
    .update({
      source_review_status: parsed.data.decision,
      source_reviewed_by: session.userId,
      source_reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  if (error)
    return {
      ...adminInitialState,
      ok: false,
      error: "No se pudo registrar la revisión.",
    };
  refreshCatalog([`/producto/${product.slug}`]);
  refreshAdmin();
  revalidatePath("/admin/revision");
  return {
    ...adminInitialState,
    ok: true,
    message:
      parsed.data.decision === "approved"
        ? "Producto aprobado. Completa precio, imagen y publicación para mostrarlo."
        : "Producto rechazado.",
  };
}

export async function moderateReview(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = z.object({
    id: z.string().trim().uuid(),
    decision: z.enum(["approved", "hidden", "rejected"]),
    reason: z.string().trim().max(500).optional(),
  }).safeParse({
    id: form.get("id"), decision: form.get("decision"), reason: form.get("reason") ?? "",
  });
  if (!parsed.success) return { ...adminInitialState, ok: false, error: "Datos inválidos." };
  if (parsed.data.decision !== "approved" && !parsed.data.reason)
    return { ...adminInitialState, ok: false, error: "Escribe el motivo de moderación." };
  const { error } = await session.client.from("reviews").update({
    status: parsed.data.decision,
    moderation_reason: parsed.data.reason || null,
    moderated_by: session.userId,
    moderated_at: new Date().toISOString(),
  }).eq("id", parsed.data.id);
  if (error) return { ...adminInitialState, ok: false, error: "No se pudo moderar la reseña." };
  revalidatePath("/admin/resenas");
  revalidatePath("/resenas");
  return { ...adminInitialState, ok: true, message: parsed.data.decision === "approved" ? "Reseña aprobada." : "Reseña ocultada." };
}

export async function respondReview(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = z.object({ id: z.string().trim().uuid(), response: z.string().trim().min(1).max(1200) }).safeParse({ id: form.get("id"), response: form.get("response") });
  if (!parsed.success) return { ...adminInitialState, ok: false, error: "Escribe una respuesta válida." };
  const { error } = await session.client.from("reviews").update({
    admin_response: parsed.data.response,
    responded_by: session.userId,
    responded_at: new Date().toISOString(),
  }).eq("id", parsed.data.id);
  if (error) return { ...adminInitialState, ok: false, error: "No se pudo guardar la respuesta." };
  revalidatePath("/admin/resenas");
  revalidatePath("/resenas");
  return { ...adminInitialState, ok: true, message: "Respuesta guardada." };
}

export async function deleteReview(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  const session = await requireAdmin();
  const parsed = z.object({ id: z.string().trim().uuid() }).safeParse({ id: form.get("id") });
  if (!parsed.success) return { ...adminInitialState, ok: false, error: "Datos inválidos." };
  const { error } = await session.client.from("reviews").delete().eq("id", parsed.data.id);
  if (error) return { ...adminInitialState, ok: false, error: "No se pudo eliminar la reseña." };
  revalidatePath("/admin/resenas");
  revalidatePath("/resenas");
  return { ...adminInitialState, ok: true, message: "Reseña eliminada." };
}

function friendlyConstraint(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("duplicate key") || lower.includes("unique"))
    return "Ya existe un producto con ese código o nombre.";
  if (lower.includes("check constraint"))
    return "Revisa precios, estado o revisión del producto antes de guardar.";
  if (lower.includes("row-level security") || message.includes("permission"))
    return "No tienes permisos para esta operación.";
  return "No se pudo guardar el producto.";
}
