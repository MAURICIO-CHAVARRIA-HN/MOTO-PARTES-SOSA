"use client";
import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
export function AdminLogin() {
  const [state, action, pending] = useActionState(signIn, { error: "" });
  return (
    <form action={action} className="admin-form">
      <label htmlFor="email">Correo electrónico</label>
      <input
        type="email"
        name="email"
        id="email"
        required
        autoComplete="username"
        maxLength={254}
      />
      <label htmlFor="password">Contraseña</label>
      <input
        type="password"
        name="password"
        id="password"
        required
        autoComplete="current-password"
        maxLength={256}
      />
      {state.error && (
        <p className="error-message" role="alert">
          {state.error}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? "Verificando acceso…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
