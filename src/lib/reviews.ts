import "server-only";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { hasSupabase } from "./supabase/server";

export const reviewInputSchema = z.object({
  branch_id: z.string().trim().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1200),
  website: z.string().max(0).default(""),
  started_at: z.coerce.number().int().positive(),
});

export type PublicReview = {
  id: string;
  branch_id: string;
  branch_name: string;
  branch_slug: string;
  rating: number;
  comment: string;
  admin_response: string | null;
  created_at: string;
  responded_at: string | null;
};

export type PublicReviewsResult = {
  reviews: PublicReview[];
  unavailable: boolean;
};

export async function listPublicReviews(): Promise<PublicReviewsResult> {
  if (!hasSupabase()) return { reviews: [], unavailable: true };
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client
    .from("public_reviews")
    .select("id,branch_id,branch_name,branch_slug,rating,comment,admin_response,created_at,responded_at")
    .order("created_at", { ascending: false })
    .limit(200);
  // La vista se crea con la migración de reseñas. Mientras esa migración no
  // se haya aplicado (o PostgREST aún no haya recargado su esquema), la página
  // pública debe seguir funcionando y mostrar un aviso, no el error global.
  if (error) {
    console.error("No se pudieron cargar las reseñas públicas:", error.message);
    return { reviews: [], unavailable: true };
  }
  return { reviews: (data ?? []) as PublicReview[], unavailable: false };
}

export function normalizeReviewComment(comment: string) {
  return comment.trim().toLocaleLowerCase("es-HN").replace(/\s+/g, " ");
}

export function reviewDedupeKey(branchId: string, comment: string) {
  return `${branchId}:${normalizeReviewComment(comment)}`;
}

export function reviewAverage(reviews: PublicReview[]) {
  if (!reviews.length) return null;
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}
