"use client";
import { useActionState } from "react";
import {
  deleteBrand,
  deleteBranch,
  deleteCategory,
  deleteProduct,
  saveBrand,
  saveBranch,
  saveCategory,
  reviewSource,
  setProductPublished,
} from "@/app/admin/actions";
import { adminInitialState } from "@/lib/admin-validation";
import { AdminStatus, Field, CheckField } from "./admin-ui";

type LabelRow = { id: string; name: string; active: boolean } | null;
type BranchRow = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  reference: string | null;
  schedule: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  google_maps_url: string | null;
  map_embed_url: string | null;
  active: boolean;
} | null;

function withId(id: string): FormData {
  const data = new FormData();
  data.set("id", id);
  return data;
}

export function LabelForm({
  kind,
  row,
}: {
  kind: "categories" | "brands";
  row: LabelRow;
}) {
  const saved = kind === "categories" ? saveCategory : saveBrand;
  const removed = kind === "categories" ? deleteCategory : deleteBrand;
  const title = kind === "categories" ? "categoría" : "marca";
  const [state, action, pending] = useActionState(saved, adminInitialState);
  const [deleteState, deleteAction, deletePending] = useActionState(
    removed,
    adminInitialState,
  );
  const idKey = row?.id ?? "new";
  return (
    <form action={action} className="admin-inline-card">
      {row ? <input type="hidden" name="id" value={row.id} /> : null}
      <Field label={`Nombre de la ${title}`} htmlFor={`${kind}-${idKey}`}>
        <input
          id={`${kind}-${idKey}`}
          name="name"
          required
          maxLength={100}
          defaultValue={row?.name ?? ""}
        />
      </Field>
      <CheckField
        label="Activa"
        name="active"
        defaultChecked={row?.active ?? true}
      />
      <div className="admin-row-actions">
        <button className="button secondary small-button" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {row && (
          <button
            className="text-button danger"
            type="button"
            disabled={deletePending}
            onClick={() => {
              if (
                window.confirm(
                  `¿Eliminar esta ${title}? No se puede si está en uso.`,
                )
              )
                deleteAction(withId(row.id));
            }}
          >
            Eliminar
          </button>
        )}
      </div>
      {row && <AdminStatus state={deleteState} />}
      <AdminStatus state={state} />
    </form>
  );
}

export function BranchForm({ branch }: { branch: BranchRow }) {
  const [state, action, pending] = useActionState(saveBranch, adminInitialState);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBranch,
    adminInitialState,
  );
  const idKey = branch?.id ?? "new";
  return (
    <form action={action} className="admin-inline-card branch-form">
      {branch ? <input type="hidden" name="id" value={branch.id} /> : null}
      <div className="admin-grid two">
        <Field label="Nombre de la sucursal" htmlFor={`br-name-${idKey}`}>
          <input
            id={`br-name-${idKey}`}
            name="name"
            required
            maxLength={120}
            defaultValue={branch?.name ?? ""}
          />
        </Field>
        <Field label="Ciudad" htmlFor={`br-city-${idKey}`}>
          <input
            id={`br-city-${idKey}`}
            name="city"
            required
            maxLength={120}
            defaultValue={branch?.city ?? ""}
          />
        </Field>
      </div>
      <Field label="Dirección" htmlFor={`br-address-${idKey}`}>
        <input
          id={`br-address-${idKey}`}
          name="address"
          maxLength={300}
          defaultValue={branch?.address ?? ""}
        />
      </Field>
      <Field label="Referencia de ubicación" htmlFor={`br-ref-${idKey}`}>
        <input
          id={`br-ref-${idKey}`}
          name="reference"
          maxLength={300}
          defaultValue={branch?.reference ?? ""}
        />
      </Field>
      <Field label="Horario" htmlFor={`br-schedule-${idKey}`}>
        <input
          id={`br-schedule-${idKey}`}
          name="schedule"
          maxLength={300}
          defaultValue={branch?.schedule ?? ""}
        />
      </Field>
      <div className="admin-grid two">
        <Field
          label="WhatsApp (solo dígitos)"
          htmlFor={`br-wa-${idKey}`}
          hint="Si falta, las consultas usan el número central."
        >
          <input
            id={`br-wa-${idKey}`}
            name="whatsapp_number"
            inputMode="numeric"
            pattern="[0-9]{8,15}"
            maxLength={15}
            defaultValue={branch?.whatsapp_number ?? ""}
          />
        </Field>
        <Field label="Teléfono" htmlFor={`br-phone-${idKey}`}>
          <input
            id={`br-phone-${idKey}`}
            name="phone"
            maxLength={40}
            defaultValue={branch?.phone ?? ""}
          />
        </Field>
      </div>
      <div className="admin-grid two">
        <Field label="Enlace de Google Maps" htmlFor={`br-gmap-${idKey}`}>
          <input
            id={`br-gmap-${idKey}`}
            name="google_maps_url"
            type="url"
            placeholder="https://…"
            defaultValue={branch?.google_maps_url ?? ""}
          />
        </Field>
        <Field label="Enlace de inserción del mapa" htmlFor={`br-embed-${idKey}`}>
          <input
            id={`br-embed-${idKey}`}
            name="map_embed_url"
            type="url"
            placeholder="https://…"
            defaultValue={branch?.map_embed_url ?? ""}
          />
        </Field>
      </div>
      <CheckField
        label="Sucursal activa"
        name="active"
        defaultChecked={branch?.active ?? true}
      />
      <div className="admin-row-actions">
        <button className="button secondary small-button" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {branch && (
          <button
            className="text-button danger"
            type="button"
            disabled={deletePending}
            onClick={() => {
              if (
                window.confirm(
                  "¿Eliminar esta sucursal? No se puede si tiene productos asignados.",
                )
              )
                deleteAction(withId(branch.id));
            }}
          >
            Eliminar
          </button>
        )}
      </div>
      {branch && <AdminStatus state={deleteState} />}
      <AdminStatus state={state} />
    </form>
  );
}

export function ProductRowActions({
  id,
  published,
}: {
  id: string;
  published: boolean;
}) {
  const [pubState, pubAction] = useActionState(setProductPublished, adminInitialState);
  const [delState, delAction] = useActionState(deleteProduct, adminInitialState);
  return (
    <div className="admin-row-actions">
      <AdminStatus state={pubState} />
      <AdminStatus state={delState} />
      <button
        className="text-button"
        type="button"
        onClick={() => {
          const confirmed = window.confirm(
            published
              ? "¿Ocultar este producto del catálogo público?"
              : "¿Publicar este producto en el catálogo?",
          );
          if (confirmed) {
            const form = withId(id);
            form.set("published", published ? "false" : "true");
            pubAction(form);
          }
        }}
      >
        {published ? "Ocultar" : "Publicar"}
      </button>
      <button
        className="text-button danger"
        type="button"
        onClick={() => {
          if (
            window.confirm(
              "¿Eliminar este producto? Esta acción no se puede deshacer.",
            )
          )
            delAction(withId(id));
        }}
      >
        Eliminar
      </button>
    </div>
  );
}

export function ReviewActions({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reviewSource, adminInitialState);
  return (
    <form className="admin-row-actions" action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        className="button primary small-button"
        disabled={pending}
        name="decision"
        value="approved"
      >
        Aprobar fuente
      </button>
      <button
        className="button secondary small-button"
        disabled={pending}
        name="decision"
        value="rejected"
      >
        Rechazar
      </button>
      <AdminStatus state={state} />
    </form>
  );
}