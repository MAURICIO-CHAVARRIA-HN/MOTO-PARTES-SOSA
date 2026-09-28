import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { initialBranches, previewProducts } from "./preview";
import { demoEnabled, demoProducts, demoBranches } from "./demo";
import { hasSupabase } from "./supabase/server";
import type { Catalog, Product, Branch } from "./types";

export const getCatalog = cache(async (): Promise<Catalog> => {
  await connection();
  // Demo is authoritative in development regardless of a configured database.
  if (demoEnabled()) {
    return {
      products: demoProducts,
      branches: demoBranches,
      preview: false,
      demo: true,
    };
  }
  if (!hasSupabase()) {
    // A production deployment never silently publishes preview products.
    const preview =
      process.env.NODE_ENV !== "production" &&
      process.env.CATALOG_PREVIEW !== "false";
    return {
      products: preview ? previewProducts : [],
      branches: initialBranches,
      preview,
      demo: false,
    };
  }
  // Anonymous client intentionally prevents an admin session from leaking draft data.
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const [products, branches] = await Promise.all([
    client.from("public_catalog").select("*"),
    client
      .from("branches")
      .select(
        "id,name,slug,city,address,schedule,whatsapp_number,google_maps_url",
      )
      .eq("active", true)
      .order("name"),
  ]);
  if (products.error || branches.error)
    throw new Error(
      "No se pudo cargar el catálogo. Intenta de nuevo en unos minutos.",
    );
  return {
    products: (products.data ?? []) as Product[],
    branches: (branches.data ?? []) as Branch[],
    preview: false,
    demo: false,
  };
});
