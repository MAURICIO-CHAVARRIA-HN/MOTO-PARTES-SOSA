import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const product = products.find((product) => product.slug === slug);
  return {
    title: product?.name ?? "Producto no encontrado",
    description: product?.description,
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { products } = await getCatalog();
  const product = products.find((product) => product.slug === slug);
  if (!product) notFound();
  const related = products
    .filter(
      (entry) => entry.id !== product.id && entry.category === product.category,
    )
    .slice(0, 4);
  return (
    <div className="container page-section">
      <div className="breadcrumb">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <Link href="/catalogo">Catálogo</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <ProductDetail product={product} />
      {related.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <h2>También para tu moto</h2>
          </div>
          <div className="product-grid">
            {related.map((entry) => (
              <ProductCard key={entry.id} product={entry} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
