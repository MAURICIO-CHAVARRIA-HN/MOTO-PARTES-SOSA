import "server-only";
import { createClient } from "@supabase/supabase-js";

export function hasSupabaseServiceRole() {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function createSupabaseAdmin() {
  if (!hasSupabaseServiceRole())
    throw new Error("La clave de servicio de Supabase no está configurada.");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
