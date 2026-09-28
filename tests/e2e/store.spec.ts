import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("search, brand filters and empty results", async ({ page }) => {
  await page.goto("/catalogo");
  await expect(page.locator(".product-card")).toHaveCount(5);
  if (
    await page.getByRole("button", { name: "Filtros", exact: true }).isVisible()
  )
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Marca", { exact: true }).selectOption("Bajaj");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page
    .getByRole("textbox", { name: "Buscar en el catálogo" })
    .fill("zz-no-existe");
  await expect(
    page.getByRole("heading", { name: "No encontramos productos" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Limpiar filtros", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(5);
});

test("cart combines quantities, persists, removes and confirms clearing", async ({
  page,
}) => {
  await page.goto("/catalogo");
  const add = page
    .getByRole("button", { name: "Agregar al carrito", exact: true })
    .first();
  await add.click();
  await add.click();
  await expect(
    page.getByRole("button", { name: "Abrir carrito, 2 unidades" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Abrir carrito, 2 unidades" }).click();
  const dialog = page.getByRole("dialog", { name: "Tu carrito · 2" });
  await expect(dialog.locator(".cart-line")).toHaveCount(1);
  await expect(
    dialog.getByRole("button", { name: "Solicitar compra por WhatsApp" }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: /Aumentar cantidad/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Tu carrito · 3" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Vaciar carrito", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.locator(".cart-line")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Vaciar carrito", exact: true })
    .click();
  await page.getByRole("button", { name: "Sí, vaciar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tu próxima ruta empieza aquí" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("theme persists and respects reduced motion and system preference", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Cambiar entre modo claro y oscuro" })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("contact requires a branch and resolves central fallback", async ({
  page,
}) => {
  await page.goto("/contacto");
  await page
    .getByRole("button", { name: "Consultar por WhatsApp", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Elige tu sucursal" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Tu sucursal", { exact: true })
    .selectOption({ label: "MARCALA TIENDA 3" });
  const link = dialog.getByRole("link", { name: "Continuar a WhatsApp" });
  const href = await link.getAttribute("href");
  expect(href).toContain("https://wa.me/50497491004");
  expect(new URL(href!).searchParams.get("text")).toContain("MARCALA TIENDA 3");
});

test("public reviews page validates the form without a review service", async ({
  page,
}) => {
  await page.goto("/resenas");
  await expect(
    page.getByRole("heading", { name: "Reseñas de nuestros clientes." }),
  ).toBeVisible();
  await page.getByLabel("Sucursal que visitaste").selectOption({ index: 1 });
  await page.getByRole("button", { name: "5 estrellas", exact: true }).click();
  await page.getByLabel("Comentario").fill("La atención fue clara y amable.");
  await page.getByRole("button", { name: "Enviar reseña", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText(
    "Las reseñas aún no están habilitadas.",
  );
});

test("draft checkout blocked on server, malformed cart rejected, admin gated", async ({
  page,
  request,
}) => {
  expect(
    (
      await request.post("/api/solicitud", {
        data: { items: [{ product_id: "preview-motul-7100", quantity: 1 }] },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/solicitud", {
        data: { items: [{ product_id: "preview-motul-7100", quantity: -1 }] },
      })
    ).status(),
  ).toBe(400);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(
    page.getByText(
      "Configuración pendiente. No hay cuentas de demostración ni contraseñas predeterminadas.",
    ),
  ).toBeVisible();
  for (const path of [
    "/admin/productos",
    "/admin/categorias",
    "/admin/marcas",
    "/admin/sucursales",
    "/admin/revision",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login/);
  }
});

test("home and catalog have no horizontal overflow or WCAG AA violations", async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme as "light" | "dark" });
    for (const path of ["/", "/catalogo"]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(result.violations).toEqual([]);
      await page.screenshot({
        path: `test-results/${testInfo.project.name}-${theme}-${path === "/" ? "home" : "catalog"}.png`,
        fullPage: true,
      });
    }
  }
});
