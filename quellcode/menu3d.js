/* ================= Startmenü: lebendige Echoarena im Hintergrund =================
   Solange ein Menü offen ist (Hauptmenü, Gartenreise, Gärtnerwahl, Erfolge) und kein Duell läuft,
   kreist die Kamera langsam um die schwebende Echoarena. Auf jeder Seite stehen ein paar
   Schau-Pflanzen. Kein Video nötig: scharf in jeder Auflösung, kostet keinen Download. */
var MENU={on:false,uids:[],seed:0};
var MENU_OVERLAYS=['ovMenu','ovCamp','ovHero','ovErfolge'];
var MENU_SHOW=[['fee','titanwurz','einhorn'],['greif','baobab','oger'],['wolf','orchidee','fee'],['mondblume','golem','skelett'],['kanne','drache','edelweiss'],['blaulotus','kroete','lotus']];

function menuShouldShow(){
  if(!E.ok)return false;
  if(G&&!G.over)return false;
  for(var i=0;i<MENU_OVERLAYS.length;i++){var el=$(MENU_OVERLAYS[i]);if(el&&!el.classList.contains('hide'))return true;}
  return false;
}
function updateMenuMode(){
  var on=menuShouldShow();
  if(on===MENU.on)return;
  MENU.on=on;document.body.classList.toggle('menuMode',on);
  if(on){menuShowcase();}else{menuClear();E.camA=E.camAT||0;}
  try{layout();}catch(e){}
}
function menuClear(){MENU.uids.forEach(function(u){try{removeMon(u);}catch(e){}});MENU.uids=[];}
function menuShowcase(){
  menuClear();
  if(G&&!G.over)return;
  try{Object.keys(E.mons).forEach(function(k){removeMon(+k);});}catch(e){}
  E.heroes.forEach(function(h){h.dead=false;h.cr.visible=true;h.gl.visible=true;h.cr.position.y=0;h.cr.scale.setScalar(1);if(h.cm)h.cm.opacity=1;if(h.om)h.om.opacity=1;});
  // zwei verschiedene Aufstellungen, bei jedem Öffnen eine andere
  var a=MENU_SHOW[MENU.seed%MENU_SHOW.length],b=MENU_SHOW[(MENU.seed+3)%MENU_SHOW.length];MENU.seed++;
  [a,b].forEach(function(ids,pi){
    ids=ids.filter(function(id){return !!MBYID[id];});
    ids.forEach(function(id,i){
      var t=MBYID[id],uid=800000+pi*10+i;
      var m={uid:uid,id:id,name:t.name,emoji:t.emoji,cost:t.cost,atk:t.atk,hp:t.hp,maxHp:t.hp,ab:t.ab.slice(),shield:false,canAttack:false,fresh:false,sp:id};
      try{var r=createMon(m,pi);var n=ids.length;r.tx=(i-(n-1)/2)*SP*(pi===0?1:-1);r.tz=pi===0?ROWZ:-ROWZ;r.g.position.set(r.tx,0,r.tz);r.mode='';r.menu=true;MENU.uids.push(uid);
        setTimeout(function(){try{fxSummon(r);}catch(e){}},200+i*260+pi*120);}catch(err){console.warn('menu plant',err);}
    });
  });
}
// Kamera im Menü: langsame Kreisfahrt, etwas flacher als im Spiel
function menuCamera(t){
  E.camA=t*.07;
  var phi=.5,d=E.menuD||E.d,hd=d*Math.cos(phi),hy=d*Math.sin(phi);
  camera.position.set(Math.sin(E.camA)*hd,hy,Math.cos(E.camA)*hd);
  camera.position.y+=Math.sin(t*.35)*.15;
  camera.lookAt(0,.35,0);
}
// Freie Fläche neben/über dem Menüfenster bestimmen und die Arena dort einpassen
function menuLayout(w,h){
  var vis=null;for(var i=0;i<MENU_OVERLAYS.length;i++){var el=$(MENU_OVERLAYS[i]);if(el&&!el.classList.contains('hide')){vis=el.querySelector('.panel');break;}}
  var L=0,R=0,top=0,bot=0,wide=w/h>1.15;
  if(vis){var pr=vis.getBoundingClientRect();
    if(wide&&pr.right<w*.62){L=pr.right+10;}
    else if(!wide&&pr.top>h*.3){bot=h-pr.top+6;}}
  camera.fov=wide?36:48;camera.aspect=w/h;
  var phi=.5,pts=[],Rr=8.0;
  for(var k=0;k<16;k++){var an=k/16*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(an)*Rr,-.9,Math.sin(an)*Rr),new THREE.Vector3(Math.cos(an)*Rr*.75,1.6,Math.sin(an)*Rr*.75));}
  var ox=(R-L)/2,oy=(bot-top)/2,pad=wide?24:10;
  var fit=function(d){var hd=d*Math.cos(phi);camera.position.set(0,d*Math.sin(phi),hd);camera.lookAt(0,.35,0);camera.setViewOffset(w,h,ox,oy,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    var y0=1e9,y1=-1e9,x0=1e9,x1=-1e9,v=new THREE.Vector3();pts.forEach(function(p){v.copy(p).project(camera);var sx=(v.x+1)/2*w,sy=(1-v.y)/2*h;x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy);});return [x0,x1,y0,y1];};
  var lo=4,hi=80,r;
  for(var it=0;it<3;it++){lo=4;hi=80;
    for(var k2=0;k2<26;k2++){var md=(lo+hi)/2;r=fit(md);if(r[0]>=L+pad&&r[1]<=w-R-pad&&r[2]>=top+pad&&r[3]<=h-bot-pad)hi=md;else lo=md;}
    r=fit(hi);oy+=((r[2]+r[3])/2-(top+(h-bot))/2);ox+=((r[0]+r[1])/2-(L+(w-R))/2);}
  E.menuD=hi;camera.setViewOffset(w,h,ox,oy,w,h);camera.updateProjectionMatrix();
}
function setupMenuMode(){
  try{var mo=new MutationObserver(function(){updateMenuMode();});
    MENU_OVERLAYS.forEach(function(id){var el=$(id);if(el)mo.observe(el,{attributes:true,attributeFilter:['class']});});}catch(e){}
  window.addEventListener('resize',function(){if(MENU.on)setTimeout(layout,50);});
  updateMenuMode();
}
