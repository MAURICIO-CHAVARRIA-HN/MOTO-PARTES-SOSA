import type { Metadata } from "next";
import { listReviews, requireAdmin } from "@/lib/admin";
import { ReviewModeration } from "@/components/admin/review-moderation";

export const metadata: Metadata = { title: "Reseñas", robots: { index: false, follow: false } };

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireAdmin();
  const params = await searchParams;
  let reviews: Awaited<ReturnType<typeof listReviews>> = [];
  let reviewsUnavailable = false;
  try {
    reviews = await listReviews(session.client, params.status);
  } catch (error) {
    console.error("No se pudo cargar la cola de reseñas:", error);
    reviewsUnavailable = true;
  }
  return (
    <div className="admin-panel">
      <div className="section-heading"><div><span className="eyebrow">COMUNIDAD</span><h1>Reseñas</h1></div></div>
      {reviewsUnavailable && <p className="notice" role="status">La cola de reseñas aún no está habilitada. Aplica la migración de reseñas en Supabase para comenzar.</p>}
      <p className="admin-count-line">{reviews.length} reseña{reviews.length === 1 ? "" : "s"} en esta vista. Las reseñas negativas se conservan: solo se modera contenido que incumple las reglas.</p>
      <form className="admin-filter-form" method="get">
        <label htmlFor="review-status">Estado</label>
        <select id="review-status" name="status" defaultValue={params.status ?? ""}>
          <option value="">Todas</option><option value="pending">Pendientes</option><option value="approved">Aprobadas</option><option value="hidden">Ocultas</option><option value="rejected">Rechazadas</option>
        </select>
        <button className="button secondary small-button">Filtrar</button>
      </form>
      <div className="admin-review-list">
        {reviews.map((review) => (
          <article className="admin-review-card" key={review.id}>
            <div className="admin-review-card-head"><div><strong>{review.branch_name}</strong><span className="admin-hint"> · {new Date(review.created_at).toLocaleString("es-HN")}</span></div><span className={`admin-badge ${review.status === "approved" ? "on" : "off"}`}>{review.status}</span></div>
            <div className="review-stars" aria-label={`${review.rating} de 5 estrellas`}>{Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">{index < review.rating ? "★" : "☆"}</span>)}</div>
            <p>{review.comment}</p>
            {review.moderation_reason && <p className="admin-hint">Motivo: {review.moderation_reason}</p>}
            <ReviewModeration review={review} />
          </article>
        ))}
        {!reviews.length && <div className="empty-state compact-empty"><h2>No hay reseñas en esta vista</h2><p>Las nuevas reseñas aparecerán como pendientes.</p></div>}
      </div>
    </div>
  );
}
