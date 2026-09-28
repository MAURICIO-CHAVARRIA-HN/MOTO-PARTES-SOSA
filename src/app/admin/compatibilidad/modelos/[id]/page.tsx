import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getMotorcycle } from "@/lib/compatibility";

export const metadata: Metadata = {
  title: "Detalle de modelo",
  robots: { index: false, follow: false },
};

export default async function AdminCompatibilityModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();
  const motorcycle = await getMotorcycle(session.client, id);
  if (!motorcycle) notFound();
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">REFERENCIA</span>
          <h1>{motorcycle.name}</h1>
        </div>
        <Link className="button secondary" href="/admin/compatibilidad/modelos">
          Volver a la lista
        </Link>
      </div>
      <div className="admin-inline-card">
        <div className="admin-grid two">
          <div>
            <p className="admin-hint">Marca</p>
            <p className="admin-count-line">{motorcycle.brand}</p>
          </div>
          <div>
            <p className="admin-hint">Cilindraje</p>
            <p className="admin-count-line">{motorcycle.engine_cc ?? "—"}</p>
          </div>
          <div>
            <p className="admin-hint">Fuente</p>
            <p className="admin-count-line">
              {motorcycle.source_url ? (
                <a
                  className="admin-hint"
                  href={motorcycle.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  KM Motos
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
      </div>
      <h2 className="admin-section-head">
        {motorcycle.parts_count} repuesto{motorcycle.parts_count !== 1 ? "s" : ""}{" "}
        compatibles
      </h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Repuesto</th>
              <th>Categoría</th>
              <th>Código</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {motorcycle.spare_parts.map((part) => (
              <tr key={part.id}>
                <td>
                  <a href={`/admin/compatibilidad/repuestos/${part.id}`}>
                    {part.name}
                  </a>
                </td>
                <td>{part.category}</td>
                <td>{part.code ?? "—"}</td>
                <td>
                  {part.price_hnl == null
                    ? "—"
                    : `L ${part.price_hnl.toFixed(2)}`}
                </td>
              </tr>
            ))}
            {motorcycle.spare_parts.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-hint">
                  Este modelo no tiene repuestos vinculados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}