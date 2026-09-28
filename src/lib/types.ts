export type ProductStatus =
  "available" | "out_of_stock" | "promotion" | "pending";
export type Branch = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string | null;
  schedule: string | null;
  whatsapp_number: string | null;
  google_maps_url: string | null;
  lat?: number;
  lng?: number;
  demo?: boolean;
  description?: string | null;
};
export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  description: string;
  compatibility: string | null;
  image: string;
  base_price: number | null;
  promo_price: number | null;
  general_status: ProductStatus;
  featured: boolean;
  branches: {
    branch_id: string;
    available: boolean;
    branch_price: number | null;
    branch_promo_price: number | null;
  }[];
};
export type Catalog = {
  products: Product[];
  branches: Branch[];
  preview: boolean;
  demo: boolean;
};
export type CartItem = { product_id: string; quantity: number };
