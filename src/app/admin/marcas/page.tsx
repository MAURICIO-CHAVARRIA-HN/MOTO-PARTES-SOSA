import type { Metadata } from "next";
import { requireAdmin, listBrands } from "@/lib/admin";
import { LabelForm } from "@/components/admin/admin-crud";

export const metadata: Metadata = {
  title: "Marcas",
  robots: { index: false, follow: false },
};

export default async function AdminBrandsPage() {
  const session = await requireAdmin();
  const brands = await listBrands(session.client);
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CATÁLOGO</span>
          <h1>Marcas</h1>
        </div>
      </div>
      <div className="admin-inline-card">
        <LabelForm kind="brands" row={null} />
      </div>
      <div className="admin-inline-card">
        {brands.map((brand) => (
          <LabelForm
            key={brand.id}
            kind="brands"
            row={{ id: brand.id, name: brand.name, active: brand.active }}
          />
        ))}
      </div>
    </div>
  );
}