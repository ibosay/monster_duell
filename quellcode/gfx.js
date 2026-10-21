/* ================= Grafik-Upgrade (v15) =================
   Ziel: hochwertiger Look ohne die Echoarena-Geometrie zu verändern.
   - Umgebungslicht/Reflexionen (Image Based Lighting aus einer kleinen Studio-Szene)
   - Filmischer Tonwert (ACES) + Farbkorrektur + Vignette
   - Kantenglättung auch mit Bloom (MSAA-Rendertarget)
   - Leuchtende Spielfeldlinien, Resonanz-Licht an den Kernen, Kontaktschatten unter Pflanzen
   - Hintergrund mit sanftem Nebel und Sternenstaub
   Alles fällt bei schwachen Geräten automatisch zurück (qualityMonitor / ?q=low). */
var GFX={env:null,glowMats:[],coreFx:[],blobTex:null,stars:null,grade:null,U:{t:{value:0}}};

function gfxRadialTex(inner,outer,size){
  var c=document.createElement('canvas');c.width=c.height=size||128;var x=c.getContext('2d'),s=c.width/2;
  var g=x.createRadialGradient(s,s,0,s,s,s);g.addColorStop(0,inner);g.addColorStop(.55,inner.replace(/[\d.]+\)$/,function(a){return (parseFloat(a)*.45)+')';}));g.addColorStop(1,outer);
  x.fillStyle=g;x.fillRect(0,0,c.width,c.height);var t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

/* ---------- Umgebungslicht (IBL) ---------- */
function gfxEnv(){
  try{
    var pm=new THREE.PMREMGenerator(renderer);
    var es=new THREE.Scene();
    var sky=new THREE.Mesh(new THREE.SphereGeometry(10,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,
      vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec3 vP;void main(){float h=vP.y;vec3 top=vec3(.95,.97,.95);vec3 hor=vec3(.42,.66,.64);vec3 bot=vec3(.06,.1,.11);vec3 c=h>0.?mix(hor,top,pow(max(h,0.),.7)):mix(hor,bot,pow(max(-h,0.),.5));c+=vec3(.55,.45,.8)*pow(max(0.,-vP.z*.7+h*.3),6.)*.6;gl_FragColor=vec4(c,1.);}'}));
    es.add(sky);
    // zwei weiche Lichtflächen (Studio-Softboxen) für schöne Glanzlichter
    var box=function(col,k,p,s){var m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(k),side:THREE.DoubleSide}));m.position.set(p[0],p[1],p[2]);m.scale.set(s[0],s[1],1);m.lookAt(0,0,0);es.add(m);};
    box(0xfff4e6,2.4,[-3,7,4],[5,3]);box(0xbfeee6,1.3,[6,3,-2],[3,4]);box(0xd4c6ff,1.2,[-6,2,-5],[4,3]);
    GFX.env=pm.fromScene(es,.035).texture;pm.dispose();
    scene.environment=GFX.env;GFX.envK=.55;
    scene.traverse(function(o){if(o.material&&o.material.isMeshStandardMaterial&&!o.material.userData.keepEnv)o.material.envMapIntensity=GFX.envK;});
  }catch(err){console.warn('IBL',err);}
}

/* ---------- Hintergrund: dunkler Nebel in Aqua/Lavendel + Sternenstaub ---------- */
function gfxSkyMat(){
  return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{t:GFX.U.t},
    vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:[
      'uniform float t;varying vec3 vP;',
      'float hs(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}',
      'float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
      ' return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}',
      'float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n3(p);p*=2.03;a*=.5;}return s;}',
      'void main(){vec3 d=normalize(vP);float h=d.y;',
      ' vec3 base=mix(vec3(.035,.06,.068),vec3(.02,.03,.036),smoothstep(-.2,.9,h));',
      ' float n=fbm(d*3.2+vec3(0.,t*.01,0.));',
      ' vec3 aq=vec3(.10,.32,.31)*smoothstep(.45,.95,n)*(1.-smoothstep(-.6,0.,d.z*.6-.3));',
      ' vec3 lv=vec3(.24,.17,.36)*smoothstep(.5,1.,fbm(d*2.7+5.))*smoothstep(-.1,.7,-d.z);',
      ' vec3 c=base+(aq+lv)*.55*(1.-abs(h)*.6);',
      ' gl_FragColor=vec4(c,1.);',
      '#include <colorspace_fragment>',
      '}'].join('\n')});
}
function gfxStars(){
  var n=420,p=new Float32Array(n*3),c=new Float32Array(n*3),C=new THREE.Color(),P=[0xffffff,0xcff7ef,0xe2d8ff,0xfff3dc];
  for(var i=0;i<n;i++){var u=Math.random()*2-1,a=Math.random()*Math.PI*2,r=Math.sqrt(1-u*u),R=55+Math.random()*10;
    p[i*3]=Math.cos(a)*r*R;p[i*3+1]=u*R;p[i*3+2]=Math.sin(a)*r*R;C.set(P[i%4]).multiplyScalar(.5+Math.random()*.7);c[i*3]=C.r;c[i*3+1]=C.g;c[i*3+2]=C.b;}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
  var m=new THREE.PointsMaterial({size:.32,map:dotTex,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true,fog:false});
  GFX.stars=new THREE.Points(g,m);scene.add(GFX.stars);
}

/* ---------- Nachbearbeitung: MSAA + Bloom + Farbkorrektur/Vignette ---------- */
var SANE_SHADER={uniforms:{tDiffuse:{value:null}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);bvec4 n=isnan(c);bvec4 f=isinf(c);if(any(n)||any(f))c=vec4(0.,0.,0.,1.);gl_FragColor=clamp(c,vec4(0.),vec4(64.));}'};
var GRADE_SHADER={uniforms:{tDiffuse:{value:null},uVig:{value:0},uSat:{value:1.1},uCon:{value:1.06},uLift:{value:new THREE.Vector3(.004,.01,.012)},uTint:{value:new THREE.Vector3(1.0,1.0,1.02)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:['uniform sampler2D tDiffuse;uniform float uVig,uSat,uCon;uniform vec3 uLift,uTint;varying vec2 vUv;',
    'void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 col=c.rgb;',
    ' float l=dot(col,vec3(.2126,.7152,.0722));col=mix(vec3(l),col,uSat);',
    ' col=(col-.5)*uCon+.5;col=col*uTint+uLift;',
    ' vec2 q=vUv-.5;float v=1.-dot(q,q)*uVig*2.2;col*=clamp(v,0.,1.);',
    ' gl_FragColor=vec4(max(col,0.),c.a);}'].join('\n')};
function gfxComposer(){
  var w=window.innerWidth,h=window.innerHeight,pr=renderer.getPixelRatio();
  var rt=null;
  try{if(renderer.capabilities.isWebGL2){rt=new THREE.WebGLRenderTarget(w*pr,h*pr,{type:THREE.HalfFloatType,samples:4});}}catch(e){rt=null;}
  var comp=rt?new THREE.PP.EffectComposer(renderer,rt):new THREE.PP.EffectComposer(renderer);
  comp.addPass(new THREE.PP.RenderPass(scene,camera));
  // Schutzfilter: ungültige Pixel (NaN/Unendlich) einzelner Grafikkarten werden schwarz statt vom Leuchteffekt
  // zu großen schwarzen Flächen verschmiert zu werden (WebGL2 rechnet hier in GLSL 3.0 mit isnan/isinf)
  if(renderer.capabilities.isWebGL2){try{GFX.sane=new THREE.PP.ShaderPass(SANE_SHADER);comp.addPass(GFX.sane);}catch(err){console.warn('sane',err);}}
  E.bloom=new THREE.PP.UnrealBloomPass(new THREE.Vector2(w/2,h/2),.32,.45,1.05);
  comp.addPass(E.bloom);
  comp.addPass(new THREE.PP.OutputPass());
  // Farbkorrektur nach dem Tonwert-Mapping (im Anzeige-Farbraum)
  GFX.grade=new THREE.PP.ShaderPass(GRADE_SHADER);comp.addPass(GFX.grade);
  return comp;
}

/* ---------- Leuchtlinien der Arena ---------- */
function gfxGlowMat(col,k){var m=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1,1,1).multiplyScalar(k),transparent:true,opacity:.95,depthWrite:false,toneMapped:false});GFX.glowMats.push({m:m,k:k,ph:GFX.glowMats.length*1.7});return m;}

/* ---------- Kerne: Resonanzlicht am Boden, Lichtsäule, schwebende Funken ---------- */
var BEAM_MAT_SRC={vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 col;uniform float a;uniform float t;varying vec2 vUv;void main(){float y=vUv.y;float k=pow(clamp(1.-y,0.,1.),2.2)*(.65+.35*sin(vUv.x*25.13+t*1.5))*smoothstep(0.,.08,y);gl_FragColor=vec4(col*k*a,k*a);}'};
function gfxCore(pi){
  var h=E.heroes[pi];if(!h)return;var col=new THREE.Color(PCOL[pi]);
  var f={};
  // weiches Lichtfeld am Boden
  var gm=new THREE.MeshBasicMaterial({map:gfxRadialTex('rgba(255,255,255,1)','rgba(255,255,255,0)',128),color:col.clone().multiplyScalar(1.2),transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  var gd=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.4),gm);gd.rotation.x=-Math.PI/2;gd.position.y=.03;h.g.add(gd);f.ground=gm;
  // zwei Resonanzwellen, die vom Kern über den Boden laufen
  f.waves=[];for(var k=0;k<2;k++){var wm=new THREE.MeshBasicMaterial({color:col.clone().multiplyScalar(1.4),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
    var w=new THREE.Mesh(new THREE.RingGeometry(.92,1,64),wm);w.rotation.x=-Math.PI/2;w.position.y=.04;h.g.add(w);f.waves.push({m:w,mat:wm,ph:k*.5});}
  // Lichtsäule
  var bm=new THREE.ShaderMaterial({uniforms:{col:{value:col.clone().multiplyScalar(1.1)},a:{value:.28},t:GFX.U.t},vertexShader:BEAM_MAT_SRC.vertexShader,fragmentShader:BEAM_MAT_SRC.fragmentShader,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
  var beam=new THREE.Mesh(new THREE.CylinderGeometry(.42,.62,3.2,32,1,true),bm);beam.position.y=1.6;h.g.add(beam);f.beam=bm;
  // Funken um den Ring
  var n=26,pp=new Float32Array(n*3);f.motes=[];for(var i=0;i<n;i++){f.motes.push({a:Math.random()*6.28,r:.55+Math.random()*.5,y:.3+Math.random()*1.6,s:.3+Math.random()*.6});}
  var pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
  var pmat=new THREE.PointsMaterial({color:col.clone().lerp(new THREE.Color(0xffffff),.5),size:.09,map:dotTex,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  f.pts=new THREE.Points(pg,pmat);h.g.add(f.pts);f.pmat=pmat;
  // Punktlicht in Kernfarbe (färbt Boden und Pflanzen in der Nähe)
  // nur am PC: farbiges Punktlicht (am Handy zu teuer)
  if(GFX.lights){f.light=new THREE.PointLight(col,4.5,6,1.6);f.light.position.set(0,1.1,0);h.g.add(f.light);}
  f.hitT=-1e9;
  GFX.coreFx[pi]=f;
}
function gfxCoreHit(pi){var f=GFX.coreFx[pi];if(f)f.hitT=performance.now();}

/* ---------- Kontaktschatten unter Pflanzen ---------- */
function gfxBlob(r){
  if(!GFX.blobTex)GFX.blobTex=gfxRadialTex('rgba(0,0,0,.55)','rgba(0,0,0,0)',128);
  var m=new THREE.Mesh(geo('blob',function(){return new THREE.PlaneGeometry(1.5,1.5);}),new THREE.MeshBasicMaterial({map:GFX.blobTex,transparent:true,depthWrite:false,opacity:.9}));
  m.rotation.x=-Math.PI/2;m.position.y=.012;m.renderOrder=-1;var s=r.vis?Math.max(.8,Math.min(1.5,r.vis.info.foot*.85)):1;m.scale.setScalar(s*(r.fused?1.25:1));r.g.add(m);r.blob=m;
}

/* ---------- Start & pro Bild ---------- */
function gfxInit(){
  var low=E.tier==='low',high=E.tier==='high';
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=low?1.0:.92;
  if(!low){gfxEnv();if(E.hemi)E.hemi.intensity=.85;if(E.sun)E.sun.intensity=1.35;}else{if(E.hemi)E.hemi.intensity=1.2;}
  gfxStars();
  GFX.lights=high;
  for(var pi=0;pi<2;pi++)gfxCore(pi);
}
function gfxTick(t,dt,now){
  GFX.U.t.value=t;
  for(var i=0;i<GFX.glowMats.length;i++){var g=GFX.glowMats[i];var pu=.5+.5*Math.sin(t*1.4+g.ph);g.m.opacity=g.strip?.28+.22*pu:.72+.23*pu;}
  if(GFX.stars)GFX.stars.rotation.y=t*.004;
  GFX.coreFx.forEach(function(f,pi){if(!f)return;var h=E.heroes[pi];var dead=h&&h.dead;
    var hk=Math.max(0,1-(now-f.hitT)/700);
    var p=.5+.5*Math.sin(t*2+pi*1.7);
    f.ground.opacity=dead?Math.max(0,f.ground.opacity-dt):.38+.18*p+hk*.5;
    f.beam.uniforms.a.value=dead?Math.max(0,f.beam.uniforms.a.value-dt):.2+.1*p+hk*.4;
    if(f.light)f.light.intensity=dead?Math.max(0,f.light.intensity-dt*6):3.6+1.4*p+hk*6;
    f.waves.forEach(function(w){var u=((t*.45+w.ph)%1);var s=.75+u*1.15;w.m.scale.set(s,s,s);w.mat.opacity=dead?0:(1-u)*(u*4<1?u*4:1)*.28;});
    var a=f.pts.geometry.attributes.position.array;f.pmat.opacity=dead?0:.85;
    for(var k=0;k<f.motes.length;k++){var m=f.motes[k];var an=m.a+t*m.s;a[k*3]=Math.cos(an)*m.r;a[k*3+1]=m.y+Math.sin(t*m.s*1.3+k)*.12;a[k*3+2]=Math.sin(an)*m.r;}
    f.pts.geometry.attributes.position.needsUpdate=true;
    if(dead===false&&f.ground.opacity<.01){}
  });
}
function gfxReset(){GFX.coreFx.forEach(function(f){if(f){f.ground.opacity=.5;f.beam.uniforms.a.value=.28;if(f.light)f.light.intensity=4;}});}

/* ---------- Lichtschein entlang der Spielfeldlinien ---------- */
function gfxStripTex(){if(GFX.stripTex)return GFX.stripTex;var c=document.createElement('canvas');c.width=4;c.height=64;var x=c.getContext('2d');
  var gr=x.createLinearGradient(0,0,0,64);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,4,64);
  GFX.stripTex=new THREE.CanvasTexture(c);return GFX.stripTex;}
function gfxLineGlow(g,root){
  // Linien-Geometrie kann mehrere Streifen enthalten: nach z-Position gruppieren
  var p=g.attributes.position,c=g.attributes.color,rows={};
  for(var i=0;i<p.count;i++){var z=Math.round(p.getZ(i)*10)/10;var r=rows[z]||(rows[z]={x0:1e9,x1:-1e9,z0:1e9,z1:-1e9,y:0,c:[c.getX(i),c.getY(i),c.getZ(i)]});
    r.x0=Math.min(r.x0,p.getX(i));r.x1=Math.max(r.x1,p.getX(i));r.z0=Math.min(r.z0,p.getZ(i));r.z1=Math.max(r.z1,p.getZ(i));r.y=Math.max(r.y,p.getY(i));}
  Object.keys(rows).forEach(function(k){var r=rows[k];var w=r.x1-r.x0,zc=(r.z0+r.z1)/2;if(w<1)return;
    var col=new THREE.Color(r.c[0],r.c[1],r.c[2]);
    var m=new THREE.MeshBasicMaterial({map:gfxStripTex(),color:col.multiplyScalar(1.6),transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    var pl=new THREE.Mesh(new THREE.PlaneGeometry(w,.34),m);pl.rotation.x=-Math.PI/2;pl.position.set((r.x0+r.x1)/2,r.y+.003,zc);pl.renderOrder=2;root.add(pl);
    GFX.glowMats.push({m:m,k:1,ph:zc,strip:true});});
}
