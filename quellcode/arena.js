/* ================= Echoarena =================
   Das Modell Echoarena_Prototyp.glb wird unverändert übernommen (gleiche Geometrie,
   gleiche Farben). Es ist im Spiel eingebettet (kein Nachladen nötig).
   Modell: Z nach oben, +Y = Gegnerseite, 1 Einheit = 1 Kachel.
   Spiel:  Y nach oben, -Z = Gegnerseite. Umrechnung: Drehung -90° um X, Maßstab EA.S.
   Die beiden Kerne (Ring, Innenring, Kugel) werden als eigene Objekte geführt,
   damit sie Treffer, Heilung und das Erlöschen zeigen können. */
var ECHO_GLB_B64='/*ECHO_GLB*/';
var EA={S:.84,FLOOR:.05,root:null,mat:null,coreParts:[[],[]],lines:[],ready:false,U:{uT:{value:0}}};
// Kern-Position aus arena_spec.json: (0, ±6.2) -> im Spiel z = ±6.2*S
var HEROZ_EA=6.2*.84;

function eaSrgbLin(c){return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);}
// Keramik: matt, nur wenig Umgebungsreflexion, damit die Aqua/Lavendel-Felder ihre Farbe behalten
function eaMat(){var m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0,flatShading:true,envMapIntensity:.18});m.userData.keepEnv=true;return m;}

function buildEchoArena(){
  var root=new THREE.Group();scene.add(root);EA.root=root;EA.mat=eaMat();
  try{
    var bin=atob(ECHO_GLB_B64),buf=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);
    var L=new THREE.GLX.GLTFLoader();
    L.parse(buf.buffer,'',function(g){try{eaApply(g.scene);}catch(err){console.warn('Echoarena',err);eaFallbackCores();}},
      function(err){console.warn('Echoarena laden',err);eaFallbackCores();});
  }catch(err){console.warn('Echoarena',err);eaFallbackCores();}
}

function eaApply(gs){
  var S=EA.S;
  // Modell -> Spiel: (x,y,z) -> (x*S, (z-FLOOR)*S, -y*S)
  var M4=new THREE.Matrix4().makeTranslation(0,-EA.FLOOR*S,0).multiply(new THREE.Matrix4().makeScale(S,S,S)).multiply(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  gs.updateMatrixWorld(true);
  var stat=[];
  gs.traverse(function(o){
    if(!o.isMesh)return;
    var g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
    // Farben: Vertexfarben liegen als sRGB-Bytes vor -> linear umrechnen, damit sie wie in den Renderbildern aussehen
    var ca=g.attributes.color;var c8=ca?[Math.round(ca.getX(0)*255),Math.round(ca.getY(0)*255),Math.round(ca.getZ(0)*255)]:null;
    if(ca){var n=ca.count,cs=ca.itemSize,arr=new Float32Array(n*3);
      for(var k=0;k<n;k++){arr[k*3]=eaSrgbLin(ca.getX(k));arr[k*3+1]=eaSrgbLin(ca.getY(k));arr[k*3+2]=eaSrgbLin(ca.getZ(k));}
      g.setAttribute('color',new THREE.BufferAttribute(arr,3));}
    g.computeBoundingBox();var bb=g.boundingBox;
    var cy=(bb.min.y+bb.max.y)/2,sy=bb.max.y-bb.min.y;
    // Kernteile: liegen bei y=±6.2, schmal, ragen über 0.7 hinaus
    var isCore=Math.abs(cy)>5&&sy<2&&bb.max.z>.7&&bb.max.x-bb.min.x<2;
    g.applyMatrix4(M4);
    if(!g.attributes.normal)g.computeVertexNormals();
    g.computeBoundingSphere();
    // Spielfeldlinien (Mittellinie creme, Zonenlinien aqua/lavendel) leuchten sanft
    var isLine=c8&&bb.max.z<.08&&bb.min.z>.05&&(''+c8==='251,240,223'||''+c8==='116,215,200'||''+c8==='185,164,232');
    if(isCore){var pi=cy<0?0:1;EA.coreParts[pi].push(g);}else if(isLine)EA.lines.push(g);else stat.push(g);
  });
  // statische Teile zu wenigen Meshes zusammenfassen
  var merged=null;try{if(THREE.GLX&&THREE.GLX.mergeGeometries){merged=THREE.GLX.mergeGeometries(stat.map(function(g){return g.index?g.toNonIndexed():g;}));}}catch(err){merged=null;}
  if(merged){var m=new THREE.Mesh(merged,EA.mat);m.receiveShadow=true;m.castShadow=true;EA.root.add(m);}
  else stat.forEach(function(g){var m=new THREE.Mesh(g,EA.mat);m.receiveShadow=true;m.castShadow=true;EA.root.add(m);});
  EA.lines.forEach(function(g){g.translate(0,.004,0);var m=new THREE.Mesh(g,(typeof gfxGlowMat==='function')?gfxGlowMat(0,2.6):EA.mat);m.renderOrder=1;EA.root.add(m);
    // weicher Lichtschein entlang jeder Linie (einzelne Streifen werden aus der Linien-Geometrie abgeleitet)
    if(typeof gfxLineGlow==='function')try{gfxLineGlow(g,EA.root);}catch(err){}});
  for(var pi=0;pi<2;pi++)eaFillCore(pi);
  EA.ready=true;
}

function eaCoreMats(pi){
  var col=PCOL[pi];
  var ring=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:0,flatShading:true,transparent:true,opacity:1,emissive:col,emissiveIntensity:.18});
  var orb=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:0,transparent:true,opacity:1,emissive:col,emissiveIntensity:.9});
  return {ring:ring,orb:orb};
}
function eaFillCore(pi){
  var h=E.heroes[pi];if(!h)return;var parts=EA.coreParts[pi];if(!parts.length){eaFallbackCore(pi);return;}
  var z0=pi===0?HEROZ:-HEROZ;var mats=eaCoreMats(pi);
  // kleinstes Teil = Kugel (leuchtet), der Rest = Ringe
  var vol=parts.map(function(g){g.computeBoundingBox();var s=g.boundingBox.getSize(new THREE.Vector3());return s.x*s.y*s.z;});
  var orbI=vol.indexOf(Math.min.apply(null,vol));
  parts.forEach(function(g,i){g=g.clone();g.translate(0,0,-z0);
    var isOrb=i===orbI;var m=new THREE.Mesh(g,isOrb?mats.orb:mats.ring);m.castShadow=true;m.receiveShadow=!isOrb;
    if(isOrb){g.computeBoundingBox();var c=g.boundingBox.getCenter(new THREE.Vector3());g.translate(-c.x,-c.y,-c.z);m.position.copy(c);h.orb=m;h.orbY=c.y;}
    h.cr.add(m);});
  h.cm=mats.ring;h.om=mats.orb;h.rgm=null;
  h.coreTop=1.75*EA.S;
}
// Falls das Modell nicht geladen werden kann: einfacher Ersatzkern im gleichen Stil
function eaFallbackCore(pi){
  var h=E.heroes[pi];if(!h||h.orb)return;var mats=eaCoreMats(pi);
  var ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.1,10,40),mats.ring);ring.position.y=.85;h.cr.add(ring);
  var orb=new THREE.Mesh(new THREE.SphereGeometry(.15,16,12),mats.orb);orb.position.y=.85;h.cr.add(orb);
  var base=new THREE.Mesh(new THREE.CylinderGeometry(.75,.85,.18,24),new THREE.MeshStandardMaterial({color:0x2c6e74,roughness:.8}));base.position.y=.05;h.cr.add(base);
  h.cm=mats.ring;h.om=mats.orb;h.orb=orb;h.orbY=.85;h.coreTop=1.45;
}
function eaFallbackCores(){for(var pi=0;pi<2;pi++)eaFallbackCore(pi);}

function gaTick(t,dt){
  EA.U.uT.value=t;
}
/* ---------- Kerne der Gärtner (aus dem Echoarena-Modell) ---------- */
function buildHeroCore(pi,g){
  var cr=new THREE.Group();g.add(cr);
  // Platzhalter-Material, bis das Modell bereit ist (Modell wird direkt beim Start geparst)
  var cm=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:1});
  return {cr:cr,cm:cm,om:null,orb:null,orbY:.85,rgm:null,fb:[],glb:true,coreTop:1.45};
}
function heroTick(h,pi,t,now){
  // Kugel schwebt sanft, Ringe atmen leicht
  if(h.orb){h.orb.position.y=h.orbY+Math.sin(t*1.3+pi)*.035;}
  if(!h.dead){var p=Math.sin(t*2+pi*1.7);
    if(h.om)h.om.emissiveIntensity=.75+.35*(.5+.5*p);
    if(h.cm&&h.cm.emissiveIntensity!==undefined)h.cm.emissiveIntensity=.12+.08*(.5+.5*p);
    h.gl.material.opacity=.16+.06*p;}
  var st=(now-h.shakeT)/450;h.g.position.x=st<1?Math.sin(st*36)*.1*(1-st):0;
}
