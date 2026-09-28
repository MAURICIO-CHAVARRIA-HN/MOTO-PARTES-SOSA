import type { Branch, Product } from "./types";

export const initialBranches: Branch[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "LA PAZ TIENDA 1",
    slug: "la-paz-tienda-1",
    city: "La Paz",
    address: null,
    schedule: null,
    whatsapp_number: null,
    google_maps_url: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "LA PAZ TIENDA 2",
    slug: "la-paz-tienda-2",
    city: "La Paz",
    address: null,
    schedule: null,
    whatsapp_number: null,
    google_maps_url: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "MARCALA TIENDA 3",
    slug: "marcala-tienda-3",
    city: "Marcala",
    address: null,
    schedule: null,
    whatsapp_number: null,
    google_maps_url: null,
  },
];

// Vista previa local: los nombres se transcriben de imágenes aportadas.
// No son registros aprobados, precios, existencias ni compatibilidades verificadas.
const candidates = [
  ["motul-7100", "Aceite Motul 7100 4T", "Motul", "aceitemotul7100.jpeg"],
  [
    "castrol-actevo",
    "Aceite Castrol Actevo 4T",
    "Castrol",
    "aceiteactevo.jpeg",
  ],
  [
    "bajaj-sintetico",
    "Aceite Bajaj 4T sintético",
    "Bajaj",
    "aceitebajaj1.2fullsintetico.jpeg",
  ],
  ["yamalube", "Aceite Yamalube", "Yamalube", "yamalubeaceite.jpeg"],
  ["bajaj-4t", "Aceite Bajaj 4T", "Bajaj", "aceite1.2bajaj.webp"],
];
export const previewProducts: Product[] = candidates.map(
  ([slug, name, brand, image], index) => ({
    id: `preview-${slug}`,
    slug,
    name,
    brand,
    image: `/api/preview-image/${image}`,
    sku: `DEMO-${String(index + 1).padStart(3, "0")}`,
    category: "Aceites y lubricantes",
    description:
      "Imagen de referencia para la vista previa del catálogo. La presentación, especificación, compatibilidad y disponibilidad deben ser confirmadas por Rancing Mau antes de publicar este producto.",
    compatibility: null,
    base_price: null,
    promo_price: null,
    general_status: "pending",
    featured: index < 4,
    branches: [],
  }),
);
