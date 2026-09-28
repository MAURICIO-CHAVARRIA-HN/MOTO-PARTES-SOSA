"use client";
import { useActionState, useId, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { saveProduct } from "@/app/admin/actions";
import {
  adminInitialState,
  MAX_UPLOAD_BYTES,
} from "@/lib/admin-validation";
import { AdminStatus, Field, CheckField } from "./admin-ui";

type Option = { id: string; name: string };

type BranchOption = {
  id: string;
  name: string;
  active: boolean;
};

type ExistingBranch = {
  branch_id: string;
  available: boolean;
  status: string;
  branch_price: number | null;
  branch_promo_price: number | null;
};

export function AdminProductForm({
  product,
  categories,
  brands,
  branches,
}: {
  product?: {
    id: string;
    name: string;
    sku: string;
    description: string;
    base_price: number | null;
    promo_price: number | null;
    general_status: string;
    featured: boolean;
    published: boolean;
    source_url: string | null;
    source_name: string | null;
    source_checked_at: string | null;
    source_review_status: string;
    category_id: string;
    brand_id: string;
    images: { url: string }[];
    branches: ExistingBranch[];
  } | null;
  categories: Option[];
  brands: Option[];
  branches: BranchOption[];
}) {
  const [state, action, pending] = useActionState(saveProduct, adminInitialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(Boolean(product?.source_url));
  const id = useId();
  const existingImage = product?.images[0]?.url ?? null;
  const assignments = product?.branches ?? [];
  const price = (value: number | null) => (value == null ? "" : String(value));

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form action={action} className="admin-panel-stack">
      {product ? (
        <input type="hidden" name="id" value={product.id} />
      ) : null}
      <AdminStatus state={state} />

      <div className="admin-section">
        <h2>Fotografía</h2>
        <div className="admin-image-pick">
          {(preview || existingImage) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview ?? existingImage ?? ""}
              alt="Vista previa de la fotografía del producto"
              className="admin-thumb"
            />
          )}
          <div className="admin-image-controls">
            <label className="button secondary" htmlFor={`${id}-imagen`}>
              <ImagePlus size={17} />
              {preview || existingImage ? "Reemplazar fotografía" : "Subir fotografía"}
            </label>
            <input
              id={`${id}-imagen`}
              type="file"
              name="imagen"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={onFile}
              className="sr-only"
            />
            <p className="admin-hint">
              JPG, PNG, WebP o AVIF, máximo{" "}
              {Math.round((MAX_UPLOAD_BYTES / 1024 / 1024) * 10) / 10} MB. La
              foto de un producto sin publicar queda en revisión hasta aprobarla.
            </p>
            {existingImage && (
              <label className="admin-check compact">
                <input type="checkbox" name="remove_image" />
                <span>Quitar la fotografía actual</span>
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2>Información general</h2>
        <div className="admin-grid two">
          <Field label="Nombre del producto" htmlFor={`${id}-name`}>
            <input
              id={`${id}-name`}
              name="name"
              required
              maxLength={160}
              defaultValue={product?.name ?? ""}
            />
          </Field>
          <Field label="Código o SKU" htmlFor={`${id}-sku`}>
            <input
              id={`${id}-sku`}
              name="sku"
              required
              maxLength={60}
              defaultValue={product?.sku ?? ""}
            />
          </Field>
        </div>
        <Field label="Descripción" htmlFor={`${id}-description`}>
          <textarea
            id={`${id}-description`}
            name="description"
            rows={5}
            maxLength={5000}
            defaultValue={product?.description ?? ""}
          />
        </Field>
        <div className="admin-grid two">
          <Field label="Categoría" htmlFor={`${id}-category`}>
            <select
              id={`${id}-category`}
              name="category_id"
              required
              defaultValue={product?.category_id ?? ""}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Marca" htmlFor={`${id}-brand`}>
            <select
              id={`${id}-brand`}
              name="brand_id"
              required
              defaultValue={product?.brand_id ?? ""}
            >
              <option value="">Seleccionar marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="admin-section">
        <h2>Precio y estado</h2>
        <div className="admin-grid two">
          <Field label="Precio (L)" htmlFor={`${id}-base`}>
            <input
              id={`${id}-base`}
              name="base_price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              max="100000000"
              defaultValue={price(product?.base_price ?? null)}
            />
          </Field>
          <Field label="Precio promocional (L, opcional)" htmlFor={`${id}-promo`}>
            <input
              id={`${id}-promo`}
              name="promo_price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              max="100000000"
              defaultValue={price(product?.promo_price ?? null)}
            />
          </Field>
        </div>
        <Field label="Estado general" htmlFor={`${id}-status`}>
          <select
            id={`${id}-status`}
            name="general_status"
            defaultValue={product?.general_status ?? "available"}
          >
            <option value="available">Disponible</option>
            <option value="out_of_stock">Agotado</option>
            <option value="promotion">En promoción</option>
          </select>
        </Field>
        <div className="admin-checks">
          <CheckField
            label="Producto destacado"
            name="featured"
            defaultChecked={product?.featured ?? false}
            hint="Aparece en la parte principal del catálogo."
          />
          <CheckField
            label="Publicado en la página"
            name="published"
            defaultChecked={product?.published ?? false}
            hint="Requiere precio y revisión aprobada o manual."
          />
        </div>
      </div>

      <div className="admin-section">
        <h2>Sucursales y disponibilidad</h2>
        <div className="admin-branches">
          {branches
            .filter((branch) => branch.active || assignments.some((item) => item.branch_id === branch.id))
            .map((branch) => {
              const assignment = assignments.find(
                (item) => item.branch_id === branch.id,
              );
              const prefix = `branch_${branch.id}`;
              return (
                <div key={branch.id} className="admin-branch">
                  <strong>{branch.name}</strong>
                  <label className="admin-check compact">
                    <input
                      type="checkbox"
                      name={`${prefix}_available`}
                      defaultChecked={assignment?.available ?? false}
                    />
                    <span>Disponible en esta sucursal</span>
                  </label>
                  <label className="admin-inline">
                    Situación
                    <select
                      name={`${prefix}_status`}
                      defaultValue={assignment?.status ?? "out_of_stock"}
                    >
                      <option value="available">Disponible</option>
                      <option value="out_of_stock">Agotado</option>
                      <option value="promotion">En promoción</option>
                    </select>
                  </label>
                  <div className="admin-inline-grid">
                    <label className="admin-inline">
                      Precio (opcional)
                      <input
                        type="number"
                        name={`${prefix}_branch_price`}
                        min="0"
                        step="0.01"
                        defaultValue={price(assignment?.branch_price ?? null)}
                      />
                    </label>
                    <label className="admin-inline">
                      Promoción (opcional)
                      <input
                        type="number"
                        name={`${prefix}_branch_promo_price`}
                        min="0"
                        step="0.01"
                        defaultValue={price(assignment?.branch_promo_price ?? null)}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-head">
          <h2>Fuente externa</h2>
          <button
            type="button"
            className="text-button"
            onClick={() => setShowSource((value) => !value)}
          >
            {showSource ? "Ocultar" : "Registrar fuente de internet"}
          </button>
        </div>
        {showSource && (
          <div className="admin-grid two">
            <Field label="URL de la fuente" htmlFor={`${id}-source-url`}>
              <input
                id={`${id}-source-url`}
                name="source_url"
                type="url"
                placeholder="https://…"
                defaultValue={product?.source_url ?? ""}
              />
            </Field>
            <Field label="Comercio o fabricante" htmlFor={`${id}-source-name`}>
              <input
                id={`${id}-source-name`}
                name="source_name"
                maxLength={200}
                defaultValue={product?.source_name ?? ""}
              />
            </Field>
            <Field
              label="Fecha de consulta"
              htmlFor={`${id}-source-date`}
              hint="Obligatoria cuando registras una fuente externa."
            >
              <input
                id={`${id}-source-date`}
                name="source_checked_at"
                type="date"
                defaultValue={product?.source_checked_at?.slice(0, 10) ?? ""}
              />
            </Field>
            <Field label="Estado de revisión" htmlFor={`${id}-source-status`}>
              <select
                id={`${id}-source-status`}
                name="source_review_status"
                defaultValue={product?.source_review_status ?? "manual"}
              >
                <option value="manual">Manual (propio)</option>
                <option value="pending">Pendiente de revisión</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </Field>
          </div>
        )}
      </div>

      <div className="admin-form-actions">
        <button className="button primary" disabled={pending}>
          <Save size={18} />
          {pending
            ? "Guardando…"
            : product
              ? "Guardar cambios"
              : "Crear producto"}
        </button>
        {product && (
          <span className="admin-hint">
            El enlace público se ajusta al nombre del producto al guardar.
          </span>
        )}
      </div>
      {product && (
        <p className="admin-hint">
          Para eliminar este producto usa la sección de la lista.
          <Trash2 size={13} aria-hidden="true" />
        </p>
      )}
    </form>
  );
}