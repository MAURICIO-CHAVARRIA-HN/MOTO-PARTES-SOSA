import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getSparePart } from "@/lib/compatibility";

export const metadata: Metadata = {
  title: "Detalle de repuesto",
  robots: { index: false, follow: false },
};

export default async function AdminCompatibilityPartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();
  const part = await getSparePart(session.client, id);
  if (!part) notFound();
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">REFERENCIA</span>
          <h1>{part.name}</h1>
        </div>
        <Link className="button secondary" href="/admin/compatibilidad/repuestos">
          Volver a la lista
        </Link>
      </div>
      <div className="admin-inline-card">
        <div className="admin-grid two">
          <div>
            <p className="admin-hint">Código</p>
            <p className="admin-count-line">{part.code ?? "—"}</p>
          </div>
          <div>
            <p className="admin-hint">Categoría</p>
            <p className="admin-count-line">{part.category}</p>
          </div>
          <div>
            <p className="admin-hint">Marca</p>
            <p className="admin-count-line">{part.brand ?? "—"}</p>
          </div>
          <div>
            <p className="admin-hint">Precio referencia</p>
            <p className="admin-count-line">
              {part.price_hnl == null
                ? "—"
                : `L ${part.price_hnl.toFixed(2)}`}
            </p>
          </div>
          <div>
            <p className="admin-hint">Medidas</p>
            <p className="admin-count-line">{part.measurements ?? "—"}</p>
          </div>
          <div>
            <p className="admin-hint">Fuente</p>
            <p className="admin-count-line">
              {part.source_url ? (
                <a
                  className="admin-hint"
                  href={part.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {part.source_name ?? "Fuente"} · {part.source_checked_at ?? ""}
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
        {part.description ? <p className="admin-count-line">{part.description}</p> : null}
      </div>
      <h2 className="admin-section-head">
        Compatible con {part.models.length} modelo
        {part.models.length !== 1 ? "s" : ""}
      </h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Modelo</th>
              <th>Nivel</th>
              <th>Evidencia</th>
            </tr>
          </thead>
          <tbody>
            {part.models.map((model) => (
              <tr key={`${part.id}-${model.motorcycle_id}`}>
                <td>{model.motorcycle_name}</td>
                <td>
                  <span className="admin-badge on">{model.compatibility_level}</span>
                </td>
                <td>
                  {model.evidence_url ? (
                    <a
                      className="admin-hint"
                      href={model.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Colección oficial
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {part.models.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-hint">
                  Este repuesto aún no tiene modelos vinculados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}