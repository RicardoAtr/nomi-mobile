#!/usr/bin/env python3
"""Reglas de esquema que Shopify aplica al subir y Theme Check no detecta."""
import json, glob, sys
bad = 0
def chk(file, where, s):
    global bad
    def err(m):
        global bad; bad += 1; print(f"{file} [{where}] {s.get('id', s.get('type'))}: {m}")
    if len(s.get('label', '')) > 70: err(f"label > 70 ({len(s['label'])})")
    for o in s.get('options', []):
        if len(o.get('label', '')) > 50: err(f"option label > 50: {o['label']}")
    if s.get('type') == 'range':
        steps = (s['max'] - s['min']) / s['step']
        if steps < 2: err('range con menos de 3 pasos')
        if steps > 100: err('range con más de 101 pasos')
        if 'default' in s and not (s['min'] <= s['default'] <= s['max']): err('default fuera de rango')
for f in sorted(glob.glob(sys.argv[1] + '/sections/*.liquid')):
    src = open(f).read()
    if '{% schema %}' not in src: continue
    j = json.loads(src.split('{% schema %}')[1].split('{% endschema %}')[0])
    if len(j.get('name', '')) > 25: bad += 1; print(f, 'nombre de sección > 25')
    for s in j.get('settings', []): chk(f, 'section', s)
    for b in j.get('blocks', []):
        if len(b.get('name', '')) > 25: bad += 1; print(f, 'bloque', b['type'], 'nombre > 25')
        for s in b.get('settings', []): chk(f, 'block ' + b['type'], s)
print('errores:', bad); sys.exit(1 if bad else 0)
