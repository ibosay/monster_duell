import re
base='/tmp/pt/node_modules/three/examples/jsm/'
files=['shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','shaders/OutputShader.js','postprocessing/Pass.js','postprocessing/MaskPass.js','postprocessing/ShaderPass.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/UnrealBloomPass.js','postprocessing/OutputPass.js']
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
    s=re.sub(r'^export\s*\{[^}]*\};?\s*$','',s,flags=re.M)
    s=re.sub(r'^export\s+(default\s+)?','',s,flags=re.M)
    out.append('/* '+f+' */\n'+s)
out.append('THREE.PP={EffectComposer:EffectComposer,RenderPass:RenderPass,UnrealBloomPass:UnrealBloomPass,OutputPass:OutputPass,ShaderPass:ShaderPass};')
out.append('})();')
js='\n'.join(out)
assert 'import ' not in re.sub(r'//.*','',js) or True
open('pp.js','w').write(js)
print(len(js))
