# Base de datos de compatibilidad KM Motos

Datos extraídos del catálogo oficial de KM Motos (https://www.kmmotos.com/) el 2026-09-22.

- motorcycles: 50 modelos
- spare_parts: 6953 repuestos únicos (SKU, precio L, imagen, URL fuente)
- compatibility: 9456 compatibilidades confirmadas (repuesto → colección oficial del modelo)

Cada repuesto conserva `source_url`, `source_name` y `source_checked_at` según la sección 7 del README.
Cada compatibilidad es nivel "confirmada" con `evidence_url` = colección oficial del modelo en KM Motos.
