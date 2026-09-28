"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Datos serializables para cada marcador del mapa (solo modo demo).
export type MapStore = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  address: string | null;
  schedule: string | null;
  phone: string;
  description: string | null;
  mapsUrl: string | null;
};

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const PIN = (color: string) =>
  `<svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg"><path d="M17 1C8.7 1 2 7.7 2 16c0 11 15 29 15 29s15-18 15-29C32 7.7 25.3 1 17 1z" fill="${color}" stroke="#ffffff" stroke-width="2"/><circle cx="17" cy="16" r="7" fill="#ffffff"/></svg>`;

function popupHtml(store: MapStore) {
  const line = (label: string, value: string | null) =>
    value
      ? `<p class="store-map-line"><span>${label}</span>${escapeHtml(value)}</p>`
      : "";
  const cta = store.mapsUrl
    ? `<a class="store-map-link" href="${store.mapsUrl}" target="_blank" rel="noopener noreferrer">Ver ubicación <span aria-hidden="true">↗</span></a>`
    : "";
  return `<div class="store-map-popup">
    <span class="store-map-city">${escapeHtml(store.city)}</span>
    <h3>${escapeHtml(store.name)}</h3>
    ${line("Dirección", store.address)}
    ${line("Horario", store.schedule)}
    ${line("Teléfono", store.phone)}
    ${store.description ? `<p class="store-map-desc">${escapeHtml(store.description)}</p>` : ""}
    ${cta}
  </div>`;
}

export default function LeafletMap({ stores }: { stores: MapStore[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || stores.length === 0) return;
    const map = L.map(containerRef.current, {
      center: [14.3, -87.75],
      zoom: 8,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markers = stores.map((store) => {
      const icon = L.divIcon({
        className: "store-map-pin",
        html: PIN("#e8492f"),
        iconSize: [34, 46],
        iconAnchor: [17, 44],
        popupAnchor: [0, -40],
      });
      const marker = L.marker([store.lat, store.lng], { icon }).addTo(map);
      marker.bindPopup(popupHtml(store), { maxWidth: 280, minWidth: 230 });
      return marker;
    });

    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.25));
    } else if (markers.length === 1) {
      map.setView([markers[0].getLatLng().lat, markers[0].getLatLng().lng], 13);
    }

    return () => {
      map.remove();
    };
  }, [stores]);

  return (
    <div
      ref={containerRef}
      className="store-map"
      role="region"
      aria-label="Mapa de tiendas de demostración"
    />
  );
}