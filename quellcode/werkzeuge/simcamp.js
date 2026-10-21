// Kampagnen-Simulation: jede Stufe N-mal, Spieler-KI gegen Stufen-Gegner.
// Aufruf im Ordner quellcode/:  node werkzeuge/simcamp.js [Anzahl=300]
// Zielkurve: Kapitel 1 leicht (~90 %), Bosse ~55/45/35 %.
const fs=require('fs'),vm=require('vm');
const dir=require('path').join(__dirname,'..'),N=+process.argv[2]||300;
let src=fs.readFileSync(dir+'/logic.js','utf8')+'\n'+fs.readFileSync(dir+'/campaign.js','utf8');
const names=new Set((src.match(/\b(fx[A-Z]\w*|render\w*|hideAll|resetScene|setCamAngle|sync3D|showInfo|metaGameEnd|metaTrack|toast|writeSave|fillHeroGrid)\b/g)||[]));
let stubs='';names.forEach(n=>{stubs+=`function ${n}(){}\n`;});
const ctx={console:{log(){},warn(){},error:console.error},Math,Promise,setTimeout:()=>0,performance:{now:()=>0},document:{getElementById:()=>({style:{},classList:{add(){},remove(){}}})}};
vm.createContext(ctx);
vm.runInContext(stubs+src.replace('"use strict";','')+`;function sleep(){return Promise.resolve();}function $(){return {style:{},classList:{add(){},remove(){}},textContent:''};}var SAVE=null;`,ctx);
async function one(h0,camp){
  vm.runInContext(`newGame('sim',['${h0}',CBYID['${camp}'].hero],'${camp}');`,ctx);
  for(let i=0;i<20000;i++){await new Promise(r=>setImmediate(r));const st=vm.runInContext('({over:G.over,round:G.round})',ctx);if(st.over||st.round>60)break;}
  return vm.runInContext(`(function(){var a=G.players[0],b=G.players[1];return {w:a.hp<=0&&b.hp<=0?-1:a.hp<=0?1:b.hp<=0?0:-2,r:G.round,hp:a.hp};})()`,ctx);
}
(async()=>{
  const H=vm.runInContext('HEROES.map(h=>h.id)',ctx),S=vm.runInContext('CAMP.map(s=>s.id+"|"+s.n)',ctx);
  for(const s of S){const id=s.split('|')[0];let w=0,r=0,st3=0;
    for(let g=0;g<N;g++){const x=await one(H[g%H.length],id);if(x.w===0){w++;if(x.hp>=15&&x.r<=10)st3++;}r+=x.r;}
    console.log(s.padEnd(34),'Spieler-KI gewinnt',(100*w/N).toFixed(0)+'%','  3 Sterne',(100*st3/N).toFixed(0)+'%','  Runden Ø',(r/N).toFixed(1));}
})();
