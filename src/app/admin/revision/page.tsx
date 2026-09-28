import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin, listReviewQueue } from "@/lib/admin";
import { ReviewActions } from "@/components/admin/admin-crud";

export const metadata: Metadata = {
  title: "Revisión de fuentes",
  robots: { index: false, follow: false },
};

export default async function AdminReviewPage() {
  const session = await requireAdmin();
  const queue = await listReviewQueue(session.client);
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">INTERNET</span>
          <h1>Revisión de fuentes externas</h1>
        </div>
      </div>
      <p className="admin-count-line">
        {queue.length} producto{queue.length !== 1 ? "s" : ""} con fuente externa
        pendiente de aprobar. Estos productos no se muestran en el catálogo
        hasta que se apruebe la fuente.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Marca</th>
              <th>Fuente</th>
              <th>Consultado el</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((product) => (
              <tr key={product.id}>
                <td>
                  <a href={`/admin/productos/${product.id}`}>{product.name}</a>
                  <div className="admin-hint">{product.sku}</div>
                </td>
                <td>{product.brand_name ?? "—"}</td>
                <td>
                  {product.source_url ? (
                    <a
                      href={product.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {product.source_name ?? product.source_url.slice(0, 40)}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{product.source_checked_at?.slice(0, 10) ?? "—"}</td>
                <td>
                  <ReviewActions id={product.id} />
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-hint">
                  No hay fuentes externas pendientes de revisión.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="admin-hint">
        Después de aprobar, completa el precio y publica el producto desde su
        ficha. <Link href="/admin/productos">Ir a Productos</Link>
      </p>
    </div>
  );
}