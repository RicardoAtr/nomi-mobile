---
name: cargar-producto
description: Carga un producto nuevo de Entalle (importado con Dropify) de principio a fin. Crea su landing con el sistema del tema, arma la galería con los creativos, agrega el 2x1 si se pide, lo suma al Catálogo y lo verifica en la vista previa real. Úsalo cuando el dueño diga "subí X producto, cárgalo" o algo parecido.
---

# Cargar producto

Antes de empezar, lee `CLAUDE.md` (reglas, branding, IDs). Como modelo terminado, usa `theme/templates/product.aurelys.json` y `products/aurelys/`.

## 1. Encontrar el producto y leer lo que trae (solo lectura)
- Busca en Shopify por nombre: el más reciente, ACTIVE o DRAFT. Anota id, handle, `templateSuffix`, variantes, precio, compareAt, SKU, fotos, `descriptionHtml` y el metafield `dropi._dropi_product` (ingredientes, contenido, Dropi ID).
- Revisa la etiqueta en las fotos: ml, porciones, forma de uso y afirmaciones que aparecen impresas.
- Busca creativos ya subidos: la media del producto, o Files con el handle en el nombre.
- No edites todavía ningún dato del producto.

## 2. Preguntar todo junto, una sola vez
Usa AskUserQuestion u otro mensaje, solo con lo que falte:
- Precio de venta y precio tachado. Si hay página de referencia, propone los suyos.
- Oferta: ¿2x1? ¿packs de 3 o 4? ¿ninguna?
- Creativos: ¿están en el producto, en Files o en una carpeta? ¿En qué orden?
- ¿Hay página de referencia?
  - **Si hay:** corre `node tools/inspect-reference.mjs <url> products/<handle>/ref` y descarga `<url>.js` (precios, media, descripción).
  - Copia precios y ofertas; los copys, adaptados apenas.
- ¿Contradicciones entre Dropi, la etiqueta y la referencia (ml, ingredientes)? Muéstralas en una tabla y pregunta cuál vale. Por defecto, la etiqueta manda en lo físico y Dropi en los ingredientes.

## 3. Plantilla del producto
- Copia `theme/templates/product.el-base.json` (o la de aurelys) como `theme/templates/product.<handle-corto>.json`.
- Rellena, en este orden y siempre en español de Chile:
  - **main:**
    - CTA primero, con `show_add` activo;
    - vendor y título;
    - precio;
    - subtítulo con el gancho;
    - ofertas:
      - 1 unidad;
      - 2x1 con `pay: 1`, `compare` = 2 × precio y sello "OFERTA", preseleccionado;
    - entrega en 2 a 6 días;
    - confianza, contacto y descripción.
  - **Beneficios (hook):** titular emocional y 4 íconos.
  - **Media-text:**
    - rituales/uso con GIF;
    - beneficios de la etiqueta con su animación, si existe.
  - **Pasos de uso**, con la dosis de la etiqueta o de la referencia.
  - **Qué incluye**, con `per_pack` activo.
  - **Ficha técnica**, en media-text con imagen.
  - **FAQ**, 7 a 9 preguntas: qué es, cómo se usa, para quién no es, duración, pago y envío, garantía, ¿puedo pedir 1?
  - **Cierre:**
    - garantías;
    - CTA banner;
    - aviso legal si es suplemento;
    - descubrir;
    - barra fija.
- `el-reviews` queda sin bloques (solo reseñas reales).
- Verifica con `python3 tools/schema-lint.py theme`, que debe dar 0 errores.

## 4. Creativos
- **Si el dueño trae escenas de ChatGPT:**
  - Recórtalas a 1080x1080.
  - Si vienen sin texto, agrega titulares, íconos, logo y sellos con una plantilla HTML (ver `products/aurelys/media/creativos2.html` y `render2.mjs`).
  - Guárdalas como WebP con calidad 86.
- **Si no hay creativos:**
  - Recorta el producto con rembg (`isnet-general-use`) y compón las piezas con `creativos2.html`: portada 2x1, presentación, ingredientes, promo y ficha.
  - Genera un GIF de 2x1 con PIL.
  - Avisa que son provisorias y ofrece los prompts de `docs/08-prompts-creativos.md`.
- **Subida:**
  - Usa stagedUploadsCreate (IMAGE, PUT), curl PUT y `productUpdate(media:[…])` con un alt descriptivo; luego `productReorderMedia`. La portada va primero.
  - Los GIF y animaciones van a Files con `fileCreate`, y se referencian como `shopify://shop_images/<archivo>`.
  - La plantilla no fuerza galería (sin bloques `gallery_image`): usa la media del producto.

## 5. Cambios en Shopify (el dueño ya los aprobó en el paso 2)
- **Precio:** `productVariantsBulkUpdate` (price y compareAtPrice).
- **2x1:** `discountAutomaticBxgyCreate`, con título "2x1 <Producto>", compra 1 y lleva 1 al 100 %, ambos sobre el producto, y `combinesWith` todo en true.
- **Catálogo:** `collectionAddProducts` a `gid://shopify/Collection/490766467172`.
- **templateSuffix:** `productUpdate(templateSuffix: "<handle-corto>")`.
  - Si el tema MAIN no tiene esa plantilla, la página pública usa `product.json` hasta que se publique el tema nuevo. Díselo al dueño.

## 6. Subir la plantilla al tema
- Si la plantilla ya existe en el tema MAIN, **descárgala primero** y aplica los cambios sobre esa versión, porque el dueño pudo editarla en el editor de temas. No reemplaces fotos ni secciones existentes; agrega las nuevas.
- `themeFilesUpsert` no escribe en el tema MAIN. Busca un tema de desarrollo sin publicar que sea copia del MAIN actual; si no hay, haz `themeDuplicate` del MAIN con el nombre "entalle-vN · desarrollo".
- Sube la plantilla (y cualquier sección o asset cambiado) con URL firmada y verifica el `checksumMd5`.

## 7. Verificación en la vista previa real (obligatoria)
URL de vista previa: `https://www.entalle.cl/products/<handle>?preview_theme_id=<id>`
- `node tools/live.mjs <url> <tag> 390` y `... 1280`: capturas; el CTA debe verse verde y la cantidad del pack llegar a 2.
- `node tools/live-cod.mjs <url> <tag> 390`: el formulario Releasit con 2x1 debe mostrar Subtotal 2×, "Descuento 2x1" y Total 1×.
- `node tools/live-cart.mjs <url> <tag>`: "Agregar al carrito" agrega la cantidad correcta y abre el carrito.
- Revisa que no haya desplazamiento horizontal y que la galería, el GIF (animado) y los precios estén bien.
- Nunca envíes formularios ni hagas pedidos: los scripts bloquean esos POST.

## 7b. Pago online y regalo
- El bloque CTA ya trae «Pagar ahora con Mercado Pago» (`show_paynow`); verifica que lleve al checkout con la cantidad y el total del pack.
- Si el dueño quiere regalar guías con el pack, sigue `docs/09-ebooks.md`: nota del pack, sección `regalo` (copiar de `product.aurelys.json`) y condición en el correo.

## 8. Registro y cierre
- Crea `products/<handle>/README.md` con:
  - IDs;
  - precio y oferta;
  - descuento creado;
  - fuentes de datos (etiqueta, Dropi, referencia);
  - decisiones y contradicciones;
  - lo verificado.
- Haz commit y push.
- Informe al dueño, corto:
  - enlace de vista previa;
  - qué quedó en vivo (precio, descuento, catálogo, fotos);
  - qué le toca a él:
    - publicar el tema;
    - agregar el producto al downsell de $1.500 en Releasit → Downsells;
  - qué falta, si algo falta.
