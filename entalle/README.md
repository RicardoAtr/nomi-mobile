# Entalle · tema modular y sistema de landings

Trabajo de tienda para **Entalle** (Shopify `g6v1zn-zy`). Está guardado en este repositorio solo para no perderlo; conviene moverlo a un repositorio propio.

- `theme/`: archivos del sistema v3 tal como están en el tema de desarrollo `entalle-v3-escala · desarrollo` (ID 167003455588). El resto del tema (estilos base, carrito, locales) vive solo en Shopify.
  - `theme/sections/entalle-landing.liquid` es la sección **anterior** (v2, en uso por el tema en vivo). Se conserva como respaldo.
- `docs/`: estado, identidad, arquitectura, matriz 1 a 1, procedimiento Dropify, políticas, anuncios y pendientes.
- `products/<handle>/`: registro por producto (fuente, datos, decisiones, checksums).
- `tools/`: validación y pruebas.
  - `schema-lint.py`: reglas de esquema de Shopify.
  - `check2.mjs`: Theme Check.
  - `render.mjs`: render local con liquidjs.
  - `verify.mjs`: Playwright en 7 anchos + comportamiento.
  - `inspect-reference.mjs`: inspección de una landing de referencia.
- `preview/`: render local, capturas e informe `verify-report.json`.

```bash
cd entalle/tools && npm i @shopify/theme-check-node liquidjs@10 playwright-core@1.56.1
python3 schema-lint.py ../theme && node check2.mjs
EL_MEDIA=<carpeta con webp> node render.mjs ../theme/templates/product.entalle-landing.json ../preview/clorofila.html
node verify.mjs
```
