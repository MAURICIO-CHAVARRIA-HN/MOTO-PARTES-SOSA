import { z } from "zod";
import { money, whatsappLink } from "./config";
import type { CartItem, Product } from "./types";

export const cartItemsSchema = z
  .array(
    z.object({
      product_id: z.string().min(1).max(100),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .max(100);

export function normalizeCart(items: CartItem[]): CartItem[] {
  const quantities = new Map<string, number>();
  for (const item of items)
    quantities.set(
      item.product_id,
      Math.min(99, (quantities.get(item.product_id) ?? 0) + item.quantity),
    );
  return Array.from(quantities, ([product_id, quantity]) => ({
    product_id,
    quantity,
  }));
}

export function readCart(raw: string | null): CartItem[] {
  try {
    const stored = JSON.parse(raw ?? "null");
    if (stored?.version !== 1) return [];
    const result = cartItemsSchema.safeParse(stored.items);
    return result.success ? normalizeCart(result.data) : [];
  } catch {
    return [];
  }
}

export function productPrice(
  product: Product,
  branchId?: string,
): number | null {
  const branch = product.branches.find((item) => item.branch_id === branchId);
  if (branch?.branch_price != null)
    return branch.branch_promo_price ?? branch.branch_price;
  return product.promo_price ?? product.base_price;
}

export type Quote = {
  items: {
    product: Product;
    quantity: number;
    price: number | null;
    subtotal: number | null;
  }[];
  total: number;
  incomplete: boolean;
};

export function quoteCart(
  items: CartItem[],
  products: Product[],
  branchId?: string,
): Quote {
  const lines = normalizeCart(items).map((item) => {
    const product = products.find((product) => product.id === item.product_id);
    if (!product)
      throw new Error(
        "Un producto ya no está en el catálogo. Elimínalo del carrito y vuelve a intentarlo.",
      );
    if (product.general_status === "out_of_stock")
      throw new Error(
        `${product.name} está agotado. Retíralo del carrito para continuar.`,
      );
    if (
      branchId &&
      !product.branches.some(
        (branch) => branch.branch_id === branchId && branch.available,
      )
    ) {
      throw new Error(
        `${product.name} no tiene disponibilidad confirmada en la sucursal seleccionada.`,
      );
    }
    const price = productPrice(product, branchId);
    return {
      product,
      quantity: item.quantity,
      price,
      subtotal:
        price == null ? null : (Math.round(price * 100) * item.quantity) / 100,
    };
  });
  return {
    items: lines,
    total:
      lines.reduce(
        (sum, item) => sum + Math.round((item.subtotal ?? 0) * 100),
        0,
      ) / 100,
    incomplete: lines.some((item) => item.price == null),
  };
}

// Budget measured on the fully encoded URL, including numbering and repeated summary.
// Whole product blocks stay intact, and every message carries the full order total.
export function orderMessages(
  quote: Quote,
  branchName: string,
  maxUrlLength = 7500,
): string[] {
  const header =
    "Hola, Rancing Mau. Quiero solicitar los siguientes repuestos:";
  const summary = `\n\nTotal estimado${quote.incomplete ? " de productos con precio" : ""}: ${money(quote.total)}${quote.incomplete ? "\nHay precios pendientes de confirmar; este importe no es el total completo." : ""}\nSucursal preferida: ${branchName}\n\nPor favor, confirmen disponibilidad y precio final. Gracias.`;
  const blocks = quote.items.map(
    ({ product, quantity, price, subtotal }, index) =>
      `${index + 1}. ${product.name} — SKU: ${product.sku}\n   Cantidad: ${quantity}\n   Precio unitario: ${price == null ? "Por confirmar" : money(price)}\n   Subtotal: ${subtotal == null ? "Por confirmar" : money(subtotal)}`,
  );
  const groups: string[] = [];
  let current = "";
  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (
      whatsappLink(`[Mensaje 100/100]\n${header}\n\n${candidate}${summary}`)
        .length > maxUrlLength
    ) {
      if (!current)
        throw new Error(
          "Un artículo tiene una descripción demasiado extensa para WhatsApp.",
        );
      groups.push(current);
      current = block;
      if (
        whatsappLink(`[Mensaje 100/100]\n${header}\n\n${current}${summary}`)
          .length > maxUrlLength
      )
        throw new Error("Un artículo es demasiado extenso para WhatsApp.");
    } else current = candidate;
  }
  if (current) groups.push(current);
  return groups.map(
    (group, index) =>
      `${groups.length > 1 ? `[Mensaje ${index + 1}/${groups.length}]\n` : ""}${header}\n\n${group}${summary}`,
  );
}
