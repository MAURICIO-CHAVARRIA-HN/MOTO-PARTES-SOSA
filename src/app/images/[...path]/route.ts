import { requireAdmin } from "@/lib/admin";
import { sniffImage } from "@/lib/admin-validation";

export const dynamic = "force-dynamic";

// Serves private candidate images referenced as /images/<bucket>/<path>.
// Access is always gated by an active admin session; drafts never reach anon.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await requireAdmin();
  const { path } = await params;
  const bucket = path[0];
  const objectPath = path.slice(1).join("/");
  if (
    (bucket !== "catalog-candidates" && bucket !== "catalog-public") ||
    !objectPath ||
    !/^[a-zA-Z0-9._/-]+$/.test(objectPath)
  )
    return new Response(null, { status: 404 });
  const { data, error } = await session.client.storage
    .from(bucket)
    .download(objectPath);
  if (error || !data) return new Response(null, { status: 404 });
  const bytes = new Uint8Array(await data.arrayBuffer());
  const mime =
    sniffImage(bytes)?.mime ??
    (objectPath.endsWith(".png")
      ? "image/png"
      : objectPath.endsWith(".avif")
        ? "image/avif"
        : objectPath.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg");
  return new Response(bytes, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}