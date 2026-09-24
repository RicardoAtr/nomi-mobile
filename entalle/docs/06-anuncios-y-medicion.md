# Preparación para tráfico de anuncios

## Listo en el tema v3 (verificado localmente o en Shopify)
- **URL:** una sola por producto (`/products/clorofila-benevolent-x-60-ml`), con canonical y og:image (de la foto del producto o de la imagen para compartir).
- **Datos estructurados:** Product con un único JSON-LD y FAQPage en la sección FAQ. En el tema anterior no había duplicados.
- **Coherencia comercial:** oferta, precio y checkout coinciden. El 2x1 es un descuento automático real, con 2 unidades a $28.990 y 4 a $57.980, envío $0 (draftOrderCalculate). Los packs del tema calculan con las mismas unidades.
- **Primera pantalla (390 px):** imagen, título, precio, tachado y ahorro.
- **CTA y barra fija:** funcionan sin duplicados.
- **Rendimiento:**
  - Primera imagen con `fetchpriority=high`; el resto, con carga diferida.
  - Videos con `preload=none` y portada.
  - CSS y JS compartidos de unos 24 KB y 16 KB sin comprimir. Shopify los sirve comprimidos y cacheados.
  - Sin librerías externas.

## No medido (no ejecutado)
Velocidad real (Lighthouse o PageSpeed): requiere acceso a entalle.cl, que está bloqueado aquí. **No se reportan puntajes.**

## Medición: pendiente (sin acceso ni app)
- No hay app de Meta instalada y el conector no tiene el permiso `read_pixels`, así que **no hay seguimiento verificado.**
- **Pasos cuando se lance, sin costo:**
  1. Instalar la app oficial **Facebook & Instagram** de Meta en Shopify. Conectar el portafolio comercial y el píxel, y elegir compartir datos en modo **Máximo**, que activa la API de conversiones.
  2. Verificar el dominio `entalle.cl` en el Business Manager.
  3. En Releasit → Integraciones, poner el **mismo ID de píxel**. Los pedidos contra entrega no pasan por el checkout de Shopify, así que la compra la registra Releasit. No se duplica con la de Shopify porque son pedidos distintos.
  4. Probar con **Test Events** de Meta: PageView, ViewContent, AddToCart / InitiateCheckout y Purchase solo en un pedido confirmado.
  5. Parámetros UTM en todos los anuncios. Shopify los atribuye de forma nativa.
- **Cookies:** *Configuración → Privacidad del cliente → Banner de cookies* (nativo de Shopify, sin costo). Activarlo al lanzar.
- **No se crean ni se activan campañas, presupuestos ni anuncios.**
