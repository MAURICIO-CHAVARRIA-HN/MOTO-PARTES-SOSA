"use client";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { business, whatsappLink } from "@/lib/config";
import type { Product } from "@/lib/types";
import { useStore } from "./store-provider";
import { BranchSelect } from "./branch-select";
import { Modal } from "./modal";

export function trackWhatsapp(kind: "contact" | "product" | "cart") {
  // Privacy-preserving hook. A future analytics provider may subscribe to this event.
  window.dispatchEvent(
    new CustomEvent("rancing-mau:whatsapp", { detail: { kind } }),
  );
}

export function WhatsappButton({
  product,
  className = "button whatsapp",
  label = "Consultar por WhatsApp",
}: {
  product?: Product;
  className?: string;
  label?: string;
}) {
  const { branches, branchId, preview, demo } = useStore();
  const [open, setOpen] = useState(false);
  const branch = branches.find((branch) => branch.id === branchId);
  const message = product
    ? `Hola, Rancing Mau. Me interesa el producto ${product.name}, código ${product.sku}, visto en la página web. Quiero consultar su disponibilidad en ${branch?.name ?? ""}.`
    : `Hola, Rancing Mau. Quiero consultar sobre repuestos en ${branch?.name ?? ""}.`;
  const disabled = Boolean(product && preview && !demo);
  const link = whatsappLink(
    message,
    branch?.whatsapp_number ?? business.whatsapp,
  );
  return (
    <>
      {branch && !disabled ? (
        <a
          className={className}
          aria-label={label || "Consultar por WhatsApp"}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsapp(product ? "product" : "contact")}
        >
          <MessageCircle size={18} aria-hidden="true" />
          {label}
        </a>
      ) : (
        <button
          className={className}
          aria-label={label || "Consultar por WhatsApp"}
          onClick={() => setOpen(true)}
          disabled={disabled}
          title={
            disabled
              ? "Producto de vista previa pendiente de revisión"
              : undefined
          }
        >
          <MessageCircle size={18} aria-hidden="true" />
          {label}
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Elige tu sucursal"
      >
        <p className="muted">
          Selecciona la tienda sobre la que deseas consultar.
        </p>
        <BranchSelect />
        {branch ? (
          <a
            className="button primary full"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackWhatsapp(product ? "product" : "contact");
              setOpen(false);
            }}
          >
            Continuar a WhatsApp <MessageCircle size={18} />
          </a>
        ) : (
          <p className="small muted">Selecciona una sucursal para continuar.</p>
        )}
      </Modal>
    </>
  );
}
