import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer, hasSupabase } from "@/lib/supabase/server";
import { signOut } from "./actions";
export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  if (!hasSupabase()) redirect("/admin/login");
  const client = await createSupabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin } = await client
    .from("admin_users")
    .select("id,name")
    .eq("id", user.id)
    .eq("active", true)
    .eq("role", "admin")
    .maybeSingle();
  if (!admin) redirect("/admin/login");
  const [products, pending, branches, published, compat] = await Promise.all([
    client.from("products").select("id", { count: "exact", head: true }),
    client
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("source_review_status", "pending"),
    client
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    client
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
    client.from("compatibility").select("id", { count: "exact", head: true }),
  ]);
  if (products.error || pending.error || branches.error || published.error)
    throw new Error("No se pudo cargar el resumen administrativo.");
  const compatCount =
    compat.error || compat.count == null ? null : compat.count;
  const sections = [
    {
      href: "/admin/productos",
      title: "Productos",
      text: `${published.count} publicados · ${products.count} totales`,
    },
    {
      href: "/admin/revision",
      title: "Revisión de fuentes",
      text: `${pending.count} pendientes de aprobar`,
    },
    {
      href: "/admin/compatibilidad",
      title: "Compatibilidad",
      text:
        compatCount == null
          ? "Base de repuestos por modelo"
          : `${compatCount} compatibilidades registradas`,
    },
    {
      href: "/admin/resenas",
      title: "Reseñas",
      text: "Modera opiniones y responde a clientes",
    },
    {
      href: "/admin/estadisticas",
      title: "Estadísticas",
      text: "Visitas agregadas del sitio",
    },
    {
      href: "/admin/categorias",
      title: "Categorías",
      text: "Administra las agrupaciones del catálogo",
    },
    {
      href: "/admin/marcas",
      title: "Marcas",
      text: "Administra las marcas disponibles",
    },
    {
      href: "/admin/sucursales",
      title: "Sucursales",
      text: `${branches.count} tiendas activas`,
    },
  ];
  return (
    <div className="container page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">PANEL PRIVADO</span>
          <h1>Hola, {admin.name}</h1>
        </div>
        <form action={signOut}>
          <button className="button secondary">Cerrar sesión</button>
        </form>
      </div>
      <div className="admin-stats">
        <div>
          <strong>{published.count}</strong>
          <span>Productos publicados</span>
        </div>
        <div>
          <strong>{pending.count}</strong>
          <span>Pendientes de revisión</span>
        </div>
        <div>
          <strong>{branches.count}</strong>
          <span>Sucursales activas</span>
        </div>
      </div>
      <div className="admin-sections">
        {sections.map((section) => (
          <Link
            key={section.href}
            className="admin-section-link"
            href={section.href}
          >
            <strong>{section.title}</strong>
            <span>{section.text}</span>
          </Link>
        ))}
      </div>
      <p className="notice">
        Los cambios guardados aquí actualizan el catálogo público. Las
        fotografías de productos que publicas pasan primero por revisión si no
        provienen de una fuente aprobada.
      </p>
    </div>
  );
}
