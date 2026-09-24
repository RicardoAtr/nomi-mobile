# Bloqueos, dependencias y datos por confirmar

## Bloqueos de acceso (registrados, no resueltos aquí)
| Bloqueo | Efecto | Cómo destrabar |
|---|---|---|
| La red del entorno deniega yallegashopping.com, entalle.cl, *.myshopify.com y cdn.shopify.com | Sin inspección de la referencia, sin vista previa real, sin medir velocidad | Entorno cloud → *Network access*: agregar los dominios. Luego ejecutar `tools/inspect-reference.mjs` |
| Conector sin `write_legal_policies` | No se pueden publicar las políticas | Pegar los borradores de `05-politicas-borrador.md` en el admin |
| Conector sin `read_pixels` | No se puede revisar el píxel | Revisar en el admin o en Meta |
| `themeFilesDelete` bloqueado por seguridad | Quedaron 3 archivos vacíos de prueba: `sections/el-zz-test2`, `el-zz-test3` y `el-zz-pma` | Borrarlos en *Editar código* del tema de desarrollo. No afectan nada |
| Panel de Releasit sin API | No se puede probar el formulario real desde aquí | Pedido de prueba manual |

## Para publicar el tema v3 (decisión tuya)
1. Abrir la vista previa en móvil y PC: https://www.entalle.cl/products/clorofila-benevolent-x-60-ml?preview_theme_id=167003455588
2. Pulsar "PIDE AHORA": debe abrir el formulario de Releasit con la cantidad del pack. Luego hacer un pedido de prueba y cancelarlo, y revisar en Dropify que llegan 2 unidades y el monto correcto.
3. Revisar que el botón negro de Releasit no se vea. Si se ve, mándame una captura: la detección usa la clase `rsi`/`releasit` o el texto «Cash on Delivery».
4. Publicar desde *Tienda online → Temas*. El conector no puede publicar.

## Datos por confirmar
- Razón social, RUT y domicilio legal (hay dos direcciones distintas en uso).
- **Ofertas:**
  - Fecha real de término, si quieres mostrar el contador. Hoy está vacía y no se muestra.
  - El tachado de $35.990 (2 frascos) y $115.960 (4 frascos) viene de tu configuración anterior. Confirmar que tiene respaldo de precio real anterior (Ley 19.496, publicidad engañosa).
- **Afirmaciones:** «apto veganos», «sin alcohol», «sin gluten» y las 15 gotas deben coincidir con la etiqueta. Las imágenes `clorofila-2` y `clorofila-info-2` destacan efectos de salud («Más energía», «Digestión ligera»): conviene revisarlas.
- Reseñas reales con pedido verificable. Hasta tenerlas, la sección queda oculta.

## Cambios preparados que tocan la tienda en vivo (no aplicados)
- Correo antiguo en páginas y en la configuración de la tienda → contacto@entalle.cl (ver `05-politicas-borrador.md`).
- Para productos futuros: asignar `templateSuffix`. En Clorofila no hace falta, porque ya usa `entalle-landing`.
