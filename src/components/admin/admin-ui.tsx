"use client";
import type { ReactNode } from "react";
import { Check, AlertTriangle } from "lucide-react";
import type { AdminState } from "@/lib/admin-validation";

export function AdminStatus({ state }: { state: AdminState }) {
  if (state.ok && !state.message) return null;
  return (
    <div
      className={`admin-status ${state.ok ? "success" : "error"}`}
      role="status"
      aria-live="polite"
    >
      {state.ok ? <Check size={17} /> : <AlertTriangle size={17} />}
      <span>{state.ok ? state.message : state.error}</span>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="admin-hint">{hint}</p>}
    </div>
  );
}

export function CheckField({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="admin-check">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}