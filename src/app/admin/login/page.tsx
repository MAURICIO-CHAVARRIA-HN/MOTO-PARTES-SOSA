import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { hasSupabase } from "@/lib/supabase/server";
import { AdminLogin } from "@/components/admin-login";
export const metadata: Metadata = {
  title: "Acceso administrativo",
  robots: { index: false, follow: false },
};
export default function LoginPage() {
  return (
    <div className="container page-section">
      <div className="admin-card">
        <LockKeyhole size={30} />
        <span className="eyebrow">RANCING MAU</span>
        <h1>Administración</h1>
        {hasSupabase() ? (
          <>
            <p>Inicia sesión con tu cuenta autorizada.</p>
            <AdminLogin />
          </>
        ) : (
          <>
            <p>
              El acceso administrativo estará disponible al configurar la base
              de datos y la primera cuenta autorizada.
            </p>
            <div className="notice">
              Configuración pendiente. No hay cuentas de demostración ni
              contraseñas predeterminadas.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
