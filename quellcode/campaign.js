/* ================= Kampagne "Gartenreise" =================
   3 Kapitel × 4 Stufen gegen den Computer. Jede Stufe hat einen Gegner-Gärtner,
   eigene Lebenspunkte, ein Deck-Thema (mehr Karten einer Sorte) und manchmal
   eine Besonderheit (Start-Pflanze, Bonus-Mana). Fortschritt liegt in SAVE.camp.
   Sterne: ★ gewonnen · ★★ mit mindestens 15 ❤️ · ★★★ zusätzlich bis Runde 10. */
var CAMP_CHAPTERS=[
  {id:'k1',n:'Morgentau-Wiesen',i:'🌅',d:'Sanfter Einstieg: lerne Pflanzen, Angriffe und Kreuzungen.'},
  {id:'k2',n:'Nebelmoor',i:'🌫️',d:'Zähe Gegner mit Gift, Wächtern und Schilden.'},
  {id:'k3',n:'Mondgipfel',i:'🌙',d:'Die stärksten Gärtner der Reise.'}
];
var CAMP=[
  {id:'s1', ch:'k1',n:'Erste Keime',        hero:'druide',   hp:10,nobonus:true,theme:['ratte','skelett'],ban:['drache','oger','golem','greif'],gold:40, tip:'Pflanze jede Runde etwas und greif den Kern direkt an.'},
  {id:'s2', ch:'k1',n:'Löwenzahnfeld',      hero:'nekromant',hp:14,nobonus:true,theme:['ratte','ratte'],ban:['drache','oger','golem'],gold:45, tip:'Viele kleine Pflanzen: Gewitter und Glutpollen räumen auf.'},
  {id:'s3', ch:'k1',n:'Sonnenhang',         hero:'magier',   hp:18,nobonus:true,theme:['wolf','wolf'],ban:['drache','oger'],gold:50, tip:'Sonnenblumen greifen sofort an. Halte Wächter bereit.'},
  {id:'s4', ch:'k1',n:'Der alte Eichenwächter',hero:'ritter',hp:16,nobonus:true,theme:['kroete','skelett'],ban:['drache','golem'],board:['kroete'],boss:true,gold:100,tip:'Er startet mit einem Kaktus als Wächter. Schwebende Pflanzen fliegen über Wächter hinweg.'},
  {id:'s5', ch:'k2',n:'Pilzring',           hero:'nekromant',hp:22,theme:['skelett','skelett','fee'],gold:60, tip:'Pilze wachsen einmal nach. Triff sie zweimal.'},
  {id:'s6', ch:'k2',n:'Dornendickicht',     hero:'ritter',   hp:24,theme:['schlange','kroete'],gold:65, tip:'Gift tut jede Runde weh: Kamillentee entgiftet.'},
  {id:'s7', ch:'k2',n:'Lotusteich',         hero:'druide',   hp:25,theme:['einhorn','fee'],gold:70, tip:'Schilde blocken den ersten Treffer. Erst mit kleinen Pflanzen aufbrechen.'},
  {id:'s8', ch:'k2',n:'Die Moorkönigin',    hero:'nekromant',hp:28,nobonus:true,theme:['schlange','skelett','fee'],board:['schlange','ratte'],boss:true,gold:150,tip:'Sie startet mit Dornenranke und Löwenzahn. Die Ranke heilt sich jede Runde. Gift und Schaden in einem Zug helfen.'},
  {id:'s9', ch:'k3',n:'Lavendelhöhen',      hero:'haendler', hp:28,theme:['greif','greif'],gold:80, tip:'Lavendel fliegt und trifft den Kern hart. Fallen helfen.'},
  {id:'s10',ch:'k3',n:'Fallengarten',       hero:'ritter',   hp:28,theme:['spiegel','giftfalle','grube'],gold:85,tip:'Überall Fallen: Lock sie mit kleinen Pflanzen aus.'},
  {id:'s11',ch:'k3',n:'Glutgrat',           hero:'magier',   hp:30,theme:['drache','wolf'],gold:90, tip:'Feuerlilien brennen alles nieder. Spar Schaden für sie auf.'},
  {id:'s12',ch:'k3',n:'Die Sonnenlilie erwacht',hero:'magier',hp:32,theme:['drache','greif','oger'],board:['wolf'],boss:true,gold:250,tip:'Der letzte Kampf. Kreuze früh – nur Kreuzungen halten hier mit.'}
];
var CBYID={};CAMP.forEach(function(s,i){s.idx=i;CBYID[s.id]=s;});

function campSave(){if(!SAVE)return {cleared:{}};if(!SAVE.camp)SAVE.camp={cleared:{}};return SAVE.camp;}
function campStars(id){return campSave().cleared[id]||0;}
function campUnlocked(s){return s.idx===0||campStars(CAMP[s.idx-1].id)>0;}
function campTotalStars(){var c=campSave().cleared,n=0;for(var k in c)n+=c[k];return n;}

// wird von newGame() aufgerufen, nachdem die Spieler angelegt sind (vor dem Kartenziehen)
function applyCampaign(st){
  var e=G.players[1];
  e.hp=st.hp;e.maxHp=st.hp;if(st.nobonus)e.noBonus=true;
  if(st.mana)e.manaBonus=st.mana;
  if(st.ban)e.deck=e.deck.filter(function(c){return st.ban.indexOf(c.id)<0;});
  if(st.theme){st.theme.forEach(function(id){for(var c=0;c<2;c++)e.deck.push({uid:++uidc,id:id});});shuffle(e.deck);}
  if(st.board)st.board.forEach(function(id){var t=MBYID[id];if(!t)return;
    e.board.push({uid:++uidc,id:id,name:t.name,emoji:t.emoji,cost:t.cost,atk:t.atk,hp:t.hp,maxHp:t.hp,ab:t.ab.slice(),shield:has(t,'shield'),canAttack:false,fresh:true,sp:id});});
}
// Ergebnis einer Kampagnen-Stufe (nur Sieg des Menschen zählt)
function campResult(winner){
  var st=G&&G.camp?CBYID[G.camp]:null;if(!st)return null;
  if(winner!==0)return {won:false,st:st};
  var p=G.players[0],stars=1+(p.hp>=15?1:0)+((p.hp>=15&&G.round<=10)?1:0);
  var cs=campSave(),before=cs.cleared[st.id]||0,first=!before;
  if(stars>before)cs.cleared[st.id]=stars;
  var gold=first?st.gold:Math.round(st.gold*.2);
  if(SAVE){SAVE.gold+=gold;writeSave();}
  return {won:true,st:st,stars:stars,gold:gold,first:first,next:CAMP[st.idx+1]||null};
}

/* ---------- Kampagnen-Bildschirm ---------- */
function fillCamp(){
  var html='<div class="campTop">⭐ '+campTotalStars()+'/'+(CAMP.length*3)+' Sterne · 🪙 '+(SAVE?SAVE.gold:0)+' Gold</div>';
  CAMP_CHAPTERS.forEach(function(ch){
    html+='<div class="campCh"><div class="campChH">'+ch.i+' <b>'+ch.n+'</b><small>'+ch.d+'</small></div><div class="campRow">';
    CAMP.filter(function(s){return s.ch===ch.id;}).forEach(function(s){
      var open=campUnlocked(s),stars=campStars(s.id),h=HBYID[s.hero];
      html+='<button type="button" class="campSt'+(open?'':' locked')+(s.boss?' boss':'')+(stars?' done':'')+'" data-camp="'+s.id+'"'+(open?'':' disabled')+'>'+
        '<span class="cn">'+(s.idx+1)+'</span><span class="cf">'+(open?(h?h.face:'🌱'):'🔒')+'</span>'+
        '<span class="ct">'+s.n+'</span><span class="cs">'+(stars?'★★★'.slice(0,stars)+'<i>'+'★★★'.slice(stars)+'</i>':(open?'❤️ '+s.hp:''))+'</span></button>';});
    html+='</div></div>';});
  $('campList').innerHTML=html;
}
function openCamp(){try{fillCamp();}catch(e){console.warn(e);}hideAll();$('ovCamp').classList.remove('hide');}
function startCampStage(id){
  var st=CBYID[id];if(!st||!campUnlocked(st))return;
  $('ovCamp').classList.add('hide');
  HS={mode:'cpu',step:0,picks:[],camp:id};
  fillHeroGrid();$('heroTitle').textContent='Stufe '+(st.idx+1)+': '+st.n+' – wähle deinen Gärtner';
  $('ovHero').classList.remove('hide');
}
