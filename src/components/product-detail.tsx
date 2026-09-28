"use client";
import Image from "next/image";
import { useState } from "react";
import { Plus, Minus, ShoppingBag, Info } from "lucide-react";
import type { Product } from "@/lib/types";
import { business, money } from "@/lib/config";
import { productPrice } from "@/lib/cart";
import { useStore } from "./store-provider";
import { BranchSelect } from "./branch-select";
import { WhatsappButton } from "./whatsapp-button";

export function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { add, branchId, branches } = useStore();
  const price = productPrice(product, branchId);
  return (
    <div className="product-detail">
      <div className="detail-image">
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 750px) 90vw, 50vw"
        />
      </div>
      <div className="detail-info">
        <span className="eyebrow">
          {product.brand} / {product.category}
        </span>
        <h1>{product.name}</h1>
        <p className="muted small">Código: {product.sku}</p>
        <strong className="detail-price">
          {price == null ? "Precio por confirmar" : money(price)}
        </strong>
        <p className="detail-description">{product.description}</p>
        {product.compatibility && (
          <p className="detail-compat">
            <strong>Compatibilidad:</strong> {product.compatibility}
          </p>
        )}
        <BranchSelect />
        <div className="branch-availability">
          {branches.map((branch) => {
            const assignment = product.branches.find(
              (item) => item.branch_id === branch.id,
            );
            return (
              <div key={branch.id}>
                <span>{branch.name}</span>
                <span
                  className={assignment?.available ? "available-text" : "muted"}
                >
                  {assignment
                    ? assignment.available
                      ? "Disponible"
                      : "Agotado"
                    : "Por confirmar"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="detail-buy">
          <div className="quantity">
            <button
              aria-label="Disminuir cantidad"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity === 1}
            >
              <Minus size={16} />
            </button>
            <span>{quantity}</span>
            <button
              aria-label="Aumentar cantidad"
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
              disabled={quantity === 99}
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            className="button primary"
            disabled={product.general_status === "out_of_stock"}
            onClick={() => add(product.id, quantity)}
          >
            <ShoppingBag size={18} />
            Agregar al carrito
          </button>
        </div>
        <WhatsappButton product={product} />
        <p className="small muted disclaimer">
          <Info size={17} />
          {business.disclaimer}
        </p>
      </div>
    </div>
  );
}
