"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import styles from "./brand-carousel.module.css";

export function BrandCarousel({ brands }: { brands: string[] }) {
  const [paused, setPaused] = useState(false);
  if (!brands.length) return null;
  return (
    <section className={`container ${styles.section}`} aria-label="Marcas del catálogo">
      <div className={styles.heading}>
        <div><span className="eyebrow">EQUIPA TU PRÓXIMA RUTA</span><h2>Marcas en nuestro catálogo<span className="red-dot">.</span></h2></div>
        {brands.length > 1 && <button className={styles.control} onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? "Reanudar movimiento de marcas" : "Pausar movimiento de marcas"}>
          {paused ? <Play size={15} /> : <Pause size={15} />}<span>{paused ? "Reanudar" : "Pausar"}</span>
        </button>}
      </div>
      <div className={styles.viewport} tabIndex={0} aria-label="Explorar marcas; desplázate para ver más">
        <div className={`brand-track ${styles.track}`} data-paused={paused || brands.length < 2}>
          {[0, 1].map((copy) => <div className={styles.list} key={copy} aria-hidden={copy === 1 ? true : undefined}>
            {brands.map((brand) => <Link key={brand} href={`/catalogo?q=${encodeURIComponent(brand)}`} tabIndex={copy === 1 ? -1 : undefined}>
              {brand}<ArrowUpRight size={18} aria-hidden="true" />
            </Link>)}
          </div>)}
        </div>
      </div>
    </section>
  );
}
