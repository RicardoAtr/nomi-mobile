# Entalle · estado del trabajo (24 sep 2026)

## v6 (24 sep, sin publicar) · ID 167006142564
- **Downsell de $1.500:**
  - El botón aceptar ahora se ve: los estilos heredados quedaron en `@layer legacy`.
  - El descuento ahora se aplica: el 2x1 de Clorofila se puede combinar con otros descuentos. Con 2 frascos y el downsell, el total queda en $27.490.
- **Botón "Agregar al carrito"** bajo "PIDE AHORA": agrega la cantidad del pack elegido y abre el carrito lateral.
- **Primer producto con el sistema: Aurelys.** Detalle en `products/aurelys/README.md`.
- **Vista previa:**
  - https://www.entalle.cl/?preview_theme_id=167006142564
  - https://www.entalle.cl/products/drenaje-linfatico-aurelys?preview_theme_id=167006142564

## v4 (24 sep, tras la revisión del usuario)
- **Tema** `entalle-v4 · desarrollo` (ID 167005159524, sin publicar). Es una copia del v3 publicado, con estas correcciones:
  - Texto `@font-face` visible arriba de la página → font_face ahora dentro de `{% style %}`.
  - CTA invisible (fondo transparente por la regla heredada `button:not(.button)`) → mayor especificidad; el render local ahora incluye las reglas heredadas.
  - Cantidad del pack que no llegaba a Releasit → formulario `{% form 'product' %}` (el mismo que usaba v2), con eventos input/change.
  - Inicio como portada de tienda: hero, catálogo, cómo comprar, garantías, FAQ.
  - Color verde.
  - Se quitó el anuncio de Clorofila. «Clorofila 2x1» se quitó del menú `entalle-v2-principal`, cambio aplicado en vivo.
  - «Qué incluye» centrado cuando tiene un solo artículo.
- **Vista previa:** https://www.entalle.cl/?preview_theme_id=167005159524 · https://www.entalle.cl/products/clorofila-benevolent-x-60-ml?preview_theme_id=167005159524

## Resumen (v3)
- **Tema de desarrollo:** `entalle-v3-escala · desarrollo`, ID 167003455588, sin publicar. Es una copia del tema en vivo `entalle-v2-conversion` (MAIN, 166995558500).
- **Vista previa del producto:** https://www.entalle.cl/products/clorofila-benevolent-x-60-ml?preview_theme_id=167003455588
- **Vista previa del inicio:** https://www.entalle.cl/?preview_theme_id=167003455588
- **Vista previa del catálogo:** https://www.entalle.cl/collections/catalogo?preview_theme_id=167003455588
- **No se publicó nada.** Tampoco se tocaron el tema en vivo, el producto activo ni el tema de terceros "Entalle · Sistema modular · revisión 24 sep" (167003422820).

## Bloqueo principal
La política de red de este entorno deniega: `yallegashopping.com`, `entalle.cl`, `*.myshopify.com` y `cdn.shopify.com`. Por eso:
- **No se pudo abrir ni inspeccionar la referencia** en un navegador. Todo lo relacionado con el "1 a 1" queda **No verificable** (ver `03-matriz-1a1.md`).
- **No se pudo ver la vista previa real de Shopify.** La verificación visual se hizo sobre un **render local** del mismo código Liquid con datos reales del producto (`tools/render.mjs`).
- **Para habilitarlo:** en la configuración del entorno cloud, en *Network access*, agregar esos dominios o subir el nivel de acceso. Luego ejecutar `node tools/inspect-reference.mjs <url> ref/`.

## Implementado y verificado
| Elemento | Estado | Cómo se verificó |
|---|---|---|
| Identidad Coral (colores y tipografías editables) | Implementado | Checksum en el tema; contraste AA calculado |
| Secciones modulares (14) + CSS/JS compartidos | Implementado | Theme Check sin errores propios; `schema-lint.py` sin errores; Shopify aceptó los 27 archivos (checksums iguales) |
| Plantilla Clorofila `product.entalle-landing` | Implementada | Render local en 7 anchos, sin desplazamiento horizontal |
| Plantilla base `product.el-base` para productos nuevos | Implementada | Render local: las secciones vacías no aparecen |
| Packs 1/2/4 con precio, tachado y % sincronizados | Verificado local | Playwright: 4 → $57.980 / $115.960 / 50 %; 2 → $28.990 / $35.990 / 19 % |
| 2x1 real en checkout | Verificado en Shopify | draftOrderCalculate: 2 u. = $28.990, 4 u. = $57.980; envío $0 |
| "PIDE AHORA" con animación pulso + destello | Verificado local | `animationName = el-pulse`; con movimiento reducido: `none` |
| Barra fija móvil y barra superior en PC | Verificado local | Aparece al pasar el CTA, se oculta al volver y con el modal contra entrega abierto |
| Un solo proceso de compra, sin duplicados | Verificado local | 3 clics = 1 navegación; con COD, 2 clics = 1 apertura, cantidad 2 en el formulario |
| Releasit (contra entrega) | Botón propio oculto; el CTA lo abre | Simulación local. **Falta probar con Releasit real** |
| Catálogo en el menú (escritorio y hamburguesa) | Implementado | Render local 390 y 1280 |
| Correo contacto@entalle.cl en el tema | Implementado | settings_data y plantillas |

## Pendiente (depende de ti o de acceso)
Ver `07-pendientes.md`.
