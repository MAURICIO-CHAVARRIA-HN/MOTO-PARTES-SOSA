import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  ALLOWED_IMAGE_MIME,
  MAX_UPLOAD_BYTES,
  sniffImage,
} from "@/lib/admin-validation";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Upload a photograph to the private candidates bucket.
export async function POST(request: Request) {
  const session = await requireAdmin();
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data"))
    return jsonError("Formato inválido.", 415);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES + 1024 * 64)
    return jsonError("La fotografía supera el límite de 5 MB.", 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("No se pudo leer la fotografía.", 400);
  }
  const file = form.get("imagen");
  if (!(file instanceof File))
    return jsonError("Selecciona una fotografía.", 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImage(bytes);
  if (file.size === 0) return jsonError("Selecciona una fotografía.", 400);
  if (file.size > MAX_UPLOAD_BYTES)
    return jsonError("La fotografía supera el límite de 5 MB.", 413);
  if (!sniffed || !ALLOWED_IMAGE_MIME.includes(sniffed.mime as (typeof ALLOWED_IMAGE_MIME)[number]))
    return jsonError(
      "El archivo no es una imagen válida (JPG, PNG, WebP o AVIF).",
      415,
    );
  const path = `uploads/${crypto.randomUUID()}.${sniffed.ext}`;
  const { error } = await session.client.storage
    .from("catalog-candidates")
    .upload(path, bytes, { contentType: sniffed.mime });
  if (error) return jsonError("No se pudo guardar la fotografía.", 500);
  return NextResponse.json({ path, fileName: path.split("/").pop() });
}

// Preview a private candidate for the admin panel only.
export async function GET(request: Request) {
  const session = await requireAdmin();
  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "";
  if (!/^uploads\/[a-f0-9-]+\.(jpg|png|webp|avif)$/.test(path))
    return jsonError("Imagen no encontrada.", 404);
  const { data, error } = await session.client.storage
    .from("catalog-candidates")
    .download(path);
  if (error || !data) return jsonError("Imagen no encontrada.", 404);
  const bytes = new Uint8Array(await data.arrayBuffer());
  const mime =
    (sniffImage(bytes)?.mime ?? null) ||
    (path.endsWith(".png") ? "image/png" : "image/jpeg");
  return new Response(bytes, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}