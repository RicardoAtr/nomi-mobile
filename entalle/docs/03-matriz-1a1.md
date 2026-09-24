# Matriz comparativa 1 a 1: referencia → Entalle

**Referencia:** https://yallegashopping.com/products/megared-omega-power

> **Estado honesto:** la referencia **no se pudo abrir**, porque el entorno bloquea el dominio (403 / EGRESS_BLOCKED). **Ninguna fila está observada.** La columna "Equivalente Entalle" describe lo implementado a partir del patrón habitual de las landings chilenas con pago contra entrega. Es una **inferencia**, no una observación. Cuando se habilite la red, `tools/inspect-reference.mjs` llenará la columna "Observado" con capturas en 7 anchos, bloques, CTA, keyframes, barra fija y formulario, y esta matriz se actualizará.

Clasificación: **Replicado funcionalmente / Adaptado / Mejorado / Pendiente / No verificable**.

| Elemento de referencia | Observado | Equivalente Entalle | Adaptación | Prueba local | Clasificación |
|---|---|---|---|---|---|
| Barra de anuncios | No verificable | `el-header`: anuncios rotativos cada 5 s (se pausa con hover y con movimiento reducido) | Coral, mensajes reales (envío gratis, pago al recibir, 2x1) | 390/1280 | Adaptado (inferido) |
| Navegación PC y hamburguesa | No verificable | Menú + "Catálogo" siempre visible; hamburguesa en `dialog` con foco y cierre | Contacto en el pie del menú | 390/1280 | Adaptado (inferido) |
| Galería | No verificable | Carrusel con scroll-snap, puntos en móvil, miniaturas y flechas en PC, teclado | Proporción configurable | 7 anchos | Adaptado (inferido) |
| Título + precio en primera pantalla | No verificable | Precio + tachado + % de ahorro visibles en el primer pantallazo a 390 px | — | 390 | Adaptado (inferido) |
| Packs y preselección | No verificable | 1 / 2 (preseleccionado) / 4 con sellos; precio por unidad automático | Precios reales de Shopify | Sincronía verificada | Adaptado (inferido) |
| CTA "Pide ahora" y animación | No verificable (duración y frecuencia sin medir) | Pulso + destello de 3,2 s en bucle; pausa con hover, foco y fuera de pantalla | Movimiento reducido = sin animación | Verificado | **Pendiente de calibrar** con la referencia |
| Barra fija móvil | No verificable | Aparece al pasar el CTA; se oculta al volver y con el modal abierto; área segura | WhatsApp dentro de la barra, sin flotantes encima | Verificado | Adaptado (inferido) |
| Comportamiento fijo en PC | No verificable | Barra superior compacta + galería fija | Se puede desactivar | Verificado | **Pendiente**: confirmar si la referencia lo usa |
| Formulario / modal | No verificable | Releasit (app instalada en Entalle) abierto desde cualquier CTA con la cantidad del pack | Diseño configurado en Releasit | Simulado | Pendiente (probar con Releasit real) |
| Carrito y checkout | No verificable | Respaldo: checkout nativo por `/cart/id:qty` con descuento automático | — | 1 navegación por 3 clics | Replicado funcionalmente (respaldo) |
| Urgencia | No verificable | Contador solo con fecha real editable; stock solo con inventario real | Sin temporizadores que se reinician | Sin fecha → oculto | Adaptado |
| Beneficios, demostración, ingredientes, contenido | No verificable | `el-benefits`, `el-media-text`, `el-included` | Textos de Entalle | Render | Adaptado (inferido) |
| Pruebas sociales / reseñas | No verificable | Solo reseñas verificadas con pedido real; hoy ninguna → oculta | No se inventan reseñas | Oculta | Pendiente (contenido real) |
| FAQ / objeciones | No verificable | 7 preguntas reales + FAQPage | — | Render | Adaptado |
| Garantías y políticas | No verificable | `el-guarantees` con enlaces a páginas reales | contacto@entalle.cl | Render | Adaptado |
| Cierre comercial | No verificable | `el-cta-banner` con precio sincronizado | — | Render | Adaptado (inferido) |
| Catálogo / descubrir | No verificable | `el-discover` (solo productos disponibles; oculta el actual) | — | Render | Adaptado |
| Responsive | No verificable | 320–1440 sin desplazamiento horizontal; 2 columnas desde 750 px | — | Verificado | Adaptado |
| Imágenes y videos de la referencia | No verificable | No se reutilizó ningún recurso de la referencia; se usan los del producto Entalle | — | — | Pendiente (inventario de Network) |
