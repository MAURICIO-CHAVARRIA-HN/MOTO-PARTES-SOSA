import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin, listCategories, listBrands, listBranches } from "@/lib/admin";
import { AdminProductForm } from "@/components/admin/admin-product-form";

export const metadata: Metadata = {
  title: "Nuevo producto",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const session = await requireAdmin();
  const [categories, brands, branches] = await Promise.all([
    listCategories(session.client),
    listBrands(session.client),
    listBranches(session.client),
  ]);
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CATÁLOGO</span>
          <h1>Nuevo producto</h1>
        </div>
        <Link className="button secondary" href="/admin/productos">
          Volver a la lista
        </Link>
      </div>
      <AdminProductForm
        product={null}
        categories={categories.map((item) => ({ id: item.id, name: item.name }))}
        brands={brands.map((item) => ({ id: item.id, name: item.name }))}
        branches={branches.map((item) => ({
          id: item.id,
          name: item.name,
          active: item.active,
        }))}
      />
    </div>
  );
}