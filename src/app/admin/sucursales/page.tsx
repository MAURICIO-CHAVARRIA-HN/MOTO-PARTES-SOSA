import type { Metadata } from "next";
import { requireAdmin, listBranches } from "@/lib/admin";
import { BranchForm } from "@/components/admin/admin-crud";

export const metadata: Metadata = {
  title: "Sucursales",
  robots: { index: false, follow: false },
};

export default async function AdminBranchesPage() {
  const session = await requireAdmin();
  const branches = await listBranches(session.client);
  return (
    <div className="admin-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TIENDAS</span>
          <h1>Sucursales</h1>
        </div>
      </div>
      <div className="admin-inline-card branch-form">
        <BranchForm branch={null} />
      </div>
      <div className="admin-inline-card branch-form">
        {branches.map((branch) => (
          <BranchForm
            key={branch.id}
            branch={{
              id: branch.id,
              name: branch.name,
              city: branch.city,
              address: branch.address,
              reference: branch.reference,
              schedule: branch.schedule,
              whatsapp_number: branch.whatsapp_number,
              phone: branch.phone,
              google_maps_url: branch.google_maps_url,
              map_embed_url: branch.map_embed_url,
              active: branch.active,
            }}
          />
        ))}
      </div>
    </div>
  );
}