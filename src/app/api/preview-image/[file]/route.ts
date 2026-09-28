import { readFile } from "node:fs/promises";
import path from "node:path";
import { previewProducts } from "@/lib/preview";
import { demoEnabled, demoProducts } from "@/lib/demo";
import { hasSupabase } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.CATALOG_PREVIEW === "false" ||
    (hasSupabase() && !demoEnabled())
  )
    return new Response(null, { status: 404 });
  const { file } = await params;
  const allowlist = new Set([
    ...previewProducts.map((product) => product.image),
    ...demoProducts.map((product) => product.image),
  ]);
  if (!allowlist.has(`/api/preview-image/${file}`))
    return new Response(null, { status: 404 });
  const image = await readFile(
    path.join(process.cwd(), "img", "productos", file),
  );
  return new Response(image, {
    headers: {
      "Content-Type": file.endsWith(".webp") ? "image/webp" : "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}
