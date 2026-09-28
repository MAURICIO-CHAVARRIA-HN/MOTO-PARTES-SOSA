import { NextResponse } from "next/server";
import { createSupabaseAdmin, hasSupabaseServiceRole } from "@/lib/supabase/admin";

function localDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tegucigalpa",
  }).format(new Date());
}

export async function POST(request: Request) {
  if (!hasSupabaseServiceRole()) return new NextResponse(null, { status: 204 });
  let body: { path?: unknown } = {};
  try {
    body = (await request.json()) as { path?: unknown };
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const path = typeof body.path === "string" ? body.path.trim() : "";
  if (!/^\/[^?]{0,300}$/.test(path) || path.startsWith("/admin") || path.startsWith("/api"))
    return new NextResponse(null, { status: 204 });
  const { error } = await createSupabaseAdmin().rpc("increment_page_view", {
    p_day: localDate(),
    p_path: path,
  });
  return new NextResponse(null, { status: error ? 204 : 202 });
}
