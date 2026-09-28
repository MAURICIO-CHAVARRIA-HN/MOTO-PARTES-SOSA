"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container empty-state">
      <h1>No pudimos cargar esta página</h1>
      <p>Revisa tu conexión e inténtalo de nuevo.</p>
      <button className="button primary" onClick={reset}>
        Intentar de nuevo
      </button>
    </div>
  );
}
