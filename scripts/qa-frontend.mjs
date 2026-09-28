import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Run against the isolated demo server; never use this script on production.
const baseURL = "http://127.0.0.1:3002";
const baseline = process.argv.includes("--baseline");
const widths = baseline
  ? [[1440, 900], [390, 844]]
  : [[1440, 900], [1280, 800], [768, 1024], [390, 844], [360, 800]];
const routes = baseline ? ["/"] : ["/", "/catalogo", "/resenas", "/sucursales"];
const themes = baseline ? ["light"] : ["light", "dark"];
const report = { mode: baseline ? "baseline" : "final", pages: [], interactions: [] };
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch();

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  // Reveal content as a visitor scrolls before taking a full-page capture.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(550);
}

try {
  for (const [width, height] of widths) {
    for (const theme of themes) {
      const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme });
      await context.route(/supabase\.(co|in)/, (route) => route.abort());
      const page = await context.newPage();
      let errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      for (const path of routes) {
        errors = [];
        const response = await page.goto(`${baseURL}${path}`);
        await expect(page.getByText(/MODO DEMO/)).toBeVisible();
        await settle(page);
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          width: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          brokenImages: [...document.images]
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => ({ alt: image.alt, src: image.currentSrc })),
          h1Count: document.querySelectorAll("h1").length,
          theme: document.documentElement.dataset.theme,
        }));
        const violations = baseline ? [] : (await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()).violations.map(({ id, impact, nodes }) => ({
            id, impact, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
          }));
        const filename = `test-results/frontend-${report.mode}-${width}-${theme}-${path === "/" ? "home" : path.slice(1)}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        const result = { path, width, theme, status: response.status(), ...metrics, errors: [...errors], violations, filename };
        report.pages.push(result);
        console.log(JSON.stringify({ path, width, theme, status: result.status, overflow: metrics.overflow, brokenImages: metrics.brokenImages.length, errors: errors.length, violations: violations.map((v) => v.id) }));
      }
      await context.close();
    }
  }

  if (!baseline) {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route(/supabase\.(co|in)/, (route) => route.abort());
      const page = await context.newPage();
      await page.goto(baseURL);
      await expect(page.getByText(/MODO DEMO/)).toBeVisible();
      const track = page.locator(".brand-track");
      await track.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const before = await track.evaluate((el) => getComputedStyle(el).transform);
      await page.waitForTimeout(180);
      const after = await track.evaluate((el) => getComputedStyle(el).transform);
      expect(after).not.toBe(before);
      await page.locator(".brand-marquee").hover();
      expect(await track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
      await page.mouse.move(0, 0);
      const firstBrand = page.locator(".brand-marquee a").first();
      await firstBrand.focus();
      expect(await track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await track.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
      report.interactions.push({ width, marquee: "motion, hover, focus and reduced-motion passed" });

      await page.goto(`${baseURL}/catalogo`);
      await page.getByRole("button", { name: "Agregar al carrito", exact: true }).first().click();
      await page.getByRole("button", { name: "Abrir carrito, 1 unidades" }).click();
      await expect(page.getByRole("dialog", { name: "Tu carrito · 1" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
      await page.reload();
      await expect(page.getByRole("button", { name: "Abrir carrito, 1 unidades" })).toBeVisible();
      await page.getByRole("button", { name: "Cambiar entre modo claro y oscuro" }).click();
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      if (width < 600) {
        await page.getByRole("button", { name: "Abrir menú" }).click();
        await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Reseñas" }).click();
        await expect(page).toHaveURL(`${baseURL}/resenas`);
      }
      report.interactions.push({ width, cart: "add, open, close, persistence passed", theme: "toggle and persistence passed", navigation: width < 600 ? "mobile menu passed" : "routes checked" });
      await context.close();
    }
  }
} catch (error) {
  report.failure = error.message;
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(`test-results/frontend-${report.mode}-report.json`, JSON.stringify(report, null, 2));
  if (report.pages.some((page) => page.overflow || page.status !== 200 || page.errors.length || page.violations.length || page.brokenImages.length)) {
    process.exitCode = 1;
  }
}
