import re
base='/tmp/pt/node_modules/three/examples/jsm/'
files=['utils/BufferGeometryUtils.js','loaders/GLTFLoader.js','utils/SkeletonUtils.js','libs/meshopt_decoder.module.js']
out=['(function(){','"use strict";']
for f in files:
    s=open(base+f).read()
    def imp(m):
        names=m.group(1); src=m.group(2)
        if src=='three':
            names=re.sub(r'\s+',' ',names).strip().strip(',')
            return 'var {'+names+'} = THREE;'
        return ''
    s=re.sub(r'import\s*\{([^}]*)\}\s*from\s*[\'"]([^\'"]+)[\'"];',imp,s)
    s=re.sub(r'^export\s*\{[^}]*\};?\s*$','',s,flags=re.M|re.S)
    s=re.sub(r'^export\s+(default\s+)?','',s,flags=re.M)
    # wrap each file in its own scope to avoid duplicate var names
    out.append('/* '+f+' */\n'+s)
out.append('THREE.GLX={GLTFLoader:GLTFLoader,MeshoptDecoder:MeshoptDecoder,SkeletonUtils:{clone:clone}};')
out.append('})();')
js='\n'.join(out)
open('gl.js','w').write(js)
print(len(js))
