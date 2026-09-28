import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { CatalogView } from "@/components/catalog-view";
export const metadata: Metadata = { title: "Catálogo" };
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { products } = await getCatalog();
  const { q } = await searchParams;
  return (
    <div className="container page-section">
      <div className="breadcrumb">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <span>Catálogo</span>
      </div>
      <div className="page-heading">
        <span className="eyebrow">ENCUENTRA LO QUE TE MUEVE</span>
        <h1>
          Catálogo de repuestos<span className="red-dot">.</span>
        </h1>
        <p>Busca, elige y prepara tu próxima consulta con Rancing Mau.</p>
      </div>
      <CatalogView
        products={products}
        initialQuery={typeof q === "string" ? q : ""}
        key={typeof q === "string" ? q : ""}
      />
    </div>
  );
}
