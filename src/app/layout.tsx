import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { StoreProvider } from "@/components/store-provider";
import { SiteShell } from "@/components/site-shell";
import { PageViewTracker } from "@/components/page-view-tracker";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rancing Mau | Repuestos para tu moto",
    template: "%s | Rancing Mau",
  },
  description:
    "Explora el catálogo de repuestos de Rancing Mau. Atención en La Paz y Marcala. Prepara tu solicitud y consulta por WhatsApp.",
  robots: { index: false, follow: false }, // Enable only after real business content is approved.
};

const themeScript = `(function(){var t;try{t=localStorage.getItem('rancing-mau:theme')}catch(e){}var m=window.matchMedia('(prefers-color-scheme: dark)');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:m.matches?'dark':'light';m.addEventListener('change',function(e){var s;try{s=localStorage.getItem('rancing-mau:theme')}catch(e){}if(s!=='light'&&s!=='dark')document.documentElement.dataset.theme=e.matches?'dark':'light'})})()`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getCatalog();
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <StoreProvider catalog={catalog}>
          <SiteShell>
            <PageViewTracker />
            {children}
          </SiteShell>
        </StoreProvider>
      </body>
    </html>
  );
}
