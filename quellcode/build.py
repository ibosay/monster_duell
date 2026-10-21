"""Baut die fertige index.html aus den Dateien in quellcode/.
Aufruf (im Ordner quellcode/):  python3 build.py
Benötigt nur Python 3 – three.js r158 liegt in quellcode/vendor/."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
three = rd('vendor/three.min.js')
three = re.sub(r"^console\.warn\([^;]*?\),", 'void 0,', three, count=1)
assert '</script' not in three.lower()
import base64
glb = base64.b64encode(open(os.path.join(HERE,'assets','echoarena.glb'),'rb').read()).decode()
js = '\n'.join(rd(f) for f in ['logic.js','campaign.js','meta.js','engine.js','fx2.js','plants.js','arena.js','gfx.js','ui.js'])
js = js.replace('/*ECHO_GLB*/', glb, 1)
s = rd('shell.html').replace('/*THREE_LIB*/', three).replace('/*PP_LIB*/', rd('pp.js') + '\n' + rd('gl.js')).replace('/*GAME_JS*/', js)
# Zip-Aufbau: ../spiel/index.html  ·  GitHub-Repo: ../index.html (Repo-Wurzel = Live-Seite)
spiel = os.path.join(HERE, '..', 'spiel')
out = os.path.join(spiel if os.path.isdir(spiel) else os.path.join(HERE, '..'), 'index.html')
open(out, 'w', encoding='utf-8').write(s)
print('OK', out, len(s), 'Bytes')
