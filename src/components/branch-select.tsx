"use client";
import { useId } from "react";
import { MapPin } from "lucide-react";
import { useStore } from "./store-provider";

export function BranchSelect({
  label = "Tu sucursal",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  const { branches, branchId, setBranchId } = useStore();
  const id = useId();
  return (
    <div className={`branch-select ${compact ? "compact" : ""}`}>
      <MapPin size={19} aria-hidden="true" />
      <div>
        <label htmlFor={id}>{label}</label>
        <select
          id={id}
          value={branchId}
          onChange={(event) => setBranchId(event.target.value)}
        >
          <option value="">Seleccionar sucursal</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
