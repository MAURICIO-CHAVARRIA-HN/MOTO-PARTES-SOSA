import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Droplets,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Wrench,
  ChevronRight,
  Star,
  Gauge,
} from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { WhatsappButton } from "@/components/whatsapp-button";
import { BrandCarousel } from "@/components/brand-carousel";
import { MotionSections } from "@/components/motion-sections";
import styles from "./home.module.css";

export default async function Home() {
  const { products, branches, preview } = await getCatalog();
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const promotions = products
    .filter((product) => product.general_status === "promotion")
    .slice(0, 4);
  const brands = [...new Set(products.map((product) => product.brand))];
  const categories = [...new Set(products.map((product) => product.category))].filter(Boolean).slice(0, 6);
  return (
    <MotionSections className={styles.home}>
      <section className="hero">
        <div className="hero-grid-lines" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">
              <span /> REPUESTOS PARA MOTOS · HONDURAS
            </span>
            <h1>
              Que nada
              <br />
              detenga <em>tu ruta.</em>
            </h1>
            <p>
              Cada kilómetro empieza con el repuesto correcto.
              Encuentra el tuyo y consulta con nuestro equipo en La Paz y Marcala.
            </p>
            <div className="hero-buttons">
              <Link className="button primary" href="/catalogo">
                Explorar catálogo <ArrowUpRight size={20} />
              </Link>
              <WhatsappButton className="hero-secondary" label="Consultar por WhatsApp" />
            </div>
            <div className="hero-note">
              <span className="hero-note-line" /> TU MOTO. TU CAMINO. TU EQUIPO.
            </div>
          </div>
          <div className="hero-art">
            <div className={styles.artPlate} aria-hidden="true" />
            <div className="hero-orbit" aria-hidden="true" />
            <div className={styles.artLabel}><span>RANCING MAU</span><b>HECHO PARA RODAR</b></div>
            <span className="hero-watermark" aria-hidden="true">
              MAU
            </span>
            <Image
              className="hero-logo"
              src="/images/logo.png"
              alt="Rancing Mau: motocicleta, pistón y transmisión en rojo y negro"
              width={620}
              height={620}
              priority
              sizes="(max-width: 750px) 85vw, 48vw"
            />
            <div className={styles.artTag}><Gauge size={21} aria-hidden="true" /><span>El siguiente kilómetro<strong>empieza aquí.</strong></span><ArrowUpRight size={18} aria-hidden="true" /></div>
            <span className="art-caption">
              LISTOS PARA EL SIGUIENTE KILÓMETRO <ArrowUpRight size={16} />
            </span>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="container">
            <span>
              <MapPin size={17} />3 sucursales, una misma pasión
            </span>
            <span>
              LA PAZ <i /> MARCALA
            </span>
            <span className="hero-bottom-right">
              HECHO PARA SEGUIR RODANDO <ArrowRight size={17} />
            </span>
          </div>
        </div>
      </section>
      <section className="service-strip container" aria-label="Cómo comprar" data-reveal>
        <div>
          <div className="service-icon">
            <Wrench size={25} />
          </div>
          <div>
            <h2>Encuentra tu repuesto</h2>
            <p>Explora por marca y categoría.</p>
          </div>
        </div>
        <div>
          <div className="service-icon">
            <ShoppingBag size={25} />
          </div>
          <div>
            <h2>Arma tu solicitud</h2>
            <p>Guarda todo en tu carrito.</p>
          </div>
        </div>
        <div>
          <div className="service-icon">
            <MessageCircle size={25} />
          </div>
          <div>
            <h2>Conversemos por WhatsApp</h2>
            <p>Confirma precio y disponibilidad.</p>
          </div>
        </div>
      </section>
      <section className="section container" data-reveal>
        <div className="section-heading">
          <div>
            <span className="eyebrow">CUIDA LO QUE TE MUEVE</span>
            <h2>Encuentra tu próxima pieza<span className="red-dot">.</span></h2>
          </div>
          <Link className="text-link" href="/catalogo">
            Ver catálogo <ArrowRight size={18} />
          </Link>
        </div>
        <Link className="category-banner" href="/catalogo">
          <div className="category-icon">
            <Droplets size={42} strokeWidth={1.4} />
          </div>
          <div>
            <span className="eyebrow">DALE A TU MOTO EL CUIDADO QUE MERECE</span>
            <h3>Lista para lo que viene.</h3>
            <p>Explora repuestos, encuentra tu marca y prepara tu solicitud.</p>
          </div>
          <span className="category-arrow">
            <ArrowUpRight size={28} />
          </span>
          <span className="category-decoration" aria-hidden="true" />
        </Link>
        {categories.length > 0 && <div className={styles.categories} aria-label="Categorías del catálogo">
          {categories.map((category, index) => <Link href={`/catalogo?q=${encodeURIComponent(category)}`} key={category}>
            <span className={styles.categoryIndex}>0{index + 1}</span><Wrench size={20} aria-hidden="true" /><strong>{category}</strong><ArrowUpRight size={18} aria-hidden="true" />
          </Link>)}
        </div>}
      </section>
      <section className="section featured-section" data-reveal>
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DA EL SIGUIENTE PASO</span>
              <h2>
                {preview ? "Conoce nuestro catálogo" : "Productos destacados"}
                <span className="red-dot">.</span>
              </h2>
            </div>
            <Link className="text-link" href="/catalogo">
              Ver todos los productos <ArrowRight size={18} />
            </Link>
          </div>
          {featured.length ? (
            <div className="product-grid">
              {featured.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <ShoppingBag size={32} />
              <h3>Estamos preparando el catálogo</h3>
              <p>
                Muy pronto encontrarás aquí los productos publicados por la
                tienda.
              </p>
              <WhatsappButton />
            </div>
          )}
        </div>
      </section>
      <BrandCarousel brands={brands.filter(Boolean)} />
      <section className={`section container ${styles.promotions}`} data-reveal>
        <div className="section-heading">
          <div>
            <span className="eyebrow">OPORTUNIDADES PARA TU MOTO</span>
            <h2>Promociones</h2>
          </div>
          <Link href="/promociones" className="text-link">
            Ver promociones <ArrowRight size={18} />
          </Link>
        </div>
        {promotions.length ? (
          <div className="product-grid">
            {promotions.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="promo-placeholder">
            <span className="promo-number" aria-hidden="true">
              %
            </span>
            <div>
              <h3>Las buenas oportunidades merecen una parada.</h3>
              <p>
                Las promociones aparecerán aquí cuando la tienda las publique.
              </p>
            </div>
            <Link className="button secondary" href="/catalogo">
              Explorar repuestos <ArrowUpRight size={18} />
            </Link>
          </div>
        )}
      </section>
      <section className="section branches-section" data-reveal>
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SIEMPRE CERCA DE TU RUTA</span>
              <h2>Tres sucursales. Un mismo equipo.</h2>
            </div>
            <Link className="text-link" href="/sucursales">
              Conócenos <ArrowRight size={18} />
            </Link>
          </div>
          <div className="branch-grid">
            {branches.map((branch, index) => (
              <Link className="branch-mini" href="/sucursales" key={branch.id}>
                <span className="branch-index">0{index + 1}</span>
                <MapPin size={26} />
                <div>
                  <span className="small muted">{branch.city}, Honduras</span>
                  <h3>{branch.name}</h3>
                  {branch.schedule && <p className={styles.schedule}>{branch.schedule}</p>}
                  <span className="branch-mini-link">
                    Ver sucursal <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className={`container ${styles.reviewIntro}`} data-reveal>
        <div className={styles.reviewSymbol} aria-hidden="true"><Star size={30} /></div>
        <div><span className="eyebrow">VOCES DE LA RUTA</span><h2>Tu experiencia nos hace mejores.</h2><p>Conoce las opiniones por sucursal y cuéntanos cómo te atendimos.</p></div>
        <Link href="/resenas" className="text-link">Explorar reseñas <ArrowUpRight size={19} /></Link>
      </section>
      <section className="section container" data-reveal>
        <div className="contact-banner">
          <div>
            <span className="eyebrow">HABLEMOS DE TU MOTO</span>
            <h2>¿Buscas un repuesto en especial?</h2>
            <p>
              Cuéntanos qué necesitas. Estamos para ayudarte a seguir rodando.
            </p>
          </div>
          <WhatsappButton
            className="button white-button"
            label="Escríbenos por WhatsApp"
          />
        </div>
      </section>
    </MotionSections>
  );
}
