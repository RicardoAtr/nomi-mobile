# Identidad visual Entalle

Entalle vende un catálogo variado (hogar, bienestar, belleza, accesorios). El color de marca no puede depender del producto: el verde de la clorofila se queda en las fotos del producto, no en la marca.

## Paletas evaluadas
| Paleta | Protagonista | Contraste con texto blanco | Decisión |
|---|---|---|---|
| **A. Coral Entalle** | #E5401C (botones) / #C8340F (precios y textos) | 4,13:1 (apto para texto grande de botones) / 5,31:1 | **Elegida**: llamativa y comercial, funciona con cualquier categoría |
| B. Naranja + marino | #FF7A00 / #14213D | 2,61:1: no sirve con texto blanco | Descartada |
| C. Magenta | #E6007E | 4,5:1 | Descartada: se asocia a belleza y resta versatilidad |

## Tokens (editables en *Configuración del tema → Identidad Entalle*)
| Token | Valor | Uso |
|---|---|---|
| `el_primary` | #E5401C | CTA, sellos principales, detalles |
| `el_primary_dark` | #C8340F | Precio, hover, textos de acento (5,3:1 sobre blanco) |
| `el_ink` | #1B1B1F | Texto, encabezado, pie, bloques oscuros |
| `el_soft` | #FFF3EE | Fondos suaves de sección y pack seleccionado |
| `el_yellow` | #FFC53D | Etiquetas de ahorro, siempre con texto oscuro (10,9:1) |
| `el_trust` | #0F7B6C | Confianza y éxito (WhatsApp, "verificada") |

## Tipografía
- **Títulos:** Poppins 700. **Texto:** Assistant 400. Ambas vienen de la biblioteca de Shopify, sin costo, y se cargan con `font-display: swap`.
- **Tamaños:**
  - H1 de producto: 26 px en móvil y 38 px en PC.
  - H2 de sección: `clamp(24px, 4.4vw, 36px)`.
  - Texto base: 16 px con interlineado 1,55.

## Grid y espaciado
- **Contenedor:** máximo 1200 px. Margen lateral de 16 px en móvil, 24 px en tablet y 32 px en PC.
- **Producto:** una columna en móvil. Desde 750 px, 2 columnas (50/50); desde 990 px, 54/46, con la galería fija al bajar.
- **Secciones:** 48 px de separación vertical en móvil y 72 px en PC.

## Componentes
- **Botón CTA:**
  - Alto mínimo 58 px, radio 14 px, texto de 19 px en peso 800 y sombra coral.
  - Estados: hover (coral oscuro), activo (escala al 98 %), foco (contorno de 3 px), ocupado (`aria-busy`) y deshabilitado ("Agotado").
- **Tarjeta de pack:**
  - Borde de 2 px y radio 14 px.
  - Cuando está seleccionada: borde coral, fondo suave y halo.
  - Sello arriba a la derecha, coral o amarillo.
- **Precio:** actual en 34 px y 900, tachado en gris y sello amarillo con el ahorro.
- **Iconografía:**
  - Emojis del sistema para los beneficios: no pesan y se editan en el editor.
  - SVG de trazo de 2 px para carrito, búsqueda y menú.
- **Imágenes:**
  - Fondo neutro #F6F4F2, proporción configurable (1:1, 4:5 o 3:4) y `object-fit: cover`.
  - La primera imagen se carga con prioridad alta y el resto con carga diferida.

## Logo
El tema usa `Logo_blanco.png` sobre el encabezado y el pie oscuros. Si no hay logo, se muestra la palabra ENTALLE con espaciado ancho, un respaldo tipográfico fácil de reemplazar. El favicon provisorio es una "E" blanca sobre coral.
