"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { business, money } from "@/lib/config";
import { productPrice } from "@/lib/cart";
import { useStore } from "./store-provider";
import { Modal } from "./modal";
import { BranchSelect } from "./branch-select";
import { trackWhatsapp } from "./whatsapp-button";

export function CartDrawer() {
  const {
    cart,
    products,
    count,
    update,
    clear,
    cartOpen,
    setCartOpen,
    branchId,
    preview,
    demo,
  } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [prepared, setPrepared] = useState<{
    signature: string;
    total: number;
    messages: { text: string; url: string }[];
  } | null>(null);
  const signature = JSON.stringify({ cart, branchId });
  const result = prepared?.signature === signature ? prepared : null;
  const lines = cart.map((item) => ({
    ...item,
    product: products.find((product) => product.id === item.product_id),
  }));
  const pending = lines.some(
    ({ product }) => !product || productPrice(product, branchId) == null,
  );
  const total =
    lines.reduce(
      (sum, { product, quantity }) =>
        sum +
        Math.round(
          (product ? (productPrice(product, branchId) ?? 0) : 0) * 100,
        ) *
          quantity,
      0,
    ) / 100;
  async function prepare() {
    setBusy(true);
    setError("");
    setPrepared(null);
    try {
      const response = await fetch("/api/solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, branch_id: branchId || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPrepared({ ...data, signature });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo preparar la solicitud. Revisa tu conexión.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={cartOpen}
      onClose={() => {
        setCartOpen(false);
        setConfirmClear(false);
      }}
      title={`Tu carrito · ${count}`}
      side
    >
      {!cart.length ? (
        <div className="empty-state">
          <ShoppingBag size={48} strokeWidth={1.4} />
          <h3>Tu próxima ruta empieza aquí</h3>
          <p>
            Agrega los repuestos que necesitas y prepara tu solicitud para la
            tienda.
          </p>
          <Link
            className="button primary"
            href="/catalogo"
            onClick={() => setCartOpen(false)}
          >
            Explorar catálogo <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-lines">
            {lines.map(({ product, product_id, quantity }) => (
              <article className="cart-line" key={product_id}>
                {product && (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={72}
                    height={88}
                    className="cart-image"
                  />
                )}
                <div className="cart-line-content">
                  <h3>{product?.name ?? "Producto no disponible"}</h3>
                  <p className="small muted">
                    {product?.sku ?? "Retira este artículo del carrito"}
                  </p>
                  <strong>
                    {product && productPrice(product, branchId) != null
                      ? money(productPrice(product, branchId)!)
                      : "Precio por confirmar"}
                  </strong>
                  <div className="quantity-row">
                    <div className="quantity">
                      <button
                        onClick={() => update(product_id, quantity - 1)}
                        aria-label={`Disminuir cantidad de ${product?.name ?? "producto"}`}
                      >
                        <Minus size={15} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        onClick={() => update(product_id, quantity + 1)}
                        disabled={quantity >= 99}
                        aria-label={`Aumentar cantidad de ${product?.name ?? "producto"}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Eliminar ${product?.name ?? "producto"}`}
                      onClick={() => update(product_id, 0)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <p className="small">
                    Subtotal:{" "}
                    {product && productPrice(product, branchId) != null
                      ? money(
                          (Math.round(productPrice(product, branchId)! * 100) *
                            quantity) /
                            100,
                        )
                      : "Por confirmar"}
                  </p>
                </div>
              </article>
            ))}
          </div>
          {confirmClear ? (
            <div className="notice">
              <p>¿Eliminar todos los productos del carrito?</p>
              <div className="button-row">
                <button
                  className="button primary small-button"
                  onClick={() => {
                    clear();
                    setConfirmClear(false);
                  }}
                >
                  Sí, vaciar
                </button>
                <button
                  className="button secondary small-button"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              className="text-button"
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 size={15} />
              Vaciar carrito
            </button>
          )}
          <div className="cart-summary">
            <BranchSelect label="Sucursal preferida" />
            <div className="total-row">
              <span>Total estimado</span>
              <strong>{pending ? "Por confirmar" : money(total)}</strong>
            </div>
            <p className="small muted">{business.disclaimer}</p>
            {preview && !demo && (
              <p className="notice small">
                Vista previa: puedes probar el carrito. El envío estará
                disponible cuando el catálogo tenga productos y precios
                aprobados.
              </p>
            )}
            {demo && (
              <p className="notice small">
                Modo demo: los precios son de ejemplo y la solicitud se arma con
                datos del catálogo de demostración.
              </p>
            )}
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <button
              className="button primary full"
              onClick={prepare}
              disabled={busy || (preview && !demo)}
            >
              {busy ? "Comprobando precios…" : "Solicitar compra por WhatsApp"}
              <MessageCircle size={18} />
            </button>
            {result && (
              <div className="notice" aria-live="polite">
                <strong>Precios comprobados: {money(result.total)}</strong>
                <p className="small">
                  {result.messages.length > 1
                    ? `Tu pedido se dividió en ${result.messages.length} mensajes. Envía cada parte para incluir todos los productos.`
                    : "Tu solicitud está lista. Abre WhatsApp para enviarla."}
                </p>
                {result.messages.map((message, index) => (
                  <a
                    className="button whatsapp full"
                    key={index}
                    href={message.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsapp("cart")}
                  >
                    Abrir WhatsApp
                    {result.messages.length > 1
                      ? ` · Parte ${index + 1}/${result.messages.length}`
                      : ""}
                    <ArrowRight size={18} />
                  </a>
                ))}
              </div>
            )}
            <p className="small muted center">
              Solicitud al {business.phoneLabel} · Sin pagos en línea
            </p>
          </div>
        </>
      )}
    </Modal>
  );
}
