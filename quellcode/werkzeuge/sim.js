// Balance-Simulation: Computer gegen Computer, alle Gärtner-Paarungen.
// Aufruf im Ordner quellcode/:  node werkzeuge/sim.js [Anzahl=2000]
// Ausgabe: Siegquote je Gärtner und je gespielter Karte (Werte deutlich über 0,70 = verdächtig stark).
const fs=require('fs'),vm=require('vm');
const dir=require('path').join(__dirname,'..'),N=+process.argv[2]||2000;
let src=fs.readFileSync(dir+'/logic.js','utf8');
const names=new Set((src.match(/\b(fx[A-Z]\w*|render\w*|hideAll|resetScene|setCamAngle|sync3D|showInfo|metaGameEnd|metaTrack)\b/g)||[]));
let stubs='';names.forEach(n=>{stubs+=`function ${n}(){}\n`;});
const el={style:{},classList:{add(){},remove(){},toggle(){}},textContent:'',innerHTML:''};
const ctx={console:{log(){},warn(){},error:console.error},Math,Promise,setTimeout:(f)=>0,performance:{now:()=>0},window:undefined,document:{getElementById:()=>el}};
vm.createContext(ctx);
vm.runInContext(stubs+src.replace('"use strict";','')+`
;function sleep(){return Promise.resolve();}
function $(){return {style:{},classList:{add(){},remove(){}},textContent:''};}
var __log=[];
`,ctx);
// Spielprotokoll: welche Karten hat wer gespielt
vm.runInContext(`
var _summon=summon;summon=async function(pi,idx){var c=G.players[pi].hand[idx];var r=await _summon(pi,idx);if(r&&c)G.played[pi].push(c.id);return r;};
var _fuse=doFusion;doFusion=async function(pi,a,b){var p=G.players[pi];var A=p.board.filter(x=>x.uid===a)[0],B=p.board.filter(x=>x.uid===b)[0];var res=A&&B?fusionResult(A.id,B.id):null;var r=await _fuse(pi,a,b);if(r&&res)G.played[pi].push(res.id);return r;};
var _cast=castSpell;castSpell=async function(pi,idx,t){var c=G.players[pi].hand[idx];var r=await _cast(pi,idx,t);if(r&&c)G.played[pi].push(c.id);return r;};
var _trap=setTrap;setTrap=async function(pi,idx){var c=G.players[pi].hand[idx];var r=await _trap(pi,idx);if(r&&c)G.played[pi].push(c.id);return r;};
`,ctx);
async function one(h0,h1){
  vm.runInContext(`newGame('sim',['${h0}','${h1}']);G.played=[[],[]];`,ctx);
  for(let i=0;i<20000;i++){await new Promise(r=>setImmediate(r));const st=vm.runInContext('({over:G.over,round:G.round})',ctx);if(st.over||st.round>60)break;}
  return vm.runInContext(`(function(){var a=G.players[0],b=G.players[1];var w=a.hp<=0&&b.hp<=0?-1:a.hp<=0?1:b.hp<=0?0:-2;return {w:w,round:G.round,played:G.played,heroes:[a.hero,b.hero]};})()`,ctx);
}
(async()=>{
  const H=vm.runInContext('HEROES.map(h=>h.id)',ctx);
  const stats={first:0,second:0,draw:0,rounds:0,card:{},hero:{}};
  for(let g=0;g<N;g++){
    const h0=H[g%H.length],h1=H[Math.floor(g/H.length)%H.length];
    const r=await one(h0,h1);
    stats.rounds+=r.round;
    if(r.w===0)stats.first++;else if(r.w===1)stats.second++;else stats.draw++;
    [0,1].forEach(pi=>{const hh=stats.hero[r.heroes[pi]]=stats.hero[r.heroes[pi]]||{g:0,w:0};hh.g++;if(r.w===pi)hh.w++;
      new Set(r.played[pi]).forEach(id=>{const c=stats.card[id]=stats.card[id]||{g:0,w:0};c.g++;if(r.w===pi)c.w++;});});
  }
  const out={games:N,firstWin:(stats.first/N).toFixed(3),secondWin:(stats.second/N).toFixed(3),draw:stats.draw,avgRounds:(stats.rounds/N).toFixed(1),
    heroes:Object.fromEntries(Object.entries(stats.hero).map(([k,v])=>[k,(v.w/v.g).toFixed(3)])),
    cards:Object.entries(stats.card).sort((a,b)=>b[1].w/b[1].g-a[1].w/a[1].g).map(([k,v])=>k+' '+(v.w/v.g).toFixed(3)+' (n='+v.g+')')};
  console.log(JSON.stringify(out,null,1));
})();
