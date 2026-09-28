import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { compatibilitySummary } from "@/lib/compatibility";

export const metadata: Metadata = {
  title: "Compatibilidad",
  robots: { index: false, follow: false },
};

export default async function AdminCompatibilityPage() {
  const session = await requireAdmin();
  const summary = await compatibilitySummary(session.client);
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">REFERENCIA</span>
          <h1>Compatibilidad de repuestos</h1>
        </div>
      </div>
      <p className="notice">
        Base de compatibilidad extraída del catálogo de KM Motos (2026-09-22).
        Cada repuesto está vinculado a los modelos que el sitio oficial lista
        para él.
      </p>
      <div className="admin-stats">
        <div>
          <strong>{summary.total_motorcycles}</strong>
          <span>Modelos de motocicleta</span>
        </div>
        <div>
          <strong>{summary.total_spare_parts}</strong>
          <span>Repuestos únicos</span>
        </div>
        <div>
          <strong>{summary.total_compatibility}</strong>
          <span>Compatibilidades confirmadas</span>
        </div>
      </div>
      <div className="admin-sections">
        <Link className="admin-section-link" href="/admin/compatibilidad/modelos">
          <strong>Modelos</strong>
          <span>
            {summary.total_motorcycles} motos con sus repuestos compatibles
          </span>
        </Link>
        <Link className="admin-section-link" href="/admin/compatibilidad/repuestos">
          <strong>Repuestos</strong>
          <span>
            {summary.total_spare_parts} repuestos y en cuáles modelos aplican
          </span>
        </Link>
      </div>
      <div className="admin-panel-stack">
        <section className="admin-section">
          <div className="admin-section-head">
            <h2>Repuestos por categoría</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Compatibilidades</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_category.map((row) => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="admin-section">
          <div className="admin-section-head">
            <h2>Modelos con más repuestos</h2>
            <Link className="admin-hint" href="/admin/compatibilidad/modelos">
              Ver todos
            </Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Repuestos</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_model.slice(0, 12).map((row) => (
                  <tr key={row.motorcycle_name}>
                    <td>{row.motorcycle_name}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}