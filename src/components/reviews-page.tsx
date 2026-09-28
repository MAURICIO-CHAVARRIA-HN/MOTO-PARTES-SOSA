"use client";
import { useMemo, useState, type FormEvent } from "react";
import { Check, Loader2, Send, Star } from "lucide-react";
import type { Branch } from "@/lib/types";
import type { PublicReview } from "@/lib/reviews";
import styles from "./reviews-page.module.css";

function dateLabel(value: string) {
  // Honduras stays on UTC-6 year-round. Formatting from explicit UTC parts
  // keeps the server output identical to the hydrated browser output.
  const local = new Date(new Date(value).getTime() - 6 * 60 * 60 * 1000);
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sept",
    "oct",
    "nov",
    "dic",
  ];
  return `${local.getUTCDate()} ${months[local.getUTCMonth()]} ${local.getUTCFullYear()}`;
}

function Stars({ value, label }: { value: number; label?: string }) {
  return (
    <span className="review-stars" aria-label={label ?? `${value} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={17} fill={index < value ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

function ReviewForm({ branches }: { branches: Branch[] }) {
  const [branchId, setBranchId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [state, setState] = useState<{ ok: boolean; text: string }>({ ok: false, text: "" });
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchId || !rating || comment.trim().length < 10 || pending) return;
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setState({ ok: false, text: "" });
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ branch_id: branchId, rating, comment, website: String(formData.get("website") ?? ""), started_at: startedAt }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo enviar la reseña.");
      setState({ ok: true, text: payload.message ?? "Gracias por tu reseña." });
      setComment("");
      setRating(0);
    } catch (error) {
      setState({ ok: false, text: error instanceof Error ? error.message : "No se pudo enviar la reseña." });
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="review-form" onSubmit={submit}>
      <div className="review-form-heading">
        <div>
          <span className="eyebrow">TU EXPERIENCIA</span>
          <h2>Cuéntanos cómo te atendimos</h2>
        </div>
        <Check size={24} aria-hidden="true" />
      </div>
      <label htmlFor="review-branch">Sucursal que visitaste</label>
      <select id="review-branch" value={branchId} onChange={(event) => setBranchId(event.target.value)} required>
        <option value="">Selecciona una sucursal</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>{branch.name}</option>
        ))}
      </select>
      <fieldset>
        <legend>Calificación</legend>
        <div className="review-rating-input">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                className={value <= rating ? "selected" : ""}
                aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                aria-pressed={value === rating}
                onClick={() => setRating(value)}
              >
                <Star size={28} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            );
          })}
        </div>
      </fieldset>
      <label htmlFor="review-comment">Comentario</label>
      <input className="review-trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <textarea
        id="review-comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        minLength={10}
        maxLength={1200}
        rows={5}
        required
        placeholder="¿Qué te pareció la atención?"
      />
      <p className="review-form-hint">No incluyas teléfonos, correos ni otros datos personales. Tu reseña será revisada antes de publicarse.</p>
      <button className="button primary" type="submit" disabled={pending || !startedAt}>
        {pending ? <><Loader2 size={17} className="spin" /> Enviando…</> : <><Send size={17} /> Enviar reseña</>}
      </button>
      {state.text && <p className={state.ok ? "form-success" : "form-error"} role="status">{state.text}</p>}
    </form>
  );
}

export function ReviewsPage({ branches, reviews, reviewsUnavailable = false }: { branches: Branch[]; reviews: PublicReview[]; reviewsUnavailable?: boolean }) {
  const [filter, setFilter] = useState("");
  const visible = useMemo(
    () => reviews.filter((review) => !filter || review.branch_id === filter),
    [filter, reviews],
  );
  const averages = useMemo(() => branches.map((branch) => {
    const items = reviews.filter((review) => review.branch_id === branch.id);
    return { branch, count: items.length, average: items.length ? items.reduce((sum, item) => sum + item.rating, 0) / items.length : null };
  }), [branches, reviews]);
  return (
    <div className={`container page-section reviews-page ${styles.page}`}>
      <div className="page-heading">
        <span className="eyebrow">VOCES DE LA RUTA</span>
        <h1>Reseñas de nuestros clientes<span className="red-dot">.</span></h1>
        <p>Cada visita cuenta. Lee las opiniones por sucursal y comparte tu experiencia.</p>
      </div>
      {reviewsUnavailable && <p className={`review-availability ${styles.availability}`} role="status">Las reseñas aún no están habilitadas. El equipo está terminando la configuración.</p>}
      <div className="review-branch-summary">
        {averages.map(({ branch, average, count }) => (
          <button key={branch.id} className={filter === branch.id ? "active" : ""} aria-pressed={filter === branch.id} onClick={() => setFilter(filter === branch.id ? "" : branch.id)}>
            <span>{branch.name}</span>
            <strong>{average == null ? "—" : average.toFixed(1)}</strong>
            {average != null && <Stars value={Math.round(average)} label={`${average.toFixed(1)} de 5 estrellas`} />}
            <small>{count} {count === 1 ? "reseña" : "reseñas"}</small>
          </button>
        ))}
      </div>
      <div className="reviews-toolbar">
        <h2>Opiniones aprobadas</h2>
        <label>Filtrar por sucursal<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Todas las sucursales</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
      </div>
      <div className="review-list">
        {visible.length ? visible.map((review) => (
          <article className="review-card" key={review.id}>
            <div className="review-card-top"><Stars value={review.rating} /><time dateTime={review.created_at}>{dateLabel(review.created_at)}</time></div>
            <p>{review.comment}</p>
            <strong>{review.branch_name}</strong>
            {review.admin_response && <div className="review-response"><b>Respuesta de Rancing Mau</b><p>{review.admin_response}</p></div>}
          </article>
        )) : <div className="empty-state compact-empty"><Star size={32} /><h2>Aún no hay reseñas publicadas</h2><p>Comparte tu experiencia y ayúdanos a mejorar.</p></div>}
      </div>
      <ReviewForm branches={branches} />
    </div>
  );
}
