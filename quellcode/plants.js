/* ================= PFLANZEN (Meshy-Modelle CC0 + prozedurale Pflanzen) – keine Gesichter ================= */
var GAME_VERSION='v21';
var ASSETS={ok:false,done:false,list:{},base:'assets/models/',arena:null};
var PLANT_FILES=['sunflower','mushroom','thornvine','aloe','cactus','lavender','lotus','oak','crystalflower','pumpkin','rose','pine','bamboo'];
// h = Höhe (Pflanzen-Einheiten), w = max. Breite, st = Steifigkeit (Exponent der Biegung), am = Wind-Amplitude, atk = Angriffsart, ab = Fähigkeits-Bewegung
var PDEF={
  ratte:{proc:'dandelion',h:.92,w:.9,st:1.6,am:1.2,atk:'seeds',ab:'bloom'},
  fleder:{proc:'maple',h:1.1,w:1.0,st:1.4,am:.6,atk:'dive',ab:'spin',fly:.42},
  wolf:{a:'sunflower',h:1.3,w:.95,st:1.7,am:1.0,atk:'beam',ab:'bloom'},
  schlange:{a:'thornvine',h:1.35,w:1.0,cl:[[-.16,.02,1,0],[.2,-.06,.82,2.1],[.02,-.2,.7,4.0]],tint:0xd9f0b8,st:1.25,am:1.2,atk:'lash',ab:'shake',vine:0x9a6a4a},
  skelett:{a:'mushroom',h:.95,w:1.0,st:2.2,am:.45,atk:'puff',ab:'spore'},
  fee:{a:'aloe',h:.95,w:1.15,st:1.8,am:.8,atk:'squirt',ab:'glow'},
  kroete:{a:'cactus',h:1.05,w:1.0,st:2.4,am:.35,atk:'spines',ab:'shake'},
  greif:{a:'lavender',h:1.35,w:1.1,cl:[[-.2,.04,1,0],[.22,0,.9,1.9],[0,-.22,.8,3.7]],st:1.5,am:1.3,atk:'scent',ab:'bloom'},
  einhorn:{a:'lotus',h:1.15,w:1.0,st:1.6,am:.8,atk:'petals',ab:'glow',pad:true},
  oger:{proc:'flytrap',h:1.45,w:1.15,st:1.5,am:1.0,atk:'snap',ab:'shake'},
  golem:{a:'oak',h:1.8,w:1.25,st:2.6,am:.55,atk:'swing',ab:'shake'},
  drache:{a:'crystalflower',h:1.95,w:1.2,st:1.7,am:.8,atk:'flare',ab:'glow',tint:0xffb78f,em:[0xff6a2a,.16]},
  vampirwolf:{a:'sunflower',h:1.6,w:1.05,st:1.7,am:1.0,atk:'beam',ab:'spin',tint:0xffc8a0,extra:'samaras'},
  pestschwarm:{a:'pumpkin',h:.95,w:1.2,st:2.6,am:.3,atk:'burst',ab:'spore'},
  todesritter:{a:'rose',h:1.7,w:1.0,st:1.4,am:1.0,atk:'lash',ab:'bloom',tint:0xffd6e6,vine:0x8f4a6a},
  pegasus:{a:'lotus',h:1.55,w:1.15,st:1.6,am:.8,atk:'petals',ab:'glow',tint:0xfff3dc,em:[0xffe2a8,.22],fly:.18,halo:true},
  bergkoloss:{a:'pine',h:2.25,w:1.3,st:2.6,am:.5,atk:'swing',ab:'shake'},
  hydra:{a:'bamboo',h:2.05,w:1.15,cl:[[-.24,.05,1,0],[.26,-.02,.88,2.2],[.02,-.26,.78,4.1]],st:1.5,am:1.0,atk:'lash',ab:'shake',vine:0x6fae5a},
  // v14 – seltene Pflanzen (prozedural, rares.js)
  edelweiss:{proc:'edelweiss',h:.86,w:.95,st:1.6,am:.9,atk:'stars',ab:'bloom'},
  kanne:{proc:'kanne',h:1.25,w:1.1,st:1.6,am:.8,atk:'nectar',ab:'hop'},
  blaulotus:{proc:'blaulotus',h:1.05,w:1.2,st:1.8,am:.6,atk:'ripple',ab:'glow'},
  mondblume:{proc:'mondblume',h:1.45,w:1.0,st:1.4,am:1.0,atk:'moon',ab:'glow'},
  orchidee:{proc:'orchidee',h:1.45,w:1.05,st:1.5,am:.8,atk:'prism',ab:'glow'},
  drachenbaum:{proc:'drachenbaum',h:1.9,w:1.2,st:2.4,am:.5,atk:'resin',ab:'shake'},
  baobab:{proc:'baobab',h:2.0,w:1.3,st:2.8,am:.4,atk:'quake',ab:'bloom'},
  titanwurz:{proc:'titanwurz',h:2.2,w:1.2,st:2.0,am:.55,atk:'bloomblast',ab:'spore'}
};
function plantDefFor(id){var t=MBYID[id];if(!t)return null;if(t.mega)return PDEF[t.base]?{def:PDEF[t.base],mega:true}:null;return PDEF[id]?{def:PDEF[id],mega:false}:null;}

/* ---------- Laden ---------- */
function floatGeo(g){var o=new THREE.BufferGeometry();for(var k in g.attributes){var a=g.attributes[k];var n=a.count,sz=a.itemSize,arr=new Float32Array(n*sz);
    for(var i=0;i<n;i++){arr[i*sz]=a.getX(i);if(sz>1)arr[i*sz+1]=a.getY(i);if(sz>2)arr[i*sz+2]=a.getZ(i);if(sz>3)arr[i*sz+3]=a.getW(i);}o.setAttribute(k,new THREE.BufferAttribute(arr,sz));}
  if(g.index)o.setIndex(g.index.clone());return o;}
function srgbLin(c){return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);}
function loadModels(onProg,onDone){
  var fin=false;function done(ok){if(fin)return;fin=true;ASSETS.ok=ok;ASSETS.done=true;try{onDone(ok);}catch(e){console.warn(e);}}
  try{
    if(!window.THREE||!THREE.GLX||location.protocol==='file:'||/[?&]models=0/.test(location.search)){done(false);return;}
    var L=new THREE.GLX.GLTFLoader();L.setMeshoptDecoder(THREE.GLX.MeshoptDecoder);
    var files=PLANT_FILES.slice(),n=files.length,got=0,prog={},fail=false;
    var to=setTimeout(function(){console.warn('Modelle: Zeitüberschreitung');done(false);},60000);
    var upd=function(){var s=0;files.forEach(function(f){s+=prog[f]||0;});onProg(s/n);};
    var one=function(){got++;upd();if(got===n){clearTimeout(to);done(!fail);}};
    files.forEach(function(f){
      L.load(ASSETS.base+f+'.glb?v='+GAME_VERSION.slice(1),function(g){
        try{if(f==='arena'){ASSETS.arena=g.scene;try{applyEchoArena(g.scene);}catch(err){console.warn('arena',err);}}else ASSETS.list[f]=normalizePlant(g.scene);}catch(err){console.warn(err);if(f!=='arena')fail=true;}
        prog[f]=1;one();
      },function(e){if(e&&e.total){prog[f]=Math.min(.99,e.loaded/e.total);upd();}},
      function(err){console.warn('Modell fehlt: '+f);if(f!=='arena')fail=true;prog[f]=1;one();});
    });
  }catch(err){console.warn(err);done(false);}
}
// Alle Teile in einen gemeinsamen Raum backen: Fuß bei y=0, mittig
function normalizePlant(scene){
  scene.updateMatrixWorld(true);var parts=[],bb=new THREE.Box3();
  scene.traverse(function(o){if(!o.isMesh)return;var g=floatGeo(o.geometry);g.applyMatrix4(o.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();g.computeBoundingBox();bb.union(g.boundingBox);parts.push({geo:g,mat:o.material});});
  var c=bb.getCenter(new THREE.Vector3());parts.forEach(function(p){p.geo.translate(-c.x,-bb.min.y,-c.z);p.geo.computeBoundingSphere();});
  var size=bb.getSize(new THREE.Vector3());return {parts:parts,size:size};
}

/* ---------- Biege-Shader: Wurzel fest, Spitze bewegt sich ---------- */
var BEND_GLSL=[
 'float hN=clamp(transformed.y/uH,0.0,1.4);',
 'float bw=pow(hN,uP);',
 'vec2 fl=vec2(sin(uT*3.1+transformed.x*7.0/uH+transformed.y*6.0/uH),cos(uT*2.6+transformed.z*7.0/uH+transformed.y*5.0/uH))*uFl*hN*uH;',
 'float wv=uWv.x*sin(hN*uWv.z-uWv.y)*hN;',
 'vec2 bb=uB*bw;',
 'transformed.xz+=(bb+vec2(wv*.35,wv))*uH+fl;',
 'transformed.y-=dot(bb,bb)*uH*.45;',
 'transformed.y*=uSq;transformed.xz*=1.0+(1.0-uSq)*.55*hN;'
].join('\n');
function bendUniforms(){return {uB:{value:new THREE.Vector2()},uT:{value:0},uFl:{value:.006},uWv:{value:new THREE.Vector3(0,0,7)},uSq:{value:1}};}
function bendify(m,U,H,P){
  var own={uH:{value:H},uP:{value:P||1.7}};
  m.onBeforeCompile=function(sh){for(var k in U)sh.uniforms[k]=U[k];sh.uniforms.uH=own.uH;sh.uniforms.uP=own.uP;
    sh.vertexShader='uniform vec2 uB;uniform float uH,uT,uFl,uSq,uP;uniform vec3 uWv;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+BEND_GLSL);};
  m.customProgramCacheKey=function(){return 'bend1';};return m;}
function bendMesh(geo,m,U,H,P,parent){var mesh=new THREE.Mesh(geo,bendify(m,U,H,P));mesh.castShadow=true;
  var dm=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});mesh.customDepthMaterial=bendify(dm,U,H,P);parent.add(mesh);return mesh;}
// Gleiche Biegung auf der CPU (für angehängte Teile)
function bendAt(U,H,P,x,y,z,out){var hN=Math.max(0,Math.min(1.4,y/H)),bw=Math.pow(hN,P);var bx=U.uB.value.x*bw,bz=U.uB.value.y*bw;var w=U.uWv.value;var wv=w.x*Math.sin(hN*w.z-w.y)*hN;
  var sq=U.uSq.value,k=1+(1-sq)*.55*hN;out.set((x+(bx+wv*.35)*H)*k,(y-(bx*bx+bz*bz)*H*.45)*sq,(z+(bz+wv)*H)*k);return out;}

/* ---------- Prozedurale Geometrie ---------- */
var _pv=null;
function PB(){this.list=[];}
PB.prototype.add=function(g,c0,c1,p,r,s){var q=g.index?g.toNonIndexed():g.clone();if(q.attributes.uv)q.deleteAttribute('uv');if(q.attributes.uv2)q.deleteAttribute('uv2');
  if(!q.attributes.normal)q.computeVertexNormals();
  var m=new THREE.Matrix4().compose(new THREE.Vector3(p?p[0]:0,p?p[1]:0,p?p[2]:0),new THREE.Quaternion().setFromEuler(new THREE.Euler(r?r[0]:0,r?r[1]:0,r?r[2]:0,'YXZ')),new THREE.Vector3(s?s[0]:1,s?s[1]:1,s?s[2]:1));
  q.computeBoundingBox();var y0=q.boundingBox.min.y,y1=q.boundingBox.max.y;var pos=q.attributes.position,n=pos.count,col=new Float32Array(n*3);
  var A=new THREE.Color(c0),B=new THREE.Color(c1==null?c0:c1),C=new THREE.Color();
  for(var i=0;i<n;i++){var k=y1>y0?(pos.getY(i)-y0)/(y1-y0):0;C.copy(A).lerp(B,k);col[i*3]=C.r;col[i*3+1]=C.g;col[i*3+2]=C.b;}
  q.setAttribute('color',new THREE.BufferAttribute(col,3));q.applyMatrix4(m);this.list.push(q);return this;};
PB.prototype.geo=function(){var g=THREE.GLX.mergeGeometries(this.list);g.computeBoundingSphere();return g;};
// Blatt entlang +y, Fläche in xy, Wölbung nach +z
function leafGeo(L,W,o){o=o||{};var nu=o.nu||8,nv=o.nv||3,pos=[],idx=[];
  for(var i=0;i<=nu;i++){var u=i/nu;var w=W*Math.pow(Math.sin(Math.PI*Math.pow(u,o.p||.75)),o.q||.9);if(o.jag)w*=.72+.28*Math.abs(Math.sin(u*Math.PI*o.jag));if(o.tipW)w=Math.max(w,W*o.tipW*u);
    for(var j=-nv;j<=nv;j++){var v=j/nv;pos.push(v*w,u*L,(o.bend||0)*u*u*L+(o.cup||0)*v*v*w);}}
  var row=nv*2+1;for(i=0;i<nu;i++)for(j=0;j<row-1;j++){var a=i*row+j,b=a+1,c=a+row,d=c+1;idx.push(a,c,b,b,c,d);}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
// verjüngte Röhre entlang Punkten
function tubeGeo(pts,r0,r1,seg,rad){var cv=new THREE.CatmullRomCurve3(pts.map(function(p){return new THREE.Vector3(p[0],p[1],p[2]);}));seg=seg||10;rad=rad||6;
  var fr=cv.computeFrenetFrames(seg,false),pos=[],idx=[];
  for(var i=0;i<=seg;i++){var u=i/seg,P=cv.getPointAt(u),N=fr.normals[i],Bn=fr.binormals[i],r=r0+(r1-r0)*u;
    for(var j=0;j<=rad;j++){var a=j/rad*Math.PI*2,cx=Math.cos(a)*r,cy=Math.sin(a)*r;pos.push(P.x+N.x*cx+Bn.x*cy,P.y+N.y*cx+Bn.y*cy,P.z+N.z*cx+Bn.z*cy);}}
  for(i=0;i<seg;i++)for(j=0;j<rad;j++){var a2=i*(rad+1)+j,b=a2+rad+1;idx.push(a2,b,a2+1,b,b+1,a2+1);}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function flipGeo(g){var q=g.index?g.toNonIndexed():g.clone();var p=q.attributes.position.array;for(var i=0;i<p.length;i+=9){for(var k=0;k<3;k++){var t=p[i+3+k];p[i+3+k]=p[i+6+k];p[i+6+k]=t;}}q.computeVertexNormals();return q;}
function procMat(o){var m=new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.72,metalness:0,side:THREE.DoubleSide},o||{}));return m;}

// Löwenzahn: gezackte Rosette, gelbe Blüte, Pusteblume
function buildDandelion(pb,token){
  var nL=token?5:7;for(var i=0;i<nL;i++){var a=i/nL*Math.PI*2+.3;pb.add(leafGeo(token?.3:.42,.08,{jag:5,cup:.25,bend:-.15,nu:10}),0x4f9a45,0x9ad67a,[0,.02,0],[1.18+.12*(i%2),a,0]);}
  var stems=token?[[.0,.62,.04,false]]:[[-.08,.72,.06,true],[.12,.58,-.05,false]];
  stems.forEach(function(s,k){var top=[s[0]*1.6,s[1],s[2]*1.6];pb.add(tubeGeo([[s[0]*.3,0,s[2]*.3],[s[0]*1.1,s[1]*.5,s[2]],[top[0],top[1],top[2]]],.018,.013,10,5),0x6fae55,0xa6d48a);
    if(s[3]){pb.add(new THREE.SphereGeometry(.06,10,6),0xf2b52c,0xffd84a,[top[0],top[1]+.02,top[2]],null,[1,.55,1]);
      for(var L=0;L<3;L++){var n=14+L*4;for(var j=0;j<n;j++){var an=j/n*Math.PI*2+L*.3;pb.add(leafGeo(.1-L*.018,.017,{nu:4,nv:1,cup:.4}),0xffc93a,0xfff0a0,[top[0],top[1]+.025+L*.012,top[2]],[1.25-L*.32,an,0]);}}}
    else{pb.add(new THREE.IcosahedronGeometry(.045,1),0xd9d2b8,0xf3eedc,[top[0],top[1]+.02,top[2]]);
      var n2=46;for(var q=0;q<n2;q++){var phi=Math.acos(1-2*(q+.5)/n2),th=q*2.39996;var dx=Math.sin(phi)*Math.cos(th),dy=Math.cos(phi),dz=Math.sin(phi)*Math.sin(th);
        var e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx,dy,dz)),'YXZ');
        pb.add(new THREE.CylinderGeometry(.003,.003,.13,3,1),0xf4f1e6,null,[top[0]+dx*.07,top[1]+.02+dy*.07,top[2]+dz*.07],[e.x,e.y,e.z]);
        pb.add(new THREE.IcosahedronGeometry(.016,0),0xffffff,null,[top[0]+dx*.135,top[1]+.02+dy*.135,top[2]+dz*.135],null,[1,.5,1]);}}
  });
}
// Ahornsamen: zwei Flügelpaare + kleiner Keimling
function samaraGeo(pb,p,ry,s){var w=leafGeo(.44*s,.12*s,{p:.55,q:.7,cup:.18,nu:8,nv:2});
  [-1,1].forEach(function(sx){pb.add(new THREE.SphereGeometry(.055*s,8,6),0xa8553a,0xc9764c,p,[0,ry,0],[1,.8,1.3]);pb.add(w,0xd8603e,0xf7c27a,p,[0,ry,sx*1.15]);});}
function buildMaple(pb,base){samaraGeo(pb,[0,0,0],0,1);samaraGeo(pb,[.12,-.12,.05],1.3,.72);
  base.add(leafGeo(.16,.08,{nu:6,cup:.3}),0x5b9e48,0xa7d77d,[0,0,0],[.9,0,0]).add(leafGeo(.16,.08,{nu:6,cup:.3}),0x5b9e48,0xa7d77d,[0,0,0],[.9,Math.PI,0]).add(tubeGeo([[0,-.02,0],[0,.06,0],[0,.12,0]],.012,.01,4,5),0x6fae55,0x8cc56b);}
// Fliegenfalle: Rosette, Stiele, Fallenköpfe (ohne Gesicht: Blattklappen mit Wimpern)
function trapLobe(){var pb=new PB();var dome=new THREE.SphereGeometry(.24,16,8,0,Math.PI*2,0,Math.PI/2);
  pb.add(dome,0x5fae48,0x9fd36f,null,null,[1,.42,.85]);pb.add(flipGeo(dome),0xff8f9b,0xffc0c4,null,null,[.96,.38,.82]);
  for(var i=0;i<11;i++){var a=i/11*Math.PI*2;pb.add(new THREE.ConeGeometry(.011,.1,3),0xe4f6b0,null,[Math.cos(a)*.235,.02,Math.sin(a)*.2],[0,0,-Math.cos(a)*1.2]);}
  var g=pb.geo();g.translate(0,0,.21);return g;} // Scharnier bei z=0
function buildFlytrap(pb){
  for(var i=0;i<6;i++){var a=i/6*Math.PI*2+.4;pb.add(leafGeo(.34,.1,{cup:.3,bend:-.2,tipW:.6}),0x4f9a45,0x8fcf68,[0,.02,0],[1.2,a,0]);}
  var heads=[[0,1.3,.1,0,1],[-.36,1.0,.02,-.55,.85],[.38,.9,-.04,.6,.78]];
  heads.forEach(function(h){pb.add(tubeGeo([[h[0]*.15,0,0],[h[0]*.6,h[1]*.45,h[2]*.3],[h[0],h[1]-.05,h[2]]],.03,.022,10,6),0x5b9e48,0x86c65f);});
  return heads;
}
// Seerosen-Teich (für Seerose)
function buildPond(pb){pb.add(new THREE.CylinderGeometry(.62,.66,.05,28),0x8ad8d0,0xb5ece4,[0,.0,0]);
  [[.34,.18,.0],[-.3,.26,1.8],[.05,-.36,3.6]].forEach(function(q){var c=new THREE.CircleGeometry(.2,14,.35,Math.PI*2-.7);pb.add(c,0x5fae5a,0x7cc46b,[q[0],.035,q[1]],[-Math.PI/2,q[2],0]);});}
// Blütenkranz (Kreuzung/Mega): kleine Blüten im Kreis am Boden
function wreathGeo(col){var pb=new PB();var n=9;for(var i=0;i<n;i++){var a=i/n*Math.PI*2,x=Math.cos(a)*.72,z=Math.sin(a)*.72;
    for(var j=0;j<5;j++)pb.add(leafGeo(.075,.04,{nu:3,nv:1,cup:.3}),col,0xffffff,[x,.05,z],[1.45,j/5*Math.PI*2+a,0]);
    pb.add(new THREE.SphereGeometry(.025,6,4),0xffe08a,null,[x,.065,z]);
    pb.add(leafGeo(.1,.035,{nu:3,nv:1}),0x6fb35a,0x9fd77a,[x,.03,z],[1.5,a+1.9,0]);}
  return pb.geo();}

/* ---------- Visual erzeugen ---------- */
var FLASHC=null;
function makeModelVisual(id,inner,token){
  var pd=plantDefFor(id);if(!pd)return null;var def=pd.def,mega=pd.mega;
  if(!FLASHC)FLASHC=new THREE.Color(0xff9a8a);
  var U=bendUniforms(),mats=[],meshes=[],H=def.h*(mega?1.22:1),P=def.st||1.7,foot=def.w||1;
  var root=new THREE.Group();inner.add(root);var spin=new THREE.Group();root.add(spin);
  var tint=function(m){if(def.tint&&m.color)m.color.multiply(new THREE.Color(def.tint));if(mega&&m.color){m.color.lerp(new THREE.Color(0xffe6a8),.16);}
    if(m.emissive){if(def.em){m.emissive.set(def.em[0]);m.emissiveIntensity=def.em[1];}else if(mega){m.emissive.set(0xffc860);m.emissiveIntensity=.08;}}
    if(m.roughness!==undefined){m.roughness=Math.max(.5,Math.min(.9,m.roughness));m.metalness=Math.min(m.metalness||0,.1);}
    m.userData.baseEm=m.emissive?m.emissive.clone():null;m.userData.baseEI=m.emissiveIntensity||0;m.userData.baseC=m.color?m.color.clone():null;mats.push(m);return m;};
  var heads=null,lobes=[],extras=[];
  if(def.a){var as=ASSETS.list[def.a];if(!as)return null;var sz=as.size;var s=Math.min(H/sz.y,foot/sz.x,foot/sz.z);H=sz.y*s;foot=Math.max(sz.x,sz.z)*s;
    var cl=def.cl||[[0,0,1,0]];var pm0=as.parts.map(function(p){return tint(p.mat.clone());});
    if(def.cl){var hh=def.h*(mega?1.22:1),ww=(def.w||1)*(mega?1.12:1);s=Math.min(hh/sz.y,ww*.62/sz.x,ww*.62/sz.z);H=sz.y*s;foot=ww;}
    cl.forEach(function(c){var holder=new THREE.Group();holder.scale.setScalar(s*c[2]);holder.position.set(c[0]*foot,def.fly||0,c[1]*foot);holder.rotation.y=c[3];spin.add(holder);
      as.parts.forEach(function(p,i){meshes.push(bendMesh(p.geo,pm0[i],U,sz.y,P,holder));});});
    if(def.pad){var pb0=new PB();buildPond(pb0);var pm=tint(procMat({side:THREE.FrontSide,roughness:.4}));var pond=bendMesh(pb0.geo(),pm,U,H,P,root);pond.castShadow=false;pond.receiveShadow=true;}
  }else{
    var pb=new PB(),pbS=null,pg=null,RB=RARE_BUILD[def.proc];
    if(RB){pg=new PB();RB.f(pb,pg);}
    else if(def.proc==='dandelion')buildDandelion(pb,token);
    else if(def.proc==='maple'){pbS=new PB();buildMaple(pb,pbS);}
    else if(def.proc==='flytrap')heads=buildFlytrap(pb);
    var g=pb.geo();g.computeBoundingBox();var top=g.boundingBox.max.y;var gg=null;if(pg&&pg.list.length){gg=pg.geo();gg.computeBoundingBox();top=Math.max(top,gg.boundingBox.max.y);}var sc=H/Math.max(.2,top+(def.proc==='maple'?.0:.08));
    if(def.proc==='maple'){var fl=new THREE.Group();fl.position.y=(def.fly||.4)*(mega?1.22:1);fl.scale.setScalar(mega?1.22:1);spin.add(fl);meshes.push(bendMesh(g,tint(procMat()),U,.5,1.2,fl));
      var sp=bendMesh(pbS.geo(),tint(procMat()),U,.5,1.2,root);sp.scale.setScalar(mega?1.3:1);extras.push({maple:fl});H=fl.position.y+.32*(mega?1.22:1);foot=.9;}
    else{var hold=new THREE.Group();hold.scale.setScalar(sc);root.add(hold);meshes.push(bendMesh(g,tint(procMat()),U,H/sc,P,hold));
      if(gg){var gm=tint(procMat({roughness:RB.rough||.6,metalness:RB.metal||0}));gm.roughness=RB.rough||.6;gm.metalness=RB.metal||0;gm.emissive.set(RB.em);gm.emissiveIntensity=RB.ei*(mega?1.2:1);
        gm.userData.baseEm=gm.emissive.clone();gm.userData.baseEI=gm.emissiveIntensity;meshes.push(bendMesh(gg,gm,U,H/sc,P,hold));}
      if(heads){var lg=geo('trapLobe',trapLobe);var lm=tint(procMat({side:THREE.FrontSide}));
        heads.forEach(function(h,k){var hg=new THREE.Group();hold.add(hg);var up=new THREE.Group(),dn=new THREE.Group();hg.add(up);hg.add(dn);
          var a=new THREE.Mesh(lg,lm),b=new THREE.Mesh(lg,lm);a.castShadow=b.castShadow=true;up.add(a);b.rotation.z=Math.PI;dn.add(b);
          hg.scale.setScalar(h[4]);hg.rotation.y=h[3];lobes.push({g:hg,up:up,dn:dn,x:h[0],y:h[1],z:h[2],ry:h[3],ph:k*1.7});});
        H=1.3*sc+.12;}
      foot=Math.min(def.w||1,1.15);}
  }
  if(def.extra==='samaras'){var pbx=new PB();samaraGeo(pbx,[0,0,0],0,.7);var sg=pbx.geo();var ring=new THREE.Group();ring.position.y=H*.82;root.add(ring);
    var sm=tint(procMat());for(var i=0;i<3;i++){var m3=new THREE.Mesh(sg,sm);m3.castShadow=true;m3.position.set(Math.cos(i/3*6.283)*.5,0,Math.sin(i/3*6.283)*.5);ring.add(m3);}extras.push({orbit:ring,y:H*.82});}
  if(def.halo){var hs=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xfff0c0,transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false}));hs.scale.set(1.6,1.6,1);hs.position.y=H*.75;root.add(hs);extras.push({glow:hs});}
  try{addRarityFX(root,id,H,foot,extras);}catch(err){console.warn('rarity fx',err);}
  var vis={info:{h:H,s:1,bh:H,foot:foot},mats:mats,parts:[],noClips:true,hasDeath:false,U:U,def:def,P:P,H:H,lobes:lobes,open:1,flashT:0,spin:spin,extras:extras,
    play:function(){},
    flash:function(col,ms){vis.flashT=performance.now();vis.flashC=col!=null?new THREE.Color(col):FLASHC;vis.flashMs=ms||300;vis.flashI=col!=null?.32:.38;}};
  var _o=new THREE.Vector3();
  vis.anim=function(t){U.uT.value=t;
    if(vis.flashT){var k=(performance.now()-vis.flashT)/(vis.flashMs||300);if(k>=1){vis.flashT=0;mats.forEach(function(m){if(m.emissive&&m.userData.baseEm){m.emissive.copy(m.userData.baseEm);m.emissiveIntensity=m.userData.baseEI;}});}
      else{var f=Math.sin(k*Math.PI);mats.forEach(function(m){if(m.emissive&&m.userData.baseEm){m.emissive.copy(m.userData.baseEm).multiplyScalar(m.userData.baseEI);_gc.copy(vis.flashC||FLASHC).multiplyScalar(f*(vis.flashI||.35));m.emissive.add(_gc);m.emissiveIntensity=1;}});}}
    lobes.forEach(function(L){var sc=L.g.parent.scale.x;bendAt(U,H/sc,P,L.x,L.y,L.z,_o);L.g.position.copy(_o);var ob=vis.open*(.5+.1*Math.sin(t*1.3+L.ph));L.up.rotation.x=-ob;L.dn.rotation.x=ob*.5;
      L.g.rotation.x=-.12-U.uB.value.y*.9;L.g.rotation.z=U.uB.value.x*.9;});
    extras.forEach(function(e){if(e.maple){e.maple.rotation.y=t*(1.6+(vis.spinBoost||0));e.maple.position.y=(def.fly||.4)*(mega?1.22:1)+Math.sin(t*1.9)*.05;}
      if(e.orbit){e.orbit.rotation.y=t*.9+(vis.spinBoost||0)*t;bendAt(U,H,P,0,e.y,0,_o);e.orbit.position.copy(_o);}
      if(e.glow){e.glow.material.opacity=.35+Math.sin(t*1.8)*.1+(vis.glowBoost||0);}
      if(e.rfx)rarityTick(e.rfx,t);});
    if(def.fly&&def.a){spin.position.y=Math.sin(t*1.7)*.05;}
  };
  return vis;
}

/* ---------- Bewegung: Wind, Atmen, Angriff, Treffer, Fähigkeit, Welken, Wachsen ---------- */
var ATK_P={ // W=Ausholen, S=Schlag, F=Nachschwingen (ms); bw/bs = Biegung zurück/vor; q = Stauchung
  lash:{W:260,S:120,F:600,bw:.45,bs:.75,wave:.3},snap:{W:280,S:110,F:520,bw:.36,bs:.6},beam:{W:340,S:160,F:560,bw:.3,bs:.36},
  puff:{W:300,S:120,F:560,bw:.08,bs:.1,qw:.72,qs:1.22},spines:{W:280,S:90,F:520,bw:.2,bs:.2,qw:.86,qs:1.1,jig:1},
  swing:{W:380,S:210,F:760,bw:.22,bs:.42,side:.3,fl:.035},seeds:{W:260,S:130,F:560,bw:.38,bs:.62},dive:{W:200,S:200,F:500,bw:.1,bs:.1},
  squirt:{W:260,S:110,F:520,bw:.22,bs:.32,qw:.86,qs:1.12},scent:{W:300,S:150,F:660,bw:.42,bs:.66,wave:.16},petals:{W:300,S:150,F:560,bw:.14,bs:.2,qw:.88,qs:1.14,fl:.025},
  flare:{W:340,S:150,F:600,bw:.24,bs:.4,qw:.9,qs:1.12},burst:{W:280,S:140,F:560,bw:.05,bs:.08,qw:.76,qs:1.2,hop:.25},
  stars:{W:300,S:150,F:600,bw:.2,bs:.3,qw:.88,qs:1.12,fl:.02},nectar:{W:300,S:120,F:560,bw:.26,bs:.4,qw:.82,qs:1.16},ripple:{W:320,S:150,F:620,bw:.12,bs:.18,qw:.86,qs:1.14,fl:.02},
  moon:{W:360,S:170,F:640,bw:.3,bs:.42,wave:.12},prism:{W:380,S:160,F:640,bw:.24,bs:.36,qw:.9,qs:1.14},resin:{W:400,S:210,F:760,bw:.2,bs:.36,side:.25,fl:.03},
  quake:{W:460,S:230,F:820,bw:.14,bs:.3,side:.18,qw:.86,qs:1.12,hop:.12,fl:.03},bloomblast:{W:420,S:170,F:760,bw:.1,bs:.18,qw:.7,qs:1.26,fl:.02}};
function atkTiming(r){var p=ATK_P[(r.vis&&r.vis.def&&r.vis.def.atk)||'lash']||ATK_P.lash;return p;}
var MOTION_COL={bloom:0xffd6ec,spore:0xe8f0c8,glow:0xbff7ea,shake:0xd8f0b0,spin:0xffd8a8,hop:0xfff0b0};
function motionKind(id){var pd=plantDefFor(id);return pd?pd.def.atk:'lash';}
function monMotion(uid,n,o){var r=E.mons[uid];if(!r||!r.mo)return;if(r.act&&r.act.n==='die')return;r.act={n:n,s:performance.now(),o:o||{}};}
function sm(k){k=Math.max(0,Math.min(1,k));return k*k*(3-2*k);}
function spring(k,f,d){return Math.exp(-d*k)*Math.cos(k*Math.PI*f);}
function motionTick(r,t,now){
  var mo=r.mo;if(!mo)return;var v=r.vis;var U=v&&v.U;var def=(v&&v.def)||{};var am=def.am||1;
  var px=0,py=0,pz=0,ry=0,s=1,sxz=1;
  var ph=r.phase,x=r.g.position.x;
  var gust=.5+.5*Math.sin(t*.37-x*.45);
  var bx=(.06*Math.sin(t*1.05+ph)+.025*Math.sin(t*2.6+ph*2.1)+.045*gust*Math.sin(t*.8-x*.6))*am;
  var bz=(.028*Math.sin(t*.85+ph*1.4)+.012*Math.sin(t*2.2+ph))*am;
  var fl=(.005+.006*gust)*Math.min(1.4,am),sq=1+.018*Math.sin(t*1.7+ph),wv=0,wph=0,wf=7,open=1,glow=0;
  var a=r.act;
  if(a){var e=now-a.s,k,c,f;
    if(a.n==='atk'){var p=ATK_P[def.atk]||ATK_P.lash;var fw=0,sd=0;
      if(e<p.W){k=easeOut(e/p.W);fw=-p.bw*k;sd=(p.side||0)*k;sq+=((p.qw||1)-1)*k;open=1+.6*k;glow=.25*k;fl+=(p.fl||0)*k;}
      else if(e<p.W+p.S){k=easeIn((e-p.W)/p.S);fw=-p.bw+(p.bw+p.bs)*k;sd=(p.side||0)*(1-2*k);sq+=((p.qw||1)-1)+((p.qs||1)-(p.qw||1))*k;open=1.6*(1-k);
        if(p.wave){wv=p.wave*Math.sin(k*Math.PI);wph=k*7;}if(p.hop)py+=p.hop*Math.sin(k*Math.PI*.5);fl+=(p.fl||0);glow=.25+.25*k;}
      else if(e<p.W+p.S+p.F){k=(e-p.W-p.S)/p.F;c=spring(k,p.jig?5:2.5,3.2);fw=p.bs*c;sd=-(p.side||0)*c;sq+=((p.qs||1)-1)*c;open=Math.min(1,k*2.2);
        if(p.wave){wv=p.wave*c*.7;wph=7+k*10;}if(p.hop)py+=p.hop*Math.max(0,c)*.6;fl+=(p.fl||0)*(1-k);glow=.5*(1-k);}
      else r.act=null;
      var dx=a.o.dx||0,dz=a.o.dz==null?1:a.o.dz;bx+=fw*dx+sd*dz;bz+=fw*dz-sd*dx;}
    else if(a.n==='hit'){var D=520;k=e/D;if(k>=1)r.act=null;else{f=spring(k,2.2,3.5)*Math.min(1,k*8);bz-=.36*f;bx+=.1*f*(a.o.side||1);fl+=.045*(1-k);sq-=.06*Math.max(0,f);}}
    else if(a.n==='die'){var DD=1150;k=Math.min(1,e/DD);var q=sm(k/.75);
      bz+=.75*q;bx+=.28*q*(a.o.side||1);sq=1-.38*sm(k/.9);fl=.004;py=-.45*sm((k-.5)/.5);
      var op=1-sm((k-.5)/.5);if(r.fadeM)r.fadeM.forEach(function(m){m.opacity=op;if(m.color&&m.userData.baseC)m.color.copy(m.userData.baseC).lerp(WILT_C,q*.55);});}
    else if(a.n==='abil'){var ty=a.o.t||def.ab||'bloom';
      if(ty==='spin'){k=e/750;if(k>=1){r.act=null;if(v)v.spinBoost=0;}else{if(v)v.spinBoost=8*Math.sin(k*Math.PI);ry+=def.proc==='maple'?0:Math.PI*2*easeInOut(k);py+=.18*Math.sin(k*Math.PI);}}
      else if(ty==='spore'){k=e/700;if(k>=1)r.act=null;else{if(k<.4){c=easeOut(k/.4);sq-=.22*c;}else{c=spring((k-.4)/.6,2,3);sq+=.18*c;}}}
      else if(ty==='shake'){k=e/650;if(k>=1)r.act=null;else{f=Math.sin(k*Math.PI);bx+=Math.sin(e*.045)*.12*f;fl+=.05*f;sq+=.03*f;}}
      else if(ty==='hop'){k=e/560;if(k>=1)r.act=null;else{f=Math.sin(k*Math.PI);py+=.22*f;sq+=.08*f-.1*Math.max(0,1-k/.15);bz+=.05*f;}}
      else if(ty==='glow'){k=e/900;if(k>=1)r.act=null;else{f=Math.sin(k*Math.PI);sq+=.07*f;fl+=.015*f;glow=.5*f;}}
      else{k=e/800;if(k>=1)r.act=null;else{f=Math.sin(k*Math.PI);sq+=.1*f;fl+=.03*f;bz-=.06*f;open=1+.6*f;glow=.35*f;}}}
  }
  // Wachsen beim Pflanzen
  var gT=r.growT!=null?(now-r.growT)/800:1;
  var hid=gT<0;if(r.inner&&r.inner.visible===hid)r.inner.visible=!hid;
  if(gT<1){var gk=Math.max(0,gT);var el=gk<=0?0:1-Math.pow(2,-9*gk)*Math.cos(gk*Math.PI*2.4);sq*=Math.max(.02,el);sxz=.35+.65*Math.min(1,easeOut(gk*1.3));bx+=.12*Math.sin(gk*9)*(1-gk);}
  if(U){U.uB.value.set(bx,bz);U.uFl.value=fl;U.uSq.value=sq;U.uWv.value.set(wv,wph,wf);}
  else{mo.rotation.set(bz*.8,0,-bx*.8);}
  if(v){v.open=open;v.glowBoost=glow*.6;if(v.def.lobesOnly)glow=0;if(glow>0.01&&!v.flashT)v.mats.forEach(function(m){if(m.emissive&&m.userData.baseEm){m.emissive.copy(m.userData.baseEm).multiplyScalar(m.userData.baseEI);_gc.copy(GLOW_C).multiplyScalar(Math.min(1,glow)*.22);m.emissive.add(_gc);m.emissiveIntensity=1;}});
    else if(!v.flashT&&v._gl>0.01)v.mats.forEach(function(m){if(m.emissive&&m.userData.baseEm){m.emissive.copy(m.userData.baseEm);m.emissiveIntensity=m.userData.baseEI;}});v._gl=glow;}
  mo.position.set(px,py,pz);mo.rotation.y=ry;mo.scale.set(sxz,1,sxz);
}
var WILT_C=new THREE.Color(0x8a7650),GLOW_C=new THREE.Color(0xfff2c8),_gc=new THREE.Color();
function prepFade(r){var list=[];
  r.inner.traverse(function(o){if(!(o.isMesh||o.isPoints||o.isSprite))return;var ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(function(m){if(!m||list.indexOf(m)>=0)return;m.transparent=true;m.depthWrite=true;m.needsUpdate=true;if(m.color&&!m.userData.baseC)m.userData.baseC=m.color.clone();list.push(m);});o.castShadow=false;});
  r.fadeM=list;}

/* ---------- Partikel-Texturen ---------- */
var PETAL_TEX=null,LEAF_TEX=null;
function petalTex(){if(PETAL_TEX)return PETAL_TEX;var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');
  var g=x.createRadialGradient(32,26,2,32,32,30);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.75,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.beginPath();x.moveTo(32,6);x.bezierCurveTo(54,14,52,44,32,58);x.bezierCurveTo(12,44,10,14,32,6);x.fill();PETAL_TEX=new THREE.CanvasTexture(c);return PETAL_TEX;}
function leafTex(){if(LEAF_TEX)return LEAF_TEX;var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');
  x.fillStyle='#fff';x.beginPath();x.moveTo(8,56);x.bezierCurveTo(10,20,36,6,58,6);x.bezierCurveTo(56,30,40,54,8,56);x.fill();x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=2;x.beginPath();x.moveTo(10,54);x.lineTo(52,12);x.stroke();
  LEAF_TEX=new THREE.CanvasTexture(c);return LEAF_TEX;}
// sanfte Partikel (normale Mischung: Blüten/Blätter; additiv: Licht)
function softBurst(pos,cols,n,o){if(!E.ok)return;o=o||{};var p=new Float32Array(n*3),cl=new Float32Array(n*3),v=[],C=new THREE.Color();
  for(var i=0;i<n;i++){p[i*3]=pos.x+(Math.random()-.5)*(o.spread||.3);p[i*3+1]=pos.y+(Math.random()-.5)*(o.spread||.3);p[i*3+2]=pos.z+(Math.random()-.5)*(o.spread||.3);
    var a=Math.random()*Math.PI*2,u=Math.random()*2-1,sp=(o.speed||2)*(.4+Math.random()*.6),rr=Math.sqrt(1-u*u);v.push(Math.cos(a)*rr*sp+(o.dx||0),Math.abs(u)*sp*(o.upB||1)+(o.up||0),Math.sin(a)*rr*sp+(o.dz||0));
    C.set(cols[i%cols.length]);cl[i*3]=C.r;cl[i*3+1]=C.g;cl[i*3+2]=C.b;}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(cl,3));
  var m=new THREE.PointsMaterial({vertexColors:true,size:o.size||.16,map:o.tex==='leaf'?leafTex():o.tex==='dot'?dotTex:o.tex==='spark'?sparkTex():petalTex(),transparent:true,depthWrite:false,alphaTest:o.add?0:.05,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending});
  var pts=new THREE.Points(g,m);scene.add(pts);E.fx.push({pts:pts,v:v,life:o.life||900,s:performance.now(),grav:o.grav!==undefined?o.grav:-2,drag:o.drag||.985});}
// Geschoss entlang eines Bogens; resolve beim Einschlag
function projectile(from,to,o){o=o||{};return new Promise(function(res){if(!E.ok){res();return;}
  var n=o.n||8,objs=[],grp=new THREE.Group();scene.add(grp);var ms=o.ms||300,arc=o.arc==null?.6:o.arc;
  for(var i=0;i<n;i++){var ob;if(o.spine){ob=new THREE.Mesh(geo('spineG',function(){var g=new THREE.ConeGeometry(.018,.22,4);g.rotateX(Math.PI/2);return g;}),geo('spineM',function(){return new THREE.MeshStandardMaterial({color:0xf3ecd2,roughness:.5});}));}
    else{ob=new THREE.Sprite(new THREE.SpriteMaterial({map:o.tex==='leaf'?leafTex():o.tex==='dot'?dotTex:o.tex==='spark'?sparkTex():petalTex(),color:o.cols?o.cols[i%o.cols.length]:(o.col||0xffffff),transparent:true,depthWrite:false,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending,rotation:Math.random()*6}));var z=(o.size||.18)*(.7+Math.random()*.6);ob.scale.set(z,z,1);}
    grp.add(ob);objs.push({o:ob,j:new THREE.Vector3((Math.random()-.5),(Math.random()-.5),(Math.random()-.5)).multiplyScalar(o.jit==null?.35:o.jit),d:(o.stagger||0)*i/n*ms});}
  var t0=performance.now(),last=0,prev=new THREE.Vector3();var P=new THREE.Vector3();
  var tick=function(){var now=performance.now(),all=true;
    objs.forEach(function(q){var k=(now-t0-q.d)/ms;if(k<1)all=false;k=Math.max(0,Math.min(1,k));var ke=o.ease?o.ease(k):k;
      P.copy(from).lerp(to,ke);P.y+=Math.sin(ke*Math.PI)*arc;var wob=Math.sin(ke*Math.PI);P.addScaledVector(q.j,wob);
      if(o.spine){prev.copy(q.o.position);q.o.position.copy(P);if(k>0)q.o.lookAt(P.clone().add(to).sub(from));}else{q.o.position.copy(P);q.o.material.rotation+=.08;}
      q.o.visible=k>0&&k<1;});
    if(o.trail&&now-last>60){last=now;softBurst(objs[0].o.position,o.trailCols||[o.col||0xffffff],3,{speed:.4,life:420,size:(o.size||.18)*.7,grav:.3,tex:o.tex,add:o.add});}
    if(all){scene.remove(grp);objs.forEach(function(q){if(q.o.material&&!o.spine)q.o.material.dispose();});E.tweens.splice(E.tweens.indexOf(tw),1);res();}};
  var tw={s:t0,ms:1e9,fn:tick,ease:function(t){return t;},res:function(){},done:false};E.tweens.push(tw);
  setTimeout(function(){if(E.tweens.indexOf(tw)>=0){E.tweens.splice(E.tweens.indexOf(tw),1);scene.remove(grp);res();}},ms+1500);});}
// Ranke wächst zum Ziel und zieht sich zurück
function vineStrike(from,to,col,ms){return new Promise(function(res){if(!E.ok){res();return;}
  var mid=from.clone().lerp(to,.5);mid.y+=.9;var side=new THREE.Vector3().subVectors(to,from).cross(new THREE.Vector3(0,1,0)).normalize().multiplyScalar(.35);
  var pts=[from.clone(),from.clone().lerp(mid,.5).add(side),mid,mid.clone().lerp(to,.55).sub(side),to.clone()];
  var cv=new THREE.CatmullRomCurve3(pts);var seg=40,rad=6,g=new THREE.TubeGeometry(cv,seg,.05,rad,false);
  var pa=g.attributes.position;var cen=[];for(var i=0;i<=seg;i++)cen.push(cv.getPointAt(i/seg));
  for(i=0;i<=seg;i++){var tp=1-.75*(i/seg);for(var j=0;j<=rad;j++){var ix=i*(rad+1)+j;var c=cen[i];pa.setXYZ(ix,c.x+(pa.getX(ix)-c.x)*tp,c.y+(pa.getY(ix)-c.y)*tp,c.z+(pa.getZ(ix)-c.z)*tp);}}
  g.computeVertexNormals();
  var m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:col||0x5f9e4a,roughness:.6}));m.castShadow=true;scene.add(m);
  var total=g.index.count;var per=total/seg;g.setDrawRange(0,0);
  var leafPts=[];for(var q=1;q<6;q++){var lp=cv.getPointAt(q/6);leafPts.push(lp);}
  tween(ms||170,function(k){g.setDrawRange(0,Math.floor(seg*k)*per);},easeOut).then(function(){
    softBurst(to,[0x8fcf68,0xc8eaa0,0xffffff],10,{speed:1.6,life:600,size:.15,tex:'leaf',grav:-1.5});res();
    setTimeout(function(){tween(260,function(k){var s0=Math.floor(seg*k);g.setDrawRange(0,Math.floor(seg*(1-k))*per);if(k>=1){scene.remove(m);g.dispose();m.material.dispose();}},easeIn);},120);});});}
function beamStrike(from,to,col,ms){return new Promise(function(res){if(!E.ok){res();return;}
  var d=to.clone().sub(from),L=d.length();var m=new THREE.Mesh(geo('beamC',function(){var g=new THREE.CylinderGeometry(.5,.5,1,14,1,true);g.translate(0,.5,0);g.rotateX(Math.PI/2);return g;}),
    new THREE.MeshBasicMaterial({map:dotTex,color:col||0xfff0a0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  m.position.copy(from);m.lookAt(to);scene.add(m);
  tween(ms||160,function(k){m.scale.set(.25*(1-k*.3),.25*(1-k*.3),L*k);m.material.opacity=.85*k;},easeOut).then(function(){res();
    tween(360,function(k){m.material.opacity=.85*(1-k);m.scale.x=m.scale.y=.18*(1+k);if(k>=1){scene.remove(m);m.material.dispose();}});});});}

/* ---------- Angriff (verwurzelt: Pflanze biegt sich, Wirkung fliegt zum Ziel) ---------- */
function headPos(r,f){var v=r.vis;var hgt=r.h*(f||.82);var o=V3(0,hgt/((r.sc||1)),0);if(v&&v.U){bendAt(v.U,v.H,v.P,0,hgt/(r.sc||1),0,o);}r.mo.updateMatrixWorld(true);return r.inner.localToWorld(o);}
async function fxLunge(uid,target){
  var r=E.mons[uid];if(!r||!E.ok){await sleep(300);return;}
  var tr=target.hero!==undefined?null:E.mons[target.uid];
  var tp=target.hero!==undefined?V3(E.heroes[target.hero].g.position.x,1.05,E.heroes[target.hero].g.position.z):(tr?monMid(tr):null);
  if(!tp){await sleep(300);return;}
  r.lock=true;var def=(r.vis&&r.vis.def)||{};var kind=def.atk||'lash',p=ATK_P[kind]||ATK_P.lash;
  var sp=r.g.position.clone();var dir=tp.clone().sub(sp);dir.y=0;var face=Math.atan2(dir.x,dir.z);var baseRot=r.body.rotation.y;
  var ry=r.body.rotation.y,dl=Math.hypot(dir.x,dir.z)||1,wx=dir.x/dl,wz=dir.z/dl;
  monMotion(uid,'atk',{dx:wx*Math.cos(ry)-wz*Math.sin(ry),dz:wx*Math.sin(ry)+wz*Math.cos(ry)});
  if(kind==='dive'){ // Ahornsamen: kreiselt hoch und stürzt sich aufs Ziel
    var stop=dir.length()>.01?Math.max(0,1-.9/dir.length()):0;
    if(r.vis)r.vis.spinBoost=10;
    await tween(220,function(t){r.g.position.y=.35*t;},easeOut);
    await tween(230,function(t){r.g.position.copy(sp).addScaledVector(dir,stop*t);r.g.position.y=.35+Math.sin(t*Math.PI)*.4;},easeIn);
    softBurst(tp,[0xf7c27a,0xd8603e,0xffe6b8],14,{speed:2.2,life:650,size:.16,tex:'leaf',grav:-2});flashSprite(tp,0xffe2b0,1.6,300);
    var back=r.g.position.clone();
    tween(420,function(t){r.g.position.copy(back).lerp(V3(sp.x,0,sp.z),t);r.g.position.y=back.y*(1-t);if(t>=1){r.lock=false;if(r.vis)r.vis.spinBoost=0;}},easeInOut);
    return;}
  await sleep(p.W);
  var hp=headPos(r);
  var impact;
  switch(kind){
    case 'lash':impact=vineStrike(headPos(r,.55),tp,def.vine||0x5c8f4a,170);break;
    case 'snap':impact=vineStrike(headPos(r,.75),tp,0x5fae48,150).then(function(){flashSprite(tp,0xff9fae,1.4,260);softBurst(tp,[0xff8f9b,0xd9f2a2],10,{speed:1.8,life:500,size:.14,tex:'leaf'});});break;
    case 'beam':flashSprite(hp,0xfff2a8,2.2,320);impact=beamStrike(hp,tp,0xfff0a0,170);break;
    case 'puff':softBurst(hp,[0xf1ead2,0xe6d6ff,0xffffff],14,{speed:.9,life:900,size:.3,tex:'dot',grav:.2});impact=projectile(hp,tp,{n:12,ms:340,arc:.5,cols:[0xf6efd8,0xe9dcff],size:.3,tex:'dot',jit:.4,stagger:.4,trail:true,trailCols:[0xf6efd8]});break;
    case 'spines':impact=projectile(hp,tp,{n:7,ms:220,arc:.15,spine:true,jit:.25,stagger:.3});break;
    case 'seeds':impact=projectile(hp,tp,{n:12,ms:380,arc:.7,col:0xffffff,size:.2,tex:'dot',jit:.4,stagger:.5,trail:true});break;
    case 'squirt':impact=projectile(hp,tp,{n:11,ms:300,arc:.8,cols:[0xa8e8b0,0xd8ffe0],size:.22,tex:'dot',jit:.15,stagger:.35});break;
    case 'scent':impact=projectile(hp,tp,{n:18,ms:440,arc:.6,cols:[0xb69cf0,0xd8c8ff,0x9f86e0],size:.24,tex:'petal',jit:.45,stagger:.5,trail:true,trailCols:[0xd8c8ff]});break;
    case 'petals':impact=projectile(hp,tp,{n:12,ms:400,arc:.7,cols:def.halo?[0xfff3d0,0xffe2a8]:[0xffa8c8,0xffd0e0],size:.25,tex:'petal',jit:.45,stagger:.45,trail:true});break;
    case 'flare':flashSprite(hp,0xffb070,2.6,360);impact=projectile(hp,tp,{n:12,ms:300,arc:.4,cols:[0xffb070,0xffd9a0,0xff8a5c],size:.24,tex:'petal',add:true,jit:.3,stagger:.3,trail:true,trailCols:[0xffc890]});break;
    case 'swing':impact=projectile(hp,tp,{n:12,ms:320,arc:.4,cols:[0x7fbf5a,0xa6d77d,0x5f9e48],size:.2,tex:'leaf',jit:.5,stagger:.35});break;
    case 'burst':impact=projectile(hp,tp,{n:12,ms:340,arc:.9,cols:[0xfff1c8,0xf4d79a],size:.2,tex:'petal',jit:.3,stagger:.4});break;
    case 'stars':impact=projectile(hp,tp,{n:12,ms:400,arc:.75,cols:[0xffffff,0xf2f6ee,0xfff6d8],size:.26,tex:'spark',add:false,jit:.45,stagger:.45,trail:true,trailCols:[0xffffff]});break;
    case 'nectar':impact=projectile(hp,tp,{n:12,ms:320,arc:.85,cols:[0xffc84a,0xc9e86a,0xffa860],size:.22,tex:'dot',jit:.18,stagger:.35}).then(function(){softBurst(tp,[0xffc84a,0xe8f0a0],12,{speed:1.6,up:.6,life:600,size:.14,tex:'dot',grav:-3});});break;
    case 'ripple':impact=projectile(hp,tp,{n:12,ms:420,arc:.7,cols:[0x8fb8ff,0xd8e8ff,0x5f8cff],size:.24,tex:'petal',jit:.4,stagger:.45,trail:true,trailCols:[0xbcd4ff]}).then(function(){shockwave(V3(tp.x,.12,tp.z),0x8fb8ff,1.3,600);});break;
    case 'moon':flashSprite(hp,0xd8ecff,2.4,360);impact=beamStrike(hp,tp,0xcfe4ff,190).then(function(){softBurst(tp,[0xffffff,0xd8ecff],12,{speed:1.3,up:.5,life:900,size:.16,tex:'petal',grav:-.6});});break;
    case 'prism':flashSprite(hp,0xe0d0ff,2.6,380);impact=Promise.all([beamStrike(hp,tp,0xc8a8ff,180),beamStrike(hp.clone().add(V3(.08,.06,0)),tp,0x9fd8ff,200),beamStrike(hp.clone().add(V3(-.08,.04,0)),tp,0xffb8e8,220)]).then(function(){softBurst(tp,[0xd8bcff,0xbfe8ff,0xffd0f0],16,{speed:1.8,life:700,size:.14,tex:'spark',add:true,grav:0});});break;
    case 'resin':impact=projectile(hp,tp,{n:12,ms:340,arc:.45,cols:[0xc8141e,0xff5040,0x7fbf5a],size:.2,tex:'dot',jit:.4,stagger:.35,trail:true,trailCols:[0xff4a3a],add:false});break;
    case 'quake':impact=projectile(hp,tp,{n:14,ms:380,arc:.5,cols:[0x7fbf5a,0xa6d77d,0xffd76a],size:.22,tex:'leaf',jit:.5,stagger:.35}).then(function(){shockwave(V3(tp.x,.1,tp.z),0xffd060,1.8,650);softBurst(V3(tp.x,.2,tp.z),[0xb39363,0xd8c49a],14,{speed:1.6,up:1.2,life:700,size:.13,tex:'dot',grav:-3});E.shake=Math.max(E.shake,.28);});break;
    case 'bloomblast':softBurst(hp,[0xffd76a,0xb83a5a,0xfff0c0],18,{speed:1.1,up:.5,life:1000,size:.3,tex:'dot',grav:.2});impact=projectile(hp,tp,{n:18,ms:420,arc:.8,cols:[0xffd870,0xd0506a,0xfff0c0],size:.3,tex:'petal',jit:.5,stagger:.45,trail:true,trailCols:[0xffe090]}).then(function(){shockwave(V3(tp.x,.1,tp.z),0xffc050,1.7,650);flashSprite(tp,0xffe0a0,2.2,320);});break;
    default:impact=projectile(hp,tp,{n:8,ms:300});}
  await impact;
  flashSprite(tp,0xffffff,1.5,260);
  if(kind!=='lash'&&kind!=='snap')softBurst(tp,[0xffffff,0xfff0d0],8,{speed:1.6,life:450,size:.12,tex:'dot',add:true,grav:0});
  E.shake=Math.max(E.shake,kind==='swing'||kind==='resin'?.2:.12);
  setTimeout(function(){r.lock=false;},Math.max(0,p.F-200));
}

/* ---------- Spawn / Tod / Treffer ---------- */
function fxSummon(r){
  var pos=r.g.position.clone();var col=PCOL[r.owner];
  r.growT=performance.now();
  var rip=new THREE.Mesh(geo('ripple',function(){return new THREE.RingGeometry(.55,.7,40);}),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}));
  rip.rotation.x=-Math.PI/2;rip.position.set(pos.x,.085,pos.z);scene.add(rip);
  tween(900,function(t){var s=.4+t*1.1;rip.scale.set(s,s,s);rip.material.opacity=.7*(1-t);if(t>=1){scene.remove(rip);rip.material.dispose();}},easeOut);
  softBurst(V3(pos.x,.12,pos.z),[0xa58a6a,0xc2a882,0x8fcf68],12,{speed:1.1,up:1.2,life:700,size:.11,tex:'dot',grav:-3,spread:.5});
  setTimeout(function(){softBurst(V3(pos.x,.6,pos.z),[0xa6d77d,0xd8f0b0,0xffffff],10,{speed:.8,up:.9,life:1100,size:.15,tex:'leaf',grav:-.5});},250);
  try{fxRareEntrance(r);}catch(err){console.warn(err);}
}
function fxDeath(uid){
  var r=E.mons[uid];if(!r||!E.ok)return;
  r.dying=true;r.bub.visible=false;r.lbl.style.opacity=0;r.zz.style.opacity=0;
  var c=monMid(r);
  softBurst(c,[0xc9a876,0xb39363,0xd8c49a,0x9fbf6a],18,{speed:1.1,up:.2,life:1500,size:.17,tex:'leaf',grav:-1.1,drag:.97});
  setTimeout(function(){softBurst(V3(c.x,.15,c.z),[0xa58a6a,0xc2a882],10,{speed:.8,life:700,size:.1,tex:'dot',grav:-2});},700);
  if(r.vis)r.vis.flash(0xfff0d0,400);
  try{prepFade(r);}catch(err){r.fadeM=null;}
  r.act={n:'die',s:performance.now(),o:{side:Math.random()<.5?-1:1}};
  tween(1200,function(t){if(t>=1)removeMon(uid);});
}
function petalWisp(pos){softBurst(pos,[0xffffff,0xfff4c8],8,{speed:.5,up:1.4,life:1300,size:.14,tex:'dot',add:true,grav:.6});}

/* ---------- Kreuzungs-Kranz ---------- */
function addCrownAura(g,inner,info,col){
  var a={};var wg=geo('wreath'+col,function(){return wreathGeo(col);});
  var ring=new THREE.Mesh(wg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,side:THREE.DoubleSide}));ring.castShadow=false;g.add(ring);a.wreath=ring;
  var disc=new THREE.Mesh(geo('auraPlane',function(){return new THREE.PlaneGeometry(2.0,2.0);}),new THREE.MeshBasicMaterial({map:dotTex,color:col,transparent:true,opacity:.3,depthWrite:false,side:2}));
  disc.rotation.x=-Math.PI/2;disc.position.y=.085;g.add(disc);a.ring=disc;
  var glow=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:col,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(1.8,2.2,1);glow.position.y=info.h*.55;g.add(glow);a.glow=glow;
  var n=12,p=new Float32Array(n*3);for(var i=0;i<n;i++){var an=i/n*Math.PI*2;p[i*3]=Math.cos(an)*.8;p[i*3+1]=.25+(i%4)*info.h*.2;p[i*3+2]=Math.sin(an)*.8;}
  var og=new THREE.BufferGeometry();og.setAttribute('position',new THREE.BufferAttribute(p,3));
  var orb=new THREE.Points(og,new THREE.PointsMaterial({color:0xffffff,size:.12,map:dotTex,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));g.add(orb);a.orb=orb;
  return a;
}

function fxHeroDeath(pi){
  if(!E.ok)return;var h=E.heroes[pi];h.dead=true;
  var c=V3(h.g.position.x,1.0,h.g.position.z);
  softBurst(c,[PCOL[pi],0xffffff],50,{speed:3.5,up:1.5,life:1700,size:.2,tex:'petal',grav:-1.5});softBurst(c,[0xffffff],24,{speed:2.4,up:2,life:1200,size:.15,tex:'dot',add:true,grav:-.5});
  flashSprite(c,0xffffff,5,600);E.shake=.45;
  tween(900,function(t){h.cm.opacity=1-t;if(h.om){h.om.opacity=1-t;h.om.emissiveIntensity=.9*(1-t);}if(h.rgm){h.rgm.opacity=1-t*.7;}h.cr.position.y=-.25*t;h.cr.scale.setScalar(1-.3*t);h.gl.material.opacity=.2*(1-t);if(t>=1){h.cr.visible=false;h.gl.visible=false;h.cm.opacity=1;if(h.om)h.om.opacity=1;if(h.rgm)h.rgm.opacity=1;h.cr.position.y=0;h.cr.scale.setScalar(1);}},easeInOut);
}

/* ---------- Kartenbilder ---------- */
function renderAllCardArt(){
  if(!E.ok)return;var ids=MONSTERS.map(function(m){return m.id;});
  ids.forEach(function(id){try{var u=renderCardArt(id);if(u)setCardArt(id,u,true);}catch(err){console.warn(err);}});
  try{fillMonsterList();if(typeof G!=='undefined'&&G)render();}catch(e){}
}

/* ================= v14: Seltene Pflanzen (prozedural, ohne Gesichter) + Seltenheits-Effekte ================= */
PB.prototype.addPB=function(o,p,r,s){var m=new THREE.Matrix4().compose(new THREE.Vector3(p?p[0]:0,p?p[1]:0,p?p[2]:0),new THREE.Quaternion().setFromEuler(new THREE.Euler(r?r[0]:0,r?r[1]:0,r?r[2]:0,'YXZ')),new THREE.Vector3(s?s[0]:1,s?s[1]:1,s?s[2]:1));
  var self=this;o.list.forEach(function(g){var q=g.clone();q.applyMatrix4(m);self.list.push(q);});return this;};
function aimRot(dx,dy,dz){var v=new THREE.Vector3(dx,dy,dz).normalize();var e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v),'YXZ');return [e.x,e.y,e.z];}
// Rotationskörper; rf = Rüschen {n,a,ya}
function latheGeo(prof,seg,rf){var g=new THREE.LatheGeometry(prof.map(function(p){return new THREE.Vector2(p[0],p[1]);}),seg||14);
  if(rf){var pa=g.attributes.position,ymax=prof[prof.length-1][1]||1;for(var i=0;i<pa.count;i++){var x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),ph=Math.atan2(x,z),yn=Math.max(0,y/ymax),w=Math.sin(rf.n*ph)*yn*yn;
    var k=1+rf.a*w;pa.setXYZ(i,x*k,y+(rf.ya||0)*Math.sin(rf.n*ph+1.3)*yn*yn,z*k);}}
  g.computeVertexNormals();return g;}
function ringPts(n,f){for(var i=0;i<n;i++)f(i/n*Math.PI*2,i);}

/* ---- Edelweiß: filzige Rosette, weiße Sternblüten ---- */
function edelHead(s){var h=new PB();
  ringPts(10,function(a,i){h.add(leafGeo(.17*s*(i%2?.85:1),.048*s,{p:.55,q:.8,cup:.18,nu:5,nv:2}),0xdfe5da,0xffffff,[0,0,0],[1.36,a,0]);});
  ringPts(7,function(a){h.add(leafGeo(.1*s,.035*s,{p:.55,q:.8,cup:.2,nu:4,nv:1}),0xe9eee4,0xffffff,[0,.012*s,0],[1.05,a+.22,0]);});
  [[0,0],[.028,0],[-.028,0],[0,.028],[0,-.028],[.02,.02],[-.02,-.02]].forEach(function(c,k){h.add(new THREE.IcosahedronGeometry(.022*s,0),0xd9c070,0xfff0b0,[c[0]*s,.03*s+(k?0:.008*s),c[1]*s]);});
  return h;}
function buildEdelweiss(pb,pg){
  ringPts(13,function(a,i){pb.add(leafGeo(.32*(i%2?.8:1),.065,{cup:.35,bend:-.12,nu:7,nv:2}),0x86a083,0xd3dfcc,[0,.02,0],[1.18+.1*(i%3),a,0]);});
  var st=[[0,.62,.04,1.4],[.2,.5,.07,1.2],[-.19,.44,-.03,1.12]];
  ringPts(8,function(a,i){pb.add(leafGeo(.2,.045,{cup:.4,bend:-.1,nu:6,nv:2}),0x8fa98c,0xdbe6d4,[0,.03,0],[.75+.1*(i%2),a+.4,0]);});
  st.forEach(function(q){var top=[q[0],q[1],q[2]];pb.add(tubeGeo([[q[0]*.2,0,q[2]*.2],[q[0]*.7,q[1]*.5,q[2]*.6],top],.024,.016,8,5),0x95ab8f,0xc6d4bf);
    pb.add(leafGeo(.13,.03,{nu:4,nv:1,cup:.3}),0x9fb59a,0xd8e3d2,[q[0]*.6,q[1]*.45,q[2]*.5],[1.0,Math.atan2(q[0],q[2]+.01)+.8,0]);
    pg.addPB(edelHead(q[3]),top,[.42,0,0]);});
}
/* ---- Kannenpflanze: Kannen mit Deckel an Ranken ---- */
function pitcher(s){var p=new PB();var prof=[[0,0],[.05,.004],[.085,.04],[.1,.1],[.097,.18],[.078,.25],[.07,.29],[.086,.32]].map(function(q){return [q[0]*s,q[1]*s];});
  p.add(latheGeo(prof,14),0x86b84a,0xc8384c);p.add(flipGeo(latheGeo(prof.map(function(q){return [q[0]*.9,q[1]+.004*s];}),14)),0x4a0c1a,0x8a2234);
  p.add(new THREE.TorusGeometry(.083*s,.014*s,5,16),0xe25466,0xff9a98,[0,.32*s,0],[Math.PI/2,0,0]);
  p.add(leafGeo(.15*s,.085*s,{cup:.3,nu:5,nv:2,p:.6}),0x8c2638,0xd8606a,[0,.33*s,-.075*s],[-.75,0,0]);
  // Streifen (Adern)
  ringPts(5,function(a){p.add(new THREE.CylinderGeometry(.004*s,.004*s,.22*s,3),0x5f9a3a,0x9a2a3a,[Math.sin(a)*.1*s,.13*s,Math.cos(a)*.1*s],[0,0,0]);});
  return p;}
function buildKanne(pb,pg){
  ringPts(7,function(a,i){pb.add(leafGeo(.4,.1,{cup:.3,bend:-.2,tipW:.3}),0x4a8a3a,0x9fd062,[0,.02,0],[1.1+.12*(i%2),a,0]);});
  pb.add(tubeGeo([[0,0,0],[.03,.35,0],[-.02,.62,.02],[0,.8,0]],.03,.018,10,6),0x5b9a44,0x8cc565);
  [[.55,.3],[.7,2.4],[.78,4.3]].forEach(function(q){pb.add(leafGeo(.26,.07,{cup:.3,bend:-.15}),0x4f9a40,0x9cd067,[0,q[0],0],[1.0,q[1],0]);});
  var P=[[.33,.12,.16,1.25,[.12,.3,.05]],[-.34,.3,.06,1.0,[-.06,.5,0]],[.1,.66,-.16,.82,[.02,.75,-.02]],[-.12,.06,.3,.75,[0,.12,.12]]];
  P.forEach(function(q){var top=[q[0],q[1]+.32*q[3]+.02,q[2]];pb.add(tubeGeo([q[4],[(q[4][0]+q[0])*.5,q[4][1]+.16,(q[4][2]+q[2])*.5],[q[0]*1.05,top[1]+.06,q[2]*1.05],[q[0],top[1]-.02,q[2]]],.008,.006,10,4),0x6aa84a,0x86b84a);
    pb.addPB(pitcher(q[3]),[q[0],q[1],q[2]],[0,Math.atan2(q[0],q[2])+Math.PI,0]);
    pg.add(new THREE.CircleGeometry(.07*q[3],10),0xffc85a,0xffe9a0,[q[0],q[1]+.27*q[3],q[2]],[-Math.PI/2,0,0]);});
}
/* ---- Blauer Lotus: Teich, spitze blaue Blüte ---- */
function lotusFlower(s){var f=new PB();
  ringPts(11,function(a){f.add(leafGeo(.3*s,.075*s,{p:.62,q:.9,cup:.35,nu:7,nv:2}),0xf2f6ff,0x3f6fe0,[0,0,0],[1.02,a,0]);});
  ringPts(9,function(a){f.add(leafGeo(.25*s,.065*s,{p:.62,q:.9,cup:.4,nu:6,nv:2}),0xffffff,0x5a86f2,[0,.01*s,0],[.62,a+.3,0]);});
  ringPts(6,function(a){f.add(leafGeo(.17*s,.05*s,{p:.62,q:.9,cup:.45,nu:5,nv:2}),0xffffff,0x86a8ff,[0,.02*s,0],[.28,a,0]);});
  ringPts(14,function(a){f.add(new THREE.CylinderGeometry(.004*s,.006*s,.07*s,3),0xffd04a,0xfff0a0,[Math.sin(a)*.045*s,.05*s,Math.cos(a)*.045*s],[.35,a,0]);});
  f.add(new THREE.CylinderGeometry(.035*s,.03*s,.04*s,10),0xe8d070,0xfff1b0,[0,.04*s,0]);return f;}
function buildBlauLotus(pb,pg){
  pb.add(new THREE.CylinderGeometry(.64,.68,.05,30),0x5aa6d8,0x9cd8f2,[0,0,0]);
  pb.add(new THREE.TorusGeometry(.66,.035,5,30),0x9a9a86,0xc9c3ae,[0,.02,0],[Math.PI/2,0,0]);
  [[.36,.16,.0,.22],[-.32,.24,1.8,.2],[.06,-.38,3.6,.18],[-.1,.36,5.0,.14]].forEach(function(q){pb.add(new THREE.CircleGeometry(q[3],14,.35,Math.PI*2-.7),0x4f9a4a,0x7cc46b,[q[0],.032,q[1]],[-Math.PI/2,q[2],0]);});
  pb.add(tubeGeo([[0,0,0],[.03,.25,.02],[0,.5,.04]],.022,.018,8,5),0x4f8a46,0x7ab65a);
  pg.addPB(lotusFlower(1),[0,.5,.04],[.32,0,0]);
  pb.add(tubeGeo([[-.2,0,-.1],[-.26,.18,-.08],[-.28,.34,-.06]],.016,.013,8,5),0x4f8a46,0x7ab65a);
  var bud=latheGeo([[0,0],[.045,.03],[.055,.08],[.04,.14],[0,.2]],8);pg.add(bud,0xe8f0ff,0x4a78e8,[-.28,.33,-.06],[.2,0,.15]);
  pg.addPB(lotusFlower(.45),[.3,.03,.2],[0,0,0]);
}
/* ---- Mondblume: Rankende Winde, leuchtende weiße Trichterblüten ---- */
function trumpet(s){var t=new PB();t.add(latheGeo([[.012,0],[.018,.1],[.032,.17],[.07,.215],[.14,.238],[.165,.244]].map(function(q){return [q[0]*s,q[1]*s];}),15,{n:5,a:.08,ya:.012*s}),0xbfe8c8,0xffffff);
  ringPts(5,function(a){t.add(leafGeo(.15*s,.012*s,{nu:4,nv:1}),0xeaf8d8,0xf6fff0,[Math.sin(a)*.03*s,.1*s,Math.cos(a)*.03*s],[aimRot(Math.sin(a)*.6,.4,Math.cos(a)*.6)[0],a,0]);});
  t.add(new THREE.IcosahedronGeometry(.02*s,0),0xfff4b0,null,[0,.17*s,0]);return t;}
function buildMondblume(pb,pg){
  ringPts(5,function(a){pb.add(leafGeo(.24,.13,{p:.42,q:1.1,cup:.3,bend:-.1}),0x2f6a3a,0x5f9e4e,[0,.02,0],[1.2,a,0]);});
  pb.add(tubeGeo([[0,0,0],[0,.4,0],[0,.85,0],[0,1.05,0]],.018,.012,6,5),0x7a6a52,0x9a8a6a); // Stab
  for(var v=0;v<2;v++){var pts=[];for(var i=0;i<=14;i++){var u=i/14,an=u*Math.PI*4.2+v*Math.PI;pts.push([Math.cos(an)*.075,u*1.02,Math.sin(an)*.075]);}
    pb.add(tubeGeo(pts,.016,.01,40,5),0x3f7a3a,0x6aa84f);}
  [[.12,1,.0],[.22,3.6,1],[.32,2.2,1],[.4,5.6,0],[.46,4.0,0],[.55,2.6,1],[.6,.9,1],[.68,4.8,1],[.72,3.2,0],[.8,1.5,0],[.84,5.3,1],[.93,1.9,0]].forEach(function(q){var y=q[0]*1.02,an=q[1];
    pb.add(leafGeo(.22,.14,{p:.42,q:1.1,cup:.3,bend:-.08,nu:7,nv:2}),0x2f6e3a,0x62a452,[Math.cos(an)*.08,y,Math.sin(an)*.08],[1.05,Math.atan2(Math.cos(an),Math.sin(an)),0]);});
  pg.addPB(trumpet(1.3),[0,1.04,.03],aimRot(0,1,.5));
  pg.addPB(trumpet(1.2),[.12,.74,.06],aimRot(.75,.35,.6));
  pg.addPB(trumpet(1.15),[-.12,.5,.06],aimRot(-.75,.3,.6));
  pg.add(latheGeo([[0,0],[.02,.03],[.025,.08],[.012,.14],[0,.17]],6,{n:5,a:.2}),0xd6f0dc,0xffffff,[.09,.3,-.04],aimRot(.7,.6,-.2));
}
/* ---- Kristallorchidee: Kristallsplitter + gläserne Blüten am Bogen ---- */
function orchidFlower(s){var f=new PB();
  [0,2.15,-2.15].forEach(function(a){f.add(leafGeo(.14*s,.036*s,{p:.6,q:.8,cup:.15,nu:5,nv:1}),0xe0d4ff,0xffffff,[0,0,0],[0,0,a]);});
  [1.15,-1.15].forEach(function(a){f.add(leafGeo(.125*s,.07*s,{p:.55,q:.9,cup:.2,nu:5,nv:2}),0xd8c8ff,0xfaf6ff,[0,0,.006*s],[0,0,a]);});
  f.add(leafGeo(.11*s,.065*s,{p:.45,q:1,cup:.6,nu:5,nv:2}),0xa070f0,0xffc8f0,[0,-.01*s,.012*s],[-.7,0,Math.PI]);
  f.add(new THREE.IcosahedronGeometry(.018*s,0),0xfff2b0,null,[0,.01*s,.02*s],null,[1,1.4,1]);return f;}
function crystal(pb,p,r,s,c0,c1){pb.add(new THREE.OctahedronGeometry(.07,0),c0,c1,p,r,[s,s*3,s]);}
function buildOrchidee(pb,pg){
  ringPts(5,function(a,i){pb.add(leafGeo(.46-.06*(i%2),.13,{cup:.25,bend:.12,tipW:.45}),0x2c5f48,0x6fae84,[0,.06,0],[1.3-.12*(i%2),a+.4,0]);});
  pb.add(new THREE.DodecahedronGeometry(.16,0),0x7a7a94,0xa6a6c0,[0,.03,0],null,[1.2,.45,1.1]);
  [[.17,.02,.1,.4,.3,.9],[-.18,.02,.06,-.35,.2,.75],[.04,.02,-.18,.1,-.35,.7],[-.07,.02,.17,-.15,.4,.6],[.22,.02,-.1,.5,-.3,.55]].forEach(function(q){crystal(pg,[q[0],q[1]+.05,q[2]],[q[4],0,q[3]],q[5],0x8f6ee6,0xeee6ff);});
  var sp=[[0,.05,0],[.02,.45,-.02],[.06,.85,0],[.2,1.08,.06],[.36,1.1,.1]];pb.add(tubeGeo(sp,.02,.012,16,5),0x5a7a52,0x8a7aa8);
  var cv=new THREE.CatmullRomCurve3(sp.map(function(p){return new THREE.Vector3(p[0],p[1],p[2]);}));
  [[.62,1],[.75,1],[.87,.9],[.98,.75]].forEach(function(q,k){var P=cv.getPointAt(q[0]);pg.addPB(orchidFlower(q[1]*1.25),[P.x,P.y-.04,P.z+.04],[.15,(k%2?.35:-.25),0]);});
  pg.add(latheGeo([[0,0],[.025,.02],[.02,.05],[0,.07]],6),0xd8c8ff,0xffffff,[.37,1.06,.1]);
}
/* ---- Drachenbaum: verzweigter Stamm, Schopf-Rosetten, Drachenblut-Harz ---- */
function buildDrachenbaum(pb,pg){
  pb.add(latheGeo([[.0,0],[.19,0],[.15,.05],[.11,.14],[.1,.2]],10),0x857a68,0x9c8f7c);
  pb.add(tubeGeo([[0,.05,0],[.02,.4,0],[0,.72,0]],.13,.1,8,8),0x968a76,0xb4a790);
  var tips=[];
  ringPts(4,function(a,i){var c=Math.cos(a+.4),s=Math.sin(a+.4);var E=[c*.26,1.0+.05*(i%2),s*.26];
    pb.add(tubeGeo([[0,.68,0],[c*.1,.84,s*.1],E],.065,.045,8,6),0x9c8f7c,0xb8ab95);
    [-.6,0,.6].forEach(function(d){var c2=Math.cos(a+.4+d),s2=Math.sin(a+.4+d);var T=[E[0]+c2*.18,E[1]+.2+.04*(i%2),E[2]+s2*.18];
      pb.add(tubeGeo([E,[E[0]+c2*.08,E[1]+.12,E[2]+s2*.08],T],.042,.03,6,5),0xa49784,0xbcaf98);tips.push(T);});});
  tips.forEach(function(T,k){var n=15;for(var j=0;j<n;j++){var a=j/n*Math.PI*2+k;var tilt=.3+.95*((j*7)%n)/n;
      pb.add(leafGeo(.34-.06*tilt,.028,{p:.5,q:.6,nu:5,nv:1,bend:-.05*tilt}),0x2d6a4a,0x82c06e,T,[tilt,a,0]);}});
  [[.09,.32,.05,.03],[-.07,.5,.07,.025],[.05,.6,-.08,.022],[.1,.18,-.03,.02]].forEach(function(q){pg.add(new THREE.IcosahedronGeometry(q[3],1),0xa8101c,0xff4a3a,[q[0],q[1],q[2]],null,[1,1.5,1]);});
  [[.24,.02,.1],[-.2,.02,.16],[.05,.02,-.24]].forEach(function(q,i){pb.add(new THREE.DodecahedronGeometry(.07+.02*i,0),0x8a8a8a,0xb0aca0,q,[i,i*2,0],[1,.6,1]);});
}
/* ---- Baobab: Flaschenstamm, kleine Krone, leuchtende Blüten ---- */
function buildBaobab(pb,pg){
  pb.add(latheGeo([[0,0],[.34,0],[.37,.04],[.38,.2],[.38,.42],[.34,.66],[.25,.86],[.18,.97],[.155,1.02],[0,1.02]],20,{n:9,a:.035}),0x9e7f6d,0xc7a994);
  ringPts(6,function(a,i){pb.add(new THREE.SphereGeometry(.1,7,5),0x8f7362,0xa88a76,[Math.sin(a)*.36,.02,Math.cos(a)*.36],[0,a,0],[1.4,.5,.8]);});
  var tips=[];
  ringPts(7,function(a,i){var c=Math.sin(a+.2),s=Math.cos(a+.2),L=.42+.1*(i%3);var E=[c*L,1.22+.08*(i%2),s*L];
    pb.add(tubeGeo([[c*.05,.96,s*.05],[c*.2,1.08,s*.2],E],.065,.024,8,5),0xa88a76,0xc2a48e);tips.push(E);
    if(i%2===0){var F=[c*L*.55-s*.18,1.32,s*L*.55+c*.18];pb.add(tubeGeo([[c*.2,1.08,s*.2],[c*.28-s*.08,1.2,s*.28+c*.08],F],.03,.016,6,4),0xa88a76,0xc2a48e);tips.push(F);}});
  tips.forEach(function(T,k){[[0,.05,0,.17],[.09,.0,.06,.12],[-.08,.02,-.05,.11]].forEach(function(o){pb.add(new THREE.IcosahedronGeometry(o[3],1),0x4a8a3c,0x9fd06a,[T[0]+o[0],T[1]+o[1],T[2]+o[2]],[k,k*1.3,0],[1,.55,1]);});
    if(k%2===0){var hp=[T[0]*.85,T[1]-.14,T[2]*.85];pg.add(tubeGeo([[T[0]*.88,T[1]-.02,T[2]*.88],hp],.006,.006,3,3),0x8a7a5a,null);
      var fl=latheGeo([[0,0],[.03,.01],[.05,.04],[.065,.07],[.06,.075]],8,{n:5,a:.25});pg.add(fl,0xfff2d0,0xffffff,hp,[Math.PI,0,0]);
      pg.add(new THREE.IcosahedronGeometry(.02,0),0xffd86a,null,[hp[0],hp[1]-.075,hp[2]]);}
    else{pg.add(latheGeo([[0,0],[.03,.02],[.035,.07],[.02,.11],[0,.12]],7),0xc89a3a,0xffe08a,[T[0]*.9,T[1]-.2,T[2]*.9]);}});
}
/* ---- Titanwurz: riesiger Kolben in gerüschtem Hochblatt ---- */
function buildTitanwurz(pb,pg){
  pb.add(new THREE.SphereGeometry(.26,12,7),0x7a5a3e,0x9a7a56,[0,.02,0],null,[1,.35,1]);
  ringPts(5,function(a,i){pb.add(leafGeo(.42,.16,{cup:.35,bend:-.25,tipW:.3}),0x2f6a3a,0x7cbf5a,[0,.03,0],[1.32,a+.6,0]);});
  var prof=[[.12,0],[.2,.06],[.27,.16],[.33,.3],[.4,.44],[.5,.56],[.62,.66],[.7,.72]];
  pb.add(latheGeo(prof,32,{n:8,a:.17,ya:.07}),0x7fa65a,0x9a4a62,[0,.04,0]);
  pb.add(flipGeo(latheGeo(prof.map(function(q){return [q[0]*.96,q[1]+.012];}),32,{n:8,a:.17,ya:.07})),0x5a0c26,0xc2405e,[0,.04,0]);
  ringPts(8,function(a){pb.add(new THREE.CylinderGeometry(.008,.006,.5,3),0x8fb06a,0x9a5a6e,[Math.sin(a+.2)*.33,.34,Math.cos(a+.2)*.33],aimRot(Math.sin(a+.2)*.55,1,Math.cos(a+.2)*.55));});
  pg.add(latheGeo([[0,0],[.15,0],[.17,.2],[.16,.55],[.135,1.0],[.105,1.4],[.075,1.66],[.04,1.8],[0,1.84]],14,{n:7,a:.035}),0xbd9a4e,0xf8e6a8,[0,.05,0]);
}
var RARE_BUILD={edelweiss:{f:buildEdelweiss,em:0xf2f6ff,ei:.16,rough:.85},kanne:{f:buildKanne,em:0xffb84a,ei:.35,rough:.4},blaulotus:{f:buildBlauLotus,em:0x5f8cff,ei:.2,rough:.55},
  mondblume:{f:buildMondblume,em:0xd6ecff,ei:.42,rough:.6},orchidee:{f:buildOrchidee,em:0xb08cff,ei:.4,rough:.25,metal:.15},drachenbaum:{f:buildDrachenbaum,em:0xff2a1a,ei:.5,rough:.3},
  baobab:{f:buildBaobab,em:0xffd27a,ei:.4,rough:.6},titanwurz:{f:buildTitanwurz,em:0xffc050,ei:.4,rough:.5}};

/* ---------- Seltenheits-Effekte: Funkeln, Glanz, Goldring ---------- */
var SPARK_TEX=null;
function sparkTex(){if(SPARK_TEX)return SPARK_TEX;var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');
  var g=x.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.75)');g.addColorStop(.45,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);x.fillStyle='rgba(255,255,255,.95)';x.beginPath();x.moveTo(32,2);x.quadraticCurveTo(35,29,62,32);x.quadraticCurveTo(35,35,32,62);x.quadraticCurveTo(29,35,2,32);x.quadraticCurveTo(29,29,32,2);x.fill();
  SPARK_TEX=new THREE.CanvasTexture(c);return SPARK_TEX;}
var RAR_FX={s:{n:7,cols:[0xbfe2ff,0xffffff],size:.09,rise:.18,glow:0},e:{n:14,cols:[0xd8bcff,0xffffff,0xbfa0ff],size:.11,rise:.24,glow:.16,gcol:0xc8a8ff},
  l:{n:22,cols:[0xffd76a,0xfff0b8,0xffc23a],size:.13,rise:.3,glow:.2,gcol:0xffd47a,ring:0xffcf5a}};
function rarKey(id){var t=MBYID[id];var b=t&&t.mega?t.base:id;return typeof rarOf==='function'?(RAR[b]||'c'):'c';}
function addRarityFX(root,id,H,foot,extras){var k=rarKey(id);var R=RAR_FX[k];if(!R)return;
  var n=R.n,pos=new Float32Array(n*3),col=new Float32Array(n*3),seed=[],C=new THREE.Color(),rad=Math.max(.35,foot*.48);
  for(var i=0;i<n;i++){seed.push({a:Math.random()*6.283,r:rad*(.55+Math.random()*.6),y:Math.random(),w:(.25+Math.random()*.4)*(i%2?1:-1),sp:.6+Math.random()*.7,tw:Math.random()*6});C.set(R.cols[i%R.cols.length]);col[i*3]=C.r;col[i*3+1]=C.g;col[i*3+2]=C.b;}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  var pts=new THREE.Points(g,new THREE.PointsMaterial({size:R.size,map:sparkTex(),vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));pts.frustumCulled=false;root.add(pts);
  var fx={rar:k,pts:pts,seed:seed,H:H,R:R};
  if(R.glow){var gs=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:R.gcol,transparent:true,opacity:R.glow,blending:THREE.AdditiveBlending,depthWrite:false}));gs.scale.set(foot*1.9,H*1.25,1);gs.position.y=H*.55;root.add(gs);fx.gs=gs;}
  if(R.ring){var rg=new THREE.Mesh(geo('rarRing',function(){return new THREE.RingGeometry(.6,.66,56);}),new THREE.MeshBasicMaterial({color:R.ring,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    rg.rotation.x=-Math.PI/2;rg.position.y=.03;root.add(rg);fx.ring=rg;
    var dg=new THREE.Mesh(geo('auraPlane',function(){return new THREE.PlaneGeometry(2.0,2.0);}),new THREE.MeshBasicMaterial({map:dotTex,color:R.ring,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,side:2}));
    dg.rotation.x=-Math.PI/2;dg.position.y=.025;root.add(dg);fx.disc=dg;
    // kleine Goldrauten im Ring
    var rp=new PB();ringPts(6,function(a){rp.add(new THREE.OctahedronGeometry(.035,0),0xffd060,0xfff2c0,[Math.sin(a)*.63,.06,Math.cos(a)*.63],null,[1,1.6,1]);});
    var rm=new THREE.Mesh(rp.geo(),new THREE.MeshStandardMaterial({vertexColors:true,emissive:0xffb830,emissiveIntensity:.6,roughness:.3,metalness:.3}));root.add(rm);fx.gems=rm;}
  extras.push({rfx:fx});return fx;}
function rarityTick(fx,t){var p=fx.pts.geometry.attributes.position,a=p.array,H=fx.H,R=fx.R;
  for(var i=0;i<fx.seed.length;i++){var s=fx.seed[i];var y=(s.y+t*R.rise*s.sp/Math.max(1,H))%1;var an=s.a+t*s.w;var rr=s.r*(1-.35*y);
    a[i*3]=Math.cos(an)*rr;a[i*3+1]=.1+y*H*1.15;a[i*3+2]=Math.sin(an)*rr;}
  p.needsUpdate=true;fx.pts.material.opacity=.75+.25*Math.sin(t*3.1);fx.pts.material.size=R.size*(.85+.15*Math.sin(t*5.3));
  if(fx.gs)fx.gs.material.opacity=R.glow*(.8+.3*Math.sin(t*1.6));
  if(fx.ring){fx.ring.material.opacity=.38+.2*Math.sin(t*2.0);fx.ring.rotation.z=t*.3;fx.gems.rotation.y=t*.45;fx.gems.position.y=Math.sin(t*1.7)*.02;fx.disc.material.opacity=.2+.08*Math.sin(t*2.0);}}

/* ---------- Auftritt nach Seltenheit ---------- */
function fxRareEntrance(r){var k=rarKey(r.id);if(k==='c')return;var pos=r.g.position.clone(),now=performance.now();
  if(k==='s'){setTimeout(function(){softBurst(V3(pos.x,.5,pos.z),[0xbfe2ff,0xffffff],12,{speed:.8,up:1.2,life:1100,size:.14,tex:'dot',add:true,grav:.4});},200);return;}
  var gold=k==='l',col=gold?0xffd060:0xc8a0ff;
  if(gold)r.growT=now+650;else r.growT=now+250;
  var pil=new THREE.Mesh(geo('pillarG',function(){var g=new THREE.CylinderGeometry(.42,.6,5,20,1,true);g.translate(0,2.5,0);return g;}),new THREE.MeshBasicMaterial({map:dotTex,color:col,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  pil.position.set(pos.x,0,pos.z);scene.add(pil);
  tween(gold?1500:1000,function(t){var a=t<.3?t/.3:1-(t-.3)/.7;pil.material.opacity=(gold?.75:.5)*a;pil.scale.set(1-.5*t,.4+.8*Math.min(1,t*2.2),1-.5*t);pil.rotation.y=t*2;if(t>=1){scene.remove(pil);pil.material.dispose();}});
  shockwave(V3(pos.x,.1,pos.z),col,gold?2.6:1.6,gold?900:700);
  softBurst(V3(pos.x,.3,pos.z),gold?[0xffd060,0xfff2c0,0xffb030]:[0xd8bcff,0xffffff],gold?30:16,{speed:1.4,up:2.4,life:1500,size:.16,tex:'dot',add:true,grav:.3,spread:.6});
  if(gold){setTimeout(function(){if(!E.ok)return;flashSprite(V3(pos.x,2.3,pos.z),0xfff0b0,2.8,480);shockwave(V3(pos.x,.1,pos.z),0xffd980,2.8,800);E.shake=Math.max(E.shake,.32);
      softBurst(V3(pos.x,1.2,pos.z),[0xffd76a,0xfff0b8,0xffffff],34,{speed:2.6,up:1.2,life:1700,size:.2,tex:'petal',grav:-.8,drag:.97});
      try{var s=toScreen(V3(pos.x,2.4,pos.z));floatAtXY(s.x,s.y,'✦ Legendär ✦','abil leg');}catch(err){}},650);}
  else setTimeout(function(){if(!E.ok)return;flashSprite(V3(pos.x,.9,pos.z),0xe8d8ff,2.6,400);softBurst(V3(pos.x,1,pos.z),[0xd8bcff,0xffffff,0xbfa0ff],18,{speed:1.6,up:.8,life:1300,size:.15,tex:'petal',grav:-.6});},250);
}
