# Plan y estado — Rancing Mau

Fecha de inicio: 21 de septiembre de 2026.

El documento rector sigue siendo `README_Rancing_Mau.md`. Este registro documenta el inicio del proyecto, no sustituye los requisitos ni declara terminada la entrega de L 8,000.

## Inspección inicial

La carpeta contenía el README y doce archivos de imágenes. No había aplicación, dependencias, base de datos ni repositorio Git. Se conservaron los archivos originales. Se adoptó la arquitectura sugerida: Next.js App Router, TypeScript estricto, CSS con tokens y Supabase como integración preparada, todavía sin conectar.

## Fases

Estado consolidado al 24 de septiembre de 2026; las secciones cronológicas posteriores conservan el historial de cada entrega.

1. **Análisis y base:** estructura, plan, inventario de datos, modelo relacional y políticas de acceso implementados y comprobados contra Supabase real. Compatibilidad cargada: 50 motos, 6953 repuestos y 9456 relaciones.
2. **Experiencia pública inicial:** inicio, catálogo, búsqueda, filtros, detalle, promociones, sucursales, contacto, tema y carrito local. Implementados como vista previa. No es un catálogo aprobado para publicación.
3. **Administración:** CRUD, autenticación, fotografías entre buckets, publicación, eliminación y cola de revisión **validados contra Supabase real**. El ensayo de la cola usa una ficha externa real con identidad e imagen técnica temporales; no constituye aprobación comercial del lote de candidatos.
4. **Integración y calidad:** Auth/Storage/RLS reales comprobados en los flujos administrativos documentados. **Pendientes:** contenido comercial aprobado, SEO de producción y revisión final del sitio con el contenido definitivo. Hay pruebas locales de carrito, base de datos simulada y navegación.
5. **Publicación y entrega:** instancia Supabase y cuenta administrativa disponibles. **Pendientes:** tarifas revisadas, dominio, despliegue autorizado y carga aprobada. Ensayo de respaldo/restauración **ejecutado y verificado el 24 de septiembre** sobre una instancia de prueba. Manual administrativo de trabajo disponible en `docs/MANUAL_ADMINISTRATIVO.md`; debe completarse con el dominio y las decisiones definitivas.

## Decisiones de esta base

- Las imágenes locales de productos son candidatas sin procedencia ni permiso documentados. Solo se exponen en desarrollo a través de una ruta limitada por una lista de archivos; en producción responde 404. No se incorporaron a un directorio público de productos.
- La vista previa incluye cinco productos, SKU con prefijo `DEMO-`, precios `null` y ninguna asignación de inventario. El aviso de referencia es visible; los envíos de solicitudes de esos productos están bloqueados en cliente y servidor.
- Se excluyeron `aceitepower.webp` por la marca de agua de Quinta Motos y `aceitemotul300.jpeg` / `aceitemotul5100.jpeg` por resolución insuficiente. Los originales siguen intactos.
- Las tres fotografías de tiendas muestran rótulos de otros negocios (Moto Repuestos Ordóñez / Super Repuestos). No se presentan como sucursales de Rancing Mau sin confirmación del propietario.
- El logotipo aportado se usa en la vista previa, sujeto a confirmación final del negocio.
- Las sucursales se crean con los nombres exactos del README y campos desconocidos en `null`, mostrados como pendientes en español. No se inventaron direcciones, horarios ni coordenadas.
- Un precio desconocido nunca se presenta como L 0.00. Los productos publicados en la base deben tener precio y estado de revisión válido. La solicitud se valida contra el catálogo vigente.
- Las cuentas autenticadas consultan sus propias membresías administrativas. Ningún usuario puede asignarse el rol desde la aplicación. La membresía inicial se configura fuera del acceso público.
- El catálogo usa un cliente anónimo incluso si visita un administrador. Una vista SQL de columnas explícitas oculta fuentes y datos de revisión; las tablas originales están protegidas por RLS.
- Las fotografías candidatas y aprobadas tienen buckets distintos. La carga sube siempre a `catalog-candidates` (privado) con validación de firma binaria; al guardar un producto publicado y aprobado se copia a `catalog-public` (público) y se elimina la candidata. Un borrador referencia la candidata por una ruta interna `/images/...` que solo responde con sesión de administrador. No colocar una candidata en `catalog-public` antes de aprobarla.
- El panel privado (`/admin/*`) reutiliza los formularios de servidor para cada operación: `requireAdmin()` comprueba sesión y membresía activa en cada acción, además de las páginas. Cuando la base no está conectada todas las rutas admin redirigen a `/admin/login` con el aviso de configuración pendiente.
- Un producto con fuente externa sin fecha de consulta o con estado de revisión no aprobado no se puede publicar. La cola de revisión permite aprobar/rechazar la fuente y guarda autor y fecha de revisión; el producto no aparece en la vista pública hasta aprobarse. La vigencia de la información se revisa manualmente: no existe una caducidad automática implementada.
- Se mantuvo la paleta indicada y se añadieron tokens de contraste: texto rojo claro `#ff555c` en superficies oscuras y botones `#d71920` con texto blanco. El rojo oscuro original sobre tarjetas no alcanzaba AA para texto pequeño.
- Se eligió CSS para las animaciones para evitar una dependencia adicional. Se respeta movimiento reducido. Las tipografías se sirven localmente con Fontsource.
- La etiqueta `noindex` y `robots.txt` bloquean indexación durante esta etapa. Habilitar SEO y sitemap real únicamente al configurar dominio y contenido aprobado.
- El evento de clic `rancing-mau:whatsapp` publica únicamente el tipo (`contact`, `product`, `cart`) en el navegador. Falta conectar un proveedor analítico si se aprueba; no se guardan mensajes privados.

## Datos pendientes del propietario

- Confirmar nombre **Rancing Mau** y logotipo definitivo.
- Confirmar o sustituir imágenes de productos y tiendas, con permisos de uso.
- Precios, SKU definitivos, especificaciones, compatibilidad y disponibilidad de productos por sucursal.
- Categorías y marcas iniciales aprobadas.
- Dirección, horario, WhatsApp individual y Google Maps de cada sucursal.
- Correo para la cuenta administrativa, dominio y redes sociales.
- Titularidad de cuentas de servicios y decisión de suscripción antes de desplegar.
- Dominio y publicación pendientes de la aprobación del proyecto por parte del negocio (confirmado el 23 de septiembre). Mientras no se apruebe, el sitio permanece local con `noindex` y no se contrata el dominio ni se despliega.
- Material de revisión de los 33 candidatos listo y **completado con la autorización del propietario el 23 de septiembre** en `docs/data/plantilla-decision-33.csv`: SKU propuestos `RM-001…RM-033`, precio de venta = el precio de referencia de la fuente (KM Motos/Motofix) marcado en cada fila como **referencial, no aprobado**, todas las sucursales (T), estado disponible, sin destacar e imagen pendiente. Las dos advertencias conocidas ya figuran en las filas 11 (cantidad «50 pastillas») y 17 (Apache RTR es Bajaj). Este llenado es una propuesta de trabajo; **no carga productos y no cambia la base**: la decisión final de precio y vigencia corresponde al negocio antes de publicar.

## Estrategia para referencias hondureñas

Buscar por producto exacto en fabricantes y distribuidores autorizados con presencia en Honduras. Registrar nombre, precio explícito en lempiras, URL, comercio y fecha en un borrador. No convertir divisas para aparentar precios locales. Reescribir descripciones y comprobar permiso de cada imagen. La carga debe permanecer oculta hasta revisar imagen, compatibilidad, descripción y precio. La búsqueda y propuesta comercial se realizará en la fase de contenido; no se obtuvieron precios externos durante esta inicialización.

Primer borrador de contenido listo en `docs/CONTENIDO_PENDIENTE.md` (21 de septiembre de 2026): 33 repuestos de referencia con precios en lempiras verificados en KM Motos (kmmotos.com) y Motofix Honduras (motofixhn.com). Ninguno está publicado: todas las referencias son candidatas, las imágenes requieren permiso, y cada producto deberá pasar por la cola de revisión del panel antes de aparecer en el sitio. Se descartaron Quinta Motos (Colombia, pesos) y Repuestos Quintana (España, euros).

## Servicios propuestos, sin contratación

| Componente | Propuesta | Estado/costo recurrente | Titular previsto |
| --- | --- | --- | --- |
| Base de datos, Auth y Storage | Supabase | Instancia real conectada; falta documentar plan, cuotas, pausas, respaldos y tarifa | Propietario de Rancing Mau |
| Alojamiento Next.js | Proveedor compatible por definir | No contratado; verificar condiciones de uso comercial y tarifa vigente | Propietario de Rancing Mau |
| Dominio | Registrador por definir | No adquirido; cotizar renovación además del primer año | Propietario de Rancing Mau |
| WhatsApp | Enlaces `wa.me` al teléfono existente | Sin integración de API de mensajería | Negocio |

No se han comprometido costos recurrentes. Los L 8,000 corresponden al desarrollo acordado, no implican suscripciones incluidas.

## Referencias técnicas consultadas

- [Instalación oficial de Next.js](https://nextjs.org/docs/app/getting-started/installation).
- [Cliente de Supabase para servidor y cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).

## Límites de validación

Las pruebas SQL utilizan PostgreSQL embebido PGlite con esquemas Auth/Storage simulados. Comprueban la migración y los permisos de la aplicación, pero no sustituyen pruebas de autenticación, expiración de cookies, subida de imágenes y recuperación contra Supabase real. El modo móvil usa Chromium con emulación de dispositivo, no un iPhone físico. El análisis automático de accesibilidad complementa la revisión manual, no certifica cumplimiento completo.


## Verificación de esta entrega

- `npm run lint`: sin errores.
- `npm run typecheck`: sin errores.
- `npm test`: 16 pruebas aprobadas (carrito, WhatsApp, validaciones del panel y migraciones SQL en PGlite aplicadas en orden).
- `npm run test:e2e`: 12 pruebas aprobadas en escritorio y móvil, con un solo proceso para limitar consumo de memoria. Incluye el bloqueo de todas las rutas admin a `/admin/login` sin base conectada.
- `npm run build`: compilación de producción correcta, incluidas las rutas de administración, subida/previsualización de imágenes y el proxy de candidatas.
- Inicio y catálogo: sin desbordamiento horizontal ni infracciones detectadas por axe en las reglas WCAG A/AA seleccionadas, en claro/oscuro y escritorio/móvil.
- Producción local sin Supabase: catálogo vacío, sucursales pendientes y panel administrativo redirigido al acceso.
- Git inicializado localmente. No se creó ningún commit ni se envió código a un repositorio remoto.

Correcciones durante esta entrega: relaciones embebidas de Supabase interpretadas como arreglos en `getProduct`, slug propio excluido al guardar ediciones (evita renombres automáticos), y aviso de fotografía en revisión que no interrumpía la redirección/revalidación al guardar un producto nuevo.

### Revisión del panel antes de conectar Supabase (21 de septiembre, tarde)

Se revisó a fondo el código del panel, las acciones y las migraciones. Las comprobaciones (`lint`, `typecheck`, 16 pruebas unitarias, 12 de navegador y build de producción) siguen en verde. Correcciones aplicadas:

- El botón Publicar/Ocultar de la lista no enviaba el campo `published`, por lo que `setProductPublished` siempre respondía «Datos inválidos». Ahora el formulario incluye el valor destino.
- Al publicar (por botón o formulario) se promueven a `catalog-public` las fotografías que siguieran en `catalog-candidates` y se actualiza su URL; si la promoción falla, el producto permanece sin publicar para no exhibir una imagen inaccesible en el catálogo público.
- `removeStoredImages` ahora también elimina objetos del bucket público referidos por URLs `https://…/object/public/…`, evitando archivos huérfanos al eliminar o reemplazar fotografías.
- `listProducts` no consultaba `product_images`, así que el listado administrativo no mostraba miniaturas. Se agregó la relación y la proyección de `images`.
- Se ordenó la sangría de la etiqueta `admin-hint` en la cola de revisión.

Estos arreglos quedan pendientes de comprobación contra una instancia real de Supabase (Auth, Storage y RLS), que sigue siendo el siguiente paso antes de la integración final.

### Modo de demostración local (22 de septiembre de 2026)

Se añadió un catálogo de demostración opcional, activado solo en desarrollo con `CATALOG_DEMO=true`. Consiste en 100 productos de ejemplo repartidos en 10 categorías, con SKU `DEMO-*`, precios de ejemplo y asignaciones por sucursal, claramente marcados en la barra superior como "MODO DEMO". La página muestra 12 tarjetas por tanda y permite cargar las 100. Permite probar de punta a punta el flujo de compra (catálogo → carrito → cotización contra el catálogo → mensaje por WhatsApp a `50497491004`) sin depender de Supabase. No sustituye la vista previa predeterminada (que mantiene precios desconocidos y envío bloqueado) y nunca se habilita en producción.

Corrección durante esta entrega: `demoProducts` no propagaba la marca al producto, por lo que las tarjetas y el filtro de marcas quedaban vacíos y React emitía una advertencia de claves en el `<select>`. Se añadió `brand` a cada producto. La verificación de esta entrega: `npm run lint`, `typecheck`, `npm test` (16), `npm run test:e2e` (12) y `npm run test:demo` (1) en verde; `npm run build` compila correctamente.

### Base de compatibilidad KM Motos (22 de septiembre de 2026, tarde)

Se añadió una base de datos de compatibilidad de repuestos por modelo, extraída del catálogo oficial de KM Motos el `2026-09-22` y de uso exclusivo administrativo. Permite que el panel (`/admin/compatibilidad`) consulte qué repuestos aplican a cada moto y en qué modelos se usa cada pieza, como referencia para preparar fichas con compatibilidad verificada.

- Migración `202609221000_compatibility.sql`: tablas `motorcycles`, `spare_parts` y `compatibility`, solo administrador (RLS `admin_manage`), con auditoría y triggers de `updated_at`. No se proyectan al catálogo público; `public_catalog` sigue siendo la única fuente de lo publicado.
- Datos: `docs/data/` (JSON/CSV) con 50 modelos, 6953 repuestos únicos y 9456 compatibilidades nivel "confirmada" con `evidence_url` a la colección oficial. `docs/data/README.md` resume el contenido.
- Importador `npm run compat:import` (`scripts/import-compatibility.ts` + `src/lib/compat-data.ts`): valida con Zod, asigna UUID deterministas por modelo/repuesto (estables entre ejecuciones), y puede generar el seed idempotente `supabase/seeds/compatibilidad.sql` o insertar directo en Supabase con la clave de servicio (solo para el importador, nunca en el frontend).
- Panel: resumen con estadísticas y tablas, listado de modelos, listado de repuestos con búsqueda/filtro por categoría, y detalle de modelo o repuesto con sus enlaces. En el resumen `/admin` se muestra el contador de compatibilidades (o el texto base si la tabla no está conectada).
- Los precios, Stock de la fuente y descripciones quedan como referencia: no inflan ni reemplazan el catálogo publicado, que sigue controlado por el flujo de revisión de fuentes.

La verificación de esta entrega: `npm run lint`, `typecheck`, `npm test` (23, incluida la migración de compatibilidad aplicada sobre PGlite con sus políticas) y `npm run test:e2e` (12) en verde; `npm run build` compila correctamente con las rutas de compatibilidad. Durante la verificación e2e, un servidor de desarrollo previo iniciado con `CATALOG_DEMO=true` quedaba reutilizado por Playwright y rompía las expectativas del catálogo de vista previa; se detuvo y la suite volvió a pasar. Queda pendiente comprobar la migración y la carga del seed contra una instancia real de Supabase.

### Optimización de imagen LCP (22 de septiembre de 2026)

Next.js advertía que la primera imagen de producto del catálogo era la LCP y debía cargarse de inmediato. Se añadió una prop `eager` opcional a `ProductCard` y la primera tarjeta visible de la cuadrícula (`catalog-view`) la usa como `priority`. Se eliminó la advertencia LCP. Esta entrega se verificó de nuevo: lint, typecheck, 12 pruebas e2e y build en verde.

### Validación parcial contra una instancia real de Supabase (22 de septiembre, noche)

El propietario creó el proyecto e indicó que se conectara parcialmente mientras aporta una cuenta administrativa. Con las claves en `.env.local` (archivo gitignored) se comprobó en la instancia real:

- Esquema aplicado: `products`, `categories`, `brands`, `product_branches`, `product_images`, `admin_users`, `branches` y las tres tablas de compatibilidad existen. `branches` contiene las 3 sucursales iniciales.
- Compatibilidad KM Motos cargada y verificada por conteo exacto: 50 motos, 6953 repuestos y 9456 compatibilidades.
- Almacenamiento: buckets `catalog-candidates` (privado) y `catalog-public` (público) presentes.
- Políticas públicas: un cliente anónimo (usando la clave publishable) lee `public_catalog` y `branches` sin error.
- Autenticación: `/admin/login` muestra el formulario real y rechaza credenciales inválidas contactando a Supabase; con navegador, todas las rutas `/admin/*` redirigen a `/admin/login` sin sesión.
- El sitio público carga contra la base real: catálogo vacío (aún sin contenido aprobado) y sucursales pendientes.

Ajustes para que las suites sigan en verde ahora que existen claves locales:

- El modo demo quedaba inhabilitado con la base configurada porque solo se usaba en la rama `!hasSupabase()`. Ahora `getCatalog` activa el demo antes de consultar la base (autoritativo solo en desarrollo con `CATALOG_DEMO=true`).
- La barra de aviso de `site-shell` solo aparecía con `preview`; ahora también con `demo`.
- `playwright.config.ts` fija el entorno del `webServer` a la vista previa determinista (variables de proceso anulan `.env.local`) y `reuseExistingServer: false`, para que `npm run test:e2e` no dependa de la configuración local ni reutilice servidores ajenos.

Pendiente para completar la integración: crear la primera identidad en Supabase Auth (correo/contraseña) desde el panel seguro del proveedor, deshabilitar el registro público y asociar su UUID en `admin_users` (el SQL indicado está en `docs/DESARROLLO.md`). Con esa cuenta validar el CRUD completo, la carga/previsualización/promoción de fotografías entre buckets y la cola de revisión de fuentes. Al conectar la base, la entrega de esta parcial quedó verificada igual que antes: `npm run lint`, `typecheck`, `npm test` (23), `npm run test:e2e` (12), `npm run test:demo` (1) y `npm run build` en verde.

### Panel administrativo validado contra Supabase real (22 de septiembre, madrugada)

El propietario creó la primera identidad administrativa en Supabase Auth y la asoció en `admin_users`. Con una contraseña temporal (nunca guardada en el repositorio y eliminada al terminar) se ejecutó el ciclo completo del panel en un navegador real:

- Inicio de sesión y cierre de sesión; el resumen muestra los conteos reales.
- Creación de categoría y marca desde sus formularios.
- Creación de un producto publicado con fotografía: la imagen se validó, subió a `catalog-candidates`, se promovió a `catalog-public` y se registró `product_images`.
- Asignación de disponibilidad a dos sucursales.
- Aparición inmediata del producto en el catálogo público y en la ficha `/producto/...`.
- Eliminación del producto (incluida la imagen pública) y de la categoría y marca creadas.
- Al terminar, la base quedó limpia (0 productos/categorías/marcas, buckets sin objetos) y la compatibilidad intacta (50/6953/9456).

Bug real detectado y corregido durante esta validación: el catálogo público se volvía inaccesible al publicar un producto con fotografía en Supabase Storage, porque `next/image` no tenía configurado el host remoto (`Invalid src prop … hostname "…supabase.co" is not configured under images`), lo que hacía fallar el render y mostraba el error global de la página. Se añadió en `next.config.ts` un `images.remotePatterns` derivado de `NEXT_PUBLIC_SUPABASE_URL` (sin fijar el host de un proyecto concreto).

La verificación de esta entrega: lint, `typecheck`, 23 pruebas unitarias, 12 e2e (vista previa determinista), 1 demo y build en verde. Queda por completar la cola de revisión de fuentes con un producto externo real, preparar el contenido aprobado, habilitar SEO y desplegar.

### Cola de revisión validada y contenido preparado (23 de septiembre)

Se añadió `scripts/validate-review-real.mjs`, ensayo explícito de navegador contra el servidor local conectado a Supabase real. Requiere `--run-real`; no pertenece a las suites automáticas habituales. Crea una cuenta administrativa temporal con contraseña aleatoria mantenida en memoria, más categoría/marca de prueba, y limpia esos registros al terminar. No modifica credenciales del propietario.

Fuente del ensayo: ficha KM Motos `KM-FF0003`, filtro de aceite NS200/RS200 y otros modelos indicados por el comercio. Se volvió a consultar la ficha durante el ensayo: precio de referencia 50. El producto temporal se identifica como **PRUEBA NO VENTA**, se guarda agotado y utiliza una tarjeta gráfica técnica propia; no se copió una fotografía del proveedor ni se aprobó contenido comercial.

Comprobaciones realizadas desde Chromium y con consultas anónimas:

- Login mediante el formulario y Supabase Auth real.
- Alta con fuente pendiente e imagen privada; bloqueo de lectura anónima de la candidata.
- Bloqueo de publicación pendiente desde la ficha y el listado, y de publicación rechazada desde la ficha.
- Rechazo desde la cola, retorno a pendiente y aprobación desde la cola, con autor y fecha registrados. Aprobar no publica automáticamente.
- Publicación desde la ficha, promoción de la imagen a `catalog-public`, retirada de la candidata y render del catálogo/ficha pública sin sesión.
- Eliminación desde el panel, retirada del catálogo, limpieza de los dos buckets y auditoría de creación/edición/eliminación.
- Limpieza de la cuenta temporal y comparación de los datos originales antes/después. La auditoría permanece; al eliminar el usuario temporal, su `actor_id` queda nulo por la política `on delete set null`.

La base ya contenía el producto `bajaj 1.2` (SKU `00025`), una categoría, una marca, una imagen y tres asignaciones por sucursal. Se conservaron idénticos. La compatibilidad continúa en **50 / 6953 / 9456**. Capturas locales en `test-results/review-real-approved.png` y `test-results/review-real-public.png` (ignoradas por Git).

Los 33 candidatos se estructuraron en `docs/data/contenido-candidato-33.json`. El 23 de septiembre se importaron a la **cola de revisión** de Supabase con `scripts/import-review-queue.mjs` (idempotente, `--dry-run` para previsualizar): los 33 quedan con `source_review_status='pending'`, `published=false`, `base_price=NULL` (el precio del tercero no es el de venta), SKU provisional `PEND-###`, sin imágenes ni asignaciones de sucursal, y las categorías/marcas inexistentes se crearon inactivas/marcadas "por confirmar" (KMS, NGK, Champion, MRF, Xenkai, RGK se crearon activas por ser marcas reales del borrador; `por confirmar` quedó inactiva). No se publicó nada. El dueño debe revisar cada referencia en `/admin/revision`: confirmar identidad y SKU local, poner precio de venta, activar marca/categoría donde corresponda, asignar disponibilidad por sucursal e imágenes autorizadas. Pendientes de nota en la revisión: cantidad de la referencia 11 y fabricante/modelo de la referencia 17. Reporte del import en `docs/data/import-review-report.json`.

Se redactó `docs/MANUAL_ADMINISTRATIVO.md` sobre los formularios existentes. No se cambió el código de la aplicación ni el esquema. La entrega añade documentación, datos de preparación y el ensayo reproducible; el ensayo real, lint, typecheck y la validación estructural de los 33 candidatos terminaron correctamente. Las cifras de las suites completas del 22 de septiembre son históricas, no una nueva ejecución.

Siguiente paso: decidir y cargar el contenido comercial aprobado, confirmar dominio/tarifas y completar el ensayo de respaldo/restauración en una instancia de prueba antes de producción. SEO continúa en `noindex`. No se creó ningún commit.

### Reseñas y estadísticas añadidas (23 de septiembre)

Se añadieron las rutas públicas `/resenas` y `/api/reviews`, con selección de sucursal, estrellas, comentario, estado pendiente, deduplicación exacta por sucursal, honeypot, tiempo mínimo y límite temporal por token anónimo. Las reseñas aprobadas se proyectan mediante `public_reviews`; la tabla interna no es legible para el público.

El panel incorpora `/admin/resenas` para aprobar, ocultar, rechazar, responder o eliminar reseñas. Ocultar o rechazar exige un motivo. Una reseña negativa puede permanecer publicada y no se modera por su puntuación.

La analítica usa `page_views_daily` y `/api/analytics/pageview`: solo guarda día, ruta y contador. El navegador evita repetir una ruta en la misma pestaña; no se almacenan nombres, correos ni IP. `/admin/estadisticas` muestra hoy, 7 días, 30 días, gráfica y páginas principales. La métrica se explica como cargas de página agregadas, no visitantes únicos.

La migración `supabase/migrations/202609231000_reviews_analytics.sql` y el bloque SQL combinado estaban preparados y **ya se aplicaron en la instancia real**: las tablas `reviews`, `page_views_daily` y la vista `public_reviews` existen, y una consulta anónima con la clave publcable devuelve la reseña aprobada. La clave `SUPABASE_SERVICE_ROLE_KEY` solo se consume en servidor. Las suites e2e limpian estas variables para no crear datos de prueba reales.

### Verificación posterior (23 de septiembre, noche)

Se repasó el punto de corte de la entrega anterior y se confirmó el estado completo contra la instancia real:

- Reseñas y estadísticas operativos: `public_reviews` legible de forma anónima (1 reseña aprobada en LA PAZ TIENDA 1), `page_views_daily` con agregados de hoy por ruta y el contador de compatibilidad intacto (50 / 6953 / 9456).
- El catálogo contiene el producto propio `bajaj 1.2` (SKU `00025`) y los 33 candidatos `PEND-001…033` permanecen en la cola de revisión (pending, sin publicar).
- Todas las comprobaciones en verde: `npm run lint`, `npm run typecheck`, `npm test` (23), `npm run test:e2e` (14, ya con las rutas de reseñas), `npm run test:demo` (1) y `npm run build`.
- Se detuvo un `next dev` huérfano en el puerto 3000 (heredado de la sesión anterior) para que Playwright pudiera levantar su propio servidor.

Queda pendiente de un proceso manual el siguiente paso: revisar y aprobar cada uno de los 33 candidatos en `/admin/revision` (SKU, precio de venta, marca/categoría, sucursales e imágenes), confirmar dominio y tarifas, completar el ensayo de respaldo/restauración y solo después habilitar el SEO.

### Ensayo de respaldo/restauración (24 de septiembre)

Se preparó y **ejecutó el ensayo completo** sobre una instancia de prueba creada para ello (`rwboqudiobrjakmecjbh`), sin tocar la de producción:

- `scripts/backup-backend.mjs` exporta las 12 tablas a JSON más los buckets de Storage, con `manifest.json`. Primera copia válida en `backups/2026-09-24T03-06-21-467Z/` (34 productos, 6953 repuestos, 9456 compatibilidades, 16779 auditorías, 1 imagen).
- `scripts/restore-backend.mjs` restaura en una instancia de destino con confirmación explícita y rechaza ejecutarse contra el origen. Durante el ensayo se corrigieron dos detalles: `admin_audit_log.id` no se inserta (es `generated always as identity`) y `page_views_daily` se borra por `day` (no tiene columna `id`).
- Pasos previos necesarios surgidos del ensayo: aplicar las migraciones en orden por `psql` (pooler 5432), **recrear el usuario de Auth del administrador con el mismo UUID y correo** (Auth no se respalda vía REST) y **desactivar los triggers de auditoría** durante la restauración (si no, los INSERT la duplican: el conteo pasó de 16779 a 49823) para restablecerlos después.
- Resultado verificado: todos los conteos coinciden con el respaldo (1 admin, 8 categorías, 13 marcas, 3 sucursales, 34 productos, 1 imagen, 3 asignaciones, 50 motos, 6953 repuestos, 9456 compatibilidades, 1 reseña, 6 rutas, 16779 auditorías), la imagen se subió con su MIME y el catálogo público publicado quedó visible.
- Registro del procedimiento completo en `docs/DESARROLLO.md` (sección «Respaldo y restauración»). La suite de pruebas existente sigue siendo la misma; el ensayo no modifica el catálogo de producción.

### Verificación de los 33 candidatos contra las fuentes (24 de septiembre)

Con la autorización del propietario se verificó cada uno de los 33 candidatos de `docs/data/plantilla-decision-33.csv` contra sus URLs fuente reales (webfetch/websearch y navegador Playwright para el catálogo de Motofix, que es una SPA):

- **30 de 33 confirmadas sin cambios**: nombre y precio referenciales coinciden con la ficha de KM Motos o Motofix. Los SKU de origen y variaciones se anotaron en las observaciones de cada fila (p. ej. bujía D8EA con variantes a L 50 y L 60; pastillas DRZ400 con varias referencias entre L 63 y L 80).
- **Refs 9, 10 y 11 (Motofix)**: el catálogo de motofixhn.com es una aplicación JavaScript; con el navegador se confirmó la ficha exacta y el precio: PRZ7HC-E a L/62.54, RG4HC/CR8E a L/71.94 y pastillas delanteras **(CJA 50) a L/165.60**. Queda aclarada la advertencia de la referencia 11: el juego se presenta como caja de 50 pastillas, no como un par.
- **Ref 17 (disco Apache RTR)**: se corrigió el dato de la plantilla. La alerta anterior decía «Apache RTR es Bajaj», pero la fuente KM Motos lista **TVS** (SKU KM-ED0059); Apache RTR 160/180 es un modelo TVS. Se corrigió la descripción del producto en la cola y se creó la marca **TVS** (activa) asignándola a `PEND-017`.
- **Ref 16 (disco CB190)**: la ficha a L/680 está **agotada** en la fuente; se anotaron alternativas en la plantilla (KMS L/650, Ltj L/750) para que el negocio decida.
- Resultado en la base: los 33 siguen en estado `pending`, sin precio de venta (`base_price` nulo), sin publicar, sin imagen ni sucursales. Solo cambió el campo `brand_id` y la descripción de `PEND-017`. No se fijó ningún precio de venta: eso lo confirma el negocio en `/admin/revision`.

### Aprobación de contenido pendiente

La cola de revisión (`/admin/revision`) es el siguiente paso manual del propietario: confirmar cada una de las 33 referencias con el SKU propuesto (`RM-001…033`), el precio de venta real, la vigencia, la marca/categoría activada y las imágenes autorizadas. Después se podrá habilitar el SEO y desplegar. La plantilla `docs/data/plantilla-decision-33.csv` contiene las propuestas y las advertencias anotadas por la verificación.
