import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, getProduct, listCategories, listBrands, listBranches } from "@/lib/admin";
import { AdminProductForm } from "@/components/admin/admin-product-form";

export const metadata: Metadata = {
  title: "Editar producto",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();
  const product = await getProduct(session.client, id);
  if (!product) notFound();
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
          <h1>Editar producto</h1>
        </div>
        <Link className="button secondary" href="/admin/productos">
          Volver a la lista
        </Link>
      </div>
      <AdminProductForm
        product={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description ?? "",
          base_price: product.base_price,
          promo_price: product.promo_price,
          general_status: product.general_status,
          featured: product.featured,
          published: product.published,
          source_url: product.source_url,
          source_name: product.source_name,
          source_checked_at: product.source_checked_at,
          source_review_status: product.source_review_status,
          category_id: product.category_id,
          brand_id: product.brand_id,
          images: product.images.map((image) => ({ url: image.url })),
          branches: product.branches.map((branch) => ({
            branch_id: branch.branch_id,
            available: branch.available,
            status: branch.status,
            branch_price: branch.branch_price,
            branch_promo_price: branch.branch_promo_price,
          })),
        }}
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