"use client";
import { Clock3, MapPin, ArrowUpRight, MessageCircle } from "lucide-react";
import type { Branch } from "@/lib/types";
import { business, whatsappLink } from "@/lib/config";
import { trackWhatsapp } from "./whatsapp-button";

export function BranchCard({
  branch,
  index,
}: {
  branch: Branch;
  index: number;
}) {
  return (
    <article className="branch-card">
      <div className="branch-card-visual">
        <span>0{index + 1}</span>
        {branch.demo && <em className="demo-chip branch-demo-chip">DEMO</em>}
        <MapPin size={60} strokeWidth={1} />
        <strong>{branch.city.toUpperCase()}</strong>
      </div>
      <div className="branch-card-body">
        <span className="eyebrow">{branch.city}, Honduras</span>
        <h2>{branch.name}</h2>
        <p>
          <MapPin size={17} />
          {branch.address || "Dirección exacta pendiente de confirmar"}
        </p>
        <p>
          <Clock3 size={17} />
          {branch.schedule || "Horario pendiente de confirmar"}
        </p>
        <p>
          <MessageCircle size={17} />
          {branch.whatsapp_number
            ? `+${branch.whatsapp_number}`
            : `Atención central: ${business.phoneLabel}`}
        </p>
        {branch.google_maps_url &&
        /^https:\/\/(www\.)?(google\.com\/maps|maps\.google\.com\/|maps\.app\.goo\.gl\/)/.test(
          branch.google_maps_url,
        ) ? (
          <a
            className="button secondary full"
            href={branch.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cómo llegar <ArrowUpRight size={18} />
          </a>
        ) : (
          <p className="notice small">
            Ubicación en Google Maps pendiente de confirmar.
          </p>
        )}
        <a
          className="button whatsapp full"
          href={whatsappLink(
            `Hola, Rancing Mau. Quiero consultar sobre repuestos en ${branch.name}.`,
            branch.whatsapp_number ?? business.whatsapp,
          )}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsapp("contact")}
        >
          <MessageCircle size={18} />
          Escribir por WhatsApp
        </a>
      </div>
    </article>
  );
}
