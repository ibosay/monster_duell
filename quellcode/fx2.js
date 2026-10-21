/* ================= Zauber-, Fallen- & Heldenkraft-Effekte (3D) ================= */
var CARDTEX={},CARDGEO=null;
function _rr(x,X,Y,W,H,R){x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.closePath();}
function cardTex(s){ // s = Zauber/Falle oder null (Rückseite)
  var key=s?s.id:'_back';if(CARDTEX[key])return CARDTEX[key];
  var c=document.createElement('canvas');c.width=128;c.height=176;var x=c.getContext('2d');
  var g=x.createLinearGradient(0,0,128,176);
  if(!s){g.addColorStop(0,'#d4c6f7');g.addColorStop(1,'#9f8ae0');}
  else if(s.type==='trap'){g.addColorStop(0,'#fbe0ea');g.addColorStop(1,'#e59ab6');}
  else{g.addColorStop(0,'#e3f6fb');g.addColorStop(1,'#86cbe2');}
  _rr(x,4,4,120,168,14);x.fillStyle=g;x.fill();x.lineWidth=5;x.strokeStyle='#ffffff';x.stroke();
  x.textAlign='center';x.textBaseline='middle';
  if(!s){x.fillStyle='rgba(255,255,255,.95)';x.font='60px sans-serif';x.fillText('🌱',64,92);
    x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=2;for(var i=0;i<4;i++){x.beginPath();x.moveTo(20,30+i*36);x.lineTo(108,30+i*36);x.stroke();}}
  else{x.font='64px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.fillText(s.emoji,64,72);
    x.fillStyle='#4a5470';x.font='bold 17px sans-serif';x.fillText(s.name,64,140,112);}
  var t=new THREE.CanvasTexture(c);if('colorSpace' in t)t.colorSpace=THREE.SRGBColorSpace;CARDTEX[key]=t;return t;
}
function cardMesh(s){if(!CARDGEO)CARDGEO=new THREE.PlaneGeometry(.62,.85);
  var m=new THREE.Mesh(CARDGEO,new THREE.MeshBasicMaterial({map:cardTex(s),transparent:true,side:THREE.DoubleSide,depthWrite:false}));m.renderOrder=5;return m;}
function heroPos(pi){return E.heroes[pi].g.position.clone();}
function towardCenter(pi){return pi===0?-1:1;}
// Karte steigt beim Wirken über dem eigenen Helden auf
async function fxCastCard(pi,s){
  if(!E.ok){await sleep(200);return;}
  var hp=heroPos(pi),m=cardMesh(s);scene.add(m);
  var p0=V3(hp.x+(pi===0?1:-1)*1.2,.6,hp.z),p1=V3(hp.x*.5,2.6,hp.z*.62);
  var glow=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:s.type==='trap'?0xff6fb5:0x6fe3ff,transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(glow);
  await tween(620,function(t){m.position.lerpVectors(p0,p1,t);m.quaternion.copy(camera.quaternion);var k=.5+t*.9;m.scale.set(k,k,k);glow.position.copy(m.position);glow.scale.set(2.4*k,2.4*k,1);glow.material.opacity=.7*t;},easeOut);
  burst(p1,s.type==='trap'?0xff8fc8:0x9fe8ff,26,{speed:2.4,life:700,size:.16,grav:-1});
  tween(380,function(t){m.quaternion.copy(camera.quaternion);m.material.opacity=1-t;glow.material.opacity=.7*(1-t);var k=1.4+t*.4;m.scale.set(k,k,k);if(t>=1){scene.remove(m);scene.remove(glow);m.material.dispose();glow.material.dispose();}});
  await sleep(120);
}
function targetPos(t){if(!t)return null;if(t.hero!==undefined){var h=E.heroes[t.hero];return V3(h.g.position.x,1.5,h.g.position.z);}var r=E.mons[t.mon];return r?monMid(r):null;}
async function fxFireball(pi,target,small){
  var to=targetPos(target);if(!E.ok||!to){await sleep(250);return;}
  var hp=heroPos(pi),from=V3(hp.x,2.4,hp.z);var sz=small?.55:1.1;
  var core=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xfff1a8,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  var halo=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xff5a1f,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
  core.scale.set(sz*.7,sz*.7,1);halo.scale.set(sz*1.8,sz*1.8,1);scene.add(core);scene.add(halo);
  var last=0,pos=V3(0,0,0);
  await tween(small?380:520,function(t){pos.lerpVectors(from,to,t);pos.y+=Math.sin(t*Math.PI)*(small?.8:1.6);core.position.copy(pos);halo.position.copy(pos);
    var now=performance.now();if(now-last>35){last=now;burst(pos,Math.random()<.5?0xff8c2a:0xffd36b,small?4:8,{speed:.7,life:450,size:small?.12:.2,grav:1.2});}},easeIn);
  scene.remove(core);scene.remove(halo);core.material.dispose();halo.material.dispose();
  flashSprite(to,0xffffff,small?1.6:3,300);flashSprite(to,0xff7a2a,small?2.4:4.5,520);
  burst(to,0xff8c2a,small?18:44,{speed:small?3:5.5,life:750,size:small?.14:.2});burst(to,0xffe08a,small?8:20,{speed:3,up:1.5,life:900,size:.14,grav:-2});
  shockwave(V3(to.x,.1,to.z),0xff7a2a,small?1.4:2.8,520);E.shake=Math.max(E.shake,small?.15:.4);
}
async function fxLightning(pi){
  if(!E.ok){await sleep(200);return;}
  var tgts=Object.keys(E.mons).map(function(k){return E.mons[k];}).filter(function(r){return r.owner!==pi&&!r.dying;});
  var f=$('flash');f.style.background='radial-gradient(circle,rgba(220,240,255,.35),rgba(120,170,255,.45))';f.style.opacity=1;setTimeout(function(){f.style.opacity=0;setTimeout(function(){f.style.background='';},300);},140);
  var bolts=[];
  tgts.forEach(function(r){var to=monMid(r);var pts=[V3(to.x+(Math.random()-.5)*1.5,8,to.z+(Math.random()-.5)*1.5)];
    for(var i=1;i<9;i++){var k=i/9;pts.push(V3(pts[0].x+(to.x-pts[0].x)*k+(Math.random()-.5)*.6,8+(to.y-8)*k,pts[0].z+(to.z-pts[0].z)*k+(Math.random()-.5)*.6));}pts.push(to);
    var cur=new THREE.CatmullRomCurve3(pts,false,'catmullrom',0.1);
    [[.07,0x7fb8ff,.75],[.03,0xffffff,1]].forEach(function(o){var m=new THREE.Mesh(new THREE.TubeGeometry(cur,40,o[0],5,false),new THREE.MeshBasicMaterial({color:o[1],transparent:true,opacity:o[2],blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(m);bolts.push(m);});
    flashSprite(to,0xbfe0ff,2.8,380);burst(to,0xcfe8ff,22,{speed:4,life:550,size:.14,grav:0});shockwave(V3(to.x,.1,to.z),0x9fd0ff,1.6,450);});
  E.shake=Math.max(E.shake,.3);
  await tween(420,function(t){bolts.forEach(function(b,i){b.visible=t>.8||Math.sin(t*60+i)>-.3;b.material.opacity=(1-t)*(i%2?1:.75);});});
  bolts.forEach(function(b){scene.remove(b);b.geometry.dispose();b.material.dispose();});
}
function fxBuff(uid,text,col){var r=E.mons[uid];if(!r||!E.ok)return;col=col||0xffd166;
  var c=monMid(r);flashSprite(c,col,3,500);burst(V3(c.x,.2,c.z),col,30,{speed:1.2,up:3,life:1000,size:.17,grav:.4});shockwave(V3(c.x,.1,c.z),col,1.6,520);
  fxFloatMon(uid,text,'heal');try{monMotion(uid,'abil',{t:'hop'});if(r.vis)r.vis.flash(col,500);}catch(e){}}
function fxBuffHero(pi,col){if(!E.ok)return;var h=E.heroes[pi];var c=V3(h.g.position.x,1.5,h.g.position.z);flashSprite(c,col||0xffd166,3.4,600);burst(c,col||0xffd166,26,{speed:1.2,up:2.5,life:1100,size:.17,grav:.4});}
function fxFrost(uid){var r=E.mons[uid];if(!r||!E.ok)return;
  var c=r.g.position.clone(),grp2=new THREE.Group();grp2.position.set(c.x,0,c.z);scene.add(grp2);
  var mm=new THREE.MeshStandardMaterial({color:0xcff4ff,emissive:0x5fc8ff,emissiveIntensity:.6,roughness:.15,metalness:.1,transparent:true,opacity:.85,flatShading:true});
  var g2=geo('ice',function(){return new THREE.OctahedronGeometry(.22,0);});var shards=[];
  for(var i=0;i<8;i++){var a=i/8*Math.PI*2;var s=new THREE.Mesh(g2,mm);s.position.set(Math.cos(a)*.55,.2,Math.sin(a)*.55);s.rotation.set((Math.random()-.5)*.8,a,(Math.random()-.5)*.8);s.scale.set(.6,1.6+Math.random(),.6);grp2.add(s);shards.push(s);}
  grp2.scale.setScalar(.01);
  burst(monMid(r),0xd8f6ff,34,{speed:2.6,life:900,size:.17,grav:-1});flashSprite(monMid(r),0x9fe8ff,2.6,450);
  tween(260,function(t){grp2.scale.setScalar(Math.max(.01,t));},easeOut);
  setTimeout(function(){tween(450,function(t){mm.opacity=.85*(1-t);if(t>=1){scene.remove(grp2);mm.dispose();}});},1300);
}
function fxPower(pi,pw){if(!E.ok)return sleep(150);var p=heroTop(pi);flashSprite(p,0xffd166,2.4,420);burst(p,0xffd166,20,{speed:2,up:1.2,life:700,size:.15,grav:-1});
  var s=toScreen(p);floatAtXY(s.x,s.y,pw.i+' '+pw.n,'abil');return sleep(320);}
/* ---------- Fallen: verdeckte Karten vor dem Helden ---------- */
E.trapM=[[],[]];
function trapSlotPos(pi,k){var sx=pi===0?1:-1;return V3(sx*(1.45+k*.78),.1,(pi===0?1:-1)*(HEROZ+.15));}
function syncTraps(){
  if(!E.ok||!G)return;
  for(var pi=0;pi<2;pi++){var n=(G.players[pi].traps||[]).length,L=E.trapM[pi];
    while(L.length>n){var m=L.pop();scene.remove(m);m.material.dispose();}
    while(L.length<n){var k=L.length,mm=cardMesh(null);mm.rotation.set(-Math.PI/2,0,pi===0?0:Math.PI);mm.position.copy(trapSlotPos(pi,k));mm.userData.k=k;scene.add(mm);L.push(mm);}
  }
}
function clearTraps(){for(var pi=0;pi<2;pi++){E.trapM[pi].forEach(function(m){scene.remove(m);m.material.dispose();});E.trapM[pi]=[];}}
async function fxTrapSet(pi){
  if(!E.ok){await sleep(200);return;}syncTraps();var L=E.trapM[pi],m=L[L.length-1];if(!m)return;
  var to=trapSlotPos(pi,L.length-1),from=V3(to.x*.6,2.4,to.z*.8);var r0=m.rotation.z;
  await tween(450,function(t){m.position.lerpVectors(from,to,t);m.position.y=to.y+(1-t)*2.3;m.rotation.z=r0+(1-t)*5;},easeOut);
  m.position.copy(to);m.rotation.z=r0;
  burst(V3(to.x,.2,to.z),0xc77dff,16,{speed:1.6,up:1,life:600,size:.14,grav:-1});shockwave(V3(to.x,.11,to.z),0xc77dff,1,380);
}
async function fxTrapReveal(pi,k,s){
  if(!E.ok){await sleep(200);return;}syncTraps();
  var from=trapSlotPos(pi,k),m=cardMesh(s);scene.add(m);m.position.copy(from);
  var qFlat=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,pi===0?0:Math.PI));
  var to=V3(from.x*.75,2.1,from.z-(pi===0?1:-1)*.6);
  var s2=toScreen(to);floatAtXY(s2.x,s2.y-40,'🪤 '+s.name+'!','abil');
  flashSprite(from,0xff6fb5,2.4,400);burst(from,0xff8fc8,30,{speed:2.8,up:1.5,life:800,size:.16,grav:-1.5});
  await tween(520,function(t){m.position.lerpVectors(from,to,t);m.quaternion.copy(qFlat).slerp(camera.quaternion,t);var k2=1+t*.8;m.scale.set(k2,k2,k2);},easeOut);
  flashSprite(to,0xffffff,2.6,300);
  setTimeout(function(){tween(380,function(t){m.quaternion.copy(camera.quaternion);m.material.opacity=1-t;if(t>=1){scene.remove(m);m.material.dispose();}});},650);
  await sleep(250);
}
async function fxMirror(pi,attUid){
  if(!E.ok){await sleep(200);return;}
  var hp=heroPos(pi),c=V3(hp.x,1.4,hp.z-towardCenter(pi)*-1.15);
  var hex=new THREE.Mesh(geo('hexS',function(){return new THREE.CircleGeometry(1.15,6);}),new THREE.MeshBasicMaterial({color:0x8fe8ff,transparent:true,opacity:0,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  var rim=new THREE.Mesh(geo('hexR',function(){return new THREE.RingGeometry(1.05,1.18,6);}),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  hex.position.copy(c);rim.position.copy(c);hex.rotation.z=rim.rotation.z=Math.PI/6;scene.add(hex);scene.add(rim);
  await tween(300,function(t){var k=.3+t*.7;hex.scale.set(k,k,k);rim.scale.set(k,k,k);hex.material.opacity=.6*t;rim.material.opacity=1*t;},easeOut);
  flashSprite(c,0x8fe8ff,3.2,500);burst(c,0xbff3ff,30,{speed:2.5,life:700,size:.15,grav:0});
  var r=E.mons[attUid];
  if(r){var to=monMid(r);var b=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(c,to),8,.06,6,false),new THREE.MeshBasicMaterial({color:0xbff3ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(b);
    flashSprite(to,0x8fe8ff,2.6,400);burst(to,0xbff3ff,26,{speed:3.5,life:600,size:.15});
    tween(350,function(t){b.material.opacity=.9*(1-t);if(t>=1){scene.remove(b);b.geometry.dispose();b.material.dispose();}});}
  E.shake=Math.max(E.shake,.25);
  setTimeout(function(){tween(450,function(t){hex.material.opacity=.6*(1-t);rim.material.opacity=1-t;if(t>=1){scene.remove(hex);scene.remove(rim);hex.material.dispose();rim.material.dispose();}});},500);
  await sleep(300);
}
function fxWeb(uid){var r=E.mons[uid];if(!r||!E.ok)return;var c=monMid(r);burst(c,0x9dff3a,30,{speed:2.2,life:900,size:.18,grav:-.5});burst(c,0xffffff,14,{speed:3,life:500,size:.1,grav:0});shockwave(V3(c.x,.1,c.z),0x9dff3a,1.5,450);}
async function fxPit(uid){
  var r=E.mons[uid];if(!r||!E.ok){await sleep(200);return;}
  var p=r.g.position.clone();
  var hole=new THREE.Mesh(geo('pit',function(){return new THREE.CircleGeometry(.95,32);}),new THREE.MeshBasicMaterial({color:0x1a0f08,transparent:true,opacity:.92,depthWrite:false}));
  hole.rotation.x=-Math.PI/2;hole.position.set(p.x,.085,p.z);scene.add(hole);
  shockwave(V3(p.x,.1,p.z),0x8a6a45,1.8,500);burst(V3(p.x,.3,p.z),0x9a7a55,36,{speed:2.2,up:2,life:1000,size:.24,grav:-2.5});
  E.shake=Math.max(E.shake,.3);
  r.lock=true;
  await tween(420,function(t){hole.scale.setScalar(Math.max(.01,t));r.body.position.y=-.55*easeIn(t);},easeOut);
  await tween(380,function(t){r.body.position.y=-.55*(1-t);hole.material.opacity=.92*(1-t);},easeOut);
  r.body.position.y=0;r.lock=false;scene.remove(hole);hole.material.dispose();
}
