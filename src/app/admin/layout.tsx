import Link from "next/link";
import { currentAdminSession } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await currentAdminSession();
  return (
    <>
      {session && (
        <header className="admin-nav">
          <div className="admin-nav-inner">
            <Link className="brand" href="/admin">
              RANCING MAU · ADMIN
            </Link>
            <nav>
              <Link href="/admin">Resumen</Link>
              <Link href="/admin/productos">Productos</Link>
              <Link href="/admin/categorias">Categorías</Link>
              <Link href="/admin/marcas">Marcas</Link>
              <Link href="/admin/sucursales">Sucursales</Link>
              <Link href="/admin/compatibilidad">Compatibilidad</Link>
              <Link href="/admin/revision">Revisión</Link>
              <Link href="/admin/resenas">Reseñas</Link>
              <Link href="/admin/estadisticas">Estadísticas</Link>
            </nav>
            <Link className="text-link" href="/">
              Ver tienda
            </Link>
          </div>
        </header>
      )}
      {children}
    </>
  );
}
