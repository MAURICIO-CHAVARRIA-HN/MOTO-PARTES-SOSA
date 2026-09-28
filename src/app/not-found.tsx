import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container empty-state">
      <span className="eyebrow">404 · FUERA DE RUTA</span>
      <h1>Esta página no está disponible</h1>
      <p>El producto pudo haber sido retirado o el enlace es incorrecto.</p>
      <Link className="button primary" href="/catalogo">
        Volver al catálogo
      </Link>
    </div>
  );
}
