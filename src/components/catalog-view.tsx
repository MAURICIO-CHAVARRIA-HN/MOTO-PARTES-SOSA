"use client";
import { useState } from "react";
import { ArrowUpRight, Search, SlidersHorizontal, X, PackageSearch } from "lucide-react";
import type { Product } from "@/lib/types";
import { productPrice } from "@/lib/cart";
import { useStore } from "./store-provider";
import { ProductCard } from "./product-card";
import styles from "./catalog-view.module.css";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function CatalogView({
  products,
  initialQuery = "",
  promotions = false,
}: {
  products: Product[];
  initialQuery?: string;
  promotions?: boolean;
}) {
  const { branches, branchId, setBranchId } = useStore();
  const [query, setQuery] = useState(initialQuery);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState(promotions ? "promotion" : "");
  const [sort, setSort] = useState("relevance");
  const [limit, setLimit] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const brands = [...new Set(products.map((product) => product.brand))].sort();
  const categories = [
    ...new Set(products.map((product) => product.category)),
  ].sort();
  const filtered = products
    .filter((product) => {
      const text = normalize(
        [
          product.name,
          product.description,
          product.brand,
          product.category,
          product.sku,
          product.compatibility ?? "",
        ].join(" "),
      );
      return (
        normalize(query)
          .split(/\s+/)
          .every((word) => text.includes(word)) &&
        (!brand || product.brand === brand) &&
        (!category || product.category === category) &&
        (!status || product.general_status === status) &&
        (!branchId ||
          product.branches.some((branch) => branch.branch_id === branchId))
      );
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      if (sort === "asc" || sort === "desc") {
        const first = productPrice(a, branchId),
          second = productPrice(b, branchId);
        if (first == null) return second == null ? 0 : 1;
        if (second == null) return -1;
        return sort === "asc" ? first - second : second - first;
      }
      return Number(b.featured) - Number(a.featured);
    });
  const active = Boolean(
    query || brand || category || branchId || (!promotions && status),
  );
  const activeFilters = [
    ...(query ? [{ label: `Búsqueda: ${query}`, clear: () => setQuery("") }] : []),
    ...(brand ? [{ label: `Marca: ${brand}`, clear: () => setBrand("") }] : []),
    ...(category ? [{ label: `Categoría: ${category}`, clear: () => setCategory("") }] : []),
    ...(branchId ? [{
      label: `Sucursal: ${branches.find((branch) => branch.id === branchId)?.name ?? "Seleccionada"}`,
      clear: () => setBranchId(""),
    }] : []),
    ...(!promotions && status ? [{
      label: `Estado: ${{ available: "Disponible", out_of_stock: "Agotado", promotion: "En promoción", pending: "Por confirmar" }[status] ?? status}`,
      clear: () => setStatus(""),
    }] : []),
  ];
  function reset() {
    setQuery("");
    setBrand("");
    setCategory("");
    setStatus(promotions ? "promotion" : "");
    setBranchId("");
    setLimit(12);
  }
  return (
    <div className={`catalog-layout ${styles.catalog}`}>
      <button
        className="button secondary filter-toggle"
        onClick={() => setFiltersOpen(!filtersOpen)}
        aria-expanded={filtersOpen}
        aria-controls="catalog-filters"
        aria-label="Filtros"
      >
        <SlidersHorizontal size={18} />
        Filtros
        {activeFilters.length > 0 && (
          <span className={styles.filterCount} aria-hidden="true">{activeFilters.length}</span>
        )}
      </button>
      <aside
        className={`catalog-filters ${filtersOpen ? "filters-open" : ""}`}
        id="catalog-filters"
      >
        <div className="filter-title">
          <h2>
            <SlidersHorizontal size={18} />
            Filtrar productos
          </h2>
          {active && (
            <button className="text-button" onClick={reset}>
              Limpiar
            </button>
          )}
        </div>
        <label htmlFor="filter-branch">Sucursal</label>
        <select
          id="filter-branch"
          value={branchId}
          onChange={(event) => setBranchId(event.target.value)}
        >
          <option value="">Todas las sucursales</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <label htmlFor="filter-category">Categoría</label>
        <select
          id="filter-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <label htmlFor="filter-brand">Marca</label>
        <select
          id="filter-brand"
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
        >
          <option value="">Todas las marcas</option>
          {brands.map((brand) => (
            <option key={brand}>{brand}</option>
          ))}
        </select>
        {!promotions && (
          <>
            <label htmlFor="filter-status">Estado</label>
            <select
              id="filter-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="available">Disponible</option>
              <option value="out_of_stock">Agotado</option>
              <option value="promotion">En promoción</option>
              <option value="pending">Por confirmar</option>
            </select>
          </>
        )}
        <div className="filter-help">
          <strong>¿No encuentras tu repuesto?</strong>
          <p>Escríbenos y consulta con nuestro equipo.</p>
          <a href="/contacto">
            Contactar <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
        <button
          className={`button primary ${styles.applyFilters}`}
          onClick={() => setFiltersOpen(false)}
        >
          Ver {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
        </button>
      </aside>
      <div className="catalog-results">
        <div className="catalog-search">
          <Search size={20} aria-hidden="true" />
          <input
            aria-label="Buscar en el catálogo"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(12);
            }}
            placeholder="Buscar por nombre, marca o código…"
          />
          {query && (
            <button
              className="icon-button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
            >
              <X size={17} />
            </button>
          )}
        </div>
        {activeFilters.length > 0 && (
          <div className={styles.activeFilters} aria-label="Filtros activos">
            {activeFilters.map((filter) => (
              <button
                key={filter.label}
                className={styles.filterChip}
                onClick={() => {
                  filter.clear();
                  setLimit(12);
                }}
                aria-label={`Quitar ${filter.label.toLocaleLowerCase("es")}`}
                title={`Quitar ${filter.label}`}
              >
                <span>{filter.label}</span>
                <X size={13} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        <div className="results-toolbar">
          <span role="status">
            <strong>{filtered.length}</strong> {filtered.length === 1 ? "producto" : "productos"}
          </span>
          <label>
            Ordenar por{" "}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Ordenar productos"
            >
              <option value="relevance">Relevancia</option>
              <option value="name">Nombre</option>
              <option value="asc">Menor precio</option>
              <option value="desc">Mayor precio</option>
            </select>
          </label>
        </div>
        {filtered.length ? (
          <>
            <div className="product-grid catalog-grid">
              {filtered.slice(0, limit).map((product, index) => (
                <ProductCard
                  product={product}
                  key={product.id}
                  eager={index === 0}
                />
              ))}
            </div>
            <p className={styles.resultProgress}>
              Mostrando {Math.min(limit, filtered.length)} de {filtered.length} productos
            </p>
            {filtered.length > limit && (
              <button
                className="button secondary load-more"
                onClick={() => setLimit(limit + 12)}
              >
                Ver más productos
              </button>
            )}
          </>
        ) : (
          <div className={`empty-state ${styles.empty}`}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <PackageSearch size={38} strokeWidth={1.3} />
            </span>
            <h2>
              {promotions && !active
                ? "Las próximas oportunidades vienen en camino"
                : "No encontramos productos"}
            </h2>
            <p>
              {promotions && !active
                ? "Aquí aparecerán las promociones cuando la tienda las publique."
                : "Prueba con el nombre, la marca o el código del repuesto. También puedes quitar un filtro para ampliar la búsqueda."}
            </p>
            {active && (
              <button className="button secondary" onClick={reset}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
