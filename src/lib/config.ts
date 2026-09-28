export const business = {
  name: "Rancing Mau",
  whatsapp: "50497491004",
  phoneLabel: "9749-1004",
  disclaimer:
    "Disponibilidad y precio final sujetos a confirmación de Rancing Mau.",
};

export function whatsappLink(message: string, number = business.whatsapp) {
  const phone = /^\d{8,15}$/.test(number) ? number : business.whatsapp;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function money(value: number) {
  return `L ${value.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
