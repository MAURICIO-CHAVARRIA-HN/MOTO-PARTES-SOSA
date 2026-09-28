import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { listMotorcycles } from "@/lib/compatibility";

export const metadata: Metadata = {
  title: "Modelos compatibles",
  robots: { index: false, follow: false },
};

export default async function AdminCompatibilityModelsPage() {
  const session = await requireAdmin();
  const motorcycles = await listMotorcycles(session.client);
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">REFERENCIA</span>
          <h1>Modelos de motocicleta</h1>
        </div>
        <Link className="button secondary" href="/admin/compatibilidad">
          Volver al resumen
        </Link>
      </div>
      <p className="admin-count-line">
        {motorcycles.length} modelos registrados
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Modelo</th>
              <th>Marca</th>
              <th>Cilindraje</th>
              <th>Repuestos compatibles</th>
              <th>Fuente</th>
            </tr>
          </thead>
          <tbody>
            {motorcycles.map((motorcycle) => (
              <tr key={motorcycle.id}>
                <td>
                  <a href={`/admin/compatibilidad/modelos/${motorcycle.id}`}>
                    {motorcycle.name}
                  </a>
                </td>
                <td>{motorcycle.brand}</td>
                <td>{motorcycle.engine_cc ?? "—"}</td>
                <td>{motorcycle.parts_count}</td>
                <td>
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
                </td>
              </tr>
            ))}
            {motorcycles.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-hint">
                  No hay modelos registrados. Ejecuta el importador de
                  compatibilidad desde la terminal.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}