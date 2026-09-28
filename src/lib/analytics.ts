import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

function localDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tegucigalpa",
  }).format(now);
}

function shiftDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export type AnalyticsStats = {
  today: number;
  last7Days: number;
  last30Days: number;
  daily: { day: string; views: number }[];
  pages: { path: string; views: number }[];
};

export async function getAnalyticsStats(
  client: SupabaseClient,
): Promise<AnalyticsStats> {
  const today = localDate();
  const start = shiftDate(today, -29);
  const { data, error } = await client
    .from("page_views_daily")
    .select("day,path,views")
    .gte("day", start)
    .lte("day", today)
    .order("day", { ascending: true });
  if (error) throw new Error("No se pudieron cargar las estadísticas.");
  const rows = (data ?? []) as { day: string; path: string; views: number }[];
  const daily = Array.from({ length: 30 }, (_, index) => {
    const day = shiftDate(today, index - 29);
    return {
      day,
      views: rows
        .filter((row) => row.day === day)
        .reduce((sum, row) => sum + Number(row.views), 0),
    };
  });
  const pages = [...rows.reduce((map, row) => {
    map.set(row.path, (map.get(row.path) ?? 0) + Number(row.views));
    return map;
  }, new Map<string, number>())]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);
  return {
    today: daily.at(-1)?.views ?? 0,
    last7Days: daily.slice(-7).reduce((sum, row) => sum + row.views, 0),
    last30Days: daily.reduce((sum, row) => sum + row.views, 0),
    daily,
    pages,
  };
}
