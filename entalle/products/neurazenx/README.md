# NeuraZenx (Zen Nutrition) · Ácido Alfa Lipoico 600 mg con Bioperine

- **Shopify:** producto 10319127937124.
  - Handle `nerve-support`.
  - Variante 50627284533348, SKU 147557.
  - Dropi ID 147557 (proveedor NIBRESMA, bodega en Macul, stock 451).
- **Título:** "Ácido Alfa Lipoico 600 mg con Bioperine – NeuraZenx" (elegido por el dueño).
  - Dropify tiene `sob_nombre`, `sob_precio` y `sob_images` activos, así que podría pisarlos al sincronizar.
- **Plantilla:** `product.neurazenx.json`, en el tema `entalle-v11 · desarrollo` (167038976100).

## Precios (escalera B, elegida por el dueño)
| Pack | Precio | Tachado (suma de unidades) | Descuento automático |
|---|---|---|---|
| 1 frasco | $24.990 | — | — |
| 2 frascos (preseleccionado, "MÁS VENDIDO") | $39.990 | $49.980 | "NeuraZenx 2 frascos $39.990": −$9.990 desde 2 u. (1488289628260) |
| 3 frascos ("MEJOR PRECIO") | $54.990 | $74.970 | "NeuraZenx 3 frascos $54.990": −$19.980 desde 3 u. (1488289661028) |

- Los dos descuentos no se combinan entre sí (Shopify aplica el mejor), pero sí con los de pedido, como el downsell de Releasit, y con los de envío.
- **draftOrderCalculate:**
  - 1 u. = $24.990;
  - 2 u. = $39.990;
  - 3 u. = $54.990;
  - 2 u. + downsell = $38.490;
  - con otro producto en el carrito no se cuela ningún descuento.
- **Costo:** $5.500 por frasco, más 5% de Dropi. El envío varía según la región.

## Tema
- **Oferta nueva `total` en el bloque de pack** (`el-product-main.liquid` y `el-core.js`): es el precio total fijo del pack, y reemplaza al cálculo por unidades cobradas.
- **Lección:** sube primero la sección (schema) y después la plantilla. Si subes la plantilla antes, Shopify descarta los ajustes que el schema todavía no conoce.

## Creativos (ChatGPT, del dueño)
- **Galería:** oferta (portada), beneficios, foto original de Dropi, escena del frasco y escena de la mujer.
- **Files:**
  - `neurazenx-ia-historia.webp` (9:16), en la sección de rutina;
  - `neurazenx-2frascos-1x1.webp` (animado), en el banner de cierre.
- **GIF y videos** "2 frascos por $39.990": en `media/gif/`.
- **Sin usar:** el collage de 6 "clientes", porque son personas inventadas y la etiqueta está alterada ("Regeneración celular").

## Verificado en la vista previa (v11)
- **Precios en pantalla:**
  - 1 → $24.990;
  - 2 → $39.990, tachado $49.980, AHORRA 20%;
  - 3 → $54.990, tachado $74.970, AHORRA 27%.
  - La cantidad pasa al formulario.
- **Releasit:** 2 u., subtotal $49.980, descuento −$9.990, total $39.990.
  - La línea dice "Descuento 2x1", un texto global de Releasit que conviene cambiar a "Descuento".
- **Carrito:** 3 u. = $54.990, con el descuento aplicado.
- **Downsell de $1.500:** no aparece. Hay que agregar el producto en Releasit → Downsells.
