# Desarrollo local

## Requisitos e inicio

Node.js compatible con Next.js 16 (mínimo 20.9). Se verificó esta base con Node 26.8.2 y npm 12.0.2. Las versiones exactas de dependencias están en `package-lock.json`.

```bash
npm ci
npm run dev
```

Abrir `http://localhost:3000`. Sin credenciales, el servidor de desarrollo ofrece una vista previa con cinco imágenes de referencia. No requiere cuentas administrativas de prueba. Los precios están pendientes y las solicitudes de compra de estos productos están bloqueadas.

Las imágenes de referencia se leen de `img/productos` por una lista permitida y no se sirven en producción. El directorio `img/` es material de trabajo y no debe subirse a un hosting estático.

## Modo demostración local

Sin Supabase, el servidor de desarrollo ofrece una vista previa sin precios y con el envío bloqueado (regla de no inventar precios). Para ejercitar el flujo completo **catálogo → carrito → cotización → WhatsApp** con precios de ejemplo claramente marcados, iniciar con `CATALOG_DEMO=true`:

```bash
CATALOG_DEMO=true npm run dev
npx playwright install chromium
npm run test:demo
```

El modo demo solo funciona en desarrollo (`NODE_ENV !== "production"`), ofrece 100 productos de ejemplo en 10 categorías con SKU `DEMO-*`, indica "MODO DEMO" en la barra superior y reutiliza las imágenes de referencia. La página muestra 12 tarjetas por tanda y permite cargar el catálogo completo con "Ver más productos". `npm run test:demo` levanta su propio servidor en el puerto 3001 con `playwright.demo.config.ts`. No debe activarse en producción.

## Comprobaciones

```bash
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

`npm test` cubre carrito, cálculos, integridad del mensaje, generación del seed de compatibilidad y políticas SQL en PGlite (incluida la migración de compatibilidad). Playwright prueba la vista previa de desarrollo en escritorio y móvil. Capturas y trazas se guardan en `test-results/` (ignorado por Git).

Para regenerar o verificar la base de compatibilidad KM Motos sin conexión:

```bash
npm run compat:import
```

Lee `docs/data/km-motos-compatibilidad.json` y regenera `supabase/seeds/compatibilidad.sql` de forma determinista (50 modelos, 6953 repuestos, 9456 compatibilidades). Si se configuran `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, en lugar del seed inserta directamente en Supabase en bloques idempotentes.

Para ejecutar la compilación de producción localmente:

```bash
npm run build
npm start
```

Sin Supabase, producción muestra un catálogo vacío y las sucursales pendientes. La vista previa nunca se habilita con `NODE_ENV=production`, incluso si `CATALOG_PREVIEW=true`.

`npm run test:e2e` levanta su propio servidor de desarrollo con el entorno fijado a la vista previa determinista (variables de proceso que anulan `.env.local`), así que pasa aunque tengas Supabase configurado; no reutiliza un `next dev` que ya esté corriendo. `npm run test:demo` hace lo propio en el puerto 3001 y, desde que existe una base configurada, el modo demo se activa antes de consultar la base (solo desarrollo, `CATALOG_DEMO=true`).

## Preparar Supabase cuando se disponga de la cuenta

1. Crear el proyecto en una cuenta propiedad del negocio después de revisar costos y autorización de publicación.
2. Copiar `.env.example` a `.env.local` y configurar URL y clave pública publicable. No guardar secretos ni una clave `service_role` en el frontend.
3. Aplicar las migraciones en orden `supabase/migrations/202609210001_initial.sql`, `202609211000_admin.sql`, `202609221000_compatibility.sql` y `supabase/migrations/202609231000_reviews_analytics.sql` sobre una base nueva. Son migraciones de ejecución única, no scripts idempotentes para repetir sobre tablas existentes. La segunda añade índices para el panel (estado de revisión, publicación y destacados). La tercera crea las tablas `motorcycles`, `spare_parts` y `compatibility` (solo admin, sin proyección al catálogo público) con sus políticas y auditoría. La cuarta crea reseñas moderables, la vista pública `public_reviews`, estadísticas agregadas y la función interna de incremento diario.
4. Tras la migración de compatibilidad, cargar el seed `supabase/seeds/compatibilidad.sql` en el SQL editor (o ejecutar `npm run compat:import` con Supabase configurado para insertar las 50 motos, 6953 repuestos y 9456 compatibilidades de KM Motos). Es idempotente: los `on conflict` actualizan en vez de duplicar.
5. Crear la primera identidad desde la administración segura de Supabase Auth. Deshabilitar registro público si no se requiere.
6. Asociar el UUID de esa identidad en `admin_users` desde SQL administrativo. Usar datos reales en el entorno seguro, nunca en el repositorio:

```sql
insert into public.admin_users(id, name, role, active)
values ('UUID_DEL_USUARIO_CREADO_EN_AUTH', 'NOMBRE_DEL_ADMINISTRADOR', 'admin', true);
```

6. Reiniciar el servidor y comprobar inicio/cierre de sesión y rechazo de acceso sin membresía activa.
7. Comprobar el flujo completo del panel: crear/editar producto, asignar sucursales, subir y previsualizar una fotografía desde móvil, publicar y verificar su aparición en el catálogo público, y aprobar una fuente externa desde la cola de revisión. El límite de carga de server actions está fijado en 8 MB (`experimental.serverActions.bodySizeLimit`) para permitir fotografías de hasta 5 MB. Las rutas `/api/admin/images` y `/images/[...path]` están protegidas por sesión de administrador.
8. Las reseñas y estadísticas ya están habilitadas en la instancia conectada (migración `202609231000_reviews_analytics.sql` aplicada y verificada). Para activarlas en un entorno nuevo, conservar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` solo en el entorno del servidor. La ruta pública `/api/reviews` valida sucursal, estrellas, longitud, honeypot, tiempo mínimo, duplicados exactos y un máximo de tres envíos por token anónimo en una hora. No guarda nombres, correos ni IP. `/api/analytics/pageview` solo acepta rutas públicas y llama a `increment_page_view`; el navegador evita repetir la misma ruta en una pestaña. El administrador consulta `/admin/resenas` y `/admin/estadisticas` después de iniciar sesión.

Estado al 22 de septiembre (madrugada): con la instancia real conectada y la cuenta administrativa creada por el propietario y asociada en `admin_users`, quedó validado con navegador el flujo completo del panel: login/logout, alta de categoría, marca y producto publicado con fotografía, promoción de la imagen de `catalog-candidates` a `catalog-public`, asignación de sucursales, aparición en el catálogo público y en la ficha, y eliminación con limpieza del bucket. Durante esa validación se corrigió la configuración de `next/image` para servir fotografías desde el Storage de Supabase (host derivado de `NEXT_PUBLIC_SUPABASE_URL` en `next.config.ts`); sin esto, un producto publicado hacía fallar el render del catálogo público. Queda pendiente validar la cola de revisión con un producto externo real, preparar contenido aprobado, habilitar SEO y desplegar.

La página `/admin` muestra el resumen con enlaces. El panel incluye listado de productos, alta/edición, categorías, marcas, sucursales, cola de revisión de fuentes y la sección `Compatibilidad` (`/admin/compatibilidad`), que consulta la base de repuestos por modelo importada de KM Motos: estadísticas, listado de modelos y de repuestos con búsqueda y filtro por categoría, y el detalle de cada uno con sus enlaces. El CRUD y la carga de fotos requieren una instancia de Supabase conectada; sin ella todas las rutas admin redirigen al acceso. El flujo completo del panel quedó probado end-to-end contra Auth y Storage reales.

## Estructura

- `src/app`: páginas, metadatos, rutas de API y acceso administrativo.
- `src/components`: interfaz pública, filtros, carrito, selectores y formularios iniciales.
- `src/lib`: configuración, catálogo, carrito, tipos, datos de vista previa y conexión Supabase.
- `src/lib/demo.ts`: catálogo de demostración opcional de 100 productos (`CATALOG_DEMO=true`, solo desarrollo) para probar el flujo completo de compra por WhatsApp.
- `src/lib/compatibility.ts`: consultas del panel (resumen, modelos, repuestos y enlaces) contra las tablas `motorcycles`, `spare_parts` y `compatibility`.
- `src/lib/compat-data.ts`: esquema Zod, UUID deterministas y generación del seed a partir de `docs/data/km-motos-compatibilidad.json`; usado por `npm run compat:import`.
- `supabase/migrations`: esquema, políticas, restricciones y sucursales iniciales.
- `supabase/seeds`: datos iniciales; `compatibilidad.sql` es el seed de compatibilidad KM Motos generado.
- `docs/data`: base de compatibilidad KM Motos (CSV y JSON) con su README.
- `tests`: pruebas de lógica, SQL y navegador.
- `docs/PLAN_Y_ESTADO.md`: fases, decisiones y pendientes.

## Respaldo y restauración

El respaldo del negocio tiene dos partes porque el dump de PostgreSQL no incluye los archivos binarios: los datos en tablas y las fotografías de Storage.

### Respaldo local (seguro, de solo lectura)

`scripts/backup-backend.mjs` exporta a `backups/<marca-de-tiempo>/`:

- Las 13 tablas de negocio a JSON (use la clave de servicio; lectura únicamente).
- Todos los objetos de `catalog-candidates` y `catalog-public`, recorriendo subcarpetas.
- `manifest.json` con origen, fecha, conteos y rutas.

```bash
node --env-file=.env.local scripts/backup-backend.mjs
```

Cada ejecución crea una carpeta nueva con marca de tiempo; la carpeta `backups/` está en `.gitignore` y **no debe subirse a Git** porque contiene datos reales del negocio. Guardar las copias fuera del hosting con acceso restringido; las claves de servicio nunca deben exponerse.

```bash
node --env-file=.env.local scripts/backup-backend.mjs --out /ruta/segura/externa
```

### Restauración (ensayo, solo sobre instancia de prueba)

`scripts/restore-backend.mjs` recibe una carpeta de respaldo y la inserta en una instancia de destino usando `RESTORE_URL` y `RESTORE_SERVICE_ROLE_KEY`. **Borra el destino antes de insertar**, por lo que únicamente debe usarse sobre una instancia de prueba creada para el ensayo, nunca sobre producción ni sobre datos a conservar. Rechaza ejecutarse si el destino coincide con el origen y pide confirmación con la fecha del manifest.

```bash
RESTORE_URL=https://...supabase.co RESTORE_SERVICE_ROLE_KEY=... \
  node scripts/restore-backend.mjs backups/2026-... --confirm="2026-..."
```

### Ensayo de restauración (ejecutado el día 24)

Validado contra la instancia de prueba `rwboqudiobrjakmecjbh`. Pasos realizados por el operador con las claves de esa instancia:

1. Aplicar las migraciones en orden por `psql` (usuario `postgres`, puerto pooler 5432).
2. **Recrear el usuario de Auth del administrador** con el mismo `id` y correo del original. Es imprescindible: `admin_users`, `admin_audit_log.actor_id` y `reviews.moderated_by` referencian `auth.users` y este no se respalda vía REST. Con `auth.admin.createUser({ id, email, password, email_confirm: true })` se conserva el UUID.
3. **Desactivar los triggers de auditoría** antes de restaurar (`audit_change`, `reviews_audit`). Sin este paso, los `INSERT` de la restauración vuelven a escribir `admin_audit_log` y el conteo se duplica (en el ensayo pasó de 16779 a 49823). Tras restaurar se vuelven a habilitar.
4. Restaurar con `scripts/restore-backend.mjs`. Diferencias frente a borrar con una sola condición: `admin_audit_log` no inserta su `id` (es `generated always as identity`) y `page_views_daily` no tiene columna `id`, por lo que se borra por `day > '0001-01-01'`. La subida de Storage especifica `contentType` según extensión.
5. Comprobar conteos por tabla contra el `manifest.json`, el archivo de imagen y el acceso público.

Resultado del ensayo: catálogo 34 productos (1 publicado), 6953 repuestos, 9456 compatibilidades, 50 motos, 8 categorías, 13 marcas, 3 sucursales, 1 reseña aprobada, 6 rutas de vistas, 16779 registros de auditoría y 1 imagen restaurada, coincidiendo con el respaldo. El ensayo quedó registrado en `docs/PLAN_Y_ESTADO.md`.

## Próxima entrega

Actualización del 23 de septiembre: la cola de revisión ya fue validada contra Supabase real con la ficha externa KM-FF0003, mediante rechazo, retorno a pendiente, aprobación y publicación; se comprobó la promoción de imagen, el acceso público y la limpieza posterior. El producto existente del propietario quedó intacto. Detalles en la última entrada de `docs/PLAN_Y_ESTADO.md`.

Lo siguiente es completar el contenido aprobado del negocio: los 33 repuestos de `docs/CONTENIDO_PENDIENTE.md`, preparados en `docs/data/contenido-candidato-33.json`, deben pasar por revisión con SKU, precio de venta, disponibilidad e imágenes autorizadas. El archivo es un borrador local y no se ha importado. El manual de trabajo está en `docs/MANUAL_ADMINISTRATIVO.md`. Después: configurar dominio, habilitar SEO/sitemap, revisar tarifas y completar despliegue e integración. El ensayo de respaldo/restauración ya fue ejecutado y comprobado sobre una instancia de prueba el día 24.

## Repetir el ensayo de la cola contra Supabase real

Este ensayo escribe temporalmente en Auth, tablas y Storage de la instancia configurada. Crea su propia cuenta administrativa, conserva su contraseña solo en memoria y elimina los recursos creados al terminar. El producto de prueba se publica brevemente como «PRUEBA NO VENTA», agotado, con una imagen técnica propia; no es una carga comercial. No ejecutar simultáneamente con otras ediciones del catálogo, ya que compara los datos antes/después.

Con `.env.local` configurado con las claves pública y administrativa existentes, iniciar el servidor local:

```bash
CATALOG_DEMO=false CATALOG_PREVIEW=false npm run dev
```

En otra terminal:

```bash
node --env-file=.env.local scripts/validate-review-real.mjs --run-real
```

No necesita `ADMIN_TEST_EMAIL` ni `ADMIN_TEST_PASSWORD`. Solo acepta `localhost` o `127.0.0.1` como servidor de la aplicación; puede cambiarse el puerto con `ADMIN_TEST_ORIGIN`. Nunca ejecutar con un proyecto de producción que no admita registros de prueba. La limpieza normal se ejecuta incluso si falla una aserción; una terminación forzada del proceso puede interrumpirla. Los recursos se identifican mediante un UUID por ejecución y SKU `QA-SOURCE-*`. La auditoría se conserva, aunque al eliminar la cuenta temporal su actor queda nulo por el esquema actual.

El ensayo verifica publicación bloqueada en pendiente/rechazado, decisiones y autor/fecha de revisión, aislamiento de imágenes, promoción, render público y eliminación. Deja capturas en `test-results/review-real-*.png`, sin guardar sesión ni credenciales. No sustituye el ensayo de restauración ni la aprobación humana de los 33 productos.
