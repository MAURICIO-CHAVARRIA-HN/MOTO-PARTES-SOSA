"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, ImageOff, MapPin, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/config";
import { productPrice } from "@/lib/cart";
import { useStore } from "./store-provider";
import { WhatsappButton } from "./whatsapp-button";
import styles from "./product-card.module.css";

export function ProductCard({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) {
  const { add, branchId, branches, cart } = useStore();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const quantity = cart.find((item) => item.product_id === product.id)?.quantity ?? 0;
  const price = productPrice(product, branchId);
  const status = product.general_status;
  const availability = product.branches
    .filter((branch) => branch.available)
    .map(
      (branch) => branches.find((entry) => entry.id === branch.branch_id)?.name,
    )
    .filter(Boolean);
  return (
    <article className={`product-card ${styles.card}`}>
      <div className="product-visual">
        <span className={`badge status-${status}`}>
          {status === "pending"
            ? "Referencia"
            : status === "promotion"
              ? "Promoción"
              : status === "out_of_stock"
                ? "Agotado"
                : "Disponible"}
        </span>
        <Link
          href={`/producto/${product.slug}`}
          aria-label={`Ver detalles de ${product.name}`}
        >
          {product.image && failedImage !== product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={eager}
              sizes="(max-width: 620px) 45vw, (max-width: 900px) 40vw, 25vw"
              onError={() => setFailedImage(product.image)}
            />
          ) : (
            <span className={styles.imagePlaceholder}>
              <ImageOff size={32} strokeWidth={1.3} aria-hidden="true" />
              Fotografía por confirmar
            </span>
          )}
        </Link>
        <Link
          className="product-open"
          href={`/producto/${product.slug}`}
          aria-label={`Abrir ${product.name}`}
        >
          <ArrowUpRight size={19} />
        </Link>
      </div>
      <div className="product-content">
        <div className={styles.meta}>
          <span className="product-brand">{product.brand}</span>
          <span className={styles.partNumber} title={`Código: ${product.sku}`}>
            {product.sku}
          </span>
        </div>
        <Link href={`/producto/${product.slug}`} className="product-name">
          <h3>{product.name}</h3>
        </Link>
        <p className="product-category">{product.category}</p>
        {product.compatibility && (
          <p className="product-compat">
            <span className="compat-label">Compatibilidad:</span>{" "}
            {product.compatibility}
          </p>
        )}
        <div className={`product-price ${styles.price}`}>
          {price == null ? (
            <span className="pending-price">Precio por confirmar</span>
          ) : (
            <>
              <strong>{money(price)}</strong>
              {product.promo_price != null && product.base_price != null && !branchId && (
                <del>{money(product.base_price)}</del>
              )}
            </>
          )}
        </div>
        <p className="availability">
          <MapPin size={13} aria-hidden="true" />
          <span>
            {availability.length
              ? availability.join(" · ")
              : "Disponibilidad por confirmar"}
          </span>
        </p>
        <div className="product-actions">
          <button
            className="button add-button"
            disabled={status === "out_of_stock"}
            onClick={() => add(product.id)}
          >
            <Plus size={18} aria-hidden="true" />
            Agregar al carrito
          </button>
          <WhatsappButton
            product={product}
            className="product-whatsapp"
            label=""
          />
        </div>
        <div className={styles.foot}>
          <span className={styles.cartFeedback} key={quantity}>
            {quantity > 0 && (
              <><Check size={13} aria-hidden="true" /> En carrito · {quantity}</>
            )}
          </span>
          <Link className="detail-link" href={`/producto/${product.slug}`}>
            Ver detalles <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
