import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye, Loader2 } from "lucide-react";
import { requireAdmin, listProducts } from "@/lib/admin";
import { ProductRowActions } from "@/components/admin/admin-crud";

export const metadata: Metadata = {
  title: "Productos",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; review?: string }>;
}) {
  const session = await requireAdmin();
  const filters = await searchParams;
  const products = await listProducts(session.client, {
    query: filters.q,
    review: filters.review,
  });
  const pendingCount = products.filter(
    (product) => product.source_review_status === "pending",
  ).length;
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CATÁLOGO</span>
          <h1>Productos</h1>
        </div>
        <Link className="button primary" href="/admin/productos/nuevo">
          <Plus size={17} />
          Nuevo producto
        </Link>
      </div>
      <p className="admin-count-line">
        {products.length} producto{products.length !== 1 ? "s" : ""} ·{" "}
        {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""} de revisión de
        fuente
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Revisión</th>
              <th className="admin-row-actions-th">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const image = product.images?.[0];
              return (
                <tr key={product.id}>
                  <td>
                    <div className="admin-cell-product">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image.url} alt="" />
                      ) : (
                        <Loader2 size={20} aria-hidden="true" />
                      )}
                      <a href={`/admin/productos/${product.id}`}>
                        {product.name}
                        <br />
                        <span className="admin-hint">{product.sku}</span>
                      </a>
                    </div>
                  </td>
                  <td>{product.category_name ?? "—"}</td>
                  <td>{product.brand_name ?? "—"}</td>
                  <td>
                    {product.base_price == null
                      ? "—"
                      : `L ${product.base_price.toFixed(2)}`}
                  </td>
                  <td>
                    <span
                      className={`admin-badge ${product.published ? "on" : "off"}`}
                    >
                      {product.published ? "Publicado" : "Oculto"}
                    </span>
                  </td>
                  <td>
                    <span className="admin-badge">
                      {product.source_review_status === "manual"
                        ? "Manual"
                        : product.source_review_status === "approved"
                          ? "Aprobado"
                          : product.source_review_status === "rejected"
                            ? "Rechazado"
                            : "Pendiente"}
                    </span>
                  </td>
                  <td>
                    <ProductRowActions
                      id={product.id}
                      published={product.published}
                    />
                    <Link
                      className="admin-hint"
                      href={`/admin/productos/${product.id}`}
                    >
                      <Eye size={13} aria-hidden="true" /> Editar ficha
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-hint">
                  Aún no hay productos. Crea el primero desde «Nuevo producto».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}