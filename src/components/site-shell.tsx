"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  MapPin,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  X,
} from "lucide-react";
import { business } from "@/lib/config";
import { useStore } from "./store-provider";
import { BranchSelect } from "./branch-select";
import { WhatsappButton } from "./whatsapp-button";
import { CartDrawer } from "./cart-drawer";
import styles from "./site-shell.module.css";

const links = [
  ["/", "Inicio"],
  ["/catalogo", "Catálogo"],
  ["/promociones", "Promociones"],
  ["/sucursales", "Sucursales"],
  ["/resenas", "Reseñas"],
  ["/contacto", "Contacto"],
];
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { count, setCartOpen, notice, preview, demo, branches } = useStore();
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  function toggleTheme() {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("rancing-mau:theme", next);
    } catch {
      /* System preference still works. */
    }
  }
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <div className={`topbar ${styles.topbar}`}>
        <div className="container topbar-content">
          <span>
            <MapPin size={13} /> La Paz y Marcala, Honduras
          </span>
          <span>
            Tu moto, nuestra pasión.{" "}
            <span className="topbar-phone">
              Atención: {business.phoneLabel}
            </span>
          </span>
        </div>
      </div>
      <header
        className={`site-header ${styles.header}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menu) {
            setMenu(false);
            menuButton.current?.focus();
          }
        }}
      >
        <div className={`container header-main ${styles.main}`}>
          <Link
            className={`brand ${styles.brand}`}
            href="/"
            aria-label="Rancing Mau, inicio"
            onClick={() => setMenu(false)}
          >
            <Image
              src="/images/logo.png"
              alt=""
              width={58}
              height={58}
              priority
            />
            <div>
              <strong>
                RANCING<span> MAU</span>
              </strong>
              <small>REPUESTOS PARA TU MOTO</small>
            </div>
          </Link>
          <form
            className={`header-search ${styles.search}`}
            action="/catalogo"
            role="search"
            onSubmit={() => setMenu(false)}
          >
            <Search size={19} aria-hidden="true" />
            <input
              name="q"
              aria-label="Buscar repuestos"
              placeholder="¿Qué necesita tu moto?"
              autoComplete="off"
            />
            <button type="submit" aria-label="Buscar">
              <ArrowUpRight size={19} aria-hidden="true" />
            </button>
          </form>
          <div className={`header-actions ${styles.actions}`}>
            <div className={`desktop-branch ${styles.desktopBranch}`}>
              <BranchSelect compact />
            </div>
            <button
              className="icon-button theme-toggle"
              onClick={toggleTheme}
              aria-label="Cambiar entre modo claro y oscuro"
            >
              <Moon className="moon" size={21} />
              <Sun className="sun" size={21} />
            </button>
            <button
              className="icon-button cart-trigger"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir carrito, ${count} unidades`}
            >
              <ShoppingBag size={22} />
              <span
                className={`cart-count ${count > 0 ? styles.cartCount : ""}`}
                key={count}
                aria-hidden="true"
              >
                {count}
              </span>
            </button>
            <button
              ref={menuButton}
              className={`icon-button mobile-menu-button ${styles.menuButton}`}
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-controls="main-navigation"
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
            >
              {menu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        <div
          className={`nav-wrap ${styles.navigation} ${menu ? "is-open" : ""}`}
          id="main-navigation"
        >
          <div className={`container nav-content ${styles.navContent}`}>
            <nav aria-label="Navegación principal">
              {links.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={pathname === href ? "active" : ""}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setMenu(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <WhatsappButton
              className={`nav-whatsapp ${styles.whatsapp}`}
              label="Hablemos por WhatsApp"
            />
            <div className={`mobile-branch ${styles.mobileBranch}`}>
              <BranchSelect />
            </div>
          </div>
        </div>
      </header>
      {(preview || demo) && (
        <div className="preview-bar">
          {demo ? "MODO DEMO · CATÁLOGO DE PRUEBA" : "VISTA PREVIA"}
          <span>
            {demo
              ? " · Precios de ejemplo para probar el carrito y la solicitud por WhatsApp. No son precios reales."
              : " · Imágenes de referencia. Precios y disponibilidad pendientes de revisión."}
          </span>
        </div>
      )}
      <main id="contenido">{children}</main>
      <footer className={`site-footer ${styles.footer}`}>
        <div className={`container footer-grid ${styles.footerGrid}`}>
          <div>
            <Link
              className="brand footer-brand"
              href="/"
              aria-label="Rancing Mau, inicio"
            >
              <Image src="/images/logo.png" alt="" width={62} height={62} />
              <div>
                <strong>
                  RANCING<span> MAU</span>
                </strong>
                <small>REPUESTOS PARA TU MOTO</small>
              </div>
            </Link>
            <p>
              Tu siguiente kilómetro empieza con
              <br />
              el repuesto correcto.
            </p>
            <span className={styles.footerLocation}>
              <MapPin size={14} aria-hidden="true" /> La Paz · Marcala · Honduras
            </span>
          </div>
          <div>
            <h3>Explora</h3>
            <Link href="/catalogo">Catálogo de repuestos</Link>
            <Link href="/promociones">Promociones</Link>
            <Link href="/sucursales">Nuestras sucursales</Link>
            <Link href="/resenas">Reseñas</Link>
          </div>
          <div>
            <h3>Estamos cerca</h3>
            {branches.map((branch) => (
              <Link href="/sucursales" key={branch.id}>
                {branch.name}
              </Link>
            ))}
            <Link href="/sucursales" className={styles.branchLink}>
              Ubicaciones y horarios <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div>
            <h3>Conversemos</h3>
            <a className={`footer-phone ${styles.phone}`} href={`tel:+${business.whatsapp}`}>
              +504 {business.phoneLabel}
            </a>
            <p>Consulta tu repuesto por WhatsApp.</p>
            <WhatsappButton className={`footer-link ${styles.footerWhatsapp}`} label="Escríbenos" />
          </div>
        </div>
        <div className={`container footer-bottom ${styles.footerBottom}`}>
          <span>
            © {new Date().getFullYear()} Rancing Mau. Todos los derechos
            reservados.
          </span>
          <span>
            Hecho para seguir rodando. <Link href="/admin">Administración</Link>
          </span>
        </div>
      </footer>
      <div className="toast" role="status" aria-live="polite" key={notice}>
        {notice && (
          <>
            <ShoppingBag size={17} />
            <span>{notice}</span>
            <button onClick={() => setCartOpen(true)}>Ver carrito</button>
          </>
        )}
      </div>
      <CartDrawer />
    </>
  );
}
