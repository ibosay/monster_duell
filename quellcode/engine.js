/* ================= 3D ENGINE ================= */
var E={ok:false,mons:{},heroes:[],tweens:[],fx:[],camA:0,camAT:0,shake:0,hits:[],d:14,phi:0.9,last:0,embers:null,torches:[]};
var renderer,scene,camera,raycaster,ndc,dotTex,canvas;
// Echoarena: Kerne bei z=±6.2*0.84, Pflanzenreihe mittig zwischen den beiden Leuchtlinien jeder Hälfte
var ROWZ=2.06, SP=1.3, HEROZ=5.21;
var PCOL=[0x3ebbae,0xa88bd6];
var V3=function(x,y,z){return new THREE.Vector3(x,y,z);};

function makeDotTex(){
  var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');
  var g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);var t=new THREE.CanvasTexture(c);return t;
}
var MATS={},GEO={};
var BUILD_TINT=null;
function mat(c,o){var k=c+'|'+(o?JSON.stringify(o,function(key,v){return key==='side'?String(v):v;}):'')+(BUILD_TINT?'|T'+BUILD_TINT.c+'_'+BUILD_TINT.k:'');
  if(!MATS[k]){var col=new THREE.Color(c);if(BUILD_TINT&&!(o&&o.noTint))col.lerp(new THREE.Color(BUILD_TINT.c),BUILD_TINT.k);
    var p={color:col,roughness:.62,metalness:.06,flatShading:false};if(o)for(var q in o){if(q!=='noTint')p[q]=o[q];}
    if(BUILD_TINT&&!(o&&(o.emissive||o.noTint))){p.emissive=new THREE.Color(BUILD_TINT.c);p.emissiveIntensity=BUILD_TINT.e||.12;}
    MATS[k]=new THREE.MeshStandardMaterial(p);}return MATS[k];}
function geo(k,fn){return GEO[k]||(GEO[k]=fn());}
function SPH(r,w,h){if(r>=.1){w=Math.max(w||0,16);h=Math.max(h||0,12);}else{w=Math.max(w||0,10);h=Math.max(h||0,8);}return geo('s'+r+'_'+w+'_'+h,function(){return new THREE.SphereGeometry(r,w,h);});}
function BOX(x,y,z){return geo('b'+x+'_'+y+'_'+z,function(){return new THREE.BoxGeometry(x,y,z);});}
function CYL(a,b,h,s){s=Math.max(s||10,(a>=.09||b>=.09)?12:6);return geo('c'+a+'_'+b+'_'+h+'_'+s,function(){return new THREE.CylinderGeometry(a,b,h,s);});}
function CONE(r,h,s){s=s||6;return geo('k'+r+'_'+h+'_'+s,function(){return new THREE.ConeGeometry(r,h,s);});}
function TOR(r,t){return geo('t'+r+'_'+t,function(){return new THREE.TorusGeometry(r,t,5,14);});}
function DOD(r){return geo('d'+r,function(){return new THREE.DodecahedronGeometry(r,0);});}
function EMI(c,i){return {emissive:c,emissiveIntensity:i||1};}
function M(parent,g,color,p,r,s,o){
  var poly=g.type==='DodecahedronGeometry'||g.type==='OctahedronGeometry'||g.type==='IcosahedronGeometry';
  if(poly&&typeof color!=='object'){var o2={flatShading:true,roughness:.9};if(o)for(var q in o)o2[q]=o[q];o=o2;}
  var m=new THREE.Mesh(g,typeof color==='object'?color:mat(color,o));
  if(p)m.position.set(p[0],p[1],p[2]);if(r)m.rotation.set(r[0],r[1],r[2]);if(s)m.scale.set(s[0],s[1],s[2]);
  if(!g.boundingSphere)g.computeBoundingSphere();
  var sc=s?Math.max(s[0],s[1],s[2]):1;m.castShadow=g.boundingSphere.radius*sc>0.09;
  parent.add(m);return m;
}
function grp(parent,p){var g=new THREE.Group();if(p)g.position.set(p[0],p[1],p[2]);parent.add(g);return g;}
function shapeGeo(key,pts,sc){return geo(key,function(){var s=new THREE.Shape();s.moveTo(pts[0][0]*sc,pts[0][1]*sc);for(var i=1;i<pts.length;i++)s.lineTo(pts[i][0]*sc,pts[i][1]*sc);return new THREE.ShapeGeometry(s);});}
var DS={side:2};

// Kartenbild aus dem echten 3D-Modell rendern
function renderCardArt(id){
  try{
    var W=240,H=176,sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,W/H,.1,30);cam.position.set(0,1.05,1.85);cam.lookAt(0,.2,0);
    sc.add(new THREE.HemisphereLight(0xfaf6ff,0x9fc9c0,1.9));var dl=new THREE.DirectionalLight(0xfff4e6,2.4);dl.position.set(1.5,3,2.5);sc.add(dl);
    var rl=new THREE.DirectionalLight(0xc9b8ff,1.0);rl.position.set(-2,1.5,-2);sc.add(rl);
    var g=new THREE.Group();sc.add(g);var vis=null,an=null,ch=1;try{vis=makeModelVisual(id,g);}catch(err){vis=null;}
    if(vis){an=vis.anim;ch=vis.info.h;var fw=vis.info.foot;var dd=Math.max(ch*1.25,fw*1.05)*2.1;cam.position.set(0,ch*.55+dd*.42,dd);cam.lookAt(0,ch*.45,0);g.rotation.y=-.3;an(0);an(0.45);if(vis.extras)vis.extras.forEach(function(e){if(e.glow)e.glow.visible=false;if(e.rfx){e.rfx.pts.visible=false;if(e.rfx.gs)e.rfx.gs.visible=false;if(e.rfx.ring){e.rfx.ring.visible=false;e.rfx.disc.visible=false;}}});}
    else return null;
    var rt=new THREE.WebGLRenderTarget(W,H,{samples:renderer.capabilities.isWebGL2?4:0});
    var prevT=renderer.getRenderTarget(),pc=new THREE.Color();renderer.getClearColor(pc);var pa=renderer.getClearAlpha();
    renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(sc,cam);
    var px=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(rt,0,0,W,H,px);
    renderer.setRenderTarget(prevT);renderer.setClearColor(pc,pa);rt.dispose();
    var cv=document.createElement('canvas');cv.width=W;cv.height=H;var cx=cv.getContext('2d'),im=cx.createImageData(W,H),d=im.data;
    var lut=new Uint8Array(256);for(var k=0;k<256;k++){var l=k/255;l=l*1.15;l=l/(1+l*.15);var s=l<=.0031308?12.92*l:1.055*Math.pow(l,1/2.4)-.055;lut[k]=Math.max(0,Math.min(255,Math.round(s*255)));}
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){var si=((H-1-y)*W+x)*4,di=(y*W+x)*4,a=px[si+3];
      if(a>0&&a<255){for(var c=0;c<3;c++)d[di+c]=lut[Math.min(255,Math.round(px[si+c]*255/a))];}else{d[di]=lut[px[si]];d[di+1]=lut[px[si+1]];d[di+2]=lut[px[si+2]];}d[di+3]=a;}
    cx.putImageData(im,0,0);
    sc.traverse(function(o){if(o.isMesh&&o.material&&!o.material.userData.shared){}});
    return cv.toDataURL('image/png');
  }catch(err){console.warn('card art',err);return null;}
}
/* ---------- Initialisierung ---------- */
function initEngine(){
  canvas=$('c3d');
  try{
    if(!window.THREE)return false;
    var test=document.createElement('canvas');
    if(!(test.getContext('webgl2')||test.getContext('webgl')||test.getContext('experimental-webgl')))return false;
    renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,powerPreference:'high-performance'});
  }catch(e){return false;}
  E.q=qParam();E.tier=E.q==='low'?'low':(E.q==='high'?'high':(E.q==='mobile'?'mobile':(isMobileDevice()?'mobile':'high')));
  renderer.setPixelRatio(E.tier==='low'?1:Math.min(window.devicePixelRatio||1,E.tier==='mobile'?1.5:2));
  setupContextLoss();
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1.0;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x141e22);scene.fog=new THREE.Fog(0x141e22,40,95);
  camera=new THREE.PerspectiveCamera(45,1,.1,120);
  raycaster=new THREE.Raycaster();ndc=new THREE.Vector2();
  dotTex=makeDotTex();
  E.hemi=new THREE.HemisphereLight(0xf4fbf8,0x3e5a62,1.6);scene.add(E.hemi);
  var sun=new THREE.DirectionalLight(0xfff6ea,1.35);sun.position.set(-4,13,7);sun.castShadow=true;E.sun=sun;
  sun.shadow.mapSize.set(1024,1024);var sc=sun.shadow.camera;sc.left=-7.5;sc.right=7.5;sc.top=7.5;sc.bottom=-7.5;sc.near=2;sc.far=35;sun.shadow.bias=-.0006;sun.shadow.normalBias=.025;sun.shadow.radius=4;
  scene.add(sun);
  var rim=new THREE.DirectionalLight(0xcfc2ff,.4);rim.position.set(-6,5,-8);scene.add(rim);
  buildArena();
  setupQuality();
  try{gfxInit();}catch(err){console.warn('gfx',err);}
  E.ok=true;
  window.addEventListener('resize',function(){layout();});
  window.addEventListener('orientationchange',function(){setTimeout(layout,300);});
  canvas.addEventListener('click',onCanvasClick);
  setupLongPress();
  layout();
  E.last=performance.now();
  requestAnimationFrame(loop);
  return true;
}

function buildArena(){
  // sanftes Licht in der Luft (Lichtpunkte in Aqua/Lavendel + wenige Blütenblätter)
  var n=60,pos=new Float32Array(n*3);for(var k=0;k<n;k++){pos[k*3]=(Math.random()-.5)*14;pos[k*3+1]=Math.random()*5;pos[k*3+2]=(Math.random()-.5)*16;}
  var eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  E.embers=new THREE.Points(eg,new THREE.PointsMaterial({color:0xcff7ef,size:.08,map:dotTex,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(E.embers);
  var np=14,pp=new Float32Array(np*3),pc=new Float32Array(np*3),C=new THREE.Color(),PC=[0xd6f4ee,0xe6dcff,0xffffff,0xc9efe8];
  for(k=0;k<np;k++){pp[k*3]=(Math.random()-.5)*12;pp[k*3+1]=Math.random()*5;pp[k*3+2]=(Math.random()-.5)*12;C.set(PC[k%4]);pc[k*3]=C.r;pc[k*3+1]=C.g;pc[k*3+2]=C.b;}
  var pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));pg.setAttribute('color',new THREE.BufferAttribute(pc,3));
  E.petals=new THREE.Points(pg,new THREE.PointsMaterial({vertexColors:true,size:.15,map:petalTex(),transparent:true,opacity:.75,depthWrite:false,alphaTest:.05}));scene.add(E.petals);
  buildSky();
  // Kerne der Gärtner (Spieler = aqua, Gegner = lavendel) – Form kommt aus dem Echoarena-Modell
  for(var pi=0;pi<2;pi++){
    var g=new THREE.Group();g.position.set(0,0,pi===0?HEROZ:-HEROZ);scene.add(g);
    var c=buildHeroCore(pi,g);
    var gl2=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:PCOL[pi],transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false}));gl2.scale.set(1.9,1.9,1);gl2.position.y=.8;g.add(gl2);
    var ring=new THREE.Mesh(geo('hdisc',function(){return new THREE.CircleGeometry(1.0,40);}),new THREE.MeshBasicMaterial({color:0xef476f,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.2;g.add(ring);
    var hit=new THREE.Mesh(CYL(.8,.8,1.7,8),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=.8;hit.userData={type:'hero',pi:pi};g.add(hit);E.hits.push(hit);
    var lbl=document.createElement('div');lbl.className='clbl';$('labels').appendChild(lbl);
    E.heroes[pi]=Object.assign(c,{g:g,gl:gl2,ring:ring,lbl:lbl,target:false,hit:hit,dead:false,shakeT:0});
  }
  // Echoarena (eingebettetes Modell, unverändert)
  buildEchoArena();
}

function resetScene(){
  if(!E.ok)return;
  Object.keys(E.mons).forEach(function(k){removeMon(+k);});
  try{clearTraps();}catch(e){}
  try{gfxReset();}catch(e){}
  E.heroes.forEach(function(h){h.dead=false;h.cr.visible=true;h.gl.visible=true;h.cr.position.y=0;h.cr.scale.setScalar(1);h.cm.opacity=1;if(h.om)h.om.opacity=1;if(h.rgm)h.rgm.opacity=1;});
}

var SIDE_MQ='(orientation:landscape) and (max-height:520px)';
function sideMode(){try{return window.matchMedia(SIDE_MQ).matches;}catch(e){return false;}}
function layout(){
  if(!E.ok)return;
  var w=window.innerWidth,h=window.innerHeight;
  renderer.setSize(w,h,false);if(E.composer){E.composer.setPixelRatio(renderer.getPixelRatio());E.composer.setSize(w,h);}
  // Freier Bereich für die Arena: Hochformat = zwischen oberer und unterer Leiste,
  // Querformat am Handy = zwischen linker (Gegner/Log) und rechter Spalte (Du/Hand)
  var side=sideMode(),tr=$('topUI').getBoundingClientRect(),br=$('botUI').getBoundingClientRect();
  var top,bot,L=0,R=0;
  if(side){top=0;bot=0;L=tr.right;R=w-br.left;}else{top=tr.bottom;bot=h-br.top;}
  var aw=w-L-R,ah=h-top-bot,aspect=w/h;
  var tall=(aw/Math.max(1,ah))<.95;
  var vf=tall?52:40;camera.fov=vf;camera.aspect=aspect;
  // Ganze Echoarena (Schale, Lamellen, Ecken, beide Kerne) in den freien Bereich einpassen
  E.phi=tall?1.1:.78;
  var oy=(bot-top)/2,ox=(R-L)/2,pad=tall?4:12,pts=[],X=5.9*.84,Z=7.7*.84;
  [-X,X].forEach(function(x){[-Z,Z].forEach(function(z){[-.95,.1].forEach(function(y){pts.push(new THREE.Vector3(x,y,z));});});});
  // Lamellen-Spitzen und Kerne
  [-1,1].forEach(function(s){pts.push(new THREE.Vector3(s*4.4,.7,-5.6),new THREE.Vector3(s*4.4,.7,5.6));});
  pts.push(new THREE.Vector3(0,1.5,-HEROZ),new THREE.Vector3(0,1.5,HEROZ));
  var fit=function(d){var hd=d*Math.cos(E.phi);camera.position.set(0,d*Math.sin(E.phi),hd);camera.lookAt(0,.4,0);camera.setViewOffset(w,h,ox,oy,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    var y0=1e9,y1=-1e9,x0=1e9,x1=-1e9,v=new THREE.Vector3();pts.forEach(function(p){v.copy(p).project(camera);var sx=(v.x+1)/2*w,sy=(1-v.y)/2*h;x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy);});return [x0,x1,y0,y1];};
  var lo=4,hi=60,r;
  for(var it=0;it<3;it++){lo=4;hi=60;
    for(var k=0;k<26;k++){var md=(lo+hi)/2;r=fit(md);if(r[0]>=L+pad&&r[1]<=w-R-pad&&r[2]>=top+pad&&r[3]<=h-bot-pad)hi=md;else lo=md;}
    r=fit(hi);oy+=((r[2]+r[3])/2-(top+(h-bot))/2);ox+=((r[0]+r[1])/2-(L+(w-R))/2);}
  E.d=hi;r=fit(E.d);
  camera.setViewOffset(w,h,ox,oy,w,h);
  camera.updateProjectionMatrix();
  E.uiTop=top;E.uiBot=bot;E.side=side;
}
function setCamAngle(a,instant){E.camAT=a;if(instant)E.camA=a;}

/* ---------- Monster verwalten ---------- */
var RINGG=null,BUBG=null,HITG=null;
function shieldMat(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.FrontSide,
  uniforms:{col:{value:new THREE.Color(0x6fd3ff)},opacity:{value:.17},t:{value:0}},
  vertexShader:'varying vec3 vN;varying vec3 vV;varying float vY;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vY=position.y;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 col;uniform float opacity;uniform float t;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float f=clamp(1.0-abs(dot(normalize(vN),normalize(vV))),0.0,1.0);float rim=pow(f,3.0);float band=0.5+0.5*sin(vY*14.0-t*3.0);float a=(rim*1.6+band*rim*0.5)*opacity*3.0;gl_FragColor=vec4(col*a,a);}'});}
// Blickrichtung: alle Modelle schauen nativ nach +z. Spieler 1 steht bei +z und schaut zum Gegner (-z), Spieler 2 umgekehrt.
function faceY(owner){return E.camAT||0;} // Pflanzen zeigen ihre Schauseite immer zur Kamera
function createMon(m,owner){
  if(!RINGG){RINGG=new THREE.CircleGeometry(.68,36);BUBG=new THREE.SphereGeometry(1,20,14);HITG=new THREE.CylinderGeometry(.6,.6,1,8);}
  var t0=MBYID[m.id],info,anim;
  var g=new THREE.Group();scene.add(g);
  var body=new THREE.Group();g.add(body);
  var mo=new THREE.Group();body.add(mo);
  var inner=new THREE.Group();mo.add(inner);
  var vis=null;try{vis=makeModelVisual(m.id,inner,!!m.token);}catch(err){console.warn('model',err);vis=null;while(inner.children.length)inner.remove(inner.children[0]);}
  if(!vis){try{vis=makeModelVisual('ratte',inner,true);}catch(err){vis=null;}}
  if(vis){info=vis.info;anim=vis.anim;}else{info={h:.8,s:1,bh:.8,foot:.8};anim=function(){};M(inner,SPH(.3,12,10),0x8fcf68,[0,.3,0]);}
  info=Object.assign({},info,{s:info.s*(m.token?.75:1.12)});
  inner.scale.setScalar(info.s);
  var aura=null;
  if(t0&&t0.fused){try{aura=addCrownAura(g,inner,info,t0.mega?0xffd98a:0xd9c8ff);}catch(err){console.warn(err);aura=null;}}
  body.rotation.y=faceY(owner);
  var ringMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
  var ring=new THREE.Mesh(RINGG,ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.075;g.add(ring);
  var bubMat=shieldMat();
  var bub=new THREE.Mesh(BUBG,bubMat);var bh=(t0&&t0.fused)?info.h:info.h*info.s;bub.position.y=bh*.5;bub.scale.set(.85*(t0&&t0.fused?1.25:1),bh*.6,.85*(t0&&t0.fused?1.25:1));bub.visible=!!m.shield;g.add(bub);
  var hit=new THREE.Mesh(HITG,new THREE.MeshBasicMaterial({visible:false}));var hh=(t0&&t0.fused)?info.h:info.h*info.s;var hr=(t0&&t0.fused)?1.2:1;if(vis)hr=Math.max(.85,Math.min(1.35,info.foot/1.15));hit.scale.set(hr,hh+.3,hr);hit.position.y=(hh+.3)/2;hit.userData={type:'mon',uid:m.uid,owner:owner};g.add(hit);E.hits.push(hit);
  var lbl=document.createElement('div');lbl.className='lbl';lbl.innerHTML='<span class="i"></span><div class="st"><span class="a"></span><span class="h"></span></div>';$('labels').appendChild(lbl);
  var zz=document.createElement('div');zz.className='zz';zz.textContent='💤';$('labels').appendChild(zz);
  var rec={mo:mo,act:null,kind:motionKind(m.id),vis:vis,aura:aura,fused:!!(t0&&t0.fused),sc:info.s,uid:m.uid,id:m.id,g:g,body:body,inner:inner,anim:anim,ring:ring,ringMat:ringMat,bub:bub,hit:hit,owner:owner,h:(t0&&t0.fused?info.h:info.h*info.s),tx:0,tz:0,phase:Math.random()*10,dying:false,lock:false,mode:'',lbl:lbl,zz:zz,sig:'',spawnT:performance.now()};
  E.mons[m.uid]=rec;
  try{gfxBlob(rec);}catch(err){}
  return rec;
}
function removeMon(uid){
  var r=E.mons[uid];if(!r)return;
  scene.remove(r.g);
  r.ringMat.dispose();r.bub.material.dispose();
  r.g.traverse(function(o){if(o.isSprite&&o.material)o.material.dispose();});
  var i=E.hits.indexOf(r.hit);if(i>=0)E.hits.splice(i,1);
  if(r.lbl.parentNode)r.lbl.parentNode.removeChild(r.lbl);
  if(r.zz.parentNode)r.zz.parentNode.removeChild(r.zz);
  delete E.mons[uid];
}

function sync3D(){
  if(!E.ok||!G)return;
  var v=viewer();var myTurn=isHumanTurn()&&G.cur===v&&!G.busy;
  var vt=null;
  if(myTurn&&G.sel!=null){var s=G.players[v].board.filter(function(m){return m.uid===G.sel;})[0];if(s)vt=validTargets(v,s);}
  var alive={};
  G.players.forEach(function(p,pi){
    var n=p.board.length;
    p.board.forEach(function(m,i){
      alive[m.uid]=1;
      var r=E.mons[m.uid];var isNew=false;
      if(!r){try{r=createMon(m,pi);}catch(err){console.warn(err);return;}isNew=true;}
      r.tx=(i-(n-1)/2)*SP*(pi===0?1:-1);r.tz=pi===0?ROWZ:-ROWZ;
      if(isNew){r.g.position.set(r.tx,0,r.tz);try{if(m.fusionSpawn){m.fusionSpawn=false;fxFusionAppear(r);}else fxSummon(r);}catch(err){console.warn(err);}}
      var mode='';
      if(myTurn&&G.aim){mode=G.aim.tg.mons.indexOf(m.uid)>=0?(pi===v?'buff':'target'):'';}
      else if(pi===v&&myTurn&&G.fuseMode){if(G.fuseFirst===m.uid)mode='sel';else if(G.fuseFirst!=null)mode=fusePartners(pi,G.fuseFirst).indexOf(m.uid)>=0?'fuse':'';else mode=fusePartners(pi,m.uid).length?'fuse':'';}
      else if(pi===v&&myTurn){mode=G.sel===m.uid?'sel':(m.canAttack?'ready':'');}
      else if(pi!==v&&vt&&vt.mons.indexOf(m.uid)>=0)mode='target';
      r.mode=mode;
      if(!r.popping)r.bub.visible=!!m.shield&&!r.dying;
      var sig=m.atk+'|'+m.hp+'|'+m.maxHp+'|'+(m.shield?1:0)+'|'+(m.frozen||m.stunned?1:0)+'|'+(m.poisoned?1:0);
      if(sig!==r.sig){r.sig=sig;
        var st=r.lbl.children[1];st.children[0].textContent=m.atk;
        r.lbl.children[0].textContent=(m.poisoned?'🧪':(has(m,'guard')?'🧱':''))+((m.frozen||m.stunned)?'🧊':(m.sp&&SPEC[m.sp]?SPEC[m.sp].i:''));
        st.children[1].textContent=Math.max(0,m.hp);
        st.children[1].className='h'+(m.hp<m.maxHp?' dmg':'');
      }
      r.showZ=!m.canAttack&&m.fresh&&pi===G.cur;
    });
  });
  Object.keys(E.mons).forEach(function(k){var r=E.mons[k];if(!alive[k]&&!r.dying)removeMon(+k);});
  syncTraps();
  for(var pi=0;pi<2;pi++){var hh=E.heroes[pi];var aimH=!!(myTurn&&G.aim&&G.aim.tg.heroes.indexOf(pi)>=0);hh.target=!!(vt&&vt.hero&&pi!==v)||aimH;hh.tcol=(aimH&&pi===v)?0x06d6a0:0xef476f;
    var p=G.players[pi];var txt=p.face+' '+p.name+' ❤️ '+Math.max(0,p.hp);if(hh.lbl.textContent!==txt)hh.lbl.textContent=txt;}
}
/* ---------- Tweens & Effekte ---------- */
function easeOut(t){return 1-Math.pow(1-t,3);}
function easeIn(t){return t*t*t;}
function easeInOut(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function tween(ms,fn,ease){
  return new Promise(function(res){
    var tw={s:performance.now(),ms:ms,fn:fn,ease:ease||function(t){return t;},res:res,done:false};
    E.tweens.push(tw);
    setTimeout(function(){if(!tw.done){tw.done=true;try{tw.fn(1);}catch(e){}res();}},ms+250);
  });
}
function burst(pos,color,n,o){
  if(!E.ok)return;o=o||{};
  var p=new Float32Array(n*3),v=[];
  for(var i=0;i<n;i++){p[i*3]=pos.x+(Math.random()-.5)*.3;p[i*3+1]=pos.y+(Math.random()-.5)*.3;p[i*3+2]=pos.z+(Math.random()-.5)*.3;
    var a=Math.random()*Math.PI*2,u=Math.random()*2-1,s=(o.speed||3)*(.4+Math.random()*.6),r=Math.sqrt(1-u*u);
    v.push(Math.cos(a)*r*s,Math.abs(u)*s*(o.upB||1)+(o.up||0),Math.sin(a)*r*s);}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  var m=new THREE.PointsMaterial({color:color,size:o.size||.2,map:dotTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  var pts=new THREE.Points(g,m);scene.add(pts);
  E.fx.push({pts:pts,v:v,life:o.life||900,s:performance.now(),grav:o.grav!==undefined?o.grav:-5});
}
function flashSprite(pos,color,size,ms){
  if(!E.ok)return;
  var s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  s.position.copy(pos);scene.add(s);
  tween(ms||400,function(t){var k=size*(.4+t);s.scale.set(k,k,1);s.material.opacity=1-t;if(t>=1){scene.remove(s);s.material.dispose();}},easeOut);
}
function monTop(r){return V3(r.g.position.x,r.g.position.y+r.h+.15,r.g.position.z);}
function monMid(r){return V3(r.g.position.x,r.g.position.y+r.h*.5,r.g.position.z);}
function heroTop(pi){var h=E.heroes[pi];return V3(h.g.position.x,(h.coreTop||1.45)+.75,h.g.position.z);}
function toScreen(v3){var p=v3.clone().project(camera);return {x:(p.x+1)/2*window.innerWidth,y:(1-p.y)/2*window.innerHeight,z:p.z};}
function floatAtXY(x,y,text,cls){var f=document.createElement('div');f.className='float '+cls;f.textContent=text;f.style.left=x+'px';f.style.top=y+'px';document.body.appendChild(f);setTimeout(function(){if(f.parentNode)f.parentNode.removeChild(f);},/abil/.test(cls)?1250:1150);}
function fxAbility(uid,text){var r=E.mons[uid];if(!r||!E.ok)return;var s=toScreen(monTop(r));floatAtXY(s.x,s.y-14,text,'abil');
  var ty=(r.vis&&r.vis.def&&r.vis.def.ab)||'bloom',col=MOTION_COL[ty]||0xfff0b0;monMotion(uid,'abil',{t:ty});if(r.vis)r.vis.flash(col,700);
  var c=monMid(r);flashSprite(c,col,2.0,500);
  if(ty==='spore')setTimeout(function(){softBurst(monTop(r),[0xf6efd8,0xe9dcff,0xffffff],18,{speed:1.1,up:.6,life:1300,size:.28,tex:'dot',grav:.25,drag:.96});},260);
  else if(ty==='shake')softBurst(c,[0x8fcf68,0xa6d77d,0xd8f0b0],12,{speed:1.4,up:.4,life:1100,size:.16,tex:'leaf',grav:-1.2});
  else if(ty==='glow'){softBurst(c,[0xffffff,0xc8fff0],14,{speed:.7,up:1.4,life:1200,size:.13,tex:'dot',add:true,grav:.5});shockwave(V3(r.g.position.x,.1,r.g.position.z),col,1.4,700);}
  else if(ty==='spin')softBurst(c,[0xf7c27a,0xffe6b8],12,{speed:1.8,life:800,size:.15,tex:'leaf',grav:-1});
  else softBurst(monTop(r),[0xffd6ec,0xfff0f6,0xffe8a8],14,{speed:1.2,up:.8,life:1200,size:.17,grav:-.8});
  try{var rk=rarKey(r.id);if(rk==='l'){shockwave(V3(r.g.position.x,.1,r.g.position.z),0xffd060,2.0,800);softBurst(c,[0xffd76a,0xfff0b8],16,{speed:1.2,up:1.4,life:1300,size:.15,tex:'spark',add:true,grav:.4});}
    else if(rk==='e')softBurst(c,[0xd8bcff,0xffffff],10,{speed:1,up:1.2,life:1100,size:.13,tex:'spark',add:true,grav:.4});}catch(err){}}
function fxFloatMon(uid,text,cls){var r=E.mons[uid];if(!r||!E.ok)return;var s=toScreen(monTop(r));floatAtXY(s.x,s.y,text,cls);}
function fxFloatHero(pi,text,cls){if(!E.ok)return;var s=toScreen(heroTop(pi));floatAtXY(s.x,s.y,text,cls);}

function fxHitMon(uid,text){
  var r=E.mons[uid];if(!r||!E.ok)return;
  fxFloatMon(uid,text,'dmg');
  var c=monMid(r);softBurst(c,[0x8fcf68,0xb8e08a,0xffc8c8],12,{speed:1.8,up:.6,life:800,size:.15,tex:'leaf',grav:-1.6});
  flashSprite(c,0xffb0a8,1.4,260);
  if(r.vis){r.vis.flash();}
  if(!r.act||r.act.n!=='atk')monMotion(uid,'hit',{side:Math.random()<.5?-1:1});
}
function fxPoison(uid){var r=E.mons[uid];if(!r||!E.ok)return;setTimeout(function(){fxFloatMon(uid,'🧪 Vergiftet','info');},250);softBurst(monMid(r),[0xb6e07a,0xd2f0a0,0xc8b6f0],18,{speed:1,up:1,life:1200,size:.22,tex:'dot',grav:.2});}
function fxShieldPop(uid){
  var r=E.mons[uid];if(!r||!E.ok)return;
  r.popping=true;var b=r.bub;var s0=b.scale.clone();
  softBurst(monMid(r),[0xbff0ff,0xffffff],22,{speed:2.4,life:700,size:.14,tex:'dot',add:true,grav:-1});
  flashSprite(monMid(r),0xbff0ff,2.6,450);
  tween(450,function(t){b.scale.copy(s0).multiplyScalar(1+t*.6);b.material.uniforms.opacity.value=.5*(1-t);if(t>=1){b.visible=false;b.scale.copy(s0);b.material.uniforms.opacity.value=.17;r.popping=false;}},easeOut);
}
function fxHeal(uid){var r=E.mons[uid];if(!r||!E.ok)return;flashSprite(monMid(r),0xb8ffe0,2.6,700);softBurst(monMid(r),[0xc8ffe8,0xffffff,0xa6e8c8],18,{speed:.9,up:1.6,life:1300,size:.14,tex:'dot',add:true,grav:.5});monMotion(uid,'abil',{t:'glow'});}
function fxHealMon(uid,text){var r=E.mons[uid];if(!r||!E.ok)return;fxFloatMon(uid,text,'heal');softBurst(V3(r.g.position.x,.3,r.g.position.z),[0xc8ffe8,0xffffff],12,{speed:.6,up:1.8,life:1100,size:.13,tex:'dot',add:true,grav:.3});}
function fxHealHero(pi,text){if(!E.ok)return;fxFloatHero(pi,text,'heal');var h=E.heroes[pi];softBurst(V3(h.g.position.x,1.0,h.g.position.z),[0xc8ffe8,0xffffff],20,{speed:.9,up:1.6,life:1200,size:.14,tex:'dot',add:true,grav:.4});}
function fxHitHero(pi,text){
  if(!E.ok)return;fxFloatHero(pi,text,'dmg');var h=E.heroes[pi];
  softBurst(V3(h.g.position.x,1.0,h.g.position.z),[PCOL[pi],0xffffff],22,{speed:2.6,life:800,size:.16,tex:'petal',grav:-1.5});flashSprite(V3(h.g.position.x,1.0,h.g.position.z),0xffffff,1.8,300);
  h.shakeT=performance.now();E.shake=Math.max(E.shake,.4);try{gfxCoreHit(pi);shockwave(V3(h.g.position.x,.06,h.g.position.z),PCOL[pi],2.6,650);}catch(err){}
  if(G&&pi===viewer()){var f=$('flash');f.style.opacity=1;setTimeout(function(){f.style.opacity=0;},180);}
}
/* ---------- Eingabe 3D ---------- */
function pickMonAt(x,y){
  if(!G||!E.ok)return null;var rect=canvas.getBoundingClientRect();
  ndc.x=((x-rect.left)/rect.width)*2-1;ndc.y=-((y-rect.top)/rect.height)*2+1;raycaster.setFromCamera(ndc,camera);
  var hs=raycaster.intersectObjects(E.hits,false),best=1e9,u=null;
  for(var i=0;i<hs.length;i++){var d=hs[i].object.userData;if(d.type!=='mon'||!E.mons[d.uid]||E.mons[d.uid].dying)continue;var dd=monTapDist(E.mons[d.uid],x,y);if(dd<best){best=dd;u=d;}}
  if(!u){var b2=48;Object.keys(E.mons).forEach(function(k){var r=E.mons[k];if(r.dying)return;var dd=monTapDist(r,x,y);if(dd<b2){b2=dd;u=r.hit.userData;}});}
  if(!u)return null;var m=G.players[u.owner]&&G.players[u.owner].board.filter(function(q){return q.uid===u.uid;})[0];return m||null;
}
// Langes Drücken auf ein Monster: Info-Box (kurz, verschwindet von selbst)
function setupLongPress(){
  var t=null,sx=0,sy=0;
  canvas.addEventListener('pointerdown',function(ev){clearTimeout(t);sx=ev.clientX;sy=ev.clientY;E.lpFired=false;
    t=setTimeout(function(){var m=pickMonAt(sx,sy);if(m){E.lpFired=true;E.lpAt=performance.now();try{showInfo(m);}catch(err){}}},480);});
  canvas.addEventListener('pointermove',function(ev){if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>12)clearTimeout(t);});
  ['pointerup','pointercancel','pointerleave'].forEach(function(n){canvas.addEventListener(n,function(){clearTimeout(t);});});
  canvas.addEventListener('contextmenu',function(ev){ev.preventDefault();});
}
function onCanvasClick(e){
  if(!G||!E.ok)return;
  if(E.lpFired&&performance.now()-(E.lpAt||0)<1500){E.lpFired=false;return;}
  E.lpFired=false;
  var rect=canvas.getBoundingClientRect();
  ndc.x=((e.clientX-rect.left)/rect.width)*2-1;ndc.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(ndc,camera);
  var hs=raycaster.intersectObjects(E.hits,false).sort(function(a,b){var am=a.object.userData.type==='mon'?0:1,bm=b.object.userData.type==='mon'?0:1;return am!==bm?am-bm:a.distance-b.distance;});
  var u=null;
  var bestD=1e9;
  for(var i=0;i<hs.length;i++){var d=hs[i].object.userData;if(d.type!=='mon'||!E.mons[d.uid]||E.mons[d.uid].dying)continue;var dd=monTapDist(E.mons[d.uid],e.clientX,e.clientY);if(dd<bestD){bestD=dd;u=d;}}
  if(!u)for(var j=0;j<hs.length;j++){if(hs[j].object.userData.type==='hero'){u=hs[j].object.userData;break;}}
  if(!u){ // Toleranz für Touch: nächstes Objekt in 48px
    var best=56,bx=null;
    Object.keys(E.mons).forEach(function(k){var r=E.mons[k];if(r.dying)return;var dd=monTapDist(r,e.clientX,e.clientY);if(dd<best){best=dd;bx=r.hit.userData;}});
    E.heroes.forEach(function(h){var s=toScreen(V3(h.g.position.x,1.4,h.g.position.z));var dd=Math.hypot(s.x-e.clientX,s.y-e.clientY);if(dd<best){best=dd;bx=h.hit.userData;}});
    u=bx;
  }
  if(!u){onEmptyClick();return;}
  if(u.type==='mon')onMonClick(u.owner,u.uid);else onHeroClick(u.pi);
}

function monTapDist(r,x,y){
  var a=toScreen(V3(r.g.position.x,r.g.position.y+.1,r.g.position.z)),b=toScreen(monTop(r));
  var vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy,t=l2>0?Math.max(0,Math.min(1,((x-a.x)*vx+(y-a.y)*vy)/l2)):0;
  return Math.hypot(x-(a.x+vx*t),y-(a.y+vy*t));
}
/* ---------- Render-Schleife ---------- */
var _tmp=null;
function loop(now){
  requestAnimationFrame(loop);
  var dt=Math.min(.05,(now-E.last)/1000);E.last=now;var t=now/1000;
  // Sicherheitsnetz: Eingabesperre nie dauerhaft
  if(G&&G.busy&&!(G.mode==='cpu'&&G.cur===1)&&!G.over){if(!E.busyT)E.busyT=now;else if(now-E.busyT>7000){G.busy=false;E.busyT=0;console.warn('busy watchdog released');try{render();}catch(err){}}}else E.busyT=0;
  // Tweens
  for(var i=E.tweens.length-1;i>=0;i--){var tw=E.tweens[i];if(tw.done){E.tweens.splice(i,1);continue;}var k=Math.min(1,(now-tw.s)/tw.ms);try{tw.fn(tw.ease(k));}catch(err){}if(k>=1){tw.done=true;E.tweens.splice(i,1);tw.res();}}
  // Partikel
  for(var j=E.fx.length-1;j>=0;j--){var f=E.fx[j];var age=now-f.s;var pa=f.pts.geometry.attributes.position;var arr=pa.array;
    for(var q=0;q<f.v.length/3;q++){arr[q*3]+=f.v[q*3]*dt;arr[q*3+1]+=f.v[q*3+1]*dt;arr[q*3+2]+=f.v[q*3+2]*dt;f.v[q*3+1]+=f.grav*dt;var dg=f.drag||.985;f.v[q*3]*=dg;f.v[q*3+2]*=dg;}
    pa.needsUpdate=true;f.pts.material.opacity=Math.max(0,1-age/f.life);
    if(age>f.life){scene.remove(f.pts);f.pts.geometry.dispose();f.pts.material.dispose();E.fx.splice(j,1);}}
  try{gaTick(t,dt);}catch(err){}
  try{gfxTick(t,dt,now);}catch(err){}
  // Glut
  var ep=E.embers.geometry.attributes.position.array;for(var e2=0;e2<ep.length;e2+=3){ep[e2+1]+=dt*.18;ep[e2]+=Math.sin(t*.6+e2)*dt*.12;if(ep[e2+1]>6)ep[e2+1]=0;}E.embers.geometry.attributes.position.needsUpdate=true;
  if(E.petals){var pp=E.petals.geometry.attributes.position.array;for(var p2=0;p2<pp.length;p2+=3){pp[p2+1]-=dt*.22;pp[p2]+=dt*(.25+Math.sin(t*.7+p2)*.2);pp[p2+2]+=Math.sin(t*.9+p2*.7)*dt*.15;if(pp[p2+1]<-.5){pp[p2+1]=5+Math.random();pp[p2]=(Math.random()-.5)*12-3;pp[p2+2]=(Math.random()-.5)*12;}if(pp[p2]>7)pp[p2]=-7;}E.petals.geometry.attributes.position.needsUpdate=true;}
  // Monster
  Object.keys(E.mons).forEach(function(k){var r=E.mons[k];
    if(!r.lock&&!r.dying){var kp=1-Math.exp(-dt*7);r.g.position.x+=(r.tx-r.g.position.x)*kp;r.g.position.z+=(r.tz-r.g.position.z)*kp;
      var dy=((faceY(r.owner)-r.body.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;r.body.rotation.y+=dy*(1-Math.exp(-dt*5));}
    try{r.anim(t+r.phase);}catch(err){}
    try{motionTick(r,t,now);}catch(err){}
    var col=0,op=0;
    if(r.mode==='fuse'){col=0xb896ff;op=.42+Math.sin(t*5)*.16;}else if(r.mode==='ready'){col=0x06d6a0;op=.45;}else if(r.mode==='sel'){col=0xffc233;op=.6;}else if(r.mode==='target'){col=0xef476f;op=.34+Math.sin(t*6)*.14;}else if(r.mode==='buff'){col=0x4cc9f0;op=.4+Math.sin(t*6)*.15;}
    r.ring.visible=op>0;if(op>0){r.ringMat.color.setHex(col);r.ringMat.opacity=op;var rs=r.mode==='sel'?1.05:1;r.ring.scale.set(rs,rs,rs);}
    if(r.mode==='sel'&&!r.lock)r.g.position.y=.12+Math.sin(t*5)*.05;else if(!r.lock&&!r.dying)r.g.position.y*=Math.pow(.85,dt*60);
    if(r.bub.visible&&!r.popping){var bp=1+Math.sin(t*2.5+r.phase)*.03,bw=r.vis?Math.max(.75,Math.min(1.2,r.vis.info.foot*.6)):(r.fused?1.06:.85);r.bub.scale.set(bw*bp,r.h*.6*bp,bw*bp);if(r.bub.material.uniforms)r.bub.material.uniforms.t.value=t;}
    if(r.aura){r.aura.ring.material.opacity=.24+Math.sin(t*2)*.06;r.aura.orb.rotation.y=t*.9;r.aura.glow.material.opacity=.14+Math.sin(t*2.2)*.05;if(r.aura.wreath)r.aura.wreath.rotation.y=t*.15;}
  });
  // Helden
  E.heroes.forEach(function(h,pi){
    heroTick(h,pi,t,now);
    var op=h.target&&!h.dead?.32+Math.sin(t*6)*.14:0;h.ring.material.opacity=op;if(op>0)h.ring.material.color.setHex(h.tcol||0xef476f);h.ring.visible=op>0;
  });
  // Kamera
  E.camA+=(E.camAT-E.camA)*(1-Math.exp(-dt*3.5));
  var hd=E.d*Math.cos(E.phi),hy=E.d*Math.sin(E.phi);
  camera.position.set(Math.sin(E.camA)*hd,hy,Math.cos(E.camA)*hd);
  if(E.shake>0){var sk=E.shake;camera.position.x+=(Math.sin(t*61.3)*.6+Math.sin(t*37.1+1.7)*.4)*sk*.5;camera.position.y+=(Math.sin(t*53.7+.4)*.6+Math.sin(t*29.9+2.3)*.4)*sk*.5;E.shake=Math.max(0,E.shake-dt*1.4);}
  camera.position.x+=Math.sin(t*.27)*.18;camera.position.y+=Math.sin(t*.35)*.12;
  camera.lookAt(0,.4,0);
  if(E.closeup){var cu=E.closeup,ca=E.camA+(cu.ang||0);camera.position.set(cu.x+Math.sin(ca)*cu.d*.7,cu.d*(cu.el||.62),cu.z+Math.cos(ca)*cu.d*.7);camera.lookAt(cu.x,cu.y||.3,cu.z);}
  if(E.lost)return;
  try{if(E.composer&&E.bloomOn)E.composer.render();else renderer.render(scene,camera);}catch(err){}
  qualityMonitor(now,dt);
  // Labels
  var W=window.innerWidth,H=window.innerHeight;
  Object.keys(E.mons).forEach(function(k){var r=E.mons[k];
    var b=toScreen(V3(r.g.position.x,0,r.g.position.z+(Math.cos(E.camA)>0?.55:-.55)));
    r.lbl.style.transform='translate3d('+b.x.toFixed(1)+'px,'+b.y.toFixed(1)+'px,0) translate(-50%,-45%)';
    if(r.showZ&&!r.dying){var tp=toScreen(monTop(r));r.zz.style.display='block';r.zz.style.transform='translate3d('+tp.x.toFixed(1)+'px,'+(tp.y-8+Math.sin(t*2)*4).toFixed(1)+'px,0) translate(-50%,-100%)';}else r.zz.style.display='none';
  });
  E.heroes.forEach(function(h,pi){var s=toScreen(heroTop(pi));h.lbl.style.transform='translate3d('+s.x.toFixed(1)+'px,'+s.y.toFixed(1)+'px,0) translate(-50%,-100%)';h.lbl.style.display=(!G||pi===viewer()||s.y<E.uiTop+30||s.y>H-E.uiBot+30)?'none':'block';});
}

function shockwave(pos,col,size,ms){
  if(!E.ok)return;
  var m=new THREE.Mesh(geo('shock',function(){return new THREE.RingGeometry(.7,1,48);}),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,side:2}));
  m.rotation.x=-Math.PI/2;m.position.copy(pos);scene.add(m);
  tween(ms||500,function(t){var k=.2+t*size;m.scale.set(k,k,k);m.material.opacity=.9*(1-t);if(t>=1){scene.remove(m);m.material.dispose();}},easeOut);
}
async function fxFusion(uA,uB){
  var A=E.mons[uA],B=E.mons[uB];if(!E.ok||!A||!B){await sleep(400);return;}
  A.lock=B.lock=true;A.lbl.style.opacity=0;B.lbl.style.opacity=0;A.zz.style.opacity=0;B.zz.style.opacity=0;A.bub.visible=B.bub.visible=false;A.popping=B.popping=true;
  var mid=A.g.position.clone().add(B.g.position).multiplyScalar(.5);mid.y=0;
  var pa=A.g.position.clone(),pb=B.g.position.clone();
  var r0=pa.distanceTo(mid),angA=Math.atan2(pa.z-mid.z,pa.x-mid.x),angB=Math.atan2(pb.z-mid.z,pb.x-mid.x);
  var col=0xc9b2ff;
  var s=toScreen(V3(mid.x,1.6,mid.z));floatAtXY(s.x,s.y-30,'🌀 Kreuzung!','info fuse');
  var swirl=new THREE.Mesh(geo('swirl',function(){return new THREE.PlaneGeometry(3.4,3.4);}),new THREE.MeshBasicMaterial({map:dotTex,color:col,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:2}));
  swirl.rotation.x=-Math.PI/2;swirl.position.set(mid.x,.1,mid.z);scene.add(swirl);
  var beam=new THREE.Mesh(geo('beam',function(){return new THREE.CylinderGeometry(.6,.75,4,20,1,true);}),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,side:2,blending:THREE.AdditiveBlending,depthWrite:false}));
  beam.position.set(mid.x,2,mid.z);scene.add(beam);
  var lastB=0;
  await tween(1100,function(t){
    var rr=r0*(1-t),sp=t*t*Math.PI*5,y=Math.sin(t*Math.PI*.5)*1.3;
    A.g.position.set(mid.x+Math.cos(angA+sp)*rr,y,mid.z+Math.sin(angA+sp)*rr);
    B.g.position.set(mid.x+Math.cos(angB+sp)*rr,y,mid.z+Math.sin(angB+sp)*rr);
    A.body.rotation.y+=.25;B.body.rotation.y+=.25;
    var sc=Math.max(.05,1-t*.85);A.body.scale.setScalar(sc);B.body.scale.setScalar(sc);
    swirl.rotation.z=-t*8;swirl.material.opacity=Math.min(1,t*2)*.9;swirl.scale.setScalar(1.2-t*.5);
    beam.material.opacity=t*.5;beam.scale.set(1-t*.5,1,1-t*.5);
    var now=performance.now();if(now-lastB>110){lastB=now;softBurst(V3(mid.x,y+.4,mid.z),[0xffd6ec,0xe6dcff,0xd6f4ee],6,{speed:1.6,life:700,size:.17,grav:-.6});}
  },easeIn);
  var c=V3(mid.x,1.2,mid.z);
  flashSprite(c,0xffffff,3.2,450);flashSprite(c,col,4.5,700);
  softBurst(c,[0xffd6ec,0xe6dcff,0xfff0b0,0xffffff],46,{speed:3.6,life:1500,size:.2,grav:-1.4,drag:.97});softBurst(c,[0xffffff],18,{speed:2.5,up:1,life:900,size:.14,tex:'dot',add:true,grav:-.5});
  shockwave(V3(mid.x,.1,mid.z),col,3.4,800);shockwave(V3(mid.x,.12,mid.z),0xfff0c0,2.2,650);
  E.shake=.25;
  var f=$('flash');f.style.background='radial-gradient(circle,rgba(255,255,255,.3),rgba(214,196,255,.35))';f.style.opacity=1;setTimeout(function(){f.style.opacity=0;setTimeout(function(){f.style.background='';},300);},200);
  removeMon(uA);removeMon(uB);
  tween(700,function(t){swirl.material.opacity=.9*(1-t);beam.material.opacity=.5*(1-t);if(t>=1){scene.remove(swirl);scene.remove(beam);swirl.material.dispose();beam.material.dispose();}});
  await sleep(120);
}
function fxDrawCard(pi){if(!E.ok||!E.heroes[pi])return;var p=heroTop(pi);burst(p,0x7fd8ff,18,{speed:2.2,up:1.6,life:750,size:.14,grav:-1});flashSprite(p,0x7fd8ff,1.6,260);var s=toScreen(p);floatAtXY(s.x,s.y,'🃏 +1 Karte','info');}
function fxFusionAppear(r){
  var pos=r.g.position.clone();var col=MBYID[r.id]&&MBYID[r.id].mega?0xffd166:0xc77dff;
  r.growT=performance.now();
  softBurst(V3(pos.x,.4,pos.z),col===0xffd166?[0xffe6a8,0xfff4d0,0xffffff]:[0xe6dcff,0xffd6ec,0xffffff],30,{speed:1.6,up:1.6,life:1400,size:.18,grav:-.8});
  setTimeout(function(){var s=toScreen(monTop(r));floatAtXY(s.x,s.y,'⭐ '+(MBYID[r.id]?MBYID[r.id].name:''),'info fuse');},350);
}

function buildSky(){
  var sky=new THREE.Mesh(new THREE.SphereGeometry(70,48,24),gfxSkyMat());
  scene.add(sky);
  // dunkler Hintergrund wie in den Echoarena-Renderbildern (keine Wolken)
}

/* ---------- Qualität / Bloom ---------- */
function qParam(){var m=/[?&]q=(high|low|auto)/.exec(location.search||'');if(m){if(m[1]!=='low'){try{localStorage.removeItem('pd_q');}catch(e){}}return m[1];}
  // im Menü gewählte Grafikstufe (Hoch / Mittel / Niedrig) hat Vorrang vor der Automatik
  try{var us=localStorage.getItem('pd_quality');if(us==='high'||us==='low'||us==='mobile')return us;}catch(e){}
  // nach einem Grafik-Absturz startet das Spiel beim nächsten Mal automatisch sparsam
  try{if(localStorage.getItem('pd_q')==='low')return 'low';}catch(e){}return 'auto';}
function isMobileDevice(){var u=navigator.userAgent||'';return /iPhone|iPad|iPod|Android|Mobile/i.test(u)||(navigator.maxTouchPoints>1&&/Macintosh/.test(u));}
// iPhone/Safari kann bei Speichermangel die 3D-Grafik kurz abschalten (schwarzer Bildschirm).
// Dann: sparsamer Modus, Grafik neu aufbauen, alle Pflanzen neu erzeugen.
function setupContextLoss(){
  canvas.addEventListener('webglcontextlost',onGLLost,false);
}
// Bei einem Absturz wird nicht auf die (auf dem iPhone unzuverlässige) Wiederherstellung gewartet:
// Es entsteht eine neue Zeichenfläche mit eigenem Renderer, die alle Modelle frisch hochlädt.
function onGLLost(ev){
  ev.preventDefault();if(E.lost)return;E.lost=true;try{localStorage.setItem('pd_q','low');}catch(e){}
  var o=$('glLost');if(o)o.style.display='flex';
  setTimeout(rebuildRenderer,350);
}
function rebuildRenderer(){
  try{
    var old=canvas,nc=document.createElement('canvas');nc.id=old.id;nc.className=old.className;
    old.removeEventListener('webglcontextlost',onGLLost,false);
    old.parentNode.replaceChild(nc,old);canvas=nc;
    renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,powerPreference:'high-performance'});
    E.tier='low';E.q='low';E.bloomOn=false;E.composer=null;
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
    if(E.sun){E.sun.shadow.mapSize.set(1024,1024);E.sun.shadow.map=null;}
    // Reflexionen kamen aus einem Puffer des alten Renderers -> abschalten, dafür mehr Grundlicht
    scene.environment=null;if(E.hemi)E.hemi.intensity=1.2;
    canvas.addEventListener('click',onCanvasClick);setupLongPress();setupContextLoss();
    try{Object.keys(E.mons).forEach(function(k){removeMon(+k);});}catch(e){}
    E.lost=false;layout();try{sync3D();}catch(e){console.warn(e);}
    E.last=performance.now();
  }catch(err){console.warn('Neuaufbau fehlgeschlagen',err);try{location.reload();}catch(e){}}
  var o=$('glLost');if(o)o.style.display='none';
}
function setupQuality(){
  E.bloomOn=false;E.fpsS=0;E.fpsN=0;E.fpsT0=0;E.downgraded=false;
  if(E.tier!=='high'){renderer.shadowMap.type=THREE.PCFShadowMap;return;}
  try{
    if(THREE.PP){
      var w=window.innerWidth,h=window.innerHeight;
      E.composer=gfxComposer();
      if(E.sun)E.sun.shadow.mapSize.set(2048,2048);
      E.bloomOn=true;
    }
  }catch(err){console.warn('Bloom nicht verfügbar',err);E.composer=null;E.bloomOn=false;}
}
function qualityMonitor(now,dt){
  if(E.q!=='auto'||E.downgraded===2||!G||document.hidden||E.lost)return;
  if(!E.fpsT0){E.fpsT0=now;E.fpsN=0;return;}
  E.fpsN++;
  if(now-E.fpsT0>2500){
    var fps=E.fpsN*1000/(now-E.fpsT0);E.fpsT0=now;E.fpsN=0;E.lastFps=fps;
    if(fps<38&&E.bloomOn){E.bloomOn=false;E.downgraded=1;}
    else if(fps<26&&(E.downgraded===1||!E.bloomOn)){renderer.setPixelRatio(1);renderer.shadowMap.type=THREE.PCFShadowMap;layout();E.downgraded=2;}
  }
}
