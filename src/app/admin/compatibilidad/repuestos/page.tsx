import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { compatibilitySummary, listSpareParts } from "@/lib/compatibility";

export const metadata: Metadata = {
  title: "Repuestos compatibles",
  robots: { index: false, follow: false },
};

export default async function AdminCompatibilityPartsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const session = await requireAdmin();
  const filters = await searchParams;
  const [summary, spareParts] = await Promise.all([
    compatibilitySummary(session.client),
    listSpareParts(session.client, {
      query: filters.q,
      category: filters.categoria,
    }),
  ]);
  const activeCategory = filters.categoria ?? "";
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">REFERENCIA</span>
          <h1>Repuestos compatibles</h1>
        </div>
        <Link className="button secondary" href="/admin/compatibilidad">
          Volver al resumen
        </Link>
      </div>
      <div className="admin-inline-card">
        <form className="admin-inline-grid" action="/admin/compatibilidad/repuestos">
          <label className="admin-field" htmlFor="compat-q">
            Buscar por nombre, código, categoría o marca
            <input
              id="compat-q"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Ej. catarina CG125"
            />
          </label>
          <label className="admin-field" htmlFor="compat-categoria">
            Categoría
            <select id="compat-categoria" name="categoria" defaultValue={activeCategory}>
              <option value="">Todas</option>
              {summary.by_category.map((row) => (
                <option key={row.category} value={row.category}>
                  {row.category} ({row.count})
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form-actions">
            <button className="button secondary small-button" type="submit">
              <Search size={15} /> Filtrar
            </button>
            {filters.q || activeCategory ? (
              <Link className="text-button" href="/admin/compatibilidad/repuestos">
                Limpiar
              </Link>
            ) : null}
          </div>
        </form>
      </div>
      <p className="admin-count-line">
        {spareParts.length} repuesto{spareParts.length !== 1 ? "s" : ""}
        {activeCategory ? ` en «${activeCategory}»` : ""}
        {filters.q ? ` para «${filters.q}»` : ""}
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Repuesto</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Precio</th>
              <th>Modelos compatibles</th>
            </tr>
          </thead>
          <tbody>
            {spareParts.map((part) => (
              <tr key={part.id}>
                <td>
                  <div className="admin-cell-product">
                    {part.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={part.image_url} alt="" />
                    ) : null}
                    <a href={`/admin/compatibilidad/repuestos/${part.id}`}>
                      {part.name}
                      <br />
                      <span className="admin-hint">{part.code ?? "—"}</span>
                    </a>
                  </div>
                </td>
                <td>{part.category}</td>
                <td>{part.brand ?? "—"}</td>
                <td>
                  {part.price_hnl == null
                    ? "—"
                    : `L ${part.price_hnl.toFixed(2)}`}
                </td>
                <td>{part.models_count}</td>
              </tr>
            ))}
            {spareParts.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-hint">
                  No se encontraron repuestos con esos filtros. Ejecuta el
                  importador de compatibilidad desde la terminal.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}