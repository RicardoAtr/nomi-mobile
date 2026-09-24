# Arquitectura de la plantilla reutilizable

## Principio
**Una sola base de código y un archivo de contenido por producto.** No se duplica el tema ni el código por cada landing.

| Capa | Dónde vive | Quién la cambia | ¿La pisa Dropify? |
|---|---|---|---|
| Estructura y diseño | `sections/el-*.liquid`, `assets/el-core.css`, `assets/el-core.js` | Desarrollo | No |
| Contenido editorial por producto (títulos, beneficios, FAQ, packs, textos de CTA) | `templates/product.<nombre>.json` | Editor de temas o Claude | No |
| Datos comerciales (precio, variantes, stock, SKU, imágenes) | Producto en Shopify | Shopify y Dropify | **Sí**: nombre, descripción, precio e imágenes (`sob_*` = true) |
| Promoción real (2x1) | Descuento automático de Shopify | Admin | No |

**Regla:** nada que tenga que sobrevivir a una sincronización de Dropify se guarda en el producto. El título comercial, la descripción editorial y las imágenes de la galería se pueden fijar en la plantilla con los bloques *Título*, *Pestaña desplegable (texto propio)* e *Imagen de galería*.

## Secciones
| Sección | Función comercial | Se oculta si… |
|---|---|---|
| `el-product-main` | Galería, título, precio, packs, urgencia real, stock real, **PIDE AHORA**, entrega y pago, sellos, contacto, pestañas | Nunca: es el núcleo |
| `el-benefits` | Beneficios o ingredientes en grilla (1–2 columnas en móvil, 2–6 en PC) | No hay bloques |
| `el-media-text` | Demostración o infografía (imagen o video + texto + viñetas) | No hay imagen, video ni texto |
| `el-videos` | Videos del producto o propios; carrusel en móvil | No hay videos |
| `el-compare` | Comparación verificable | No hay filas |
| `el-steps` | Modo de uso | No hay pasos |
| `el-included` | Qué incluye el paquete | No hay artículos |
| `el-reviews` | **Solo reseñas marcadas como verificadas** | No hay ninguna verificada |
| `el-faq` | Objeciones (+ datos estructurados FAQPage) | No hay preguntas |
| `el-guarantees` | Envío, pago, garantía y contacto con enlace a políticas | No hay bloques |
| `el-cta-banner` | Cierre con precio sincronizado y CTA | No hay producto |
| `el-discover` | Descubre otros productos o categorías del Catálogo | No hay otros productos disponibles |
| `el-sticky-buy` | Barra fija móvil, barra superior en PC, WhatsApp y volver arriba | Se desactiva en ajustes |
| `el-header` | Anuncios rotativos, navegación con Catálogo, hamburguesa, búsqueda, carrito | — |

## Estado de compra compartido (`assets/el-core.js`)
- **Fuente de verdad:**
  - Precios y disponibilidad: el JSON de variantes que renderiza Shopify (`script[data-el-config]`).
  - Pack elegido: el radio seleccionado.
- **Sincronía:** el pack o la variante actualizan todos los `[data-el-now]`, `[data-el-was]`, `[data-el-pct]` y `[data-el-offer-label]`, y los campos `id` y `quantity` del formulario principal.
- **CTA:** todos los CTA llaman a `EL.buy()`, que:
  - aplica un **bloqueo de 1,5 s** contra aperturas dobles;
  - si existe el botón de Releasit, lo pulsa (el botón queda oculto de la vista pero en el DOM);
  - si no existe, va a `/cart/<variante>:<cantidad>`, un enlace de carrito que lleva al checkout nativo con el descuento automático.
- **Barra fija:** se calcula en cada scroll con una lectura por cuadro. Se ve si el CTA principal quedó arriba de la pantalla; se oculta si hay un `dialog` abierto o un modal visible de Releasit.
- **Contador:** usa una fecha y hora de término reales (`data-end`). Al vencer se oculta; sin fecha, no se muestra.
- **Stock:** solo se muestra si Shopify controla el inventario de la variante. Dropify no lo controla en este producto, así que queda oculto.

## Compatibilidad con el editor de temas
Todas las secciones tienen esquema, bloques reordenables y *presets*, y se re-inicializan con `shopify:section:load`. Las reglas de esquema que Shopify aplica al subir (etiqueta de opción de hasta 50 caracteres, controles deslizantes de al menos 3 pasos, nombres de bloque de hasta 25) se revisan con `tools/schema-lint.py`.
