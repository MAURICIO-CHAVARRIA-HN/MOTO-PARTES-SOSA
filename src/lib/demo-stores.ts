// Datos DEMO de sucursales para el mapa interactivo (modo CATALOG_DEMO=true).
// Los negocios, direcciones, horarios y teléfonos son ficticios y de prueba:
// existen únicamente para demostrar el mapa. No representan comercios reales.
// Las coordenadas son aproximadas y corresponden a ciudades reales de la región
// de La Paz y Marcala (Honduras) únicamente como referencia geográfica.

export type DemoStore = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  address: string;
  schedule: string;
  phone: string;
  description: string;
};

export const demoStores: DemoStore[] = [
  {
    id: "demo-store-la-paz-1",
    name: "Rancing Mau · La Paz Centro (DEMO)",
    city: "La Paz, Honduras",
    lat: 14.3186,
    lng: -87.6834,
    address: "Av. la Paz 2ª avenida, edificio demo (dirección ficticia)",
    schedule: "Lun–Sáb 8:00–18:00",
    phone: "(+504) 0000-0001",
    description:
      "Sucursal principal de demostración: repuestos, lubricantes y accesorios para motos.",
  },
  {
    id: "demo-store-la-paz-2",
    name: "Rancing Mau · La Paz Norte (DEMO)",
    city: "La Paz, Honduras",
    lat: 14.3245,
    lng: -87.6778,
    address: "Barrio El Calvario, frente al parque (dirección ficticia)",
    schedule: "Lun–Sáb 8:30–17:30",
    phone: "(+504) 0000-0002",
    description:
      "Sucursal de demostración orientada a mecánica y partes de transmisión.",
  },
  {
    id: "demo-store-marcala",
    name: "Rancing Mau · Marcala (DEMO)",
    city: "Marcala, Honduras",
    lat: 14.1572,
    lng: -88.0356,
    address: "Calle principal, contiguo al mercado (dirección ficticia)",
    schedule: "Lun–Sáb 8:00–17:00",
    phone: "(+504) 0000-0003",
    description:
      "Punto mayorista de demostración para la zona de Marcala y alrededores.",
  },
  {
    id: "demo-store-siguatepeque",
    name: "Rancing Mau · Siguatepeque (DEMO)",
    city: "Siguatepeque, Honduras",
    lat: 14.598,
    lng: -87.833,
    address: "Salida a Comayagua, local comercial demo (dirección ficticia)",
    schedule: "Lun–Sáb 9:00–18:00",
    phone: "(+504) 0000-0004",
    description:
      "Sucursal de demostración de llantas y suspensiones en el corredor central.",
  },
  {
    id: "demo-store-comayagua",
    name: "Rancing Mau · Comayagua (DEMO)",
    city: "Comayagua, Honduras",
    lat: 14.4511,
    lng: -87.637,
    address: "Barrio La Alameda, 3ª calle (dirección ficticia)",
    schedule: "Lun–Sáb 8:30–17:30",
    phone: "(+504) 0000-0005",
    description:
      "Sucursal de demostración con enfoque en sistema eléctrico y arranques.",
  },
  {
    id: "demo-store-la-esperanza",
    name: "Rancing Mau · La Esperanza (DEMO)",
    city: "La Esperanza, Intibucá, Honduras",
    lat: 14.3144,
    lng: -88.1788,
    address: "Av. de las Flores, esquina opuesta al parque (dirección ficticia)",
    schedule: "Lun–Sáb 9:00–17:00",
    phone: "(+504) 0000-0006",
    description:
      "Sucursal de demostración para la zona de Intibucá y la frontera de la sierra.",
  },
  {
    id: "demo-store-jesus-de-otoro",
    name: "Rancing Mau · Jesús de Otoro (DEMO)",
    city: "Jesús de Otoro, Honduras",
    lat: 14.483,
    lng: -88.002,
    address: "Calle 21 de Octubre, local demo (dirección ficticia)",
    schedule: "Lun–Sáb 8:00–18:00",
    phone: "(+504) 0000-0007",
    description:
      "Punto de demostración entre La Paz y Marcala, enfocado en repuestos universales.",
  },
];