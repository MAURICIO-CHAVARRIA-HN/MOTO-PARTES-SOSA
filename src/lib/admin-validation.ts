import { z } from "zod";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AdminState = { ok: boolean; message?: string; error?: string };
export const adminInitialState: AdminState = { ok: true };

export function slugify(text: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
  return base || "registro";
}

export type SniffedImage = {
  ext: "jpg" | "png" | "webp" | "avif";
  mime: string;
};

// Validates the real file signature, never the client-claimed MIME type.
export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  const eq = (offset: number, sequence: number[]) =>
    offset + sequence.length <= bytes.length &&
    sequence.every((byte, index) => bytes[offset + index] === byte);
  if (eq(0, [0xff, 0xd8, 0xff])) return { ext: "jpg", mime: "image/jpeg" };
  if (eq(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { ext: "png", mime: "image/png" };
  if (eq(0, [0x52, 0x49, 0x46, 0x46]) && eq(8, [0x57, 0x45, 0x42, 0x50]))
    return { ext: "webp", mime: "image/webp" };
  const ftyp = eq(4, [0x66, 0x74, 0x79, 0x70]);
  if (ftyp && (eq(8, [0x61, 0x76, 0x69, 0x66]) || eq(8, [0x61, 0x76, 0x69, 0x73])))
    return { ext: "avif", mime: "image/avif" };
  return null;
}

export function isValidUploadedImage(input: {
  size: number;
  claimedType: string;
  sniffed: SniffedImage | null;
}): { ok: true } | { ok: false; error: string } {
  if (input.size === 0) return { ok: false, error: "Selecciona una fotografía." };
  if (input.size > MAX_UPLOAD_BYTES)
    return {
      ok: false,
      error: "La fotografía supera el límite de 5 MB.",
    };
  if (!input.sniffed)
    return {
      ok: false,
      error: "El archivo no es una imagen válida (JPG, PNG, WebP o AVIF).",
    };
  return { ok: true };
}

const price = z
  .union([
    z.literal(null),
    z.coerce.number().finite().min(0).max(100000000),
  ])
  .transform((value) => (value == null ? null : Math.round(value * 100) / 100));

const idField = z.string().trim().uuid("Selecciona una opción válida.");

export const productFormSchema = z
  .object({
    id: idField.optional(),
    name: z.string().trim().min(1, "Escribe el nombre del producto.").max(160),
    sku: z.string().trim().min(1, "Escribe el código o SKU.").max(60),
    description: z.string().trim().max(5000).default(""),
    base_price: price,
    promo_price: price,
    category_id: idField,
    brand_id: idField,
    general_status: z.enum(["available", "out_of_stock", "promotion"]),
    featured: z.boolean(),
    published: z.boolean(),
    source_url: z
      .string()
      .trim()
      .refine((value) => value === "" || /^https:\/\//.test(value), {
        message: "El enlace de la fuente debe comenzar con https://",
      })
      .transform((value) => (value === "" ? null : value))
      .pipe(z.union([z.literal(null), z.string().url()])),
    source_name: z
      .string()
      .trim()
      .max(200)
      .transform((value) => (value === "" ? null : value)),
    source_checked_at: z
      .string()
      .trim()
      .transform((value) => (value === "" ? null : value)),
    source_review_status: z.enum([
      "manual",
      "pending",
      "approved",
      "rejected",
    ]),
    branches: z
      .array(
        z.object({
          branch_id: idField,
          available: z.boolean(),
          status: z.enum(["available", "out_of_stock", "promotion"]),
          branch_price: price,
          branch_promo_price: price,
        }),
      )
      .max(30),
  })
  .superRefine((data, ctx) => {
    if (
      data.promo_price != null &&
      (data.base_price == null || data.promo_price >= data.base_price)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["promo_price"],
        message: "El precio promocional debe ser menor que el precio normal.",
      });
    }
    if (data.general_status === "promotion" && data.promo_price == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["general_status"],
        message: "Un producto en promoción requiere precio promocional.",
      });
    }
    if (
      data.published &&
      (data.base_price == null ||
        data.source_review_status === "pending" ||
        data.source_review_status === "rejected")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["published"],
        message:
          "Para publicar se necesita precio y un estado de revisión aprobado o manual.",
      });
    }
    if (data.source_url && !data.source_checked_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["source_url"],
        message: "Registra la fecha de consulta de la fuente.",
      });
    }
    if (data.source_url && data.source_review_status === "manual") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["source_review_status"],
        message:
          "No puedes usar el estado 'manual' con una fuente externa; selecciona pendiente/aprobado/rechazado.",
      });
    }
  });

export type ProductForm = z.infer<typeof productFormSchema>;

export type ParsedProduct =
  | { ok: true; data: ProductForm }
  | { ok: false; error: string };

function formText(form: FormData, name: string): string {
  const entry = form.get(name);
  return typeof entry === "string" ? entry.trim() : "";
}

function formChecked(form: FormData, name: string): boolean {
  const entry = form.get(name);
  return typeof entry === "string" && entry !== "";
}

function formPrice(form: FormData, name: string): number | null {
  const raw = formText(form, name);
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.round(parsed * 100) / 100
    : NaN;
}

// Normalizes what the UI submits so the database invariants always hold:
// an unavailable branch maps to out_of_stock and unavailable by definition.
export function parseProductForm(form: FormData): ParsedProduct {
  const branchIds = new Set<string>();
  for (const key of Array.from(form.keys())) {
    const match = key.match(/^branch_([a-f0-9-]+)_available$/);
    if (match) branchIds.add(match[1]);
    else {
      const statusMatch = key.match(/^branch_([a-f0-9-]+)_status$/);
      if (statusMatch) branchIds.add(statusMatch[1]);
    }
  }
  const branches = Array.from(branchIds).map((branch_id) => {
    const available = formChecked(form, `branch_${branch_id}_available`);
    const statusRaw = formText(form, `branch_${branch_id}_status`) || "out_of_stock";
    const status = available
      ? statusRaw === "promotion"
        ? "promotion"
        : "available"
      : "out_of_stock";
    return {
      branch_id,
      available,
      status,
      branch_price: formPrice(form, `branch_${branch_id}_branch_price`),
      branch_promo_price: formPrice(form, `branch_${branch_id}_branch_promo_price`),
    };
  });

  const general_status =
    formText(form, "general_status") === "promotion"
      ? ("promotion" as const)
      : formText(form, "general_status") === "out_of_stock"
        ? ("out_of_stock" as const)
        : ("available" as const);

  const candidate = productFormSchema.safeParse({
    id: formText(form, "id") || undefined,
    name: formText(form, "name"),
    sku: formText(form, "sku"),
    description: formText(form, "description"),
    base_price: formPrice(form, "base_price"),
    promo_price: formPrice(form, "promo_price"),
    category_id: formText(form, "category_id"),
    brand_id: formText(form, "brand_id"),
    general_status,
    featured: formChecked(form, "featured"),
    published: formChecked(form, "published"),
    source_url: formText(form, "source_url"),
    source_name: formText(form, "source_name"),
    source_checked_at: formText(form, "source_checked_at"),
    source_review_status:
      formText(form, "source_review_status") === "pending"
        ? ("pending" as const)
        : formText(form, "source_review_status") === "approved"
          ? ("approved" as const)
          : formText(form, "source_review_status") === "rejected"
            ? ("rejected" as const)
            : ("manual" as const),
    branches,
  });
  if (!candidate.success)
    return {
      ok: false,
      error:
        candidate.error.issues[0]?.message ?? "Revisa los datos del formulario.",
    };
  for (const item of candidate.data.branches) {
    if (
      item.branch_promo_price != null &&
      (item.branch_price == null || item.branch_promo_price >= item.branch_price)
    )
      return {
        ok: false,
        error:
          "El precio promocional de una sucursal debe ser menor que su precio.",
      };
  }
  return { ok: true, data: candidate.data };
}

export const branchFormSchema = z.object({
  id: idField.optional(),
  name: z.string().trim().min(1, "Escribe el nombre de la sucursal.").max(120),
  city: z.string().trim().min(1, "Indica la ciudad.").max(120),
  address: z.string().trim().max(300).transform((value) => value || null),
  reference: z.string().trim().max(300).transform((value) => value || null),
  schedule: z.string().trim().max(300).transform((value) => value || null),
  whatsapp_number: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[0-9]{8,15}$/.test(value), {
      message: "El número de WhatsApp debe tener entre 8 y 15 dígitos.",
    })
    .transform((value) => value || null),
  phone: z.string().trim().max(40).transform((value) => value || null),
  google_maps_url: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https:\/\//.test(value), {
      message: "El enlace de Google Maps debe comenzar con https://",
    })
    .transform((value) => value || null),
  map_embed_url: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https:\/\//.test(value), {
      message: "El enlace del mapa debe comenzar con https://",
    })
    .transform((value) => value || null),
  active: z.boolean(),
});

export type BranchForm = z.infer<typeof branchFormSchema>;

export function parseBranchForm(form: FormData): {
  ok: true;
  data: BranchForm;
} | { ok: false; error: string } {
  const parsed = branchFormSchema.safeParse({
    id: formText(form, "id") || undefined,
    name: formText(form, "name"),
    city: formText(form, "city"),
    address: formText(form, "address"),
    reference: formText(form, "reference"),
    schedule: formText(form, "schedule"),
    whatsapp_number: formText(form, "whatsapp_number"),
    phone: formText(form, "phone"),
    google_maps_url: formText(form, "google_maps_url"),
    map_embed_url: formText(form, "map_embed_url"),
    active: formChecked(form, "active"),
  });
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisa los datos.",
    };
  return { ok: true, data: parsed.data };
}

export const catalogLabelFormSchema = z.object({
  id: idField.optional(),
  name: z.string().trim().min(1, "Escribe el nombre.").max(100),
  active: z.boolean(),
});

export type CatalogLabelForm = z.infer<typeof catalogLabelFormSchema>;

export function parseCatalogLabelForm(form: FormData): {
  ok: true;
  data: CatalogLabelForm;
} | { ok: false; error: string } {
  const parsed = catalogLabelFormSchema.safeParse({
    id: formText(form, "id") || undefined,
    name: formText(form, "name"),
    active: formChecked(form, "active"),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  return { ok: true, data: parsed.data };
}