"use client";
import { useActionState } from "react";
import { Check, EyeOff, Trash2, MessageCircle } from "lucide-react";
import { deleteReview, moderateReview, respondReview } from "@/app/admin/actions";
import { adminInitialState } from "@/lib/admin-validation";
import { AdminStatus } from "./admin-ui";
import type { AdminReviewRow } from "@/lib/admin";

export function ReviewModeration({ review }: { review: AdminReviewRow }) {
  const [moderationState, moderationAction, moderationPending] = useActionState(moderateReview, adminInitialState);
  const [responseState, responseAction, responsePending] = useActionState(respondReview, adminInitialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteReview, adminInitialState);
  return (
    <div className="review-admin-actions">
      <form action={moderationAction} className="admin-review-decision">
        <input type="hidden" name="id" value={review.id} />
        <input name="reason" placeholder="Motivo si ocultas o rechazas" maxLength={500} aria-label={`Motivo para ${review.comment.slice(0, 20)}`} />
        <div className="admin-row-actions">
          <button className="button primary small-button" name="decision" value="approved" disabled={moderationPending}><Check size={15} /> Aprobar</button>
          <button className="button secondary small-button" name="decision" value="hidden" disabled={moderationPending}><EyeOff size={15} /> Ocultar</button>
          <button className="text-button danger" name="decision" value="rejected" disabled={moderationPending}>Rechazar</button>
        </div>
        <AdminStatus state={moderationState} />
      </form>
      <form action={responseAction} className="admin-review-response">
        <input type="hidden" name="id" value={review.id} />
        <textarea name="response" rows={2} maxLength={1200} defaultValue={review.admin_response ?? ""} placeholder="Respuesta pública (opcional)" aria-label="Respuesta pública" />
        <button className="button secondary small-button" disabled={responsePending}><MessageCircle size={15} /> {responsePending ? "Guardando…" : "Guardar respuesta"}</button>
        <AdminStatus state={responseState} />
      </form>
      <form action={deleteAction} onSubmit={(event) => { if (!window.confirm("¿Eliminar definitivamente esta reseña?")) event.preventDefault(); }}>
        <input type="hidden" name="id" value={review.id} />
        <button className="text-button danger" disabled={deletePending}><Trash2 size={15} /> Eliminar</button>
        <AdminStatus state={deleteState} />
      </form>
    </div>
  );
}
