import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { listPublicReviews } from "@/lib/reviews";
import { ReviewsPage } from "@/components/reviews-page";

export const metadata: Metadata = {
  title: "Reseñas",
  description: "Experiencias de clientes de Rancing Mau por sucursal.",
};

export default async function ReviewsRoute() {
  const [{ branches }, reviewResult] = await Promise.all([getCatalog(), listPublicReviews()]);
  return <ReviewsPage branches={branches} reviews={reviewResult.reviews} reviewsUnavailable={reviewResult.unavailable} />;
}
