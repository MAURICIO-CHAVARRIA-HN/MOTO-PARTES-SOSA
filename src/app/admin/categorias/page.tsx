import type { Metadata } from "next";
import { requireAdmin, listCategories } from "@/lib/admin";
import { LabelForm } from "@/components/admin/admin-crud";

export const metadata: Metadata = {
  title: "Categorías",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const session = await requireAdmin();
  const categories = await listCategories(session.client);
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CATÁLOGO</span>
          <h1>Categorías</h1>
        </div>
      </div>
      <div className="admin-inline-card">
        <LabelForm kind="categories" row={null} />
      </div>
      <div className="admin-inline-card">
        {categories.map((category) => (
          <LabelForm
            key={category.id}
            kind="categories"
            row={{ id: category.id, name: category.name, active: category.active }}
          />
        ))}
      </div>
    </div>
  );
}