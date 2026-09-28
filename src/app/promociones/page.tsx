import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { CatalogView } from "@/components/catalog-view";
export const metadata: Metadata = { title: "Promociones" };
export default async function PromotionsPage() {
  const { products } = await getCatalog();
  return (
    <div className="container page-section">
      <div className="page-heading">
        <span className="eyebrow">UNA BUENA RAZÓN PARA SEGUIR RODANDO</span>
        <h1>
          Promociones<span className="red-dot">.</span>
        </h1>
        <p>Consulta los productos con promociones publicadas por la tienda.</p>
      </div>
      <CatalogView products={products} promotions />
    </div>
  );
}
