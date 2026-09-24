# Entalle · instrucciones para Claude

Tienda Shopify **Entalle** (www.entalle.cl, shop `g6v1zn-zy`). Es dropshipping en Chile con productos importados por Dropify (Dropi). El dueño habla español de Chile; responde en español, breve y concreto.

## Qué hace este repositorio
- `theme/`: tema modular (secciones `el-*`, `assets/el-core.css|js`, plantillas).
- `tools/`: verificación. Se usan así:
  - `schema-lint.py` (esquemas);
  - `render.mjs` + `verify.mjs` (render local);
  - `live*.mjs` (vista previa real con Playwright; Releasit y carrito).
- `products/<handle>/`: registro de cada producto (README, creativos en `media/`, referencia en `ref/`).
- `docs/`: identidad, arquitectura, procedimiento, prompts de creativos y pendientes.

## Tarea principal: "subí X producto, cárgalo"
Sigue **`.claude/skills/cargar-producto/SKILL.md`** paso a paso. No hace falta una página de referencia: el branding y la estructura ya están definidos.

## Reglas del dueño (no negociables salvo que él diga otra cosa)
1. **Solo lo pedido.** No cambies textos, precios u ofertas que no te pidieron.
2. **Página de referencia:**
   - Si hay una, se copian sus precios, packs y ofertas.
   - Sus copys se adaptan solo un poco, porque venden.
   - Si la referencia no trae un dato, no se agrega.
3. **Datos del producto:**
   - Los datos físicos (ml, porciones, cápsulas) salen de la etiqueta del producto propio.
   - Los ingredientes salen de Dropi.
4. **2x1:**
   - Pack `qty 2, pay 1`, con precio tachado = precio de 2 unidades (ej. 2 × $37.990 = $75.980).
   - Descuento automático BXGY "2x1 <producto>": compra 1 y lleva 1 gratis, sobre el mismo producto, con `combinesWith` todo en true (necesario para el downsell de Releasit).
5. **Condiciones de venta:**
   - Envío gratis a todo Chile (ya incluido en el precio).
   - Pago al recibir con Releasit.
   - Entrega en 2 a 6 días.
   - Garantía de 30 días.
   - WhatsApp +56 9 4058 9575.
   - Correo `contacto@entalle.cl`, siempre con `mailto:`.
6. **Presupuesto $0.** No compres apps, temas, créditos ni imágenes, ni actives suscripciones o campañas.
7. **No inventes reseñas ni testimonios.** La sección `el-reviews` solo muestra reseñas reales y queda oculta si no hay.
8. **Nunca borres ni recrees un producto de Dropify.** Conserva SKU, variantes e identificadores. Dropify tiene activos `sob_nombre`, `sob_descripcion`, `sob_precio` y `sob_images`, así que puede pisar esos campos al sincronizar. Por eso el contenido editorial va en la plantilla del tema.
9. **Pide confirmación** antes de acciones visibles en la tienda pública que el dueño no pidió.

## Branding
- **Colores:**
  - verde #15803D (CTA);
  - oscuro #166534;
  - profundo #0F3D24 (encabezado, pie y bloques oscuros);
  - suave #EEF7F1;
  - amarillo #FFC53D (ahorro, con texto oscuro).
- **Tipografía:** Poppins 700/800 para títulos y Assistant para el texto.
- **CTA:** "PIDE AHORA", subtexto "Paga al recibir · Envío gratis", con animación de pulso. Debajo, "Agregar al carrito".
- **Logos** en Shopify Files:
  - `Logo_blanco.png` sobre fondo oscuro;
  - `Logo_negro.png` sobre fondo claro.
- Más detalle en `docs/01-identidad.md`.

## IDs y datos técnicos
- **Temas:**
  - `entalle-v6 · desarrollo`: 167006142564;
  - v5: 167005323364 (MAIN al 24 sep).
  - Revisa cuál es MAIN con `themes(roles:[MAIN])`.
- **Escritura de temas:**
  - `themeFilesUpsert` está bloqueado sobre el tema MAIN.
  - Para cargar una plantilla nueva: `themeDuplicate` del MAIN → sube la plantilla a la copia → el dueño la publica.
- **Subir archivos al tema:**
  1. `stagedUploadsCreate` (FILE, PUT);
  2. `curl -X PUT` del archivo;
  3. `themeFilesUpsert` con body `{type:URL, value:resourceUrl}`.
  - Es asíncrono y no reporta errores: verifica con `checksumMd5`.
- **Esquemas:** Shopify rechaza en silencio etiquetas de opción de más de 50 caracteres, rangos con menos de 3 pasos, nombres de bloque de más de 25 caracteres y etiquetas de más de 70. Corre `python3 tools/schema-lint.py theme` antes de subir.
- **Colección Catálogo:** `gid://shopify/Collection/490766467172` (manual).
- **Releasit** (contra entrega):
  - El botón propio (`rsi_buy_now_button`, barra `rsi_floating`) lo oculta `el-core.js`; el CTA propio lo abre.
  - El downsell de $1.500 se configura **por producto** en Releasit → Downsells (metafield `_rsi_cod_form_sf.downsells_json`, campo `prods`), y lo agrega el dueño.
- **Playwright** con la red del entorno: `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` y `proxy: { server: process.env.HTTPS_PROXY }`. Si falla el certificado, agrega los CA de `/root/.ccr/ca-bundle.crt` a `~/.pki/nssdb` con certutil. Nunca desactives TLS.
- **Recorte de fondo** para creativos: `pip install rembg onnxruntime`, modelo `isnet-general-use` (gratis). Resultado de ejemplo: `products/aurelys/media/frasco.png`.

## Lo que el dueño hace a mano
- Publicar el tema: Tienda online → Temas → Publicar. La conexión con Shopify lo bloquea.
- Agregar cada producto al downsell de Releasit.
- Entregar los creativos, con los prompts de `docs/08-prompts-creativos.md`.
