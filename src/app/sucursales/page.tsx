import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { business } from "@/lib/config";
import { BranchCard } from "@/components/branch-card";
import { StoreMap, type MapStore } from "@/components/store-map";
export const metadata: Metadata = { title: "Sucursales" };
export default async function BranchesPage() {
  const { branches, demo } = await getCatalog();
  const stores: MapStore[] = branches
    .filter((branch) => branch.lat != null && branch.lng != null)
    .map((branch) => ({
      id: branch.id,
      name: branch.name,
      city: `${branch.city}, Honduras`,
      lat: branch.lat!,
      lng: branch.lng!,
      address: branch.address,
      schedule: branch.schedule,
      phone: branch.whatsapp_number
        ? `+${branch.whatsapp_number}`
        : business.phoneLabel,
      description: branch.description ?? null,
      mapsUrl: branch.google_maps_url,
    }));
  return (
    <div className="container page-section">
      <div className="page-heading">
        <span className="eyebrow">CERCA DE TI Y DE TU MOTO</span>
        <h1>
          Encuentra tu sucursal<span className="red-dot">.</span>
        </h1>
        <p>Tres tiendas en La Paz y Marcala conectadas por una misma pasión.</p>
      </div>
      {demo && (
        <section className="demo-section" aria-label="Sucursales de demostración">
          <div className="demo-note">
            <span className="demo-chip">DEMO</span>
            <p>
              Mapa en modo demostración: los negocios, direcciones y teléfonos
              mostrados son <strong>ficticios y de prueba</strong>, no
              representan comercios reales de Rancing Mau.
            </p>
          </div>
          <StoreMap stores={stores} />
        </section>
      )}
      <div className="branch-grid">
        {branches.map((branch, index) => (
          <BranchCard key={branch.id} branch={branch} index={index} />
        ))}
      </div>
    </div>
  );
}