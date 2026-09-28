import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { getAnalyticsStats } from "@/lib/analytics";

export const metadata: Metadata = { title: "Estadísticas", robots: { index: false, follow: false } };

export default async function AdminAnalyticsPage() {
  const session = await requireAdmin();
  let stats: Awaited<ReturnType<typeof getAnalyticsStats>>;
  let statsUnavailable = false;
  try {
    stats = await getAnalyticsStats(session.client);
  } catch (error) {
    console.error("No se pudieron cargar las estadísticas:", error);
    statsUnavailable = true;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tegucigalpa" }).format(new Date());
    stats = { today: 0, last7Days: 0, last30Days: 0, daily: Array(30).fill(null).map(() => ({ day: today, views: 0 })), pages: [] };
  }
  const max = Math.max(1, ...stats.daily.map((item) => item.views));
  return (
    <div className="admin-panel">
      <div className="section-heading"><div><span className="eyebrow">DATOS AGREGADOS</span><h1>Estadísticas de visitas</h1></div></div>
      {statsUnavailable && <p className="notice" role="status">Las estadísticas aún no están habilitadas. Aplica la migración de reseñas y estadísticas en Supabase para comenzar.</p>}
      <p className="notice">Una visita cuenta como una carga de página pública por sesión del navegador. No es una persona única: una misma persona puede generar varias visitas. No se guardan nombres, correos ni direcciones IP.</p>
      <div className="admin-stats"><div><strong>{stats.today}</strong><span>Hoy</span></div><div><strong>{stats.last7Days}</strong><span>Últimos 7 días</span></div><div><strong>{stats.last30Days}</strong><span>Últimos 30 días</span></div></div>
      <section className="admin-section analytics-chart"><div className="admin-section-head"><h2>Visitas por día</h2><span className="admin-hint">Últimos 30 días</span></div><div className="analytics-bars" aria-label="Gráfica de visitas por día">{stats.daily.map((item) => <div className="analytics-bar-wrap" key={item.day} title={`${item.day}: ${item.views}`}><div className="analytics-bar" style={{ height: `${Math.max(item.views ? 8 : 2, (item.views / max) * 100)}%` }} /><small>{item.day.slice(8)}</small></div>)}</div></section>
      <section className="admin-section"><div className="admin-section-head"><h2>Páginas más visitadas</h2></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Página</th><th>Visitas</th></tr></thead><tbody>{stats.pages.map((page) => <tr key={page.path}><td>{page.path}</td><td>{page.views}</td></tr>)}{!stats.pages.length && <tr><td colSpan={2} className="admin-hint">Aún no hay datos agregados.</td></tr>}</tbody></table></div></section>
    </div>
  );
}
