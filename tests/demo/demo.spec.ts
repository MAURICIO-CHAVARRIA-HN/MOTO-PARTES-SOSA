import { expect, test } from "@playwright/test";

test("demo catalog shows priced products and a full WhatsApp order works", async ({
  page,
  request,
}) => {
  await page.goto("/catalogo");
  await expect(page.getByText(/MODO DEMO/)).toBeVisible();
  await expect(page.locator(".results-toolbar [role=status]")).toHaveText("100 productos");
  await expect(page.locator(".product-card")).toHaveCount(12);
  await expect(page.getByText("L 320.00")).toBeVisible();

  while (await page.getByRole("button", { name: "Ver más productos", exact: true }).count()) {
    await page.getByRole("button", { name: "Ver más productos", exact: true }).click();
  }
  await expect(page.locator(".product-card")).toHaveCount(100);

  await page
    .getByRole("button", { name: "Agregar al carrito", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Agregar al carrito", exact: true })
    .nth(1)
    .click();
  await page.getByRole("button", { name: "Abrir carrito, 2 unidades" }).click();
  const dialog = page.getByRole("dialog", { name: "Tu carrito · 2" });
  await expect(
    dialog.getByRole("button", { name: "Solicitar compra por WhatsApp" }),
  ).toBeEnabled();
  await expect(dialog).toContainText("L 564.00");
  await dialog
    .getByRole("button", { name: "Solicitar compra por WhatsApp" })
    .click();
  await expect(
    dialog.getByRole("link", { name: "Abrir WhatsApp", exact: true }),
  ).toBeVisible();

  // Server quote: all items, totals and the central number.
  const response = await request.post("/api/solicitud", {
    data: {
      items: [
        { product_id: "demo-aceite-motul-7100", quantity: 1 },
        { product_id: "demo-aceite-castrol-actevo", quantity: 1 },
      ],
      branch_id: "00000000-0000-4000-8000-000000000001",
    },
  });
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.total).toBe(564);
  expect(payload.messages).toHaveLength(1);
  const url = new URL(payload.messages[0].url);
  expect(url.pathname).toBe("/50497491004");
  const text = url.searchParams.get("text")!;
  expect(text).toContain("Aceite Motul 7100 4T 10W-40 (DEMO)");
  expect(text).toContain("Aceite Castrol Actevo 4T 20W-50 (DEMO)");
  expect(text).toContain("Total estimado: L 564.00");
  expect(text).toContain("LA PAZ TIENDA 1");

  // Promo price is quoted correctly for a promotion demo product.
  const promo = await request.post("/api/solicitud", {
    data: {
      items: [{ product_id: "demo-aceite-bajaj-4t", quantity: 2 }],
    },
  });
  const promoPayload = await promo.json();
  expect(promoPayload.total).toBe(270);
});
