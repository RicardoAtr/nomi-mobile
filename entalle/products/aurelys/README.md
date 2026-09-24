# Aurelys Drenaje Linfático · registro de adaptación (24 sep 2026)

- **Producto Shopify:** 10318042071140 (`drenaje-linfatico-aurelys`, ACTIVO). Importado con Dropify; Dropi ID 161583.
- **Plantilla:** `templates/product.aurelys.json`, subida al tema v6 (167006142564). El producto tiene `templateSuffix = aurelys`. El tema publicado (v5) no tiene esa plantilla, así que la página pública sigue usando `product.json` hasta que se publique v6.
- **Referencia:** https://yallegashopping.com/products/aurelys-drenaje-linfatico. Las capturas y `reference-report.json` están en `ref/`.

## De la referencia a las secciones de Entalle
| Referencia | Entalle | Decisión |
|---|---|---|
| Galería | `el-product-main` (bloque gallery_image) | Se usa la foto propia del frasco. El alt del producto ("Gray helmet…") está mal y se corrige en la plantilla |
| Botón contra entrega sobre el título | Bloque CTA arriba ("PIDE AHORA") + "Agregar al carrito" | Replicado |
| Precio tachado y sello "OFERTA" | Precio sin tachado | No hay descuento real. No se copia el precio de la referencia |
| 2x1 | Packs de 1 y 2 frascos a precio normal | Sin descuento real no se muestra 2x1 |
| Hook y 4 íconos | `el-benefits` "Tu día pesa. Tu rutina, no." | Adaptado, sin afirmaciones de salud |
| Caja "rituales" | `el-media-text` | Adaptado |
| Antes y después / testimonios | No se usa (`el-reviews` queda oculto) | No hay reseñas verificadas y las imágenes son de terceros |
| Imagen de especificaciones | `el-benefits` como "Especificaciones" | Solo datos de la etiqueta (50 ml, gotario, suplemento) |
| FAQ | `el-faq` (6 preguntas) + JSON-LD | Adaptado. Dosis: "según la etiqueta" |
| Banner de confianza | `el-guarantees` + `el-cta-banner` | Replicado con datos reales de Entalle |

## Contradicciones detectadas
- La referencia vende **30 ml** con otros ingredientes (Galium aparine, trébol rojo, Stillingia, fresno espinoso). La etiqueta del producto de Entalle dice **50 ml**, y Dropi indica diente de león, bardana, amor de hortelano y té verde. **No se listan ingredientes** hasta confirmarlos con la etiqueta.
- **Precio:** Shopify tiene $8.000 (el precio sugerido de Dropi). La referencia vende a $37.990. El precio lo define el dueño de la tienda.

## Verificado en la vista previa real (v6)
- La plantilla carga las 13 secciones sin desplazamiento horizontal, en 390 y 1280 px.
- "PIDE AHORA" abre el formulario de Releasit (total $8.000). El botón propio de Releasit y su barra fija quedan ocultos.
- "Agregar al carrito" con el pack de 2 agrega 2 unidades ($16.000) y abre el carrito lateral.
- **Descuento de $1.500 al cerrar el formulario:** no aparece en Aurelys. Releasit no pide la oferta (`get-upsell`) para este producto, pero sí para Clorofila, donde se volvió a comprobar hoy. Es una regla de la configuración de Releasit (productos o monto mínimo del downsell); el tema no la controla.
