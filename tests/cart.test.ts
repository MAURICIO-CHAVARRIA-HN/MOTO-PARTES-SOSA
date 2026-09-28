import test from "node:test";
import assert from "node:assert/strict";
import {
  cartItemsSchema,
  normalizeCart,
  orderMessages,
  productPrice,
  quoteCart,
  readCart,
} from "../src/lib/cart";
import { whatsappLink } from "../src/lib/config";
import type { Product } from "../src/lib/types";

const product: Product = {
  id: "oil",
  slug: "oil",
  name: "Aceite de prueba",
  sku: "TEST-01",
  brand: "Prueba",
  category: "Prueba",
  description: "Fixture de pruebas, no usar en el catálogo.",
  compatibility: null,
  image: "/test.png",
  base_price: 125.35,
  promo_price: null,
  featured: false,
  general_status: "available",
  branches: [
    {
      branch_id: "branch-1",
      available: true,
      branch_price: 100,
      branch_promo_price: 90,
    },
  ],
};

test("cart restores only versioned identifiers and valid quantities", () => {
  assert.deepEqual(readCart("broken"), []);
  assert.deepEqual(readCart(JSON.stringify({ version: 2, items: [] })), []);
  assert.deepEqual(
    readCart(
      JSON.stringify({
        version: 1,
        items: [{ product_id: "oil", quantity: -1 }],
      }),
    ),
    [],
  );
  assert.deepEqual(
    readCart(
      JSON.stringify({
        version: 1,
        items: [
          { product_id: "oil", quantity: 2, price: 0.01, name: "manipulated" },
        ],
      }),
    ),
    [{ product_id: "oil", quantity: 2 }],
  );
});

test("same product merges and quantity is capped at 99", () => {
  assert.deepEqual(
    normalizeCart([
      { product_id: "oil", quantity: 2 },
      { product_id: "oil", quantity: 3 },
    ]),
    [{ product_id: "oil", quantity: 5 }],
  );
  assert.equal(
    normalizeCart([
      { product_id: "oil", quantity: 99 },
      { product_id: "oil", quantity: 2 },
    ])[0].quantity,
    99,
  );
  assert.equal(
    cartItemsSchema.safeParse([{ product_id: "oil", quantity: 1.5 }]).success,
    false,
  );
});

test("server quote uses current catalog prices with cent-accurate totals", () => {
  const result = quoteCart([{ product_id: "oil", quantity: 3 }], [product]);
  assert.equal(result.total, 376.05);
  const updated = quoteCart(
    [{ product_id: "oil", quantity: 3 }],
    [{ ...product, base_price: 130 }],
  );
  assert.equal(updated.total, 390);
});

test("branch overrides, promotions, removed products and availability are respected", () => {
  assert.equal(productPrice(product, "branch-1"), 90);
  assert.equal(
    quoteCart([{ product_id: "oil", quantity: 2 }], [product], "branch-1")
      .total,
    180,
  );
  assert.throws(
    () => quoteCart([{ product_id: "removed", quantity: 1 }], [product]),
    /ya no está/,
  );
  assert.throws(
    () =>
      quoteCart(
        [{ product_id: "oil", quantity: 1 }],
        [product],
        "unknown-branch",
      ),
    /no tiene disponibilidad/,
  );
  assert.throws(
    () =>
      quoteCart(
        [{ product_id: "oil", quantity: 1 }],
        [{ ...product, general_status: "out_of_stock" }],
      ),
    /agotado/,
  );
});

test("unknown prices stay unknown instead of appearing free", () => {
  const quote = quoteCart(
    [{ product_id: "oil", quantity: 1 }],
    [{ ...product, base_price: null }],
  );
  assert.equal(quote.incomplete, true);
  assert.equal(quote.items[0].subtotal, null);
});

test("WhatsApp includes all items, totals and branch; always central number", () => {
  const [message] = orderMessages(
    quoteCart([{ product_id: "oil", quantity: 2 }], [product]),
    "LA PAZ TIENDA 1",
  );
  assert.match(message, /TEST-01/);
  assert.match(message, /Cantidad: 2/);
  assert.match(message, /L 250.70/);
  assert.match(message, /LA PAZ TIENDA 1/);
  const url = new URL(whatsappLink(message));
  assert.equal(url.pathname, "/50497491004");
  assert.equal(url.searchParams.get("text"), message);
  assert.equal(
    new URL(whatsappLink(message, "invalid")).pathname,
    "/50497491004",
  );
});

test("long orders split on whole product boundaries without losing products", () => {
  const products = Array.from({ length: 60 }, (_, index) => ({
    ...product,
    id: `p-${index}`,
    sku: `SKU-${String(index).padStart(3, "0")}`,
    name: `Repuesto de prueba número ${index} con descripción y acentos áéíóú`,
  }));
  const quote = quoteCart(
    products.map((item) => ({ product_id: item.id, quantity: 1 })),
    products,
  );
  const messages = orderMessages(quote, "MARCALA TIENDA 3", 2500);
  assert.ok(messages.length > 1);
  for (const message of messages) {
    assert.ok(whatsappLink(message).length <= 2500);
    assert.match(message, /Total estimado/);
  }
  for (const item of products)
    assert.equal(
      messages.filter((message) => message.includes(item.sku)).length,
      1,
    );
});
