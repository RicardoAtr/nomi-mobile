# Aurelys Drenaje Linfático · registro de adaptación (24 sep 2026)

- **Producto Shopify:** 10318042071140 (`drenaje-linfatico-aurelys`, ACTIVO). Importado con Dropify; Dropi ID 161583.
- **Plantilla:** `templates/product.aurelys.json`, subida al tema v6 (167006142564). El producto tiene `templateSuffix = aurelys`. El tema publicado (v5) no tiene esa plantilla, así que la página pública sigue usando `product.json` hasta que se publique v6.
- **Referencia:** https://yallegashopping.com/products/aurelys-drenaje-linfatico. Las capturas y `reference-report.json` están en `ref/`.

## Regla del dueño (24 sep)
Se copian los **precios y ofertas** de la referencia, salvo indicación contraria. Los copys se adaptan solo un poco, porque los de la referencia venden. Si la referencia no trae un dato, no se agrega.

## Cambios en Shopify (en vivo)
- **Precio:** $37.990, con precio tachado de $40.990 (igual que la referencia). Ojo: Dropify tiene `sob_precio` activo; si sincroniza, podría volver a pisar el precio.
- **Descuento automático** "2x1 Aurelys Drenaje Linfático" (gid://shopify/DiscountAutomaticNode/1488189915236). Compra 1 y lleva 1 gratis; se combina con otros descuentos.
- **Agregado al Catálogo.**

## De la referencia a las secciones de Entalle
| Referencia | Entalle | Decisión |
|---|---|---|
| Galería con sello 2x1 | `el-product-main`, sello "2x1" | Foto propia del frasco. El alt del producto ("Gray helmet…") se corrige en la plantilla |
| "PIDE AHORA - PAGA AL RECIBIR · ENVÍO GRATIS" sobre el título | Bloque CTA arriba + "Agregar al carrito" | Replicado |
| $37.990, tachado $40.990, "OFERTA" | Igual; pack 2x1 por defecto y opción de 1 frasco | Replicado |
| Hook "Tu día pesa. Tu rutina, no." y 4 íconos | `el-benefits` | Copy casi igual. "Base sin alcohol" → "Extractos líquidos" (no está en nuestra etiqueta) |
| "Pequeños rituales para grandes días" | `el-media-text` | Replicado |
| Uso en 4 pasos (1 ml, unas 20 gotas) | `el-steps` con 4 pasos | Replicado |
| Testimonios con nombre | No se usan | No son clientes de Entalle: serían reseñas inventadas |
| FAQ | `el-faq` (9 preguntas) + JSON-LD | Adaptado a 50 ml: 50 porciones (100 con el 2x1) y unos 25 días a 2 ml diarios. Plazo de entrega de Entalle: 2 a 6 días |
| Ingredientes nombrados | "Cuatro extractos botánicos", sin nombres | Los de la referencia (30 ml) no coinciden con los de Dropi para este frasco |

## Verificado en la vista previa real (v6)
- 390 y 1280 px: precio $37.990 con $40.990 tachado, 2x1 preseleccionado y "OFERTA".
- **Releasit:** "PIDE AHORA" abre el formulario con 2 frascos. Subtotal $75.980, "Descuento 2x1" −$37.990, **total $37.990**.
- **Descuento de $1.500 al cerrar:** no aparece en Aurelys. En Releasit, el downsell "Downsell Clorofila $1.500" tiene `prods: [10317050937444]`, o sea, solo Clorofila. Para activarlo, hay que agregar Aurelys (o crear otro downsell) en Releasit → Downsells. El código de descuento ya aplica a todos los productos.

## Fotos y GIF (24 sep, segunda vuelta)
- **Creativos propios** en `media/` (HTML en `creativos.html` y render con Playwright), con la foto real del frasco de 50 ml, el logo y el verde de Entalle:
  - `aurelys-01` portada;
  - `02` presentación;
  - `04` rutina;
  - `05` promo 2x1;
  - `12` ficha técnica.
  Siguen la estructura y los copys de la referencia.
- **Galería del producto:** portada, foto original, 02, 04, 05, 12. La plantilla ya no fuerza su propia galería: usa la del producto. Se corrigió el alt "Gray helmet".
- **GIF animado** `aurelys-gif.gif` (Archivos) en la sección de rituales. Shopify lo sirve como WebP animado de 30 cuadros.
- **No se replicó:**
  - antes y después (AD1–AD3);
  - GIF médico de piernas;
  - testimonios inventados.
- **Pendiente:** imagen de ingredientes (03) hasta definir cuáles se nombran.
