"use client";
import dynamic from "next/dynamic";
import type { MapStore } from "./leaflet-map";

export type { MapStore };

const LeafletMap = dynamic(
  async () => (await import("./leaflet-map")).default,
  {
    ssr: false,
    loading: () => (
      <div className="store-map store-map-loading" role="status">
        Cargando mapa…
      </div>
    ),
  },
);

export function StoreMap({ stores }: { stores: MapStore[] }) {
  if (stores.length === 0) return null;
  return <LeafletMap stores={stores} />;
}