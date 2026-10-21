/* ================= Speicherstand, Erfolge, Tagesaufgaben ================= */
// Alles liegt lokal im Browser (localStorage). In der Desktop-/Steam-Version kann
// window.MonsterDuellSteam = {unlock(apiName), setStat(apiName,value), save(json)} gesetzt werden:
// dann werden Erfolge/Statistiken 1:1 an Steam gemeldet (siehe ACH[].steam und STAT_STEAM).
var SAVE_KEY='monsterduell_save_v1', ACH_GOLD=25, SAVE=null;
var STAT_STEAM={games:'STAT_GAMES',wins:'STAT_WINS',fusions:'STAT_FUSIONS',megas:'STAT_MEGAS',summons:'STAT_SUMMONS',spells:'STAT_SPELLS',trapsFired:'STAT_TRAPS_FIRED',powers:'STAT_POWERS',heroDmg:'STAT_HERO_DMG',quests:'STAT_QUESTS'};
function countKeys(o){return Object.keys(o||{}).length;}
var ACH=[
  {id:'first_fusion', steam:'ACH_FIRST_FUSION', i:'🌀', n:'Erste Kreuzung', d:'Kreuze zum ersten Mal zwei Pflanzen.',            stat:'fusions', goal:1},
  {id:'fusion_10',    steam:'ACH_FUSION_10',    i:'🧬', n:'Kreuzungsmeister', d:'10 Kreuzungen insgesamt.',                stat:'fusions', goal:10},
  {id:'mega',         steam:'ACH_MEGA',         i:'👑', n:'Mega!',          d:'Ziehe eine Mega-Pflanze heran.',             stat:'megas',   goal:1},
  {id:'dragon_king',  steam:'ACH_DRAGON_KING',  i:'🌺', n:'Sonnenlilie',    d:'Ziehe die Sonnenlilie heran.'},
  {id:'first_win',    steam:'ACH_FIRST_WIN',    i:'🏆', n:'Erster Sieg',    d:'Besiege den Computer.',                 stat:'wins',    goal:1},
  {id:'win_10',       steam:'ACH_WIN_10',       i:'🥇', n:'Champion',       d:'10 Siege gegen den Computer.',          stat:'wins',    goal:10},
  {id:'flawless',     steam:'ACH_FLAWLESS',     i:'💎', n:'Makellos',       d:'Gewinne, ohne Schaden zu nehmen.'},
  {id:'close_call',   steam:'ACH_CLOSE_CALL',   i:'🍃', n:'Knapp!',         d:'Gewinne mit 3 ❤️ oder weniger.'},
  {id:'speed_win',    steam:'ACH_SPEED_WIN',    i:'⏱️', n:'Blitzsieg',      d:'Gewinne bis Runde 8.'},
  {id:'all_monsters', steam:'ACH_ALL_MONSTERS', i:'📖', n:'Pflanzenkenner', d:'Pflanze 12 verschiedene Pflanzen.',       prog:function(){return countKeys(SAVE.summoned);}, goal:12},
  {id:'all_heroes',   steam:'ACH_ALL_HEROES',   i:'🧭', n:'Gartenreise',    d:'Spiele ein Duell mit jedem Gärtner.',    prog:function(){return countKeys(SAVE.heroesPlayed);}, goal:5},
  {id:'spells_10',    steam:'ACH_SPELLS_10',    i:'✨', n:'Zauberlehrling', d:'Wirke 10 Zauber.',                      stat:'spells',  goal:10},
  {id:'traps_5',      steam:'ACH_TRAPS_5',      i:'🪤', n:'Fallensteller',  d:'5 deiner Fallen schnappen zu.',         stat:'trapsFired', goal:5},
  {id:'powers_20',    steam:'ACH_POWERS_20',    i:'⚡', n:'Grüner Daumen',  d:'Nutze 20× eine Gärtnerkraft.',           stat:'powers',  goal:20},
  {id:'quests_10',    steam:'ACH_QUESTS_10',    i:'📅', n:'Fleißig',        d:'Erledige 10 Tagesaufgaben.',            stat:'quests',  goal:10}
];
var QUESTS=[
  {id:'win1',     n:'Gewinne 1 Duell gegen den Computer', ev:'win',          goal:1,  gold:50},
  {id:'fuse2',    n:'Mache 2 Kreuzungen',                   ev:'fusion',       goal:2,  gold:30},
  {id:'rats5',    n:'Pflanze 5 Löwenzähne',         ev:'summon:ratte', goal:5,  gold:30},
  {id:'spell3',   n:'Wirke 3 Zauber',                     ev:'spell',        goal:3,  gold:30},
  {id:'trap2',    n:'Lass 2 Fallen zuschnappen',          ev:'trapFire',     goal:2,  gold:40},
  {id:'power4',   n:'Nutze 4× deine Gärtnerkraft',         ev:'power',        goal:4,  gold:30},
  {id:'summon10', n:'Setze 10 Pflanzen',               ev:'summon',       goal:10, gold:30},
  {id:'dmg30',    n:'Mache 30 Schaden am Gegner',         ev:'heroDmg',      goal:30, gold:40},
  {id:'play2',    n:'Spiele 2 Duelle zu Ende',            ev:'game',         goal:2,  gold:30},
  {id:'mega1',    n:'Ziehe eine Mega-Pflanze heran',           ev:'mega',         goal:1,  gold:40},
  {id:'wolf3',    n:'Pflanze 3 Sonnenblumen',                  ev:'summon:wolf',  goal:3,  gold:25}
];
var QBYID={};QUESTS.forEach(function(q){QBYID[q.id]=q;});
function defSave(){return {v:1,gold:0,stats:{games:0,wins:0,losses:0,fusions:0,megas:0,summons:0,spells:0,trapsSet:0,trapsFired:0,powers:0,heroDmg:0,quests:0},
  summoned:{},heroesPlayed:{},ach:{},settings:{lastHero:null},daily:null};}
function loadSave(){
  var d=defSave(),raw=null;
  try{raw=localStorage.getItem(SAVE_KEY);}catch(e){raw=null;}
  try{var s=raw?JSON.parse(raw):null;if(s&&typeof s==='object'){for(var k in d)if(s[k]!==undefined)d[k]=s[k];for(var sk in defSave().stats)if(typeof d.stats[sk]!=='number')d.stats[sk]=0;if(!d.settings)d.settings={lastHero:null};}}catch(e){console.warn('Speicherstand defekt – neu angelegt',e);}
  SAVE=d;ensureDaily();return SAVE;
}
function writeSave(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(e){}try{var b=steamBridge();if(b&&b.save)b.save(JSON.stringify(SAVE));}catch(e){}}
function steamBridge(){return (typeof window!=='undefined'&&window.MonsterDuellSteam)||null;}
function todayKey(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function ensureDaily(){
  var k=todayKey();if(SAVE.daily&&SAVE.daily.date===k)return;
  var h=2166136261;for(var i=0;i<k.length;i++){h^=k.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  var rnd=function(){h=(Math.imul(h,1664525)+1013904223)>>>0;return h/4294967296;};
  var pool=QUESTS.map(function(q){return q.id;}),pick=[];
  while(pick.length<3&&pool.length){pick.push(pool.splice(Math.floor(rnd()*pool.length),1)[0]);}
  SAVE.daily={date:k,q:pick.map(function(id){return {id:id,p:0,done:false};})};writeSave();
}
function isHumanSide(pi){return !!G&&(G.mode==='pvp'||(G.mode==='cpu'&&pi===0));}
function questAdd(ev,n){
  ensureDaily();
  SAVE.daily.q.forEach(function(st){var q=QBYID[st.id];if(!q||st.done||q.ev!==ev)return;
    st.p=Math.min(q.goal,st.p+n);
    if(st.p>=q.goal){st.done=true;SAVE.gold+=q.gold;SAVE.stats.quests++;metaToast('✅ '+q.n+' · +'+q.gold+' 🪙');}});
}
function unlockAch(id){
  if(SAVE.ach[id])return;var a=ACH.filter(function(x){return x.id===id;})[0];if(!a)return;
  SAVE.ach[id]=Date.now();SAVE.gold+=ACH_GOLD;metaToast('🏆 '+a.n+' · +'+ACH_GOLD+' 🪙');
  try{var b=steamBridge();if(b&&b.unlock)b.unlock(a.steam);}catch(e){}
}
function checkAch(){ACH.forEach(function(a){if(SAVE.ach[a.id]||!a.goal)return;var v=a.prog?a.prog():(SAVE.stats[a.stat]||0);if(v>=a.goal)unlockAch(a.id);});
  try{var b=steamBridge();if(b&&b.setStat)for(var k in STAT_STEAM)b.setStat(STAT_STEAM[k],SAVE.stats[k]||0);}catch(e){}}
// zentrale Ereignis-Zähler (aus logic.js über track())
function metaTrack(pi,ev,d){
  if(!SAVE||!isHumanSide(pi))return;
  var S=SAVE.stats;
  switch(ev){
    case 'summon': S.summons++;SAVE.summoned[d.id]=1;questAdd('summon',1);questAdd('summon:'+d.id,1);break;
    case 'fusion': S.fusions++;questAdd('fusion',1);if(d.mega){S.megas++;questAdd('mega',1);}if(d.id==='mega_drache')unlockAch('dragon_king');break;
    case 'spell': S.spells++;questAdd('spell',1);break;
    case 'trapSet': S.trapsSet++;break;
    case 'trapFire': S.trapsFired++;questAdd('trapFire',1);break;
    case 'power': S.powers++;questAdd('power',1);break;
    case 'heroDmg': S.heroDmg+=d.n;questAdd('heroDmg',d.n);break;
  }
  checkAch();writeSave();
}
function metaGameEnd(winner){
  if(!SAVE||!G||G.mode==='sim')return;
  var S=SAVE.stats;S.games++;questAdd('game',1);
  G.players.forEach(function(p,pi){if(isHumanSide(pi))SAVE.heroesPlayed[p.hero]=1;});
  if(G.mode==='cpu'){
    if(winner===0){S.wins++;questAdd('win',1);
      if(G.dmg[0]===0)unlockAch('flawless');
      if(G.players[0].hp<=3)unlockAch('close_call');
      if(G.round<=8)unlockAch('speed_win');
    }else S.losses++;
  }
  checkAch();writeSave();
}
/* ---------- kleine Hinweise oben (Erfolg / Aufgabe) ---------- */
var _mtQ=[],_mtBusy=false;
function metaToast(txt){_mtQ.push(txt);if(!_mtBusy)_mtNext();}
function _mtNext(){var el=typeof document!=='undefined'?document.getElementById('achToast'):null;if(!el){_mtQ=[];return;}
  var t=_mtQ.shift();if(t===undefined){_mtBusy=false;return;}_mtBusy=true;
  el.textContent=t;el.classList.add('on');setTimeout(function(){el.classList.remove('on');setTimeout(_mtNext,350);},2300);}
/* ---------- Erfolge-Bildschirm ---------- */
function fillErfolge(){
  ensureDaily();
  var got=countKeys(SAVE.ach);
  $('goldNow').textContent=SAVE.gold;$('achCount').textContent=got+'/'+ACH.length;
  $('questList').innerHTML=SAVE.daily.q.map(function(st){var q=QBYID[st.id];if(!q)return '';var pc=Math.round(100*st.p/q.goal);
    return '<div class="qrow'+(st.done?' done':'')+'"><div class="qt">'+(st.done?'✅ ':'')+q.n+'</div><div class="qbar"><i style="width:'+pc+'%"></i></div><div class="qr">'+(st.done?'✔':st.p+'/'+q.goal)+' · '+q.gold+'🪙</div></div>';}).join('');
  $('achList').innerHTML=ACH.map(function(a){var on=!!SAVE.ach[a.id];var v=a.goal?(a.prog?a.prog():(SAVE.stats[a.stat]||0)):null;
    return '<div class="ach'+(on?' on':'')+'"><span class="ai">'+a.i+'</span><div><b>'+a.n+'</b><small>'+a.d+(!on&&a.goal>1?' ('+Math.min(v,a.goal)+'/'+a.goal+')':'')+'</small></div></div>';}).join('');
  $('statLine').textContent='Duelle '+SAVE.stats.games+' · Siege '+SAVE.stats.wins+' · Kreuzungen '+SAVE.stats.fusions+' · 🪙 Gold wird für spätere Kartenpacks gesammelt';
}
function refreshMenuGold(){try{if(SAVE)$('menuGold').textContent=SAVE.gold;}catch(e){}}
