# Manual administrativo — Rancing Mau

Versión de trabajo: 23 de septiembre de 2026. Las rutas parten del dominio del negocio; durante desarrollo, `http://localhost:3000`.

## Acceso

Entrar en `/admin/login` con la cuenta asignada por el propietario. La cuenta necesita membresía activa en `admin_users`; registrarse en Auth por sí solo no concede acceso. El resumen está en `/admin`. Cerrar sesión desde el panel al terminar, especialmente en equipos compartidos.

## Categorías, marcas y sucursales

Crear categorías en `/admin/categorias` y marcas en `/admin/marcas` antes de cargar productos. Utilizar nombres confirmados por el negocio. Una categoría o marca en uso no se puede eliminar; desactivarla también oculta sus productos del catálogo público.

En `/admin/sucursales`, revisar dirección, horario, teléfono, WhatsApp y enlace de Maps con el propietario. Las tres sucursales iniciales se pueden ocultar, pero no eliminar. La disponibilidad de cada repuesto se indica en su ficha.

## Crear un producto propio

1. En `/admin/productos`, pulsar **Nuevo producto**.
2. Completar nombre, SKU único, descripción, categoría y marca.
3. Registrar el precio de venta confirmado en lempiras. Dejarlo vacío si aún se desconoce; no usar cero como sustituto.
4. Subir una fotografía propia o autorizada, en JPG, PNG, WebP o AVIF, de hasta 5 MB. Guardar la procedencia y evidencia del permiso con la documentación del negocio; el formulario actual no ofrece un campo para adjuntar esa autorización.
5. Indicar disponibilidad y, si corresponde, precio por sucursal. Una sucursal sin disponibilidad se guarda como agotada.
6. Guardar inicialmente sin marcar **Publicado en la página**. Revisar la ficha y publicar cuando los datos estén completos.

La promoción requiere un precio inferior al normal. El estado **En promoción** requiere precio promocional.

## Revisar una referencia de internet

1. Crear la ficha como borrador. En **Registrar fuente de internet**, completar URL HTTPS, comercio y fecha real de consulta; elegir **Pendiente de revisión**.
2. Guardar. La ficha aparece en `/admin/revision` y permanece fuera del catálogo público. La fotografía permanece privada mientras no se publique.
3. Abrir la fuente y comprobar la identidad exacta de la pieza, presentación/cantidad, marca, medidas y compatibilidad. Confirmar el precio de venta y la disponibilidad con el negocio; el precio del tercero es solo una referencia.
4. Confirmar la autorización de la imagen y revisar la descripción. Si falta información, mantener pendiente. Si no corresponde al negocio, pulsar **Rechazar** en la cola.
5. Para corregir un rechazo, abrir la ficha desde **Productos**, corregir los datos y volver a **Pendiente de revisión**; guardar.
6. Cuando la revisión esté completa, pulsar **Aprobar fuente** desde la cola. Esa acción registra quién revisó y cuándo. Aprobar no publica automáticamente.
7. Abrir la ficha aprobada, comprobar precio, imagen y sucursales, marcar **Publicado en la página** y guardar. Revisar el catálogo y la ficha pública en una ventana sin sesión.

Utilizar la cola para aprobar, no seleccionar directamente **Aprobado** al crear la ficha: la base requiere el autor y la fecha que registra la acción de la cola. Los productos pendientes o rechazados no pueden publicarse. No hay un plazo automático de caducidad de las fuentes; la vigencia se comprueba durante la revisión humana.

Si hay que revisar de nuevo un producto ya publicado, primero ocultarlo desde **Productos**, después cambiarlo a pendiente y guardar. Repetir la revisión antes de volver a publicarlo.

## Fotografías y publicación

Una fotografía de borrador se guarda en almacenamiento privado. Al publicar un producto aprobado, el sistema la copia al almacenamiento público y retira la candidata. Si aparece un aviso de promoción fallida, revisar el almacenamiento antes de continuar.

El catálogo solo muestra productos publicados con precio, estado permitido, marca/categoría activas y una imagen registrada. Si un producto no aparece, revisar esas condiciones.

**Ocultar** retira el producto del catálogo, pero no elimina su archivo público. **Eliminar** borra la ficha y limpia las imágenes asociadas; es irreversible desde el panel. Para conservar el registro, usar **Ocultar**.

## Los 33 candidatos iniciales

El borrador está en `docs/CONTENIDO_PENDIENTE.md` y su preparación estructurada en `docs/data/contenido-candidato-33.json`. El JSON es un documento local, no una importación ni una aprobación. Conserva la fecha de consulta original y separa `reference_price_hnl` del precio de venta `base_price`, aún pendiente.

Para recoger las decisiones del negocio, `docs/data/plantilla-decision-33.csv` lista los 33 candidatos con columnas accionables (SKU definitivo, confirmación del ítem, cantidad, precio de venta y promocional, sucursales, estado, destacado, imagen autorizada, archivo y observaciones) y conserva la fuente como referencia. Con autorización del propietario se completó como propuesta de trabajo el 23 de septiembre: SKU `RM-001…RM-033`, precio de venta igual al precio de referencia de la fuente pero **marcado en cada fila como referencial y no aprobado**, todas las sucursales, estado disponible y sin destacar; las imágenes quedan pendientes. La plantilla ya alerta sobre la cantidad «50 pastillas» de la referencia 11 y la marca Apache RTR de la referencia 17. Antes de publicar, cada precio de venta debe confirmarse con el negocio porque el de la fuente no es el del local.

Antes de cargar cada ficha, confirmar SKU local, categoría/marca, precio, disponibilidad, descripción, compatibilidad y fotografía autorizada. Dos observaciones requieren especial atención: la cantidad «50 pastillas» de la referencia 11 y el fabricante atribuido a Apache RTR en la referencia 17. No trasladar esas afirmaciones al catálogo sin verificarlas.

## Reseñas de clientes

Los clientes publican reseñas en `/resenas`: eligen sucursal, califican de 1 a 5 estrellas y escriben un comentario. Las reseñas entran como **pendientes** y solo las aprobadas aparecen públicamente.

En `/admin/resenas`:

1. Aprobar una reseña la hace visible en `/resenas` junto con su sucursal.
2. Ocultar o rechazar exige escribir un motivo; queda registrado quién lo hizo y cuándo.
3. Responder agrega `admin_response`, que se muestra con la reseña aprobada.
4. Eliminar borra la reseña de forma irreversible desde el panel.

Una reseña **por ser negativa no se modera ni se oculta**: la moderación aplica sobre contenido, no sobre la puntuación. El formulario público deduplica comentarios idénticos por sucursal, exige entre 10 y 1200 caracteres y limita reenvíos por navegador para evitar abuso; no almacena nombres, correos ni direcciones IP.

## Estadísticas

El panel `/admin/estadisticas` muestra cargas de páginas públicas agregadas por día y por ruta: totales de hoy, 7 días y 30 días, una gráfica de evolución diaria y las páginas más visitadas. La métrica no representa visitantes únicos; una misma ruta se cuenta una vez por pestaña en cada sesión del navegador.

No se registran rutas administrativas ni de API, y no se guardan nombres, correos ni IP. Los datos se almacenan solo como agregados diarios por ruta en `page_views_daily`.

## Recuperación y entrega

El panel no dispone de restauración de eliminaciones. Antes de producción se debe ensayar una recuperación en una instancia de prueba, con base de datos y archivos de Storage, siguiendo `docs/DESARROLLO.md`. El respaldo de PostgreSQL no incluye las fotografías. Dominio, SEO, tarifas y publicación definitiva siguen sujetos a los datos finales del negocio.
