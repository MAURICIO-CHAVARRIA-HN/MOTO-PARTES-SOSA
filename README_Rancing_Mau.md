# Rancing Mau — Catálogo digital de repuestos para motos

Documento maestro de requisitos e instrucciones para desarrollar el sitio web de **Rancing Mau** con **Big Pickle de OpenCode** y **Codex**.

> Este archivo es la fuente principal de verdad del proyecto. Antes de programar, la IA debe leerlo completo. No debe eliminar, sustituir ni asumir requisitos sin documentar el cambio.

---

## 1. Resumen del proyecto

Construir una página web profesional, clara y adaptable para una empresa de venta de repuestos de motos llamada **Rancing Mau**.

La primera versión será un **catálogo digital administrable con carrito de solicitud de compra**. Los clientes podrán consultar productos, precios, promociones y sucursales, guardar repuestos en el carrito y enviar el pedido completo por WhatsApp. El personal autorizado podrá administrar el catálogo desde un panel privado sin modificar código.

### Inversión acordada

- Desarrollo y puesta en funcionamiento: **L 8,000**.
- El alcance debe mantenerse dentro de lo descrito en este documento.
- Cualquier función adicional debe cotizarse y aprobarse por separado.

### Objetivo principal

Permitir que Rancing Mau publique y actualice fácilmente sus repuestos, mientras los clientes encuentran productos desde su teléfono, los agregan a un carrito y envían la solicitud completa por WhatsApp al **+504 9749-1004**.

---

## 2. Sucursales

El sistema tendrá inicialmente tres sucursales:

1. **LA PAZ TIENDA 1**
2. **LA PAZ TIENDA 2**
3. **MARCALA TIENDA 3**

Son locales diferentes, pero utilizarán **el mismo catálogo general y el mismo sistema administrativo**.

### Regla de funcionamiento del catálogo compartido

- Debe existir un solo registro maestro por producto para evitar duplicados.
- Un producto podrá estar asignado a una, dos o las tres sucursales.
- Cada relación producto-sucursal debe permitir indicar disponibilidad.
- Si el negocio lo necesita, la arquitectura debe admitir precio o promoción diferente por sucursal, aunque inicialmente se puede utilizar un precio general.
- El cliente podrá filtrar el catálogo por sucursal.
- Cada sucursal tendrá su propia dirección, teléfono de WhatsApp, horario y ubicación de Google Maps.
- El botón de WhatsApp utilizará el número de la sucursal elegida. Si el cliente no ha seleccionado una, el sitio deberá pedirle escogerla antes de abrir WhatsApp.

---

## 3. Alcance incluido

La primera versión debe incluir:

- Página principal profesional.
- Catálogo administrable de productos.
- Buscador de productos.
- Filtros por categoría, marca, sucursal, estado y promoción.
- Secciones de categorías y marcas.
- Productos destacados y promociones.
- Página o sección de sucursales.
- Ubicación de cada sucursal mediante Google Maps.
- Botón de WhatsApp en cada producto.
- Carrito de compras persistente para guardar los repuestos seleccionados.
- Envío de la solicitud de compra con productos, cantidades, precios y total estimado al WhatsApp `+504 9749-1004`.
- Modo claro y modo oscuro.
- Animaciones modernas y profesionales.
- Carga inicial de imágenes, descripciones y precios de referencia encontrados en internet para Honduras, sujetos a revisión administrativa.
- Panel administrativo privado.
- Inicio y cierre de sesión del administrador.
- Base de datos.
- Almacenamiento de fotografías.
- Diseño adaptable a teléfonos, tablets y computadoras.
- Configuración para publicar el sitio en internet.
- Entrega de los accesos administrativos al finalizar.

### Fuera del alcance de esta versión

No implementar en esta fase:

- Facturación electrónica.
- Sistema de caja o punto de venta.
- Pagos en línea.
- Procesamiento de pagos dentro del carrito.
- Sincronización automática con el inventario interno.
- Control contable.
- Envíos automatizados.
- Aplicación móvil nativa.

El carrito no procesará pagos. Su función será preparar el pedido y abrir WhatsApp con el detalle completo para que la tienda confirme disponibilidad, precio final, forma de pago y entrega.

---

## 4. Identidad visual, temas y animaciones

El cliente solicitó **letras bien visibles**, una apariencia moderna, modo claro y modo oscuro. El diseño no debe verse simple ni genérico.

### Dirección visual

- Estilo moderno, enérgico y profesional relacionado con motocicletas y repuestos.
- Utilizar rojo, blanco y negro como identidad principal.
- Equilibrar las animaciones con una interfaz limpia y fácil de entender.
- Priorizar la lectura rápida de nombres, precios, estados y botones.
- Usar tarjetas de productos claras, fotografías grandes y espacios amplios.
- El sitio debe sentirse comercial y confiable, no como una plantilla genérica.

### Modo claro

- Fondo principal: `#FFFFFF`.
- Fondo secundario: `#F5F5F5`.
- Superficies y tarjetas: `#FFFFFF`.
- Texto principal: `#111111`.
- Texto secundario: `#4B4B4B`.
- Color de marca/acento: `#D71920`.
- Botones secundarios y bordes fuertes: `#111111`.
- Bordes suaves: `#E2E2E2`.

### Modo oscuro

- Fondo principal: `#080808`.
- Fondo secundario: `#121212`.
- Superficies y tarjetas: `#181818`.
- Texto principal: `#FFFFFF`.
- Texto secundario: `#C7C7C7`.
- Color de marca/acento: `#EF2B33`.
- Botones secundarios y bordes fuertes: `#FFFFFF`.
- Bordes suaves: `#303030`.

### Colores funcionales compartidos

- Promoción: `#F59E0B`.
- Disponible: `#15803D`.
- Agotado: `#B91C1C`.
- WhatsApp: `#25D366`.

La paleta debe quedar centralizada en variables CSS o tokens semánticos. En modo claro predominan **blanco, negro y rojo**; en modo oscuro se invierte la base para que predominen **negro, blanco y rojo**. No se debe invertir literalmente cada imagen o color funcional.

### Selector de tema

- Incluir un control visible con iconos y etiquetas accesibles para cambiar entre modo claro y oscuro.
- La primera visita debe respetar `prefers-color-scheme` del dispositivo.
- Guardar la elección del usuario en almacenamiento local.
- Evitar destellos de tema incorrecto al cargar la página.
- Verificar el contraste WCAG AA en ambos temas.

### Animaciones y microinteracciones

- Entrada elegante del banner principal, textos y botones.
- Aparición progresiva de secciones al desplazarse.
- Transiciones suaves en tarjetas, botones, menús, filtros y cambio de tema.
- Efecto visual moderado al pasar el cursor por un producto.
- Animación al agregar un producto al carrito y actualización visible del contador.
- Panel lateral o modal del carrito con entrada y salida fluidas.
- Indicadores animados de carga sin bloquear la interfaz.
- Las animaciones deben sentirse profesionales, no exageradas ni repetitivas.
- Preferir transformaciones y opacidad para mantener buen rendimiento.
- Respetar `prefers-reduced-motion` y ofrecer una experiencia funcional sin movimiento.
- Se puede utilizar Framer Motion o animaciones CSS, evitando dependencias innecesarias.

### Tipografía

- Utilizar una fuente sans serif de alta legibilidad, por ejemplo **Inter**, **Manrope** o **Montserrat**.
- Texto base mínimo recomendado: `16px`.
- Los precios deben tener alta jerarquía visual.
- Mantener contraste accesible de al menos WCAG AA.
- No colocar texto importante directamente sobre imágenes sin una capa que asegure su lectura.

### Diseño móvil

La prioridad es móvil. La navegación, los filtros, las tarjetas, los formularios administrativos y las tablas deben funcionar cómodamente en pantallas pequeñas.

---

## 5. Estructura del sitio público

### 5.1 Encabezado

- Logotipo y nombre **Rancing Mau**.
- Menú: Inicio, Catálogo, Promociones, Sucursales y Contacto.
- Buscador visible.
- Selector de sucursal.
- Selector de modo claro/oscuro.
- Icono de carrito con contador de unidades.
- Botón de WhatsApp.
- Menú móvil accesible.

### 5.2 Página principal

- Banner principal con mensaje comercial, imagen relacionada con repuestos y botón **Ver catálogo**.
- Acceso rápido a las tres sucursales.
- Categorías principales.
- Productos destacados.
- Productos en promoción.
- Beneficios: variedad, atención por WhatsApp y presencia en La Paz y Marcala.
- Resumen de sucursales con dirección, horario, teléfono y botón **Cómo llegar**.
- Llamada final a consultar por WhatsApp.
- Pie de página con datos de contacto, enlaces y redes sociales.

### 5.3 Catálogo

- Cuadrícula adaptable de productos.
- Buscador por nombre, descripción, marca, categoría o código/SKU.
- Filtros combinables por:
  - Sucursal.
  - Categoría.
  - Marca.
  - Disponible, agotado o en promoción.
  - Rango de precio, si resulta apropiado.
- Orden por relevancia, nombre, precio menor y precio mayor.
- Botón para limpiar filtros.
- Paginación o carga progresiva.
- Mensaje claro cuando no existan resultados.

### 5.4 Tarjeta de producto

Debe mostrar:

- Fotografía.
- Nombre.
- Marca.
- Categoría.
- Precio en lempiras con formato `L 0.00`.
- Etiqueta de disponibilidad o promoción.
- Sucursales donde está disponible.
- Botón **Ver detalles**.
- Botón **Consultar por WhatsApp**.
- Botón **Agregar al carrito**.

### 5.5 Detalle del producto

- Una o varias fotografías, si la arquitectura lo permite.
- Nombre, descripción, marca, categoría, SKU y precio.
- Estado general y disponibilidad por sucursal.
- Selector de sucursal antes de consultar.
- Botón de WhatsApp con mensaje prellenado.
- Selector de cantidad y botón **Agregar al carrito**.
- Productos relacionados.
- No mostrar controles administrativos en el sitio público.

### 5.6 Promociones

- Listado de productos marcados como promoción.
- Mostrar precio normal y precio promocional cuando ambos existan.
- No inventar descuentos ni promociones vencidas.

### 5.7 Sucursales

Cada sucursal tendrá una tarjeta o página con:

- Nombre.
- Dirección.
- Horario.
- Teléfono/WhatsApp.
- Referencia de ubicación.
- Mapa de Google Maps.
- Botones **Cómo llegar** y **Escribir por WhatsApp**.

---

## 6. Carrito y WhatsApp

### 6.1 Carrito de solicitud de compra

El carrito permitirá guardar los repuestos que el cliente desea solicitar, pero no cobrará ni reservará inventario.

Funciones obligatorias:

- Agregar un producto desde la tarjeta o página de detalle.
- Elegir cantidad.
- Aumentar o disminuir cantidad.
- Eliminar un producto.
- Vaciar el carrito con confirmación.
- Mostrar imagen, nombre, SKU, precio unitario, cantidad y subtotal.
- Mostrar total estimado en lempiras.
- Mostrar el número total de unidades en el encabezado.
- Conservar el carrito al recargar o cerrar el navegador mediante almacenamiento local.
- Validar nuevamente los datos antes de formar el mensaje.
- No solicitar tarjeta, cuenta bancaria ni información de pago.
- Informar claramente: **“Disponibilidad y precio final sujetos a confirmación de Rancing Mau.”**

Si un mismo producto se agrega de nuevo, debe aumentar su cantidad y no crear una fila duplicada. El carrito debe guardar solamente identificadores y cantidades como fuente principal; nombres y precios deben comprobarse contra el catálogo vigente al preparar la solicitud.

### 6.2 Solicitud completa por WhatsApp

El botón principal del carrito será **Solicitar compra por WhatsApp**. Debe enviar la solicitud al número central:

- Número visible: **9749-1004**.
- Formato internacional para el enlace: **50497491004**.

Mensaje de ejemplo:

```text
Hola, Rancing Mau. Quiero solicitar los siguientes repuestos:

1. [NOMBRE DEL PRODUCTO] — SKU: [SKU]
   Cantidad: [CANTIDAD]
   Precio unitario: L [PRECIO]
   Subtotal: L [SUBTOTAL]

2. [NOMBRE DEL PRODUCTO] — SKU: [SKU]
   Cantidad: [CANTIDAD]
   Precio unitario: L [PRECIO]
   Subtotal: L [SUBTOTAL]

Total estimado: L [TOTAL]
Sucursal preferida: [SUCURSAL O SIN SELECCIONAR]

Por favor, confirmen disponibilidad y precio final. Gracias.
```

El mensaje debe incluir todos los artículos, cantidades, precios y total estimado. Si el texto supera el límite práctico de una URL de WhatsApp, la interfaz debe avisar y ofrecer dividir el pedido en mensajes numerados sin perder productos.

### 6.3 Consulta de un solo producto

Cada producto debe tener un botón de WhatsApp. El mensaje prellenado debe incluir como mínimo:

```text
Hola, Rancing Mau. Me interesa el producto [NOMBRE DEL PRODUCTO], código [SKU], visto en la página web. Quiero consultar su disponibilidad en [SUCURSAL].
```

Reglas:

- Codificar correctamente el mensaje en la URL.
- Para el pedido del carrito, usar siempre `50497491004`.
- Para una consulta individual, se puede usar el número de la sucursal seleccionada cuando esté configurado; si falta, usar `50497491004`.
- No guardar números telefónicos directamente en componentes; administrarlos desde la base de datos o configuración.
- Registrar un evento analítico del clic sin almacenar el contenido privado de la conversación.

---

## 7. Obtención inicial de productos desde internet

Big Pickle y Codex podrán investigar en internet repuestos de motos disponibles o comercializados en Honduras para preparar la carga inicial del catálogo. Esta tarea no debe convertirse en una copia automática sin revisión.

### Datos que se pueden investigar

- Nombre comercial del repuesto.
- Marca y compatibilidad conocida.
- Descripción técnica resumida y reescrita.
- Precio publicado en Honduras en lempiras.
- Imagen de referencia autorizada.
- URL, comercio o fabricante de donde se obtuvo la referencia.
- Fecha en la que se verificó la información.

### Reglas obligatorias para contenido externo

- Priorizar fabricantes, distribuidores autorizados y comercios hondureños confiables.
- Confirmar que el precio esté expresado en lempiras y corresponda al producto exacto.
- No convertir un precio extranjero y presentarlo como precio de Honduras sin marcarlo como estimación.
- Registrar `source_url`, `source_name` y `source_checked_at`.
- Reescribir las descripciones con lenguaje propio, preciso y comercial; no copiar bloques completos.
- Usar únicamente imágenes propias, del fabricante, distribuidor autorizado, con licencia compatible o con permiso del propietario.
- No enlazar directamente imágenes de terceros desde el sitio final. Cuando exista permiso, descargar, optimizar y guardar una copia en el almacenamiento del proyecto.
- Mantener atribución cuando la licencia lo requiera.
- Rechazar imágenes con marcas de agua ajenas, baja resolución o contenido engañoso.
- Marcar cada producto importado como **pendiente de revisión**.
- Ningún producto obtenido de internet se publicará hasta que un administrador confirme imagen, descripción, compatibilidad y precio.
- Los precios publicados por terceros pueden cambiar. Una vez aprobados, el precio oficial del sitio será el guardado por Rancing Mau, no una lectura automática en tiempo real.
- No implementar scraping que incumpla términos del sitio, `robots.txt`, derechos de autor o medidas de acceso.

### Flujo de importación recomendado

1. La IA busca fuentes actuales de Honduras.
2. Presenta una lista con producto, precio, fuente, fecha e imagen candidata.
3. El administrador revisa y corrige.
4. El sistema importa solamente los productos aprobados.
5. Las fotografías autorizadas se optimizan a WebP o AVIF y se almacenan localmente.
6. El administrador decide en qué sucursales estará disponible cada producto.

El panel debe permitir editar todos los datos importados y mostrar la fuente únicamente al administrador. La fuente no tiene que aparecer en la ficha pública, salvo que una licencia exija atribución.

---

## 8. Panel administrativo privado

Ruta sugerida: `/admin`. Debe estar protegida con usuario y contraseña y no debe permitir acceso sin sesión válida.

### Funciones principales

- Iniciar y cerrar sesión.
- Ver resumen de productos, promociones, agotados y sucursales.
- Crear productos.
- Editar productos.
- Ocultar o volver a publicar productos.
- Eliminar productos con confirmación.
- Administrar categorías.
- Administrar marcas.
- Administrar datos de sucursales.
- Revisar, aprobar, corregir o rechazar productos propuestos a partir de fuentes de internet.
- Ver la fuente y fecha de consulta de cada producto importado.
- Buscar y filtrar productos dentro del panel.
- Ver una vista previa antes de publicar, si es viable.
- Moderar reseñas de clientes por sucursal, responderlas y conservar el motivo de ocultamiento o rechazo.
- Consultar estadísticas agregadas de visitas, páginas más visitadas y evolución diaria.

### Formulario de producto

Al registrar o editar un producto debe permitir:

- Subir fotografía desde teléfono o computadora.
- Previsualizar la fotografía.
- Revisar o sustituir la imagen candidata obtenida de una fuente autorizada.
- Escribir nombre.
- Escribir descripción.
- Colocar código o SKU.
- Colocar o actualizar precio.
- Colocar precio promocional opcional.
- Seleccionar categoría.
- Seleccionar marca.
- Asignar una o varias sucursales.
- Indicar disponibilidad por sucursal.
- Marcar como disponible, agotado o en promoción.
- Marcar como destacado en la página principal.
- Publicar u ocultar.
- Guardar fuente, fecha de consulta y estado de revisión cuando el dato provenga de internet.
- Editar o eliminar cuando sea necesario.

### Experiencia de administración

- Formularios claros y utilizables desde celular.
- Validaciones explicadas en español.
- Confirmación visual al guardar.
- Evitar pérdida de información por doble clic.
- Confirmar antes de eliminar.
- Mostrar estados de carga y errores.
- Al guardar, los cambios deben aparecer automáticamente en el sitio público sin modificar código.

### Usuarios administrativos

La primera versión puede manejar un rol `admin`, pero la estructura debe permitir agregar más usuarios posteriormente. Nunca guardar contraseñas en texto plano ni incluir credenciales reales en el repositorio.

### Reseñas públicas y estadísticas

`/resenas` permite seleccionar una sucursal, calificar de 1 a 5 estrellas y enviar un comentario. Las reseñas entran como `pending` y solo las aprobadas aparecen públicamente. El panel `/admin/resenas` permite aprobar, ocultar, rechazar, eliminar y responder; una reseña negativa no se modera por ser negativa. Se guardan fecha, moderador y motivo cuando corresponde.

`/admin/estadisticas` muestra visitas de hoy, 7 y 30 días, una gráfica diaria y las páginas más visitadas. Una visita es una carga de página pública registrada una vez por ruta y pestaña durante la sesión del navegador; no representa visitantes únicos. Solo se almacenan agregados diarios por ruta. No se guardan nombres, correos ni direcciones IP.

Estas funciones requieren la migración `supabase/migrations/202609231000_reviews_analytics.sql` y las variables de servidor `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. La clave de servicio solo se usa en las rutas del servidor para recibir reseñas e incrementar agregados; nunca debe empezar por `NEXT_PUBLIC_` ni enviarse al navegador. Si no está configurada, el formulario informa que las reseñas aún no están habilitadas y las estadísticas permanecen en cero. Antes de producción, aplicar la migración en Supabase y probar la política de RLS con una cuenta administrativa.

---

## 9. Modelo de datos recomendado

Los nombres pueden ajustarse al framework, pero deben conservarse las relaciones.

### `admin_users`

- `id`
- `name`
- `email` o `username`
- `password_hash` o identidad del proveedor de autenticación
- `role`
- `active`
- `created_at`
- `updated_at`

### `products`

- `id`
- `name`
- `slug`
- `sku`
- `description`
- `base_price`
- `promo_price` opcional
- `price_country`, valor inicial `HN`
- `source_url` opcional
- `source_name` opcional
- `source_checked_at` opcional
- `source_review_status`: `manual`, `pending`, `approved` o `rejected`
- `source_reviewed_by` opcional
- `source_reviewed_at` opcional
- `category_id`
- `brand_id`
- `general_status`: `available`, `out_of_stock` o `promotion`
- `featured`
- `published`
- `created_at`
- `updated_at`

### `product_images`

- `id`
- `product_id`
- `url`
- `source_url` opcional
- `license_or_permission` opcional
- `alt_text`
- `position`
- `is_primary`

### `categories`

- `id`
- `name`
- `slug`
- `active`

### `brands`

- `id`
- `name`
- `slug`
- `active`

### `branches`

- `id`
- `name`
- `slug`
- `address`
- `reference`
- `city`
- `whatsapp_number`
- `phone`
- `schedule`
- `google_maps_url`
- `map_embed_url` opcional
- `active`

### `product_branches`

- `id`
- `product_id`
- `branch_id`
- `available`
- `status`
- `branch_price` opcional
- `branch_promo_price` opcional
- `updated_at`

Crear restricciones de unicidad para `products.slug`, `products.sku` y la combinación `product_id + branch_id`.

### Estado del carrito

En esta versión no es obligatorio crear una tabla de pedidos porque el pedido se termina de enviar mediante WhatsApp. El carrito puede persistirse en el navegador con una estructura versionada que guarde:

- `product_id`
- `quantity`
- `branch_id` opcional
- `added_at`

Antes de generar el mensaje, el servidor o la capa de datos debe recuperar nombres y precios vigentes. No se debe confiar ciegamente en precios guardados en el navegador.

---

## 10. Arquitectura técnica sugerida

La IA puede proponer cambios justificados, pero debe priorizar bajo costo, mantenimiento sencillo, seguridad y buena experiencia móvil.

### Opción recomendada

- **Frontend y servidor:** Next.js con TypeScript.
- **Estilos:** Tailwind CSS o CSS modular con tokens de diseño.
- **Temas:** variables CSS con modo claro/oscuro y persistencia de preferencia.
- **Animaciones:** Framer Motion o CSS optimizado con soporte para movimiento reducido.
- **Carrito:** estado cliente pequeño y probado, persistido en `localStorage`; usar Context, Zustand o equivalente solamente si aporta claridad.
- **Base de datos:** PostgreSQL administrado mediante Supabase.
- **Autenticación:** Supabase Auth o solución equivalente segura.
- **Fotografías:** Supabase Storage, Cloudinary o almacenamiento compatible.
- **Validación:** Zod o equivalente tanto en cliente como servidor.
- **Despliegue:** Vercel, Cloudflare o proveedor compatible.
- **Mapas:** enlaces e inserciones oficiales de Google Maps configurables.

No depender de servicios costosos si existe una alternativa confiable dentro de los niveles gratuitos o económicos. Antes de elegir servicios definitivos, documentar costos recurrentes, límites y quién será propietario de cada cuenta.

### Reglas de implementación

- TypeScript estricto.
- Componentes reutilizables.
- Separar interfaz pública, administración, acceso a datos y validaciones.
- No incluir secretos, contraseñas ni claves en Git.
- Proporcionar `.env.example` sin valores reales.
- Crear migraciones o esquema reproducible de base de datos.
- Usar datos de prueba identificados como demostración.
- No usar datos de prueba como si fueran información real del negocio.
- Mantener nombres de variables y código en inglés; interfaz y mensajes al usuario en español.
- Incluir estados de carga, vacío y error.
- Optimizar imágenes y usar texto alternativo.

---

## 11. Seguridad mínima obligatoria

- Proteger todas las rutas y operaciones administrativas en el servidor.
- No confiar solamente en ocultar botones en el frontend.
- Utilizar autenticación segura y sesiones con vencimiento.
- Contraseñas procesadas por un proveedor seguro o mediante hash robusto.
- Aplicar autorización para crear, editar, ocultar y eliminar.
- Validar tipo, tamaño y extensión de imágenes.
- Generar nombres seguros para archivos subidos.
- Sanitizar y validar entradas.
- Proteger contra inyección, XSS, CSRF cuando corresponda y abuso de formularios.
- Aplicar límites razonables a solicitudes sensibles.
- Evitar enumerar cuentas administrativas en los mensajes de error.
- Definir políticas de acceso a base de datos y almacenamiento.
- Incluir respaldo y restauración documentados.
- Registrar cambios administrativos básicos sin guardar contraseñas ni secretos.
- No confiar en precios manipulables desde `localStorage`; comprobar el catálogo al crear la solicitud.
- No almacenar información personal del cliente sin una necesidad y consentimiento claros.

---

## 12. Rendimiento, SEO y accesibilidad

### Rendimiento

- Optimizar y redimensionar fotografías.
- Carga diferida para imágenes fuera de pantalla.
- Evitar dependencias pesadas innecesarias.
- Evitar que las animaciones retrasen la interacción o el contenido principal.
- Priorizar una carga rápida con conexiones móviles.
- Objetivo inicial: Lighthouse alto en rendimiento, accesibilidad, buenas prácticas y SEO.

### SEO

- Títulos y descripciones por página.
- URLs legibles.
- Metadatos para compartir productos en Facebook y WhatsApp.
- `sitemap.xml` y `robots.txt`.
- Datos estructurados de negocio local y producto cuando sean correctos.
- No publicar páginas administrativas en buscadores.

### Accesibilidad

- Navegación mediante teclado.
- Etiquetas asociadas a formularios.
- Indicador visible de foco.
- Contraste WCAG AA.
- Texto alternativo en imágenes.
- Botones con nombres claros.
- No depender únicamente del color para comunicar disponibilidad.
- El cambio de tema y el carrito deben funcionar con teclado y lector de pantalla.
- Respetar `prefers-reduced-motion`.

---

## 13. Datos pendientes que no se deben inventar

Antes de publicar la versión final, solicitar al propietario:

- Logotipo definitivo de Rancing Mau.
- WhatsApp individual de cada sucursal. El número central de pedidos ya definido es `9749-1004`.
- Dirección exacta de cada sucursal.
- Enlaces o coordenadas de Google Maps.
- Horarios.
- Redes sociales.
- Correo administrativo.
- Dominio deseado.
- Categorías iniciales.
- Marcas iniciales.
- Fotografías, nombres, descripciones y precios de productos.
- Confirmación del propietario sobre cada producto investigado en internet antes de publicarlo.
- Nombre comercial exacto y confirmación de que se escribe **Rancing Mau**.

Mientras falten datos, utilizar marcadores evidentes como `PENDIENTE_WHATSAPP_TIENDA_1`. No inventar números, ubicaciones, precios, testimonios ni promociones.

---

## 14. Configuración inicial de sucursales

Crear estas sucursales como datos iniciales, sin inventar información adicional:

```json
[
  {
    "name": "LA PAZ TIENDA 1",
    "slug": "la-paz-tienda-1",
    "city": "La Paz",
    "whatsapp_number": "PENDIENTE",
    "address": "PENDIENTE",
    "google_maps_url": "PENDIENTE",
    "active": true
  },
  {
    "name": "LA PAZ TIENDA 2",
    "slug": "la-paz-tienda-2",
    "city": "La Paz",
    "whatsapp_number": "PENDIENTE",
    "address": "PENDIENTE",
    "google_maps_url": "PENDIENTE",
    "active": true
  },
  {
    "name": "MARCALA TIENDA 3",
    "slug": "marcala-tienda-3",
    "city": "Marcala",
    "whatsapp_number": "PENDIENTE",
    "address": "PENDIENTE",
    "google_maps_url": "PENDIENTE",
    "active": true
  }
]
```

---

## 15. Flujo de trabajo para Big Pickle y Codex

### Fase 1 — Análisis

1. Leer este `README` completo.
2. Inspeccionar el repositorio antes de modificarlo.
3. Confirmar la tecnología existente y no reemplazarla sin justificación.
4. Crear un plan por fases y una lista de datos pendientes.
5. Definir el esquema de base de datos y la seguridad.
6. Preparar una estrategia de búsqueda de productos en fuentes hondureñas y revisión administrativa.

### Fase 2 — Diseño base

1. Crear tokens de color, tipografía, espaciado y componentes para los modos claro y oscuro.
2. Construir primero la experiencia móvil.
3. Implementar encabezado, página principal, catálogo, producto y sucursales.
4. Usar datos de demostración claramente identificados.
5. Verificar contraste y legibilidad.
6. Implementar animaciones y comprobar la experiencia con movimiento reducido.

### Fase 3 — Backend y administración

1. Crear base de datos y migraciones.
2. Configurar autenticación.
3. Configurar almacenamiento de fotografías.
4. Implementar CRUD de productos, categorías, marcas y sucursales.
5. Implementar la relación compartida entre productos y sucursales.
6. Validar permisos en el servidor.
7. Implementar el flujo de revisión para productos investigados en internet.

### Fase 4 — Integración y calidad

1. Conectar el sitio público a los datos reales.
2. Implementar buscador, filtros, carrito persistente y WhatsApp.
3. Verificar el cálculo de cantidades, subtotales y total estimado.
4. Probar alta, edición, ocultamiento y eliminación de productos.
5. Probar ambos temas en celular, tablet y computadora.
6. Ejecutar pruebas, lint, compilación y revisión de accesibilidad.
7. Corregir errores antes de publicar.

### Fase 5 — Publicación y entrega

1. Configurar variables de entorno de producción.
2. Configurar dominio y despliegue.
3. Crear la primera cuenta administrativa mediante un proceso seguro.
4. Investigar y presentar productos hondureños con fuentes verificables.
5. Cargar únicamente datos e imágenes aprobados.
6. Entregar accesos al propietario sin escribirlos en este archivo ni en Git.
7. Entregar instrucciones breves de uso, respaldo y recuperación.

---

## 16. Reglas de colaboración entre IAs

- Cada IA debe revisar el trabajo existente antes de editar.
- No reescribir módulos completos si basta con un cambio localizado.
- No eliminar funciones aprobadas.
- Mantener este documento actualizado cuando una decisión cambie.
- Explicar cambios importantes en el registro del proyecto.
- Ejecutar verificaciones después de cada conjunto de cambios.
- No declarar una función como terminada sin probarla.
- No publicar el sitio ni modificar servicios externos sin autorización del propietario.
- No inventar credenciales ni exponer secretos en mensajes, capturas o commits.
- No publicar automáticamente productos, precios o imágenes hallados en internet sin revisión humana.
- Cuando exista una ambigüedad que afecte precio, identidad, contenido o funcionamiento, detenerse y preguntar.

---

## 17. Criterios de aceptación

El proyecto se considerará listo cuando:

- El sitio se vea correctamente en móvil, tablet y computadora.
- Los textos sean claros y legibles.
- Los modos claro y oscuro respeten la combinación rojo, blanco y negro y mantengan buen contraste.
- La preferencia de tema permanezca guardada y no produzca destellos al cargar.
- Las animaciones se vean profesionales y no reduzcan el rendimiento ni la accesibilidad.
- El administrador pueda iniciar sesión de forma segura.
- Se pueda crear un producto con fotografía desde un teléfono.
- Se pueda editar precio, descripción, categoría, marca, sucursal y estado.
- Se pueda destacar, ocultar y eliminar un producto.
- Un cambio guardado se refleje automáticamente en el catálogo público.
- El catálogo permita buscar y combinar filtros.
- Las tres sucursales aparezcan separadas, pero compartan el catálogo maestro.
- La disponibilidad por sucursal se muestre correctamente.
- El botón de WhatsApp utilice producto y sucursal correctos.
- El cliente pueda agregar, modificar y eliminar productos del carrito.
- El carrito permanezca al recargar la página.
- El total se calcule correctamente y se muestre como estimado.
- La solicitud completa se envíe al `+504 9749-1004` con artículos, cantidades, precios y total.
- Los productos encontrados en internet conserven fuente y fecha, y requieran aprobación antes de publicarse.
- Los mapas y datos de contacto funcionen.
- No haya credenciales expuestas.
- Compilación, lint y pruebas principales finalicen sin errores.
- El propietario reciba los accesos y una guía de administración.

---

## 18. Pruebas mínimas

- Inicio y cierre de sesión.
- Rechazo de credenciales inválidas.
- Bloqueo de rutas administrativas sin sesión.
- Creación de producto con imagen válida.
- Rechazo de archivos no permitidos o demasiado grandes.
- Edición y ocultamiento de producto.
- Confirmación antes de eliminar.
- Producto asignado a una sola sucursal.
- Producto asignado a las tres sucursales.
- Disponibilidad diferente por sucursal.
- Búsqueda con y sin resultados.
- Combinación de marca, categoría y sucursal.
- Precio normal y promocional.
- Mensaje y número correctos en WhatsApp.
- Agregar dos veces el mismo producto y acumular la cantidad.
- Modificar cantidades, eliminar productos y vaciar carrito.
- Persistencia del carrito después de recargar y cerrar el navegador.
- Cálculo correcto de subtotales y total.
- Revalidación de precios antes de generar el pedido.
- Mensaje de pedido completo enviado a `50497491004`.
- Pedido extenso dividido de forma segura cuando no quepa en un solo enlace.
- Cambio de tema, persistencia de preferencia y respeto al tema del sistema.
- Animaciones con `prefers-reduced-motion` activado.
- Producto importado pendiente que no puede aparecer públicamente.
- Aprobación administrativa de fuente, descripción, imagen y precio.
- Diseño en anchos móviles comunes.
- Navegación con teclado y lector de pantalla básico.

---

## 19. Entregables

- Código fuente organizado.
- Sitio público funcional.
- Panel administrativo funcional.
- Base de datos y migraciones.
- Almacenamiento de fotografías configurado.
- `.env.example` sin secretos.
- Datos iniciales de las tres sucursales.
- Carrito persistente y solicitud por WhatsApp configurada para `9749-1004`.
- Modos claro y oscuro con animaciones optimizadas.
- Registro de fuentes y aprobación de productos obtenidos de internet.
- Manual breve para administrar productos.
- Instrucciones de instalación, desarrollo, pruebas y despliegue.
- Accesos administrativos entregados de manera privada.
- Registro de servicios utilizados y posibles costos recurrentes.

---

## 20. Comandos del proyecto

La IA desarrolladora debe completar esta sección cuando inicialice el repositorio:

```bash
# Instalar dependencias
npm ci

# Ejecutar en desarrollo
npm run dev

# Ejecutar pruebas de lógica y base de datos local
npm test

# Instalar navegador de pruebas (primera vez)
npx playwright install chromium

# Ejecutar pruebas de navegador
npm run test:e2e

# Ejecutar lint
npm run lint

# Verificar tipos
npm run typecheck

# Compilar para producción
npm run build
```

### Modo de demostración local (opcional, solo desarrollo)

Para probar el flujo completo de compra (catálogo → carrito → cotización → WhatsApp) sin esperar la base de datos, se puede iniciar un **catálogo de demostración** con precios de ejemplo claramente marcados:

```bash
CATALOG_DEMO=true npm run dev
npm run test:demo
```

Los productos de demostración usan SKU `DEMO-*`, muestran "MODO DEMO" en la barra superior y **no son precios ni inventario reales**. Este modo se desactiva automáticamente en producción y no reemplaza la vista previa predeterminada. Su propósito es permitir la revisión de la entrega con datos controlados por el negocio en la fase 4.

---

## 21. Definición final del producto

**Rancing Mau** será un catálogo digital de repuestos de motos, administrado por el propio negocio, con tres sucursales independientes conectadas a un catálogo central. La experiencia estará enfocada en teléfonos, tendrá modos claro y oscuro en rojo, blanco y negro, tipografía visible, animaciones profesionales y un carrito para preparar solicitudes por WhatsApp.

La carga inicial podrá apoyarse en productos, descripciones, imágenes autorizadas y precios de Honduras encontrados en internet, pero todo contenido externo requerirá fuente, fecha y aprobación administrativa. La primera versión debe ser sencilla de administrar, segura, rápida y preparada para crecer, sin convertirse todavía en un sistema de facturación, caja o comercio electrónico con pagos en línea.


---

## 22. Registro de inicio — 21 de septiembre de 2026

Se inicializó la base con Next.js y TypeScript, una vista previa pública navegable, carrito local, temas y esquema de Supabase. El catálogo de referencia no contiene precios ni existencias inventados y no permite enviar solicitudes de compra.

El CRUD administrativo, la carga de imágenes, la conexión a Supabase real, el contenido aprobado y la publicación siguen pendientes. El estado por fases y las decisiones están en [docs/PLAN_Y_ESTADO.md](docs/PLAN_Y_ESTADO.md); los comandos y la configuración se explican en [docs/DESARROLLO.md](docs/DESARROLLO.md). Esta inicialización no representa la entrega final del proyecto.
