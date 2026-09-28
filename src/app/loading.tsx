import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div
      className={`container page-section ${styles.loading}`}
      role="status"
      aria-label="Cargando contenido"
    >
      <div className={`skeleton skeleton-title ${styles.title}`} aria-hidden="true" />
      <div className="product-grid" aria-hidden="true">
        {[1, 2, 3, 4].map((item) => (
          <div className={styles.card} key={item}>
            <div className={`skeleton ${styles.image}`} />
            <div className={styles.content}><div className={`skeleton ${styles.label}`} /><div className={`skeleton ${styles.line}`} /><div className={`skeleton ${styles.price}`} /><div className={`skeleton ${styles.button}`} /></div>
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
