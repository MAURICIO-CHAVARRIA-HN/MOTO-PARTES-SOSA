import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, MapPin, ShoppingBag, ArrowRight } from "lucide-react";
import { WhatsappButton } from "@/components/whatsapp-button";
import { business } from "@/lib/config";
export const metadata: Metadata = { title: "Contacto" };
export default function ContactPage() {
  return (
    <div className="container page-section">
      <div className="page-heading">
        <span className="eyebrow">HABLEMOS DE TU MOTO</span>
        <h1>
          Estamos para ayudarte<span className="red-dot">.</span>
        </h1>
        <p>
          Consulta por el repuesto que buscas o prepara tu solicitud desde el
          catálogo.
        </p>
      </div>
      <div className="contact-grid">
        <article className="contact-card">
          <MessageCircle size={36} />
          <h2>Atención por WhatsApp</h2>
          <strong className="contact-number">+504 {business.phoneLabel}</strong>
          <p>Selecciona tu sucursal y cuéntanos qué necesita tu moto.</p>
          <WhatsappButton />
        </article>
        <article className="contact-card">
          <MapPin size={36} />
          <h2>Visita nuestras sucursales</h2>
          <p>
            LA PAZ TIENDA 1<br />
            LA PAZ TIENDA 2<br />
            MARCALA TIENDA 3
          </p>
          <Link href="/sucursales" className="button secondary">
            Ver sucursales <ArrowRight size={18} />
          </Link>
        </article>
        <article className="contact-card">
          <ShoppingBag size={36} />
          <h2>Prepara tu solicitud</h2>
          <p>
            Agrega productos al carrito y consulta disponibilidad, precio final,
            forma de pago y entrega con la tienda.
          </p>
          <Link href="/catalogo" className="button secondary">
            Explorar catálogo <ArrowRight size={18} />
          </Link>
        </article>
      </div>
    </div>
  );
}
