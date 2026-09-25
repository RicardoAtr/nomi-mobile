# Guías digitales Entalle (ebooks)

## Las guías
| Guía | Producto Shopify | Precio | PDF (Shopify Files) |
|---|---|---|---|
| 21 días de hábitos simples (general) | 10319587213412 · `/products/guia-21-dias-habitos-simples` | $6.990 | https://cdn.shopify.com/s/files/1/0804/5766/2564/files/entalle-guia-habitos-21-dias.pdf |
| Hidratación y rutina verde (Clorofila) | 10319587311716 · `/products/guia-hidratacion-rutina-verde` | $4.990 | https://cdn.shopify.com/s/files/1/0804/5766/2564/files/entalle-guia-hidratacion-rutina-verde.pdf |
| Guía para días largos (Aurelys) | 10319587377252 · `/products/guia-para-dias-largos` | $4.990 | https://cdn.shopify.com/s/files/1/0804/5766/2564/files/entalle-guia-dias-largos.pdf |
| Constancia y energía diaria (NeuraZenx) | 10319587475556 · `/products/guia-constancia-energia-diaria` | $4.990 | https://cdn.shopify.com/s/files/1/0804/5766/2564/files/entalle-guia-constancia-energia-diaria.pdf |

- **Configuración de los productos:**
  - sin envío (`requiresShipping: false`) y sin control de stock;
  - plantilla `product.el-ebook.json`, que va directo al checkout (Mercado Pago), sin pago contra entrega;
  - colección "Guías digitales" (490830790756) y Catálogo.
- **Fuentes** en `ebooks/`:
  - `contenido.py`: textos;
  - `build.py`: genera el HTML;
  - `render.mjs`: exporta PDF y capturas.
  - Para regenerar: `python3 ebooks/build.py`, y luego correr `render.mjs` desde `tools/` (ver el comando en el historial).
- **Autoría:**
  - logo circular Entalle en la portada, en el pie de cada página y en la contraportada;
  - página de créditos "© 2026 Entalle. Todos los derechos reservados";
  - metadato de autor "Entalle".
- **Reglas de contenido:**
  - solo hábitos generales;
  - sin "detox", "cura", "desinflama" ni "baja de peso";
  - aviso de "contenido informativo" en cada guía.

## Regalo en packs
- **Qué se regala:** la guía general más la del producto, "valoradas en $11.980" (su precio real de venta).
- **Qué pedidos lo llevan:**
  - Clorofila con 2 o más unidades (2x1 y pack de 4);
  - Aurelys con 2 o más (2x1);
  - NeuraZenx con 2 o más (packs de 2 y 3).
- **En la página:** la nota "🎁 + 2 guías digitales gratis" en esos packs, una sección "🎁 Tu regalo con el pack" con el mockup, y una pregunta frecuente.

## Entrega: correo de confirmación (lo pega el dueño una sola vez)
En Shopify, entra a **Configuración → Notificaciones → Confirmación de pedido → Editar código**. Pega este bloque justo **antes** de la sección del resumen del pedido (busca el comentario `order-summary` o el texto "Resumen del pedido") y guarda.

```liquid
{%- assign g_gen = false -%}{%- assign g_clo = false -%}{%- assign g_aur = false -%}{%- assign g_nz = false -%}
{%- for line in line_items -%}
  {%- assign pid = line.product_id -%}
  {%- if pid == 10319587213412 -%}{%- assign g_gen = true -%}{%- endif -%}
  {%- if pid == 10319587311716 -%}{%- assign g_clo = true -%}{%- endif -%}
  {%- if pid == 10319587377252 -%}{%- assign g_aur = true -%}{%- endif -%}
  {%- if pid == 10319587475556 -%}{%- assign g_nz = true -%}{%- endif -%}
  {%- if pid == 10317050937444 and line.quantity >= 2 -%}{%- assign g_gen = true -%}{%- assign g_clo = true -%}{%- endif -%}
  {%- if pid == 10318042071140 and line.quantity >= 2 -%}{%- assign g_gen = true -%}{%- assign g_aur = true -%}{%- endif -%}
  {%- if pid == 10319127937124 and line.quantity >= 2 -%}{%- assign g_gen = true -%}{%- assign g_nz = true -%}{%- endif -%}
{%- endfor -%}
{%- if g_gen or g_clo or g_aur or g_nz -%}
<table style="width:100%;margin:20px 0;border-collapse:collapse"><tr><td style="background:#EEF7F1;border-left:4px solid #15803D;border-radius:8px;padding:16px 18px;font-family:Arial,sans-serif;color:#1B1B1F">
<p style="margin:0 0 8px;font-size:16px;font-weight:bold;color:#0F3D24">📘 Tus guías digitales Entalle</p>
<p style="margin:0 0 12px;font-size:14px">Descárgalas aquí (PDF, para leer en tu celular):</p>
{%- if g_gen -%}<p style="margin:0 0 8px"><a href="https://cdn.shopify.com/s/files/1/0804/5766/2564/files/entalle-guia-habitos-21-dias.pdf" style="color:#15803D;font-weight:bold">⬇ 21 días de hábitos simples</a></p>{%- endif -%}
{%- if g_clo -%}<p style="margin:0 0 8px"><a href="https://cdn.shopify.com/s/files/1/0804/5766/2564/files/entalle-guia-hidratacion-rutina-verde.pdf" style="color:#15803D;font-weight:bold">⬇ Hidratación y rutina verde</a></p>{%- endif -%}
{%- if g_aur -%}<p style="margin:0 0 8px"><a href="https://cdn.shopify.com/s/files/1/0804/5766/2564/files/entalle-guia-dias-largos.pdf" style="color:#15803D;font-weight:bold">⬇ Guía para días largos</a></p>{%- endif -%}
{%- if g_nz -%}<p style="margin:0 0 8px"><a href="https://cdn.shopify.com/s/files/1/0804/5766/2564/files/entalle-guia-constancia-energia-diaria.pdf" style="color:#15803D;font-weight:bold">⬇ Constancia y energía diaria</a></p>{%- endif -%}
<p style="margin:10px 0 0;font-size:12px;color:#55605A">Uso personal. © Entalle. ¿Problemas con la descarga? Escríbenos a contacto@entalle.cl o por WhatsApp al +56 9 4058 9575.</p>
</td></tr></table>
{%- endif -%}
```

**Ojo:** en el formulario contra entrega el correo es opcional. Si el cliente no lo deja, no recibe el correo, así que en esos casos se mandan las guías por WhatsApp.

## Entrega por WhatsApp (pedidos con pack)
> ¡Hola {nombre}! Gracias por tu pedido en Entalle 💚 Como llevaste el pack, te regalamos 2 guías digitales:
> 📘 21 días de hábitos simples: https://cdn.shopify.com/s/files/1/0804/5766/2564/files/entalle-guia-habitos-21-dias.pdf
> 📘 {guía del producto}: {enlace de la tabla de arriba}
> Tu pedido llega entre 2 y 6 días y pagas al recibir. ¡Que las disfrutes!

## Límites conocidos
- **Enlaces públicos:** cualquiera que tenga el enlace puede descargar la guía. Para guías de bajo precio es aceptable; si se comparten mucho, se renombra el archivo y se actualiza el correo.
- **Productos digitales de Shopify:** no están disponibles en esta tienda (se revisó con `test-digital-products-connection`). Si se habilitan, conviene migrar las guías para que la descarga quede automática en el checkout.
