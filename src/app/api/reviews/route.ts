import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdmin, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { reviewDedupeKey, reviewInputSchema } from "@/lib/reviews";

const COOKIE_NAME = "rancing_review_visitor";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  if (!hasSupabaseServiceRole())
    return NextResponse.json(
      { error: "Las reseñas aún no están habilitadas." },
      { status: 503 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const parsed = reviewInputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Revisa la sucursal, la puntuación y el comentario." },
      { status: 400 },
    );
  const elapsed = Date.now() - parsed.data.started_at;
  if (elapsed < 800 || elapsed > 15 * 60 * 1000)
    return NextResponse.json(
      { error: "El formulario expiró. Vuelve a intentarlo." },
      { status: 400 },
    );

  const token = request.headers.get("cookie")?.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  )?.[1] ?? randomUUID();
  const visitorTokenHash = hash(token);
  const client = createSupabaseAdmin();
  const { data: branch, error: branchError } = await client
    .from("branches")
    .select("id")
    .eq("id", parsed.data.branch_id)
    .eq("active", true)
    .maybeSingle();
  if (branchError || !branch)
    return NextResponse.json({ error: "Selecciona una sucursal válida." }, { status: 400 });

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await client
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("visitor_token_hash", visitorTokenHash)
    .gte("created_at", since);
  if (countError)
    if (countError.code === "PGRST205" || countError.code === "42P01")
      return NextResponse.json(
        { error: "Las reseñas aún no están habilitadas." },
        { status: 503 },
      );
  if (countError)
    return NextResponse.json({ error: "No se pudo recibir la reseña." }, { status: 500 });
  if ((count ?? 0) >= 3)
    return NextResponse.json(
      { error: "Has enviado varias reseñas recientemente. Inténtalo más tarde." },
      { status: 429 },
    );

  const { error } = await client.from("reviews").insert({
    branch_id: parsed.data.branch_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    dedupe_key: reviewDedupeKey(parsed.data.branch_id, parsed.data.comment),
    visitor_token_hash: visitorTokenHash,
  });
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01")
      return NextResponse.json(
        { error: "Las reseñas aún no están habilitadas." },
        { status: 503 },
      );
    if (error.code === "23505")
      return NextResponse.json(
        { error: "Ya recibimos una reseña igual para esta sucursal." },
        { status: 409 },
      );
    return NextResponse.json({ error: "No se pudo enviar la reseña." }, { status: 500 });
  }
  const response = NextResponse.json({
    message: "Gracias. Tu reseña quedó pendiente de aprobación.",
  });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
