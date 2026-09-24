# Procedimiento: nuevo producto de Dropify → landing Entalle

**Entrada:** producto ya importado por Dropify en Shopify (enlace o ID) + URL de una landing de referencia.
**Salida:** vista previa lista para revisar, sin publicar ni cambiar productos activos sin aprobación.

## 1. Identificar el producto (solo lectura)
Consulta GraphQL: `product(id)` → título, estado, handle, `templateSuffix`, variantes (id, precio, compare_at, SKU, `inventoryPolicy`, `tracked`) y metacampo `dropi._dropi_product`.
- Anotar en `products/<handle>/README.md` lo siguiente:
  - El ID de Dropi y las marcas `sob_nombre`, `sob_descripcion`, `sob_precio` y `sob_images`. Si están en true, Dropify puede sobrescribir esos campos.
  - El `stock` y la bodega según Dropi. Solo como referencia: no se muestra si Shopify no controla el inventario.
- **No tocar:** variantes, SKU, proveedor, inventario, ubicaciones, metacampos `dropi.*` ni la configuración de fulfillment.
- **No copiar en los documentos** el campo `tokens` del metacampo de Dropi: es una credencial.

## 2. Inspeccionar la referencia
`node tools/inspect-reference.mjs <url> products/<handle>/ref/` genera capturas en 7 anchos, bloques, CTA, keyframes, barra fija, formulario (sin enviar) e inventario de recursos. Requiere que la red permita el dominio.

## 3. Extraer y detectar contradicciones
Comparar la referencia con el producto real: tamaño, contenido, ingredientes, certificaciones y afirmaciones de salud.
- **No copiar** precios, inventario, impuestos, pesos ni plazos de la referencia.
- **Imágenes de la referencia:** solo como guía de la función comercial. Se crean piezas propias o se usan las del proveedor con permiso.

## 4. Crear la plantilla del producto
1. Copiar `theme/templates/product.el-base.json` → `theme/templates/product.<handle>.json`.
2. Llenar los bloques y secciones: título comercial, propuesta de valor, packs (unidades y unidades cobradas **iguales al descuento real**), beneficios, demostración, videos, FAQ, qué incluye y garantías confirmadas.
3. Si Dropify sobrescribe las imágenes, agregar bloques *Imagen de galería* con las imágenes definitivas subidas a Archivos.
4. Validar: `python3 tools/schema-lint.py theme` y `node tools/check2.mjs`.
5. Render local: `node tools/render.mjs theme/templates/product.<handle>.json preview/<handle>.html`, luego `node tools/verify.mjs`, que debe dar 0 desbordamientos, barra fija correcta y 1 navegación.

## 5. Ofertas reales
Si hay un pack con precio especial, crear o verificar el **descuento automático** en Shopify. Comprobarlo con `draftOrderCalculate(acceptAutomaticDiscounts: true)` para cada cantidad. Las unidades cobradas del bloque deben coincidir con el resultado.

## 6. Subir al tema de desarrollo
Subir por URL firmada (`stagedUploadsCreate` PUT → `themeFilesUpsert` URL) y verificar el checksum MD5 contra el archivo local. Las subidas por URL **no devuelven errores**: si un archivo no aparece, validar su esquema con una subida TEXT pequeña.

## 7. Asignar la plantilla (cambio preparado para revisión)
Asignar `templateSuffix = <handle>` al producto modifica un producto. Si está activo, **queda preparado y lo aprueba el usuario**. Si el tema en vivo no tiene esa plantilla, Shopify usa `product.json`; por eso asignarla antes de publicar no cambia la tienda en vivo.

## 8. Verificar y entregar
- Vista previa: `https://www.entalle.cl/products/<handle>?preview_theme_id=<tema>`.
- Probar en móvil y PC el CTA, el formulario de Releasit y un pedido de prueba cancelado.
- Actualizar `docs/03-matriz-1a1.md` y `products/<handle>/README.md` con la fecha, la fuente, los recursos y los cambios.

## Detección de cambios manuales
Antes de volver a subir una plantilla, descargar la versión remota y comparar su checksum con el último registrado en `products/<handle>/README.md`. Si difiere, alguien la editó en el editor de temas: fusionar esos cambios, no sobrescribirlos.

## Futuro (sin activar)
Detectar productos nuevos en la tienda de referencia (rastreo periódico) y crear borradores de plantilla automáticamente. Se deja fuera a propósito: no se activa monitoreo ni publicación automática.

## Regla de contenido (decisión del dueño, 24 sep)
- Se copian los **precios, packs y ofertas** de la página objetivo, salvo indicación contraria. Si la oferta es 2x1, se crea el descuento automático BXGY del producto, combinable con otros descuentos (así funciona el downsell de Releasit).
- Los copys se adaptan **solo un poco**.
- Si la página objetivo no trae un dato, no se agrega.
- Excepciones fijas:
  - no se copian testimonios de otra tienda;
  - los datos físicos (ml, porciones) salen de la etiqueta del producto propio.
- El downsell de Releasit se configura por producto: hay que agregar cada producto nuevo en Releasit → Downsells.
