/* ================= UI ================= */
function abilText(ab){return ab.map(function(a){return ABIL[a].icon+' '+ABIL[a].name;}).join(' · ');}
function specOf(id){return SPEC[id]||null;}
function cardAbHTML(t){var s=specOf(t.id);return (t.ab.length?'<span class="kw">'+t.ab.map(function(a){return ABIL[a].icon;}).join('')+'</span> ':'')+(s?'<span class="sp">'+s.i+' '+s.s+'</span>':'&nbsp;');}
function abilTitle(t){var s=specOf(t.id);return t.name+' ('+t.cost+' Mana, '+t.atk+'/'+t.hp+')'+(t.ab.length?'\n'+t.ab.map(function(a){return ABIL[a].name+': '+ABIL[a].desc;}).join('\n'):'')+(s?'\n✨ '+s.n+': '+s.d:'');}
function specLine(id){var s=specOf(id);return s?'<span class="spl">'+s.i+' <b>'+s.n+':</b> '+s.d+'</span>':'';}
function kwLine(ab){return ab.length?ab.map(function(a){return ABIL[a].icon+' '+ABIL[a].name;}).join(' · '):'';}
var infoT=null;
// Pflanzen-Info: Tippe eine Pflanze an oder halte eine Handkarte gedrückt
function showInfoHTML(html){var el=$('monInfo');el.innerHTML=html;
  var tb=(E&&E.side)?4:$('topUI').getBoundingClientRect().bottom;el.style.top=(tb+4)+'px';
  el.classList.add('on');clearTimeout(infoT);infoT=setTimeout(function(){el.classList.remove('on');},3200);}
function spellInfoHTML(s){return '<div class="ih">'+s.emoji+' <b>'+s.name+'</b> <span class="is">💎'+s.cost+' · '+(s.type==='trap'?'🪤 Falle':'✨ Zauber')+'</span></div><div class="isp">'+s.d+'</div>'+(s.type==='trap'?'<div class="ik">Wird verdeckt gelegt (max. '+MAX_TRAPS+') und schnappt im Zug des Gegners zu.</div>':'');}
function heroInfoHTML(pi){var p=G.players[pi],h=HBYID[p.hero];if(!h)return '';var mine=pi===viewer();
  return '<div class="ih">'+h.face+' <b>'+h.name+'</b> <span class="is">'+p.name+'</span></div><div class="isp">'+h.pw.i+' <b>'+h.pw.n+'</b> ('+h.pw.cost+'💎, 1× pro Zug): '+h.pw.d+'</div>'+
    ((p.traps&&p.traps.length)?'<div class="ik">🪤 '+(mine?p.traps.map(function(x){var s=SBYID[x.id];return s.emoji+' '+s.name;}).join(' · '):p.traps.length+' verdeckte Falle'+(p.traps.length>1?'n':''))+'</div>':'');}
function showHeroInfo(pi){try{if(G)showInfoHTML(heroInfoHTML(pi));}catch(e){console.warn(e);}}
function showInfo(m,isCard){
  try{
    if(isCard&&SBYID[m.id]){showInfoHTML(spellInfoHTML(SBYID[m.id]));return;}
    var t=MBYID[m.id]||m;var s=m.token?null:specOf(isCard?m.id:(m.sp||m.id));
    var stats=isCard?('💎'+t.cost+' ⚔️'+t.atk+' ❤️'+t.hp):('⚔️'+m.atk+' ❤️'+Math.max(0,m.hp)+'/'+m.maxHp+(m.shield?' 🛡️':'')+(m.frozen||m.stunned?' 🧊':''));
    var ab=isCard?t.ab:m.ab;
    var html='<div class="ih">'+(m.emoji||t.emoji)+' <b>'+(m.name||t.name)+'</b> '+(m.token?'':rarTag(t.id||m.id))+' <span class="is">'+stats+'</span></div>'+
      (ab.length?'<div class="ik">'+ab.map(function(a){return ABIL[a].icon+' '+ABIL[a].name;}).join(' · ')+'</div>':'')+
      (s?'<div class="isp">'+s.i+' <b>'+s.n+':</b> '+s.d+'</div>':(m.token?'<div class="ik">Keimling ohne eigene Fähigkeit.</div>':''))+
      ((m.frozen||m.stunned)?'<div class="ik">🧊 Erstarrt – kann diesen Zug nicht angreifen.</div>':'');
    var el=$('monInfo');el.innerHTML=html;
    var tb=(E&&E.side)?4:$('topUI').getBoundingClientRect().bottom;el.style.top=(tb+4)+'px';
    el.classList.add('on');clearTimeout(infoT);infoT=setTimeout(function(){el.classList.remove('on');},3200);
  }catch(err){console.warn(err);}
}
function trapIcons(pi){var p=G.players[pi];if(!p.traps||!p.traps.length)return '';var mine=pi===viewer();
  return '<span class="trp">'+p.traps.map(function(x){return '<i>'+(mine?SBYID[x.id].emoji:'?')+'</i>';}).join('')+'</span>';}
function heroHTML(pi,isActive,targetable,showBacks){
  var p=G.players[pi];var gems='';var pw=powerOf(pi);var heal=targetable&&pi===viewer();
  for(var i=0;i<p.maxMana;i++)gems+='<span class="gem'+(i<p.mana?' on':'')+'"></span>';
  var backs='';if(showBacks){for(var k=0;k<p.hand.length;k++)backs+='<span class="back"></span>';}
  return '<div class="hero'+(isActive?' active':'')+(targetable?' target':'')+(heal?' heal':'')+'" data-hero="'+pi+'">'+
    '<div class="face">'+p.face+(showBacks&&pw?'<span class="pwi'+(p.powerUsed&&G.cur===pi?' used':'')+'">'+pw.i+'</span>':'')+'</div><div><div class="nm">'+p.name+trapIcons(pi)+'</div>'+
    '<div class="stats"><span class="hp">❤️ '+Math.max(0,p.hp)+'</span><span>💎 '+p.mana+'/'+p.maxMana+(p.bonusMana&&G.cur===pi?' <b class="bon">+1</b>':'')+'</span></div>'+
    '<div class="mana">'+gems+'</div></div>'+
    (showBacks?'<div class="backs">'+backs+'</div>':'')+
    '<div class="deckinfo">🃏 '+p.deck.length+'<br>✋ '+p.hand.length+'</div></div>';
}
var CARD_ART={};
function setCardArt(id,url,quiet){CARD_ART[id]=url;try{var st=document.createElement('style');st.textContent='.art-'+id+'{background:url('+url+') center/contain no-repeat}.card .emo.art{width:100%;height:calc(var(--cw)*.6);margin:calc(var(--cw)*.06) auto 0;filter:drop-shadow(0 3px 3px rgba(0,0,0,.55))}.artmini{display:inline-block;width:2.4em;height:1.6em;vertical-align:middle}';document.head.appendChild(st);}catch(e){}
  if(quiet)return;try{if(document.getElementById('monsterList'))fillMonsterList();if(typeof G!=='undefined'&&G)render();}catch(e){}}
function fillMonsterList(){$('monsterList').innerHTML=MONSTERS.map(function(m){return '<div>'+(CARD_ART[m.id]?'<span class="art artmini art-'+m.id+'"></span>':m.emoji)+' <b>'+m.name+'</b> '+rarTag(m.id)+'<br>💎'+m.cost+' ⚔️'+m.atk+' ❤️'+m.hp+(m.ab.length?' · '+m.ab.map(function(a){return ABIL[a].icon+ABIL[a].name;}).join(', '):'')+'<br>'+specLine(m.id)+'</div>';}).join('');}
function rarity(id){var r=typeof rarOf==='function'?rarOf(id):'c';return {c:'com',s:'rare',e:'epic',l:'leg'}[r]||'com';}
function rarTag(id){var r=rarOf(id);return r==='c'?'':'<span class="rtag r'+r+'">'+RARITY[r].n+'</span>';}
var SHORTN={edelweiss:'Edelweiß',kanne:'Kanne',blaulotus:'Bl. Lotus',mondblume:'Mondblume',orchidee:'Orchidee',drachenbaum:'Drachenb.',baobab:'Baobab',titanwurz:'Titanwurz',ratte:'Löwenzahn',fleder:'Ahorn',wolf:'Sonnenbl.',schlange:'Ranke',skelett:'Pilz',fee:'Aloe',kroete:'Kaktus',greif:'Lavendel',einhorn:'Seerose',oger:'Falle',golem:'Eiche',drache:'Feuerlilie'};
var SHORTS={feuerball:'Sonne',heiltrank:'Tee',blitz:'Gewitter',verstaerkung:'Dünger',wissen:'Buch',frost:'Raureif',spiegel:'Tau',grube:'Stein',giftfalle:'Nessel'};
function spellCardHTML(s,idx,playable,aimSel){
  return '<div class="card '+(s.type==='trap'?'trapc':'spellc')+' '+(playable?'play':'no')+(aimSel?' aim':'')+'" data-hidx="'+idx+'" title="'+s.name+' ('+s.cost+' Mana): '+s.d+'">'+
    '<span class="cost">'+s.cost+'</span><span class="spi">'+(s.type==='trap'?'🪤':'✨')+'</span><div class="emo">'+s.emoji+'</div><div class="cn">'+(SHORTS[s.id]||s.name)+'</div><div class="sd">'+s.s+'</div></div>';}
function handCardHTML(c,idx,playable,fuseHint,aimSel){
  if(SBYID[c.id])return spellCardHTML(SBYID[c.id],idx,playable,aimSel);
  var t=MBYID[c.id];var s=specOf(t.id);
  return '<div class="card '+rarity(t.id)+' '+(playable?'play':'no')+'" data-hidx="'+idx+'" title="'+abilTitle(t)+'">'+(fuseHint?'<span class="fhint" title="Kreuzung möglich mit: '+fuseHint+'">🌀</span>':(s?'<span class="spi">'+s.i+'</span>':''))+
    '<span class="cost">'+t.cost+'</span>'+(CARD_ART[t.id]?'<div class="emo art art-'+t.id+'"></div>':'<div class="emo">'+t.emoji+'</div>')+'<div class="cn">'+(SHORTN[t.id]||t.name)+'</div>'+
    '<span class="badge atk">'+t.atk+'</span><span class="badge hpb">'+t.hp+'</span></div>';
}
var _lastTop=-1,_lastBot=-1;
function render(){
  if(!G)return;
  var v=viewer(),o=1-v;
  var myTurn=isHumanTurn()&&G.cur===v&&!G.busy;
  var vt=null;
  if(myTurn&&G.sel!=null){var sel=G.players[v].board.filter(function(m){return m.uid===G.sel;})[0];if(sel)vt=validTargets(v,sel);else G.sel=null;}
  if(G.aim&&!myTurn)G.aim=null;
  var aimH=function(pi){return !!(G.aim&&G.aim.tg.heroes.indexOf(pi)>=0);};
  $('sideTop').innerHTML=heroHTML(o,G.cur===o,!!(vt&&vt.hero)||aimH(o),true);
  $('sideBot').innerHTML=heroHTML(v,G.cur===v,aimH(v),false);
  var p=G.players[v];
  $('hand').innerHTML=p.hand.map(function(c,i){var fh=SBYID[c.id]?[]:p.board.filter(function(m){return !!fusionResult(c.id,m.id);}).map(function(m){return m.name;});return handCardHTML(c,i,myTurn&&canPlay(v,i),fh.join(', '),!!(G.aim&&G.aim.uid===c.uid));}).join('')||'<span style="opacity:.5;font-size:13px;align-self:center">Keine Handkarten</span>';
  var pw=powerOf(v),bp=$('btnPower');
  if(pw){var pOk=myTurn&&canPower(v);bp.innerHTML=pw.i+'<span class="pc">'+pw.cost+'</span>';bp.title=pw.n+' ('+pw.cost+' Mana, 1× pro Zug): '+pw.d;
    bp.disabled=!myTurn;bp.classList.toggle('ok',pOk&&!G.aim);bp.classList.toggle('used',!!p.powerUsed);bp.classList.toggle('on',!!(G.aim&&G.aim.kind==='power'));bp.style.display='';}
  else bp.style.display='none';
  fitHand();
  var be=$('btnEnd');be.disabled=!myTurn;
  var bd=$('btnDraw');var drawOk=myTurn&&canDrawExtra(v);bd.disabled=!myTurn;bd.classList.toggle('dim',myTurn&&!drawOk);
  bd.classList.toggle('glow',drawOk&&!p.hand.some(function(c,i){return canSummon(v,i);})&&p.board.length<MAX_BOARD&&!G.fuseMode);
  var bf=$('btnFuse');var fuseOk=myTurn&&canFuseNow(v);bf.disabled=!myTurn;bf.classList.toggle('dim',myTurn&&!fuseOk&&!G.fuseMode);
  var modeOn=!!(G.fuseMode||G.aim);
  bf.classList.toggle('on',modeOn);bf.classList.toggle('glow',fuseOk&&!modeOn);if(G.aim)bf.classList.remove('dim');
  bf.textContent=modeOn?'✖ Abbrechen':'🌀 Kreuzen '+FUSE_COST+'💎';
  var fb=$('fuseBanner');fb.style.visibility=(modeOn&&myTurn)?'visible':'hidden';fb.classList.toggle('aimb',!!G.aim);
  if(G.aim&&myTurn)fb.textContent=G.aim.label;
  else if(G.fuseMode&&myTurn)fb.textContent=G.fuseFirst==null?'🌀 Wähle eine leuchtende Pflanze':'🌀 Jetzt den Partner wählen';
  var anything=myTurn&&(p.board.some(function(m){return m.canAttack;})||p.hand.some(function(c,i){return canPlay(v,i);})||(drawOk&&p.board.length<MAX_BOARD)||canPower(v));
  be.classList.toggle('pulse',myTurn&&!anything);
  be.textContent=(G.mode==='cpu'&&G.cur===1&&!G.over)?'💻 denkt…':'Zug beenden ⏭️';
  $('turnInfo').textContent='Runde '+G.round;
  sync3D();
  if(E.ok){var tR=$('topUI').getBoundingClientRect(),bR=$('botUI').getBoundingClientRect(),tb=tR.bottom+tR.right*1000,bb=bR.top+bR.left*1000;if(Math.abs(tb-_lastTop)>2||Math.abs(bb-_lastBot)>2){_lastTop=tb;_lastBot=bb;layout();}}
}
function renderLog(){var l=G.log.slice(-1);$('log').innerHTML=l.map(function(x){return '<div>'+x+'</div>';}).join('');}
var toastT=null;
function toast(msg){var t=$('toast');t.textContent=msg;try{var bb=$('botUI').getBoundingClientRect().top;t.style.top=Math.max(60,bb-30)+'px';}catch(e){}t.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(function(){t.style.opacity=0;},1300);}
// Viele Handkarten: Karten überlappen, damit bis zu 8 ohne Scrollen sichtbar sind
function fitHand(){var h=$('hand');if(!h)return;var cs=h.querySelectorAll('.card');var n=cs.length;h.classList.remove('tight');h.style.removeProperty('--cw');cs.forEach(function(c){c.style.marginLeft='';});if(n<2)return;
  var W=h.clientWidth-16,cw=cs[0].offsetWidth,gap=parseFloat(getComputedStyle(h).columnGap)||6;if(n*cw+(n-1)*gap<=W)return;
  var fit=Math.floor((W-(n-1)*gap)/n);if(fit>=46){h.style.setProperty('--cw',fit+'px');return;}
  h.style.setProperty('--cw','46px');cw=46;
  var ov=Math.min(cw*.45,(n*cw-W)/(n-1));h.classList.add('tight');for(var i=1;i<n;i++)cs[i].style.marginLeft=(-ov)+'px';}
window.addEventListener('resize',function(){try{fitHand();}catch(e){}});
function hideAll(){['ovMenu','ovHand','ovOver','ovRules','ovConfirm','ovHero','ovErfolge','ovCamp'].forEach(function(id){$(id).classList.add('hide');});}

function showError(msg){try{var b=$('errBox');if(b){b.style.display='block';b.textContent='⚠️ Fehler im Spiel: '+msg+'\nBitte die Seite neu laden oder in einem anderen Browser öffnen.';}}catch(e){}}
window.addEventListener('error',function(e){showError((e&&e.message)||'Unbekannter Fehler');});
window.addEventListener('unhandledrejection',function(e){showError((e&&e.reason&&e.reason.message)||String(e&&e.reason));});

function init(){
  try{
    var w=$('jsWarn');if(w&&w.parentNode)w.parentNode.removeChild(w);
    $('abilityList').innerHTML=Object.keys(ABIL).map(function(k){var a=ABIL[k];return '<li>'+a.icon+' <b>'+a.name+':</b> '+a.desc+'</li>';}).join('')+
      '<li>✨ <b>Spezialfähigkeit:</b> Jede Pflanze hat zusätzlich ihre <b>eigene Fähigkeit</b> (siehe Pflanzenliste). Ihr Symbol steht auf der Karte und unter der Pflanze; wenn sie auslöst, leuchtet ihr Name kurz auf.</li>'+
      '<li>ℹ️ <b>Info:</b> Halte eine Pflanze in der Arena (auch gegnerische) oder eine Handkarte kurz gedrückt, um ihre Fähigkeiten zu sehen.</li>'+
      '<li>🌱 <b>Keimlinge</b> (z.&nbsp;B. Pusteblume, Pilzkeim) wachsen durch Fähigkeiten und haben keine eigene Fähigkeit.</li>'+
      '<li>🧊 <b>Erstarrt:</b> Die Pflanze kann in ihrem nächsten Zug nicht angreifen.</li>';
    $('fusionList').innerHTML='<div><b>2× gleiche Pflanze</b> → Mega-Pflanze: ⚔️ und ❤️ ×1,5 (gerundet), voll geheilt, 🌼 Blütenkranz + zusätzlich 🛡️ Schild (wer schon Schild hat, bekommt ⚡ Schnellwuchs; Ureiche und Sonnenlilie bekommen nichts extra) und eine neue Mega-Fähigkeit:</div>'+
      MONSTERS.filter(function(m){return RARITY[rarOf(m.id)].copies>=2;}).map(function(m){var mg=MBYID['mega_'+m.id];return '<div>'+m.emoji+' <b>'+mg.name+'</b> ⚔️'+mg.atk+' ❤️'+mg.hp+(mg.ab.length?' · '+kwLine(mg.ab):'')+'<br>'+specLine(mg.id)+'</div>';}).join('')+
      RECIPES.map(function(r){var a=MBYID[r.a],b=MBYID[r.b];return '<div>'+a.emoji+' '+a.name+' + '+b.emoji+' '+b.name+' → <b>'+r.emoji+' '+r.name+'</b> ⚔️'+r.atk+' ❤️'+r.hp+' · '+kwLine(r.ab)+'<br>'+specLine(r.id)+'</div>';}).join('');
    fillMonsterList();
    $('heroList').innerHTML=HEROES.map(function(h){return '<div>'+h.face+' <b>'+h.name+'</b><br><span class="spl">'+h.pw.i+' <b>'+h.pw.n+'</b> ('+h.pw.cost+'💎): '+h.pw.d+'</span></div>';}).join('');
    $('spellList').innerHTML=SPELLS.map(function(x){return '<div>'+x.emoji+' <b>'+x.name+'</b> · 💎'+x.cost+' · '+(x.type==='trap'?'🪤 Falle':'✨ Zauber')+'<br><span class="spl">'+x.d.replace(/^Falle: /,'')+'</span></div>';}).join('');
    try{loadSave();}catch(e){console.warn(e);SAVE=defSave();}
    refreshMenuGold();
    var openRules=function(){$('ovRules').classList.remove('hide');};
    $('btnRules').onclick=openRules;$('btnRules2').onclick=openRules;
    $('btnRulesClose').onclick=function(){$('ovRules').classList.add('hide');};
    $('ovRules').addEventListener('click',function(e){if(e.target.id==='ovRules')$('ovRules').classList.add('hide');});
    var ok=false;
    try{ok=initEngine();}catch(err){ok=false;console.warn(err);}
    if(!ok){
      $('noGL').style.display='block';
      $('btnPvp').disabled=true;$('btnCpu').disabled=true;
      return;
    }
    try{setupMenuMode();}catch(err){console.warn('menu3d',err);}
    try{
      $('btnPvp').disabled=true;$('btnCpu').disabled=true;$('btnCamp').disabled=true;$('loadBox').style.display='block';
      var fin=function(ok){try{if(ok)renderAllCardArt();}catch(e){console.warn(e);}
        try{if(MENU.on)menuShowcase();}catch(e){}
        $('btnPvp').disabled=false;$('btnCpu').disabled=false;$('btnCamp').disabled=false;
        if(ok){$('loadBox').style.display='none';}else{$('loadTxt').textContent='⚠️ Arena-Modell konnte nicht geladen werden – einfache Arena aktiv.';$('loadFill').style.width='100%';}};
      loadModels(function(p){$('loadFill').style.width=Math.round(p*100)+'%';$('loadTxt').textContent='Lade Arena… '+Math.round(p*100)+'%';},fin);
    }catch(err){console.warn(err);$('btnPvp').disabled=false;$('btnCpu').disabled=false;$('btnCamp').disabled=false;}
    var lpT=null,lpFired=false;
    var lpCancel=function(){clearTimeout(lpT);lpT=null;};
    $('hand').addEventListener('pointerdown',function(e){var c=e.target.closest('[data-hidx]');lpFired=false;lpCancel();if(!c||!G)return;var idx=+c.dataset.hidx;
      lpT=setTimeout(function(){var p=G.players[viewer()];var hc=p&&p.hand[idx];if(hc){lpFired=true;showInfo({id:hc.id},true);}},450);});
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){$('hand').addEventListener(ev,lpCancel);});
    $('hand').addEventListener('contextmenu',function(e){e.preventDefault();});
    $('hand').addEventListener('click',function(e){if(lpFired){lpFired=false;return;}var c=e.target.closest('[data-hidx]');if(c)onHandClick(+c.dataset.hidx);});
    $('monInfo').addEventListener('click',function(){$('monInfo').classList.remove('on');});
    ['sideTop','sideBot'].forEach(function(id){$(id).addEventListener('click',function(e){var h=e.target.closest('[data-hero]');if(h)onHeroClick(+h.dataset.hero);});});
    $('btnFuse').onclick=function(){onFuseButton();};
    $('btnDraw').onclick=function(){onDrawButton();};
    $('btnEnd').onclick=function(){if(isHumanTurn()&&!G.busy)endTurn();};
    $('btnHandGo').onclick=function(){$('ovHand').classList.add('hide');startTurn();};
    $('btnPvp').onclick=function(){chooseHeroes('pvp');};
    $('btnCpu').onclick=function(){chooseHeroes('cpu');};
    $('btnRestart').onclick=function(){if(G&&!G.over){$('ovConfirm').classList.remove('hide');return;}chooseHeroes(G?G.mode:'pvp');};
    $('btnConfYes').onclick=function(){$('ovConfirm').classList.add('hide');chooseHeroes(G?G.mode:'pvp');};
    $('btnConfNo').onclick=function(){$('ovConfirm').classList.add('hide');};
    $('btnAgain').onclick=function(){if(G&&G.camp)startCampStage(G.camp);else chooseHeroes(G.mode);};
    $('btnNext').onclick=function(){var st=G&&G.camp&&CBYID[G.camp];if(st&&CAMP[st.idx+1])startCampStage(CAMP[st.idx+1].id);else openCamp();};
    $('btnCamp').onclick=openCamp;
    // Grafikstufe: Automatisch → Hoch → Mittel → Niedrig (wird gespeichert, Seite lädt neu)
    var GQ=[['auto','Automatisch'],['high','Hoch'],['mobile','Mittel'],['low','Niedrig']];
    var gqNow=function(){var v='auto';try{v=localStorage.getItem('pd_quality')||'auto';}catch(e){}return v;};
    var gqLabel=function(){var v=gqNow();var l=GQ.filter(function(x){return x[0]===v;})[0];$('btnGfx').textContent='⚙️ Grafik: '+(l?l[1]:'Automatisch')+(v==='auto'&&E.tier?' ('+({high:'Hoch',mobile:'Mittel',low:'Niedrig'}[E.tier]||'')+')':'');};
    gqLabel();
    $('btnGfx').onclick=function(){var v=gqNow(),i=GQ.map(function(x){return x[0];}).indexOf(v),nx=GQ[(i+1)%GQ.length][0];
      try{if(nx==='auto')localStorage.removeItem('pd_quality');else localStorage.setItem('pd_quality',nx);localStorage.removeItem('pd_q');}catch(e){}
      location.reload();};
    $('btnCampBack').onclick=function(){hideAll();refreshMenuGold();$('ovMenu').classList.remove('hide');};
    $('campList').addEventListener('click',function(e){var b=e.target.closest('[data-camp]');if(b&&!b.disabled)startCampStage(b.dataset.camp);});
    var toMenu=function(){if(G){G.over=true;G.gen++;}hideAll();resetScene();refreshMenuGold();$('ovMenu').classList.remove('hide');};
    $('btnMenu').onclick=toMenu;$('btnOverMenu').onclick=toMenu;
    $('btnPower').onclick=function(){if(pwLp){pwLp=false;return;}onPowerButton();};
    var pwLp=false,pwT=null;
    $('btnPower').addEventListener('pointerdown',function(){pwLp=false;clearTimeout(pwT);pwT=setTimeout(function(){if(G){pwLp=true;showHeroInfo(viewer());}},450);});
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){$('btnPower').addEventListener(ev,function(){clearTimeout(pwT);});});
    $('btnPower').addEventListener('contextmenu',function(e){e.preventDefault();});
    // langes Drücken auf eine Heldenleiste: Held, Heldenkraft, Fallen
    var hlT=null,hlFired=false;
    ['sideTop','sideBot'].forEach(function(id){var el=$(id);
      el.addEventListener('pointerdown',function(e){var h=e.target.closest('[data-hero]');hlFired=false;clearTimeout(hlT);if(!h||!G)return;var pi=+h.dataset.hero;hlT=setTimeout(function(){hlFired=true;showHeroInfo(pi);},450);});
      ['pointerup','pointercancel','pointerleave'].forEach(function(ev){el.addEventListener(ev,function(){clearTimeout(hlT);});});
      el.addEventListener('contextmenu',function(e){e.preventDefault();});
      el.addEventListener('click',function(e){if(hlFired){hlFired=false;e.stopImmediatePropagation();}},true);});
    $('btnErfolge').onclick=openErfolge;$('btnOverErfolge').onclick=openErfolge;
    $('btnErfolgeClose').onclick=function(){$('ovErfolge').classList.add('hide');refreshMenuGold();};
    $('ovErfolge').addEventListener('click',function(e){if(e.target.id==='ovErfolge'){$('ovErfolge').classList.add('hide');refreshMenuGold();}});
    $('heroGrid').addEventListener('click',function(e){var b=e.target.closest('[data-hid]');if(b)pickHero(b.dataset.hid);});
    $('btnHeroRand').onclick=function(){pickHero(randHero());};
    $('btnHeroBack').onclick=function(){$('ovHero').classList.add('hide');if(HS.camp){openCamp();return;}if(!G||G.over){hideAll();$('ovMenu').classList.remove('hide');}};
    // Tastatur (PC): Leertaste/Enter = Zug beenden, F = Fusion, D = Ziehen, H = Heldenkraft, 1–8 = Handkarte, Esc = Abbrechen
    document.addEventListener('keydown',function(e){
      if(!G||G.over||e.ctrlKey||e.metaKey||e.altKey)return;
      if(document.querySelector('.overlay:not(.hide)'))return;
      var k=e.key;
      if(k==='Escape'){onEmptyClick();return;}
      if(!isHumanTurn()||G.busy)return;
      if(k===' '||k==='Enter'){e.preventDefault();endTurn();}
      else if(k==='f'||k==='F')onFuseButton();
      else if(k==='d'||k==='D')onDrawButton();
      else if(k==='h'||k==='H')onPowerButton();
      else if(/^[1-8]$/.test(k)){var i=+k-1;if(G.players[G.cur].hand[i])onHandClick(i);}
    });
  }catch(err){showError(err&&err.message?err.message:String(err));}
}
/* ---------- Heldenwahl ---------- */
var HS={mode:'cpu',step:0,picks:[]};
function chooseHeroes(mode){
  if(G&&!G.over){G.over=true;G.gen++;}
  HS={mode:mode,step:0,picks:[]};
  ['ovOver','ovMenu','ovConfirm','ovHand'].forEach(function(id){$(id).classList.add('hide');});
  fillHeroGrid();$('ovHero').classList.remove('hide');
}
function fillHeroGrid(){
  var htip=$('heroTip');if(htip){var cs0=HS.camp&&CBYID[HS.camp];htip.textContent=cs0?('💡 '+cs0.tip):'';htip.style.display=cs0?'':'none';}
  $('heroTitle').textContent=HS.mode==='pvp'?('Spieler '+(HS.step+1)+': Wähle deinen Gärtner'):'Wähle deinen Gärtner';
  var last=SAVE&&SAVE.settings.lastHero;
  $('heroGrid').innerHTML=HEROES.map(function(h){var played=SAVE&&SAVE.heroesPlayed[h.id];
    return '<button type="button" class="htile'+(HS.step===0&&last===h.id?' last':'')+'" data-hid="'+h.id+'"><span class="hf">'+h.face+'</span><span class="hn">'+h.name+(played?' <small>✔</small>':'')+'</span><span class="hp2">'+h.pw.i+' '+h.pw.n+' · '+h.pw.cost+'💎</span><span class="hd">'+h.pw.s+'</span></button>';}).join('');
}
function pickHero(id){
  HS.picks.push(id);
  if(HS.step===0&&SAVE){SAVE.settings.lastHero=id;writeSave();}
  if(HS.mode==='pvp'&&HS.step===0){HS.step=1;fillHeroGrid();return;}
  $('ovHero').classList.add('hide');
  var cst=HS.camp&&CBYID[HS.camp];
  var hs=HS.mode==='pvp'?HS.picks.slice(0,2):[HS.picks[0],cst?cst.hero:randHero()];
  newGame(HS.mode,hs,HS.camp||null);
}
function openErfolge(){try{fillErfolge();}catch(e){console.warn(e);}$('ovErfolge').classList.remove('hide');}
window.__game={get G(){return G;},E:E,newGame:newGame,
  pick:function(x,y){ndc.x=x/window.innerWidth*2-1;ndc.y=-(y/window.innerHeight)*2+1;raycaster.setFromCamera(ndc,camera);return raycaster.intersectObjects(E.hits,false).map(function(h){return JSON.stringify(h.object.userData)+'@'+h.distance.toFixed(2);});},
  monScreen:function(uid){var r=E.mons[uid];if(!r)return null;var s=toScreen(monMid(r));return {x:s.x,y:s.y};},
  heroScreen:function(pi){var h=E.heroes[pi];var s=toScreen(V3(h.g.position.x,1.4,h.g.position.z));return {x:s.x,y:s.y};}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();