"use strict";
var MAX_HP = 30, MAX_MANA = 10, MAX_BOARD = 5, MAX_HAND = 8;
var P2_BONUS_TURNS = 3;
var START_HAND = 5, DRAW_PER_TURN = 2, DRAW_COST = 2, DECK_COPIES = 3;
var ABIL = {
  rush:   {icon:'⚡', name:'Schnellwuchs', desc:'Kann sofort in dem Zug angreifen, in dem sie gepflanzt wird.'},
  fly:    {icon:'🍃', name:'Schweben', desc:'Schwebt über gegnerische Wächter hinweg (ignoriert sie).'},
  shield: {icon:'🛡️', name:'Schild', desc:'Der erste erlittene Schaden wird komplett geblockt (Schutzblase aus Tau).'},
  poison: {icon:'🧪', name:'Gift', desc:'Wer von ihr Schaden nimmt (auch beim Gegenangriff), wird vergiftet 🧪: verliert zu Beginn jedes eigenen Zuges 1 ❤️.'},
  guard:  {icon:'🧱', name:'Wächter', desc:'Gegner müssen zuerst Wächter angreifen (außer schwebende Pflanzen).'}
};
var MONSTERS = [
  {id:'ratte',    name:'Löwenzahn',     emoji:'🌼', cost:1, atk:1, hp:2, ab:[]},
  {id:'fleder',   name:'Ahornsamen',    emoji:'🍁', cost:1, atk:2, hp:1, ab:['fly']},
  {id:'wolf',     name:'Sonnenblume',   emoji:'🌻', cost:2, atk:2, hp:1, ab:['rush']},
  {id:'schlange', name:'Dornenranke',   emoji:'☘️', cost:2, atk:1, hp:3, ab:['poison']},
  {id:'skelett',  name:'Pilz',          emoji:'🍄', cost:2, atk:2, hp:2, ab:[]},
  {id:'fee',      name:'Aloe',          emoji:'🪴', cost:3, atk:2, hp:5, ab:[]},
  {id:'kroete',   name:'Kaktus',        emoji:'🌵', cost:3, atk:2, hp:5, ab:['guard']},
  {id:'greif',    name:'Lavendel',      emoji:'🪻', cost:4, atk:4, hp:4, ab:['fly']},
  {id:'einhorn',  name:'Seerose',       emoji:'🪷', cost:4, atk:3, hp:3, ab:['shield']},
  {id:'oger',     name:'Fliegenfalle',  emoji:'🌿', cost:5, atk:7, hp:6, ab:[]},
  {id:'golem',    name:'Eichenwächter', emoji:'🌳', cost:6, atk:4, hp:7, ab:['guard']},
  {id:'drache',   name:'Feuerlilie',    emoji:'🌺', cost:8, atk:7, hp:7, ab:['fly']},
  // seltene Pflanzen (v14)
  {id:'edelweiss',  name:'Edelweiß',        emoji:'🤍', cost:2, atk:2, hp:3, ab:[]},
  {id:'kanne',      name:'Kannenpflanze',   emoji:'🫖', cost:3, atk:3, hp:4, ab:[]},
  {id:'blaulotus',  name:'Blauer Lotus',    emoji:'💠', cost:3, atk:2, hp:6, ab:[]},
  {id:'mondblume',  name:'Mondblume',       emoji:'🌙', cost:4, atk:4, hp:5, ab:['fly']},
  {id:'orchidee',   name:'Kristallorchidee',emoji:'💎', cost:5, atk:3, hp:4, ab:['shield']},
  {id:'drachenbaum',name:'Drachenbaum',     emoji:'🌴', cost:6, atk:4, hp:7, ab:['guard']},
  {id:'baobab',     name:'Baobab',          emoji:'🌳', cost:8, atk:4, hp:12, ab:['guard']},
  {id:'titanwurz',  name:'Titanwurz',       emoji:'🌋', cost:9, atk:7, hp:9, ab:[]}
];
/* ---------- Seltenheit: c=Gewöhnlich, s=Selten, e=Episch, l=Legendär (bestimmt auch die Anzahl im Deck) ---------- */
var RARITY={c:{n:'Gewöhnlich',copies:3},s:{n:'Selten',copies:2},e:{n:'Episch',copies:1},l:{n:'Legendär',copies:1}};
var RAR={greif:'s',einhorn:'s',oger:'s',golem:'s',drache:'e',edelweiss:'s',kanne:'s',blaulotus:'s',mondblume:'e',orchidee:'e',drachenbaum:'e',baobab:'l',titanwurz:'l'};
function rarOf(id){var t=MBYID[id];if(t&&t.mega)return 'e';if(t&&t.recipe)return 'e';return RAR[id]||'c';}
var MBYID = {};
MONSTERS.forEach(function(m){MBYID[m.id]=m;});
/* ---------- Zauber- & Fallenkarten ---------- */
var MAX_TRAPS = 2, SPELL_COPIES = 1;
var SPELLS = [
  {id:'feuerball',   type:'spell', name:'Sonnenstrahl',  emoji:'☀️', cost:3, v:5, tgt:'enemyAny', s:'5 Schaden',      d:'5 Schaden an eine gegnerische Pflanze oder den gegnerischen Kristall.'},
  {id:'heiltrank',   type:'spell', name:'Kamillentee',   emoji:'🍵', cost:1, v:4, tgt:'ownAny',   s:'+4 ❤️',         d:'Heilt dich oder eine eigene Pflanze um 4 ❤️ und entfernt Gift 🧪.'},
  {id:'blitz',       type:'spell', name:'Gewitter',      emoji:'⚡', cost:4, v:2, tgt:null,       s:'2 an alle',      d:'2 Schaden an alle gegnerischen Pflanzen.'},
  {id:'verstaerkung',type:'spell', name:'Dünger',        emoji:'🌱', cost:2, tgt:'ownMon',   s:'+2/+2',          d:'Eine eigene Pflanze bekommt dauerhaft +2 ⚔️ und +2 ❤️.'},
  {id:'wissen',      type:'spell', name:'Gartenbuch',    emoji:'📖', cost:1, tgt:null,       s:'+2 Karten',      d:'Ziehe 2 Karten.'},
  {id:'frost',       type:'spell', name:'Raureif',       emoji:'❄️', cost:1, tgt:'enemyMon', s:'Erstarrt',       d:'1 Schaden an eine gegnerische Pflanze. Sie erstarrt 🧊 und kann ihren nächsten Zug nicht angreifen.'},
  {id:'spiegel',     type:'trap',  name:'Tauspiegel',    emoji:'💧', cost:2, on:'atkHero',   s:'Prallt ab', d:'Falle: Greift eine gegnerische Pflanze deinen Kristall an, prallt der Angriff ab – die Pflanze erleidet ihren eigenen Schaden.'},
  {id:'grube',       type:'trap',  name:'Steinboden',    emoji:'🪨', cost:2, v:4, on:'summon',    s:'4 an Neues',     d:'Falle: Pflanzt der Gegner eine Pflanze aus der Hand, erleidet sie sofort 4 Schaden.'},
  {id:'giftfalle',   type:'trap',  name:'Nesselfalle',   emoji:'🥀', cost:1, on:'atk',       s:'Angreifer 🧪',   d:'Falle: Greift eine gegnerische Pflanze an, erleidet sie 1 Schaden und wird vergiftet 🧪.'}
];
var SBYID = {};
SPELLS.forEach(function(x){SBYID[x.id]=x;});
function cardDef(id){return SBYID[id]||MBYID[id]||null;}
function isMonCard(id){return !SBYID[id]&&!!MBYID[id];}
/* ---------- Helden mit Heldenkraft (1× pro Zug) ---------- */
var HEROES = [
  {id:'druide',    name:'Wurzelhüter',  face:'🌳', pw:{i:'🌿', n:'Wildwuchs',  cost:2, tgt:'ownMon',        s:'+1/+1',      d:'Eine eigene Pflanze bekommt dauerhaft +1 ⚔️ und +1 ❤️.'}},
  {id:'nekromant', name:'Pilzgärtner',  face:'🍄', pw:{i:'🌱', n:'Keimruf',    cost:2, tgt:null,            s:'Pilzkeim 1/1',d:'Ein Pilzkeim (1/1) wächst auf deiner Seite.'}},
  {id:'magier',    name:'Sonnenglut',   face:'🔆', pw:{i:'💥', n:'Glutfunke',  cost:2, v:2, tgt:'enemyMon',      s:'2 Schaden',  d:'2 Schaden an eine gegnerische Pflanze (auch hinter Wächtern).'}},
  {id:'ritter',    name:'Rindenschild', face:'🪵', pw:{i:'🛡️', n:'Rindenschutz',cost:2, tgt:'ownMonNoShield',s:'🛡️ Schild',  d:'Eine eigene Pflanze ohne Schild bekommt einen 🛡️ Schild.'}},
  {id:'haendler',  name:'Samenhändler', face:'🌰', pw:{i:'🌰', n:'Samentausch',cost:1, tgt:null,            s:'+1 Karte',   d:'Ziehe 1 Karte.'}}
];
var HBYID = {};
HEROES.forEach(function(h){HBYID[h.id]=h;});
function randHero(){return HEROES[Math.floor(Math.random()*HEROES.length)].id;}
// optionale Effekt-Funktionen (gibt es nur mit 3D-Engine; in der Simulation fehlen sie)
function fxc(name,a,b,c,d){try{var f=(typeof window!=='undefined'&&window)?window[name]:null;if(typeof f==='function')return f(a,b,c,d);}catch(e){console.warn(e);}return null;}
// Fortschritt/Erfolge (meta.js) – in der Simulation inaktiv
function track(pi,ev,d){if(!G||G.mode==='sim')return;try{if(typeof metaTrack==='function')metaTrack(pi,ev,d||{});}catch(e){console.warn(e);}}
/* ---------- Fusion ---------- */
var FUSE_COST = 1, MEGA_MULT = 1.5, MEGA_NO_EXTRA = ['golem','drache'];
var MEGA_NAMES = {ratte:'Löwenzahnwiese',fleder:'Ahornsturm',wolf:'Sonnenblumenfeld',schlange:'Frostranke',skelett:'Pilzkreis',fee:'Riesenaloe',kroete:'Riesenkaktus',greif:'Lavendelsturm',einhorn:'Riesenseerose',oger:'Riesenfalle',golem:'Ureiche',drache:'Sonnenlilie',edelweiss:'Edelweißwiese',kanne:'Riesenkanne',blaulotus:'Lotusteich',mondblume:'Mondgarten',orchidee:'Kristallgarten',drachenbaum:'Drachenhain',baobab:'Urbaobab',titanwurz:'Titanenblüte'};
var RECIPES = [
  {a:'wolf',b:'fleder',id:'vampirwolf',name:'Wirbelblüte',emoji:'🍂',atk:4,hp:4,ab:['fly','rush']},
  {a:'ratte',b:'schlange',id:'pestschwarm',name:'Platzkürbis',emoji:'🟠',atk:2,hp:5,ab:['poison','guard']},
  {a:'skelett',b:'oger',id:'todesritter',name:'Dornenrose',emoji:'🌹',atk:6,hp:6,ab:['shield','rush']},
  {a:'fee',b:'einhorn',id:'pegasus',name:'Lichtlotus',emoji:'🌸',atk:4,hp:8,ab:['fly','shield']},
  {a:'kroete',b:'golem',id:'bergkoloss',name:'Mammutbaum',emoji:'🌲',atk:4,hp:12,ab:['guard','shield']},
  {a:'schlange',b:'drache',id:'hydra',name:'Bambushain',emoji:'🎋',atk:7,hp:7,ab:['fly','poison']}
];
MONSTERS.forEach(function(m){
  // Riesen-Eiche und Sonnenlilie sind schon durch ihre Fähigkeit stark genug: keine Extra-Eigenschaft
  var ab=m.ab.slice();if(MEGA_NO_EXTRA.indexOf(m.id)<0)ab.push(ab.indexOf('shield')<0?'shield':'rush');
  MBYID['mega_'+m.id]={id:'mega_'+m.id,base:m.id,name:MEGA_NAMES[m.id],emoji:m.emoji,cost:m.cost*2,atk:Math.round(m.atk*MEGA_MULT),hp:Math.round(m.hp*MEGA_MULT),ab:ab,fused:true,mega:true};
});
MBYID['mega_drache'].atk=10;MBYID['mega_drache'].hp=10;
MBYID['mega_golem'].atk=5;MBYID['mega_golem'].hp=10;
RECIPES.forEach(function(r){MBYID[r.id]={id:r.id,name:r.name,emoji:r.emoji,cost:MBYID[r.a].cost+MBYID[r.b].cost,atk:r.atk,hp:r.hp,ab:r.ab.slice(),fused:true,recipe:r};});
/* ---------- Spezialfähigkeiten: jede Pflanze hat ihre eigene ---------- */
var SPEC={
  ratte:{i:'🌱',n:'Aussaat',s:'+1 Pusteblume',d:'Beim Pflanzen wächst eine Pusteblume (1/1) dazu.',
    can:function(pi){return G.players[pi].board.length<MAX_BOARD;},enter:function(pi,m){spawnToken(pi,'ratte','Pusteblume',1,1,m);}},
  fleder:{i:'💧',n:'Nektar',s:'Heilt dich beim Treffen',d:'Du heilst so viel ❤️, wie sie Schaden macht.',
    hit:function(pi,m,d){healHero(pi,d);}},
  wolf:{i:'☀️',n:'Sonnenschein',s:'Andere +1 ⚔️',d:'Beim Pflanzen bekommen deine anderen Pflanzen +1 ⚔️.',
    can:function(pi,m){return others(pi,m).length>0;},enter:function(pi,m){buffOthers(pi,m,1);}},
  schlange:{i:'♻️',n:'Nachwachsen',s:'Heilt sich jeden Zug',d:'Zu Beginn deines Zuges heilt sie sich vollständig.',
    can:function(pi,m){return m.hp<m.maxHp;},turn:function(pi,m){healMon(m,m.maxHp);}},
  skelett:{i:'🍄',n:'Myzel',s:'Wächst 1× nach',d:'Welkt er zum ersten Mal, wächst er mit 1 ❤️ wieder nach.',revive:true},
  fee:{i:'💚',n:'Heilsaft',s:'Heilt jeden Zug',d:'Zu Beginn deines Zuges: deine Pflanzen +1 ❤️ und du +2 ❤️.',
    turn:function(pi,m){healHero(pi,2);G.players[pi].board.forEach(function(x){healMon(x,1);});}},
  kroete:{i:'🌵',n:'Stacheln',s:'Angreifer −1 ❤️',d:'Wer sie angreift, erleidet 1 Extraschaden.',thorns:1},
  greif:{i:'🎯',n:'Duftflug',s:'+2 auf Kristall',d:'Greift sie den gegnerischen Kristall an, macht sie +2 Schaden.',heroBonus:2},
  einhorn:{i:'✨',n:'Blütenschutz',s:'Schild für Freund',d:'Beim Pflanzen bekommt eine andere deiner Pflanzen auch einen 🛡️ Schild.',
    can:function(pi,m){return others(pi,m).some(function(x){return !x.shield;});},
    enter:function(pi,m){var o=others(pi,m).filter(function(x){return !x.shield;});if(o.length)giveShield(o[Math.floor(Math.random()*o.length)]);}},
  oger:{i:'💰',n:'Wurzelräuber',s:'Kristall-Treffer: +1 Karte',d:'Trifft sie den gegnerischen Kristall, ziehst du 1 Karte.',
    heroHit:function(pi,m){drawBonus(pi,1);}},
  golem:{i:'🪵',n:'Rinde',s:'−1 Schaden je Treffer',d:'Erleidet bei jedem Treffer 1 Schaden weniger.',armor:1},
  drache:{i:'🔥',n:'Glutpollen',s:'1 Schaden an alle',d:'Beim Pflanzen: 1 Schaden an alle gegnerischen Pflanzen.',
    can:function(pi){return G.players[1-pi].board.length>0;},enter:function(pi,m){aoe(pi,1,false);}},
  edelweiss:{i:'🏔️',n:'Bergsegen',s:'Freund +2 ❤️',d:'Beim Pflanzen bekommt eine andere deiner Pflanzen dauerhaft +2 ❤️.',
    can:function(pi,m){return others(pi,m).length>0;},enter:function(pi,m){var o=others(pi,m);var x=o[Math.floor(Math.random()*o.length)];x.hp+=2;x.maxHp+=2;fxFloatMon(x.uid,'+2 ❤️','heal');}},
  kanne:{i:'🫖',n:'Verdauen',s:'Sieg: +1 ⚔️ & heilt',d:'Besiegt sie eine Pflanze, bekommt sie +1 ⚔️ und heilt sich vollständig.',
    can:function(pi,m){return m.hp>0;},kill:function(pi,m){m.atk+=1;healMon(m,m.maxHp);fxFloatMon(m.uid,'+1 ⚔️','info');}},
  blaulotus:{i:'💧',n:'Ruhewasser',s:'Heilt 3 jeden Zug',d:'Zu Beginn deines Zuges: Die am stärksten verletzte eigene Pflanze heilt 3 ❤️ (sonst du +2 ❤️).',
    turn:function(pi,m){var b=G.players[pi].board.filter(function(x){return x.hp>0&&x.hp<x.maxHp;}).sort(function(x,y){return (y.maxHp-y.hp)-(x.maxHp-x.hp);})[0];if(b)healMon(b,3);else healHero(pi,2);}},
  mondblume:{i:'🌙',n:'Mondlicht',s:'Jeden Zug: +1/+1',d:'Zu Beginn deines Zuges bekommt eine andere deiner Pflanzen (oder sie selbst, wenn sie allein ist) dauerhaft +1 ⚔️ und +1 ❤️.',
    turn:function(pi,m){var o=others(pi,m);var x=o.length?o[Math.floor(Math.random()*o.length)]:m;x.atk+=1;x.hp+=1;x.maxHp+=1;fxFloatMon(x.uid,'+1/+1','info');}},
  orchidee:{i:'🔷',n:'Prismastrahl',s:'3 an stärksten Gegner',d:'Beim Pflanzen: 3 Schaden an die gegnerische Pflanze mit dem meisten ⚔️.',
    can:function(pi){return G.players[1-pi].board.length>0;},enter:function(pi,m){var b=G.players[1-pi].board.filter(function(x){return x.hp>0;}).sort(function(x,y){return y.atk-x.atk;})[0];if(b)dealDamage(b,3,null);}},
  drachenbaum:{i:'🩸',n:'Harzpanzer',s:'Max. 3 Schaden je Treffer',d:'Erleidet pro Treffer höchstens 3 Schaden.',cap:3},
  baobab:{i:'🌳',n:'Lebensbaum',s:'Jeden Zug: alle +1 ❤️, du +2',d:'Zu Beginn deines Zuges: deine Pflanzen heilen 1 ❤️ und du +2 ❤️.',
    turn:function(pi,m){healHero(pi,2);G.players[pi].board.forEach(function(x){healMon(x,1);});}},
  titanwurz:{i:'🌋',n:'Riesenblüte',s:'Alle Gegner 🧪 + 1 Schaden',d:'Beim Pflanzen: Alle gegnerischen Pflanzen erleiden 1 Schaden und werden vergiftet 🧪.',
    can:function(pi){return G.players[1-pi].board.length>0;},enter:function(pi,m){G.players[1-pi].board.slice().forEach(function(x){if(x.hp<=0)return;dealDamage(x,1,null);if(x.hp>0&&!x.poisoned){x.poisoned=true;try{fxPoison(x.uid);}catch(e){}}});}},
  mega_edelweiss:{i:'🏔️',n:'Alpenglühen',s:'Alle Freunde +2 ❤️',d:'Beim Entstehen bekommen alle deine anderen Pflanzen dauerhaft +2 ❤️.',
    can:function(pi,m){return others(pi,m).length>0;},enter:function(pi,m){others(pi,m).forEach(function(x){x.hp+=2;x.maxHp+=2;fxFloatMon(x.uid,'+2 ❤️','heal');});}},
  mega_kanne:{i:'🫖',n:'Großer Hunger',s:'Sieg: +2 ⚔️ & heilt',d:'Besiegt sie eine Pflanze, bekommt sie +2 ⚔️ und heilt sich vollständig.',
    can:function(pi,m){return m.hp>0;},kill:function(pi,m){m.atk+=2;healMon(m,m.maxHp);fxFloatMon(m.uid,'+2 ⚔️','info');}},
  mega_blaulotus:{i:'💧',n:'Lotusquelle',s:'Alle heilen 2',d:'Zu Beginn deines Zuges: deine Pflanzen heilen 2 ❤️ und du +2 ❤️.',
    turn:function(pi,m){healHero(pi,2);G.players[pi].board.forEach(function(x){healMon(x,2);});}},
  mega_ratte:{i:'🌼',n:'Samenflut',s:'Jeden Zug Pusteblume',d:'Zu Beginn deines Zuges wächst eine Pusteblume (1/1) dazu.',
    can:function(pi){return G.players[pi].board.length<MAX_BOARD;},turn:function(pi,m){spawnToken(pi,'ratte','Pusteblume',1,1,m);}},
  mega_fleder:{i:'💧',n:'Nektarquelle',s:'Heilt dich & sich',d:'Du und sie heilen so viel ❤️, wie sie Schaden macht.',
    hit:function(pi,m,d){healHero(pi,d);if(m.hp>0)healMon(m,d);}},
  mega_wolf:{i:'☀️',n:'Sommerglanz',s:'Andere +1/+1',d:'Beim Entstehen bekommen deine anderen Pflanzen +1 ⚔️ und +1 ❤️.',
    can:function(pi,m){return others(pi,m).length>0;},enter:function(pi,m){others(pi,m).forEach(function(x){x.atk+=1;x.hp+=1;x.maxHp+=1;fxFloatMon(x.uid,'+1/+1','info');});}},
  mega_schlange:{i:'🧊',n:'Raureif',s:'Stärkster Gegner erstarrt',d:'Beim Entstehen erstarrt die stärkste gegnerische Pflanze: Sie kann ihren nächsten Zug nicht angreifen.',
    can:function(pi){return G.players[1-pi].board.length>0;},enter:function(pi,m){var b=G.players[1-pi].board.slice().sort(function(x,y){return y.atk-x.atk;})[0];if(b){b.frozen=true;fxFloatMon(b.uid,'🧊 Erstarrt!','info');}}},
  mega_skelett:{i:'🍄',n:'Sporenkreis',s:'Welke → Pilzkeim',d:'Welkt eine andere deiner Pflanzen, wächst ein Pilzkeim (1/1).',
    allyDeath:function(pi,m,dead){spawnToken(pi,'skelett','Pilzkeim',1,1,m);}},
  mega_fee:{i:'⛲',n:'Lebensquell',s:'Heilt +2 jeden Zug',d:'Zu Beginn deines Zuges: deine Pflanzen +2 ❤️ und du +3 ❤️.',
    turn:function(pi,m){healHero(pi,3);G.players[pi].board.forEach(function(x){healMon(x,2);});}},
  mega_kroete:{i:'🌵',n:'Dornenpanzer',s:'Angreifer −3 ❤️',d:'Wer sie angreift, erleidet 3 Extraschaden.',thorns:3},
  mega_greif:{i:'🌪️',n:'Samensturm',s:'Nach Angriff: Sturm',d:'Nach jedem ihrer Angriffe: 1 Schaden an alle gegnerischen Pflanzen.',
    can:function(pi){return G.players[1-pi].board.some(function(x){return x.hp>0;});},after:function(pi,m){aoe(pi,1,false);}},
  mega_einhorn:{i:'🌟',n:'Lotussegen',s:'Schild für alle',d:'Beim Entstehen bekommen alle deine Pflanzen einen 🛡️ Schild.',
    enter:function(pi,m){G.players[pi].board.forEach(function(x){if(!x.shield)giveShield(x);});}},
  mega_oger:{i:'💎',n:'Goldernte',s:'Kristall-Treffer: 2 Karten +2💎',d:'Trifft sie den gegnerischen Kristall: Du ziehst 2 Karten und bekommst +2 💎 Mana.',
    heroHit:function(pi,m){drawBonus(pi,2);var p=G.players[pi];p.mana=Math.min(MAX_MANA,p.mana+2);}},
  mega_golem:{i:'🌳',n:'Wurzelbeben',s:'1 an alle',d:'Beim Entstehen: 1 Schaden an alle gegnerischen Pflanzen.',
    enter:function(pi,m){aoe(pi,1,false);}},
  mega_drache:{i:'🔆',n:'Hitzewelle',s:'Entstehen: 2 an alle',d:'Beim Entstehen: 2 Schaden an alle gegnerischen Pflanzen.',
    can:function(pi){return G.players[1-pi].board.length>0;},enter:function(pi,m){aoe(pi,2,false);}},
  vampirwolf:{i:'🌀',n:'Rankenrausch',s:'Sieg: nochmal angreifen',d:'Besiegt sie eine Pflanze, darf sie (1× pro Zug) gleich nochmal angreifen.',
    can:function(pi,m){return !m.extraUsed&&m.hp>0;},kill:function(pi,m){m.extraUsed=true;m.canAttack=true;}},
  pestschwarm:{i:'💥',n:'Kernregen',s:'Welkt: 1 an alle',d:'Welkt er, erleiden alle gegnerischen Pflanzen 1 Schaden.',
    death:function(pi,m){aoe(pi,1,false);}},
  todesritter:{i:'🌱',n:'Nährboden',s:'Sieg: +2/+2',d:'Besiegt sie eine Pflanze, bekommt sie +2 ⚔️ und +2 ❤️.',
    can:function(pi,m){return m.hp>0;},kill:function(pi,m){m.atk+=2;m.hp+=2;m.maxHp+=2;fxFloatMon(m.uid,'+2/+2','heal');}},
  pegasus:{i:'💧',n:'Morgentau',s:'Heilt & schützt',d:'Zu Beginn deines Zuges: du +2 ❤️ und eine eigene Pflanze ohne Schild bekommt einen 🛡️ Schild.',
    turn:function(pi,m){healHero(pi,2);var o=G.players[pi].board.filter(function(x){return !x.shield&&x.hp>0;});if(o.length)giveShield(o[Math.floor(Math.random()*o.length)]);}},
  bergkoloss:{i:'🌳',n:'Blätterdach',s:'Freunde −1 Schaden',d:'Deine anderen Pflanzen erleiden 1 Schaden weniger pro Treffer.'},
  hydra:{i:'🎋',n:'Drei Halme',s:'Trifft auch Nachbarn',d:'Greift sie eine Pflanze an, erleiden deren Nachbarn je 1 Schaden.',splash:1}
};
function spec(m){return m&&m.sp?SPEC[m.sp]||null:null;}
function ownerOf(m){for(var i=0;i<2;i++)if(G.players[i].board.indexOf(m)>=0)return i;return -1;}
function others(pi,m){return G.players[pi].board.filter(function(x){return x!==m&&x.hp>0;});}
function announce(m){var s=spec(m);if(!s)return;try{fxAbility(m.uid,s.i+' '+s.n);}catch(e){}log('✨ '+m.emoji+' '+m.name+': <b>'+s.n+'</b>!');}
function healHero(pi,amt){var p=G.players[pi];var h=Math.max(0,Math.min(amt,(p.maxHp||MAX_HP)-p.hp));if(h>0){p.hp+=h;try{fxHealHero(pi,'+'+h);}catch(e){}}return h;}
function healMon(m,amt){var d=Math.max(0,Math.min(amt,m.maxHp-m.hp));if(d>0&&m.hp>0){m.hp+=d;try{fxHealMon(m.uid,'+'+d);}catch(e){}}return d;}
function buffOthers(pi,m,n){others(pi,m).forEach(function(x){x.atk+=n;fxFloatMon(x.uid,'+'+n+' ⚔️','info');});}
function giveShield(x){x.shield=true;fxFloatMon(x.uid,'🛡️ Schild!','info');}
function drawBonus(pi,n){for(var i=0;i<n;i++)drawCard(pi,false);try{fxDrawCard(pi);}catch(e){}}
function aoe(pi,amt,hero){var e=G.players[1-pi];e.board.slice().forEach(function(x){if(x.hp>0)dealDamage(x,amt,null);});if(hero)hurtHero(1-pi,amt,pi);}
function hurtHero(pi,amt,src){if(amt<=0)return;var p=G.players[pi];p.hp-=amt;G.dmg[pi]+=amt;try{fxHitHero(pi,'-'+amt);}catch(e){}if(src!=null&&src!==pi)track(src,'heroDmg',{n:amt});}
function spawnToken(pi,id,name,atk,hp,near){
  var p=G.players[pi];if(p.board.length>=MAX_BOARD)return null;var t=MBYID[id];
  var m={uid:++uidc,id:id,name:name,emoji:t.emoji,cost:1,atk:atk,hp:hp,maxHp:hp,ab:[],shield:false,canAttack:false,fresh:true,token:true,sp:null};
  var idx=near?p.board.indexOf(near):-1;if(idx>=0)p.board.splice(idx+1,0,m);else p.board.push(m);
  log('🌱 '+t.emoji+' '+name+' wächst.');
  try{render();}catch(e){}
  return m;
}
// "Beim Beschwören" / "Beim Entstehen"
async function runEnter(pi,m){
  var s=spec(m);if(!s||!s.enter||G.over||m.hp<=0)return;
  if(s.can&&!s.can(pi,m))return;
  announce(m);await sleep(600);
  try{s.enter(pi,m);}catch(err){console.warn(err);}
  try{render();}catch(e){}
  await sleep(500);
  await removeDead();render();checkWin();
}
function fusionResult(a,b){
  if(!MBYID[a]||!MBYID[b]||MBYID[a].fused||MBYID[b].fused)return null;
  if(a===b)return MBYID['mega_'+a];
  for(var i=0;i<RECIPES.length;i++){var r=RECIPES[i];if((r.a===a&&r.b===b)||(r.a===b&&r.b===a))return MBYID[r.id];}
  return null;
}
function fusePartners(pi,uid){var p=G.players[pi];var m=p.board.filter(function(x){return x.uid===uid;})[0];if(!m)return [];
  return p.board.filter(function(x){return x.uid!==uid&&!!fusionResult(m.id,x.id);}).map(function(x){return x.uid;});}
function fusionPairs(pi){var p=G.players[pi],res=[];for(var i=0;i<p.board.length;i++)for(var j=i+1;j<p.board.length;j++){var r=fusionResult(p.board[i].id,p.board[j].id);if(r)res.push({a:p.board[i],b:p.board[j],r:r});}return res;}
function canFuseNow(pi){var p=G.players[pi];return !p.fusedThisTurn&&p.mana>=FUSE_COST&&fusionPairs(pi).length>0;}
async function doFusion(pi,uA,uB){
  var p=G.players[pi];
  var A=p.board.filter(function(x){return x.uid===uA;})[0],B=p.board.filter(function(x){return x.uid===uB;})[0];
  if(!A||!B||G.over)return false;
  var res=fusionResult(A.id,B.id);if(!res||p.fusedThisTurn||p.mana<FUSE_COST)return false;
  G.busy=true;G.fuseMode=false;G.fuseFirst=null;G.sel=null;
  p.mana-=FUSE_COST;p.fusedThisTurn=true;
  G.fusions=(G.fusions||0)+1;
  log('🌀 Kreuzung! '+A.emoji+' '+A.name+' + '+B.emoji+' '+B.name+' = '+res.emoji+' '+res.name+'!');
  render();
  try{await fxFusion(A.uid,B.uid);}catch(err){console.warn(err);}
  var idx=p.board.indexOf(A);
  var ready=A.canAttack||B.canAttack||has(res,'rush');
  var m={uid:++uidc,id:res.id,name:res.name,emoji:res.emoji,cost:res.cost,atk:res.atk,hp:res.hp,maxHp:res.hp,ab:res.ab.slice(),shield:has(res,'shield'),canAttack:ready,fresh:!ready,fused:true,fusionSpawn:true,sp:res.id};
  p.board=p.board.filter(function(x){return x!==A&&x!==B;});
  p.board.splice(Math.min(Math.max(0,idx),p.board.length),0,m);
  G.busy=false;
  try{render();}catch(err){console.warn(err);}
  await sleep(1000);
  render();
  track(pi,'fusion',{id:res.id,mega:!!res.mega});
  G.busy=true;try{await runEnter(pi,m);}finally{G.busy=false;}
  render();
  return true;
}

var G = null, uidc = 0;
function $(id){return document.getElementById(id);}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function has(m,a){return m.ab.indexOf(a)>=0;}
function isDu(p){return p.name==='Du';}

function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function makeDeck(){var d=[];MONSTERS.forEach(function(m){var n=RARITY[rarOf(m.id)].copies;for(var c=0;c<n;c++)d.push(m.id);});SPELLS.forEach(function(x){for(var c=0;c<SPELL_COPIES;c++)d.push(x.id);});return shuffle(d).map(function(id){return {uid:++uidc,id:id};});}
function newPlayer(name,hid){var h=HBYID[hid]||HEROES[0];return {name:name,hero:h.id,face:h.face,hp:MAX_HP,maxMana:0,mana:0,deck:makeDeck(),hand:[],board:[],traps:[],fatigue:0,turns:0,powerUsed:false};}
function who(p,du,er){return isDu(p)?du:p.name+' '+er;}

function viewer(){return G.mode==='pvp'?G.cur:0;}
function isHumanTurn(){return !!G && !G.over && (G.mode==='pvp' || G.cur===0);}
function log(msg){G.log.push(msg);if(G.log.length>40)G.log.shift();renderLog();}

function newGame(mode,heroes,camp){
  uidc=0;
  if(G) G.over=true;
  heroes=(heroes&&heroes.length===2)?heroes.slice():[randHero(),randHero()];
  G={mode:mode,cur:0,round:1,over:false,busy:false,sel:null,aim:null,log:[],gen:(G?G.gen+1:1),heroIds:heroes,dmg:[0,0],
     players: mode==='cpu' ? [newPlayer('Du',heroes[0]),newPlayer('Computer',heroes[1])] : [newPlayer('Spieler 1',heroes[0]),newPlayer('Spieler 2',heroes[1])]};
  // Kampagne: Gegner bekommt Lebenspunkte, Deck-Thema und Besonderheiten der Stufe
  G.camp=(camp&&typeof CBYID!=='undefined'&&CBYID[camp])?camp:null;
  if(G.camp)applyCampaign(CBYID[G.camp]);
  for(var i=0;i<START_HAND;i++)drawCard(0,true);
  for(var k=0;k<START_HAND+1;k++)drawCard(1,true);
  hideAll();
  resetScene();
  setCamAngle(0,true);
  log(mode==='cpu'?'Das Duell beginnt! Du fängst an.':'Das Duell beginnt! Spieler 1 fängt an.');
  if(mode==='pvp'){showHandoff();render();} else startTurn();
}

function drawCard(pi,silent){
  var p=G.players[pi];
  if(!p.deck.length){p.fatigue++;p.hp-=p.fatigue;G.dmg[pi]+=p.fatigue;if(!silent){log('🍂 '+(isDu(p)?'Du hast keine Karten mehr und erleidest ':p.name+' hat keine Karten mehr und erleidet ')+p.fatigue+' Schaden!');fxHitHero(pi,'-'+p.fatigue);}return;}
  var c=p.deck.pop();
  if(p.hand.length>=MAX_HAND){if(!silent)log('🔥 '+(isDu(p)?'Deine':p.name+'s')+' Hand ist voll – '+cardDef(c.id).name+' verwelkt.');return;}
  p.hand.push(c);
}

function showHandoff(){
  var p=G.players[G.cur];
  $('handTitle').textContent=p.name+' ist dran';
  $('handEmoji').textContent=p.face;
  $('handText').textContent=(G.round===1&&G.cur===0)?'Spieler 1 beginnt. Spieler 2 schaut bitte weg!':'Gib das Gerät an '+p.name+' weiter. Der andere Spieler schaut bitte weg!';
  $('ovHand').classList.remove('hide');
}

async function startTurn(){
  var gen=G.gen;
  var p=G.players[G.cur];
  if(G.mode==='pvp') setCamAngle(G.cur===0?0:Math.PI,false);
  p.maxMana=Math.min(MAX_MANA,p.maxMana+1);p.mana=p.maxMana;
  // Ausgleich für den Nachziehenden: Spieler 2 bekommt in seinen ersten Zügen +1 💎 Bonus
  if(G.cur===1&&!p.noBonus&&(p.turns||0)<P2_BONUS_TURNS){p.mana+=1;p.bonusMana=true;log('💎 Ausgleich: '+(isDu(p)?'Du bekommst':p.name+' bekommt')+' +1 Bonus-Mana.');}else p.bonusMana=false;
  if(p.manaBonus){p.mana+=p.manaBonus;}
  p.board.forEach(function(m){m.canAttack=true;m.fresh=false;m.extraUsed=false;m.stunned=false;if(m.frozen){m.frozen=false;m.stunned=true;m.canAttack=false;}});
  p.fusedThisTurn=false;p.powerUsed=false;G.fuseMode=false;G.fuseFirst=null;G.aim=null;
  G.sel=null;
  render();
  p.turns=(p.turns||0)+1;
  // im allerersten eigenen Zug spielt man mit der Starthand, danach 2 Karten pro Zug
  if(p.turns>1){for(var dc=0;dc<DRAW_PER_TURN&&!G.over;dc++){drawCard(G.cur,false);if(dc===0&&DRAW_PER_TURN>1)await sleep(120);}}
  render();
  if(checkWin())return;
  var pois=p.board.filter(function(m){return m.poisoned&&m.hp>0;});
  if(pois.length){pois.forEach(function(m){m.hp-=1;try{fxHitMon(m.uid,'🧪-1');}catch(e){}});log('🧪 Gift: '+pois.map(function(m){return m.emoji+' '+m.name;}).join(', ')+(pois.length>1?' verlieren je':' verliert')+' 1 ❤️.');render();await sleep(500);await removeDead();render();if(checkWin())return;}
  var pi0=G.cur,tm=p.board.slice();
  var hasTurnFx=tm.some(function(x){var xs=spec(x);return xs&&xs.turn;});
  if(hasTurnFx)G.busy=true;
  try{
  for(var i=0;i<tm.length&&!G.over&&gen===G.gen;i++){
    var h=tm[i],hs=spec(h);
    if(!hs||!hs.turn||h.hp<=0||p.board.indexOf(h)<0)continue;
    if(hs.can&&!hs.can(pi0,h))continue;
    announce(h);
    if(hs.i==='🧚'||hs.i==='⛲'||hs.i==='☀️')try{fxHeal(h.uid);}catch(e){}
    try{hs.turn(pi0,h);}catch(err){console.warn(err);}
    render();
    await sleep(550);
    await removeDead();render();
    if(checkWin())return;
  }
  }finally{if(hasTurnFx&&gen===G.gen)G.busy=false;}
  render();
  if(checkWin())return;
  if(gen!==G.gen)return;
  if(((G.mode==='cpu'&&G.cur===1)||G.mode==='sim')&&gen===G.gen){await aiTurn(gen);}
}

async function endTurn(){
  if(G.over||G.busy)return;
  G.sel=null;G.fuseMode=false;G.fuseFirst=null;G.aim=null;
  G.cur=1-G.cur;
  if(G.cur===0)G.round++;
  log('➡️ '+(isDu(G.players[G.cur])?'Du bist':G.players[G.cur].name+' ist')+' am Zug.');
  if(G.mode==='pvp'){showHandoff();render();}
  else await startTurn();
}

function canDrawExtra(pi){var p=G.players[pi];return !G.over&&p.mana>=DRAW_COST&&p.deck.length>0&&p.hand.length<MAX_HAND;}
// Beschwörungsruf: eine Extrakarte für 2 Mana (beliebig oft pro Zug)
async function drawExtra(pi){
  if(!canDrawExtra(pi))return false;
  var p=G.players[pi];p.mana-=DRAW_COST;G.sel=null;G.xd=G.xd||[0,0];G.xd[pi]++;
  drawCard(pi,true);
  log('🃏 '+(isDu(p)?'Du rufst':p.name+' ruft')+' eine neue Karte herbei (−'+DRAW_COST+' 💎).');
  try{fxDrawCard(pi);}catch(err){}
  render();
  await sleep(350);
  return true;
}
function canSummon(pi,idx){var p=G.players[pi];var c=p.hand[idx];return !!c&&isMonCard(c.id)&&MBYID[c.id].cost<=p.mana&&p.board.length<MAX_BOARD;}

async function summon(pi,idx){
  if(!canSummon(pi,idx))return false;
  var p=G.players[pi];var c=p.hand.splice(idx,1)[0];var t=MBYID[c.id];
  p.mana-=t.cost;
  var m={uid:c.uid,id:c.id,name:t.name,emoji:t.emoji,cost:t.cost,atk:t.atk,hp:t.hp,maxHp:t.hp,ab:t.ab.slice(),shield:has(t,'shield'),canAttack:has(t,'rush'),fresh:true,sp:c.id};
  p.board.push(m);
  G.sel=null;
  log('🌱 '+(isDu(p)?'Du pflanzt ':p.name+' pflanzt ')+t.emoji+' '+t.name+'.');
  var wasBusy=G.busy;G.busy=true;
  try{
    render();
    await sleep(650);
    var tr=findTrap(1-pi,'summon');
    if(tr&&!G.over){await fireTrap(1-pi,tr,{mon:m,pi:pi});await sleep(250);await removeDead();render();checkWin();}
    await runEnter(pi,m);
  }finally{G.busy=wasBusy;}
  track(pi,'summon',{id:c.id});
  render();
  return true;
}

function validTargets(pi,attacker){
  var e=G.players[1-pi];
  var guards=e.board.filter(function(m){return has(m,'guard');});
  if(guards.length&&!has(attacker,'fly'))return {mons:guards.map(function(m){return m.uid;}),hero:false};
  return {mons:e.board.map(function(m){return m.uid;}),hero:true};
}

function dealDamage(target,amt,src){
  if(amt<=0||target.hp<=0)return 0;
  if(target.shield){target.shield=false;fxShieldPop(target.uid);fxFloatMon(target.uid,'🛡️ Geblockt!','info');return 0;}
  var ts=spec(target);
  if(ts&&ts.cap&&amt>ts.cap){amt=ts.cap;announce(target);}
  if(ts&&ts.armor){amt-=ts.armor;announce(target);if(amt<=0){fxFloatMon(target.uid,'🪵 Kein Schaden','info');return 0;}}
  var o=ownerOf(target);
  if(o>=0&&G.players[o].board.some(function(x){return x!==target&&x.sp==='bergkoloss'&&x.hp>0;})){amt-=1;if(amt<=0){fxFloatMon(target.uid,'🌳 Blätterdach!','info');return 0;}}
  target.hp-=amt;
  fxHitMon(target.uid,'-'+amt);
  if(src&&has(src,'poison')&&target.hp>0&&!target.poisoned){target.poisoned=true;fxPoison(target.uid);log('🧪 '+target.emoji+' '+target.name+' ist vergiftet.');}
  return amt;
}

async function attack(pi,attUid,target){
  var p=G.players[pi],e=G.players[1-pi];
  var a=p.board.filter(function(m){return m.uid===attUid;})[0];
  if(!a||!a.canAttack||G.over)return false;
  var vt=validTargets(pi,a);
  if(target==='hero'){if(!vt.hero)return false;}else if(vt.mons.indexOf(target)<0)return false;
  G.busy=true;a.canAttack=false;G.sel=null;G.aim=null;render();
  try{
  // Fallen des Verteidigers
  var trp=target==='hero'?findTrap(1-pi,'atkHero'):null;if(!trp)trp=findTrap(1-pi,'atk');
  var cancelled=false;
  if(trp){var tdef=SBYID[trp.id];await fireTrap(1-pi,trp,{attacker:a,pi:pi});await sleep(250);if(tdef.on==='atkHero'||a.hp<=0||G.over)cancelled=true;}
  if(!cancelled){
  try{await fxLunge(a.uid,target==='hero'?{hero:1-pi}:{uid:target});}catch(err){console.warn(err);}
  var sa=spec(a),dealt=0,t=null;
  if(target==='hero'){
    var dmg=a.atk;
    if(sa&&sa.heroBonus){dmg+=sa.heroBonus;announce(a);}
    dealt=dmg;
    hurtHero(1-pi,dmg,pi);
    log('⚔️ '+a.emoji+' '+a.name+' greift '+(isDu(e)?'dich':e.name)+' an: '+dmg+' Schaden!');
    if(sa&&sa.heroHit&&dmg>0){await sleep(250);announce(a);try{sa.heroHit(pi,a);}catch(err){console.warn(err);}}
  }else{
    t=e.board.filter(function(m){return m.uid===target;})[0];
    log('⚔️ '+a.emoji+' '+a.name+' kämpft gegen '+t.emoji+' '+t.name+'.');
    var ti=e.board.indexOf(t);
    dealt=dealDamage(t,a.atk,a);
    var st=spec(t),counter=t.atk;
    if(st&&st.thorns){counter+=st.thorns;announce(t);}
    dealDamage(a,counter,t);
    if(sa&&sa.splash){var nb=[e.board[ti-1],e.board[ti+1]].filter(function(x){return x&&x.hp>0;});if(nb.length){announce(a);nb.forEach(function(x){dealDamage(x,sa.splash,null);});}}
  }
  if(dealt>0&&sa&&sa.hit&&(!sa.can||sa.can(pi,a))){announce(a);try{sa.hit(pi,a,dealt);}catch(err){console.warn(err);}}
  try{sync3D();}catch(err){console.warn(err);}
  await sleep(500);
  if(t&&t.hp<=0&&a.hp>0&&sa&&sa.kill&&(!sa.can||sa.can(pi,a))){announce(a);try{sa.kill(pi,a);}catch(err){console.warn(err);}await sleep(350);}
  if(a.hp>0&&sa&&sa.after&&(!sa.can||sa.can(pi,a))){announce(a);try{sa.after(pi,a);}catch(err){console.warn(err);}try{sync3D();}catch(err){}await sleep(450);}
  }
  await removeDead();
  }finally{G.busy=false;}
  render();
  checkWin();
  return true;
}

async function removeDead(){
  for(var loop=0;loop<8;loop++){
    var dead=[];
    G.players.forEach(function(p,pi){p.board.forEach(function(m){if(m.hp<=0)dead.push({m:m,pi:pi});});});
    if(!dead.length)return;
    // Myzel (Pilz): wächst 1× nach
    var revived=false;
    dead=dead.filter(function(d){var s=spec(d.m);if(s&&s.revive&&!d.m.revived){d.m.revived=true;d.m.hp=1;announce(d.m);revived=true;return false;}return true;});
    if(revived){try{render();}catch(e){}await sleep(450);}
    if(!dead.length)continue;
    dead.forEach(function(d){var s=spec(d.m);if(s&&s.death)announce(d.m);fxDeath(d.m.uid);});
    await sleep(700);
    G.players.forEach(function(p){p.board=p.board.filter(function(m){if(m.hp<=0){log('💥 '+m.emoji+' '+m.name+' ist verwelkt.');return false;}return true;});});
    var any=false;
    for(var i=0;i<dead.length;i++){
      var d=dead[i],s=spec(d.m);
      if(s&&s.death){try{s.death(d.pi,d.m);}catch(err){console.warn(err);}any=true;}
      var allies=G.players[d.pi].board.slice();
      for(var j=0;j<allies.length;j++){var x=allies[j],xs=spec(x);if(xs&&xs.allyDeath&&x.hp>0&&G.players[d.pi].board.length<MAX_BOARD){announce(x);try{xs.allyDeath(d.pi,x,d.m);}catch(err){console.warn(err);}any=true;}}
    }
    if(any){try{render();}catch(e){}await sleep(500);}
  }
}

function checkWin(){
  if(G.over)return true;
  var a=G.players[0],b=G.players[1];
  var winner=null;
  if(a.hp<=0&&b.hp<=0)winner=-1;else if(a.hp<=0)winner=1;else if(b.hp<=0)winner=0;
  if(winner===null)return false;
  G.over=true;G.busy=false;G.aim=null;render();
  try{if(G.mode!=='sim'&&typeof metaGameEnd==='function')metaGameEnd(winner);}catch(e){console.warn(e);}
  var cr=null;try{if(G.camp&&G.mode==='cpu'&&typeof campResult==='function')cr=campResult(winner);}catch(e){console.warn(e);}
  if(winner===-1){fxHeroDeath(0);fxHeroDeath(1);}else fxHeroDeath(1-winner);
  setTimeout(function(){
    if(winner===-1){$('overTitle').textContent='Unentschieden!';$('overText').textContent='Beide Kristalle sind gleichzeitig erloschen.';$('overEmoji').textContent='🤝';}
    else{
      var w=G.players[winner];
      $('overTitle').textContent=G.mode==='cpu'?(winner===0?'Du hast gewonnen!':'Der Computer gewinnt!'):w.name+' gewinnt!';
      $('overText').textContent=w.face+' '+w.name+' hat das Duell nach '+G.round+' Runden für sich entschieden.'+(G.fusions?' ('+G.fusions+' Kreuzungen im Spiel)':'');
      $('overEmoji').textContent=(G.mode==='cpu'&&winner===1)?'🥀':'🏆';
    }
    try{var bn=$('btnNext');if(bn)bn.style.display=(cr&&cr.won&&cr.next)?'':'none';
      if(cr){var st=cr.st;$('overTitle').textContent=cr.won?'Stufe geschafft!':'Stufe verloren';
        $('overText').innerHTML=cr.won?('<b>'+st.n+'</b><br><span class="bigStars">'+'★★★'.slice(0,cr.stars)+'<i>'+'★★★'.slice(cr.stars)+'</i></span><br>+'+cr.gold+' 🪙 Gold'+(cr.first?' (erster Sieg)':'')+(cr.next?'':'<br>🎉 Du hast die Gartenreise abgeschlossen!')):('<b>'+st.n+'</b><br>💡 '+st.tip);
        $('overEmoji').textContent=cr.won?(st.boss?'👑':'🌟'):'🥀';}}catch(e){console.warn(e);}
    $('ovOver').classList.remove('hide');
  },1300);
  return true;
}

/* ---------- Zauber, Fallen, Heldenkraft ---------- */
function monByUid(uid){for(var i=0;i<2;i++){var m=G.players[i].board.filter(function(x){return x.uid===uid;})[0];if(m)return m;}return null;}
function handIdx(pi,uid){var h=G.players[pi].hand;for(var i=0;i<h.length;i++)if(h[i].uid===uid)return i;return -1;}
// Ziele: {mons:[uid], heroes:[pi]} oder null (kein Ziel nötig)
function targetsFor(pi,tgt){
  if(!tgt)return null;
  var me=G.players[pi],en=G.players[1-pi],r={mons:[],heroes:[]};
  if(tgt==='enemyAny'||tgt==='enemyMon')en.board.forEach(function(m){if(m.hp>0)r.mons.push(m.uid);});
  if(tgt==='enemyAny')r.heroes.push(1-pi);
  if(tgt==='ownAny'||tgt==='ownMon')me.board.forEach(function(m){if(m.hp>0)r.mons.push(m.uid);});
  if(tgt==='ownMonNoShield')me.board.forEach(function(m){if(m.hp>0&&!m.shield)r.mons.push(m.uid);});
  if(tgt==='ownAny')r.heroes.push(pi);
  return r;
}
function hasTargets(r){return !r||(r.mons.length+r.heroes.length)>0;}
function validPick(tg,t){return !!t&&(t.hero!==undefined?tg.heroes.indexOf(t.hero)>=0:tg.mons.indexOf(t.mon)>=0);}
function canCast(pi,idx){var p=G.players[pi],c=p.hand[idx];var s=c&&SBYID[c.id];if(!s||s.cost>p.mana||G.over)return false;
  if(s.type==='trap')return p.traps.length<MAX_TRAPS;
  return hasTargets(targetsFor(pi,s.tgt));}
function canPlay(pi,idx){var c=G.players[pi].hand[idx];if(!c)return false;return SBYID[c.id]?canCast(pi,idx):canSummon(pi,idx);}

async function castSpell(pi,idx,target){
  var p=G.players[pi],c=p.hand[idx];var s=c&&SBYID[c.id];
  if(!s||s.type!=='spell'||s.cost>p.mana||G.over)return false;
  var tg=targetsFor(pi,s.tgt);
  if(tg&&!validPick(tg,target))return false;
  p.hand.splice(idx,1);p.mana-=s.cost;G.aim=null;G.sel=null;G.fuseMode=false;G.fuseFirst=null;
  var wasBusy=G.busy;G.busy=true;
  try{
    log(s.emoji+' '+(isDu(p)?'Du wirkst ':p.name+' wirkt ')+s.name+'.');
    render();
    await fxc('fxCastCard',pi,s);
    var m=target&&target.mon!==undefined?monByUid(target.mon):null;
    switch(s.id){
      case 'feuerball':
        await fxc('fxFireball',pi,target,false);
        if(m)dealDamage(m,s.v,null);else hurtHero(target.hero,s.v,pi);
        break;
      case 'heiltrank':
        if(m){fxc('fxHeal',m.uid);healMon(m,s.v);if(m.poisoned){m.poisoned=false;fxFloatMon(m.uid,'✨ Entgiftet','info');}}
        else{healHero(pi,s.v);fxc('fxBuffHero',pi,0x5dffb0);}
        break;
      case 'blitz':
        await fxc('fxLightning',pi);
        aoe(pi,s.v,false);
        break;
      case 'verstaerkung':
        if(m){m.atk+=2;m.hp+=2;m.maxHp+=2;fxc('fxBuff',m.uid,'+2/+2',0xffd166);}
        break;
      case 'wissen':
        drawBonus(pi,2);
        break;
      case 'frost':
        if(m){fxc('fxFrost',m.uid);dealDamage(m,1,null);if(m.hp>0){m.frozen=true;fxFloatMon(m.uid,'🧊 Erstarrt','info');}}
        break;
    }
    render();await sleep(450);
    await removeDead();render();checkWin();
  }finally{G.busy=wasBusy;}
  track(pi,'spell',{id:s.id});
  render();
  return true;
}
async function setTrap(pi,idx){
  var p=G.players[pi],c=p.hand[idx],s=c&&SBYID[c.id];
  if(!s||s.type!=='trap'||s.cost>p.mana||p.traps.length>=MAX_TRAPS||G.over)return false;
  p.hand.splice(idx,1);p.mana-=s.cost;p.traps.push({uid:c.uid,id:s.id});G.aim=null;G.sel=null;G.fuseMode=false;G.fuseFirst=null;
  log('🪤 '+(isDu(p)?'Du legst':p.name+' legt')+' eine verdeckte Falle.');
  var wasBusy=G.busy;G.busy=true;
  try{render();await fxc('fxTrapSet',pi);await sleep(250);}finally{G.busy=wasBusy;}
  track(pi,'trapSet',{id:s.id});
  render();
  return true;
}
function findTrap(pi,ev){var p=G.players[pi];if(!p.traps)return null;for(var i=0;i<p.traps.length;i++){if(SBYID[p.traps[i].id].on===ev)return p.traps[i];}return null;}
async function fireTrap(pi,tr,ctx){
  var p=G.players[pi],s=SBYID[tr.id],k=p.traps.indexOf(tr);if(k<0)return;
  p.traps.splice(k,1);
  log('🪤 Falle! '+s.emoji+' '+s.name);
  try{render();}catch(e){}
  await fxc('fxTrapReveal',pi,k,s);
  var a=ctx.attacker;
  if(s.id==='spiegel'&&a){
    await fxc('fxMirror',pi,a.uid);
    var dmg=a.atk;fxFloatMon(a.uid,'💧 Abgeprallt!','info');
    dealDamage(a,dmg,null);
  }else if(s.id==='giftfalle'&&a){
    fxc('fxWeb',a.uid);
    dealDamage(a,1,null);
    if(a.hp>0&&!a.poisoned){a.poisoned=true;try{fxPoison(a.uid);}catch(e){}}
  }else if(s.id==='grube'&&ctx.mon){
    await fxc('fxPit',ctx.mon.uid);
    dealDamage(ctx.mon,s.v,null);
  }
  try{render();}catch(e){}
  track(pi,'trapFire',{id:s.id});
}
function powerOf(pi){var h=HBYID[G.players[pi].hero];return h?h.pw:null;}
function powerBlock(pi){var p=G.players[pi],pw=powerOf(pi);
  if(!pw)return 'Keine Gärtnerkraft';if(p.powerUsed)return 'Nur 1× pro Zug';if(p.mana<pw.cost)return 'Kostet '+pw.cost+' 💎';
  if(p.hero==='nekromant'&&p.board.length>=MAX_BOARD)return 'Feld voll';
  if(p.hero==='haendler'&&(!p.deck.length||p.hand.length>=MAX_HAND))return p.deck.length?'Hand voll':'Deck leer';
  if(!hasTargets(targetsFor(pi,pw.tgt)))return 'Kein Ziel';
  return '';}
function canPower(pi){return !G.over&&!powerBlock(pi);}
async function usePower(pi,target){
  if(!canPower(pi))return false;
  var p=G.players[pi],pw=powerOf(pi),tg=targetsFor(pi,pw.tgt);
  if(tg&&!validPick(tg,target))return false;
  p.mana-=pw.cost;p.powerUsed=true;G.aim=null;G.sel=null;G.fuseMode=false;G.fuseFirst=null;
  var wasBusy=G.busy;G.busy=true;
  try{
    log(pw.i+' '+(isDu(p)?'Du nutzt ':p.name+' nutzt ')+pw.n+'.');
    render();
    await fxc('fxPower',pi,pw);
    var m=target&&target.mon!==undefined?monByUid(target.mon):null;
    switch(p.hero){
      case 'druide': if(m){m.atk+=1;m.hp+=1;m.maxHp+=1;fxc('fxBuff',m.uid,'+1/+1',0x7cff6b);}break;
      case 'nekromant': spawnToken(pi,'skelett','Pilzkeim',1,1,null);break;
      case 'magier': await fxc('fxFireball',pi,target,true);if(m)dealDamage(m,pw.v,null);else hurtHero(target.hero,pw.v,pi);break;
      case 'ritter': if(m)giveShield(m);break;
      case 'haendler': drawBonus(pi,1);break;
    }
    render();await sleep(400);
    await removeDead();render();checkWin();
  }finally{G.busy=wasBusy;}
  track(pi,'power',{hero:p.hero});
  render();
  return true;
}

/* ---------- KI ---------- */
async function aiTurn(gen){
  G.busy=true;render();
  await sleep(800);
  var me=G.cur,p=G.players[me];
  await aiPlayPhase(me,gen,false);
  if(!G.over&&gen===G.gen&&canFuseNow(me)){
    var pairs=fusionPairs(me).sort(function(x,y){return (y.r.atk+y.r.hp)-(x.r.atk+x.r.hp);});
    var pr=pairs[0];
    if(pr&&(pr.r.atk+pr.r.hp)>=(pr.a.atk+pr.a.hp+pr.b.atk+pr.b.hp)*0.7){G.busy=false;await doFusion(me,pr.a.uid,pr.b.uid);G.busy=true;await sleep(400);}
  }
  for(var guard=0;guard<10&&!G.over&&gen===G.gen;guard++){
    var ready=p.board.filter(function(m){return m.canAttack;});
    if(!ready.length)break;
    var a=ready.sort(function(x,y){return y.atk-x.atk;})[0];
    var tgt=aiChooseTarget(a,me);
    G.busy=false;
    var ok=await attack(me,a.uid,tgt);
    if(!ok)a.canAttack=false;
    G.busy=true;
    await sleep(300);
  }
  // Rest-Mana nach dem Kampf (Heldenkraft, Zauber, Fallen)
  if(!G.over&&gen===G.gen)await aiPlayPhase(me,gen,true);
  if(gen!==G.gen)return;
  G.busy=false;
  if(!G.over){await sleep(400);await endTurn();}
}
async function aiPlayPhase(me,gen,late){
  var extra=0;
  for(var loop=0;loop<24&&!G.over&&gen===G.gen;loop++){
    var p=G.players[me];
    var reserve=(!late&&!p.fusedThisTurn&&fusionPairs(me).length)?FUSE_COST:0;
    var opts=aiOptions(me,late).filter(function(o){return o.sc>0;});
    var pick=aiPick(opts,p.mana,MAX_BOARD-p.board.length,MAX_TRAPS-p.traps.length,reserve);
    if(pick){
      G.busy=false;var ok=false;try{ok=await pick.run();}finally{G.busy=true;}
      await sleep(300);
      if(!ok)break;
      continue;
    }
    // nichts Sinnvolles: Beschwörungsruf, wenn danach noch Mana bleibt und Platz auf dem Feld ist
    if(!late&&extra<4&&p.board.length<MAX_BOARD&&canDrawExtra(me)&&p.mana-DRAW_COST>=1+reserve&&(p.deck.length>4||p.hand.length===0)){
      G.busy=false;await drawExtra(me);G.busy=true;extra++;await sleep(250);continue;}
    break;
  }
}
// Schaden, der tatsächlich ankommt (Schild, Steinhaut, Bergfestung)
function effDmg(m,amt){if(m.shield)return 0;var s=spec(m);if(s&&s.cap&&amt>s.cap)amt=s.cap;if(s&&s.armor)amt-=s.armor;var o=ownerOf(m);if(o>=0&&G.players[o].board.some(function(x){return x!==m&&x.sp==='bergkoloss'&&x.hp>0;}))amt-=1;return Math.max(0,amt);}
function wouldKill(m,amt){var s=spec(m);return effDmg(m,amt)>=m.hp&&!(s&&s.revive&&!m.revived);}
function aiMonValue(m){var s=spec(m);return (m.cost||1)*1.1+m.atk*.4+(s&&(s.turn||s.allyDeath)?2:0)+(m.fused?2:0);}
function aiOptions(me,late){
  var p=G.players[me],e=G.players[1-me],opts=[];
  var enemyAtk=e.board.reduce(function(s,m){return s+m.atk;},0);
  p.hand.forEach(function(c,i){
    var s=SBYID[c.id];
    if(!s){if(canSummon(me,i)){var t=MBYID[c.id];opts.push({sc:t.cost*1.15+.3,cost:t.cost,mon:true,run:function(){return summon(me,i);}});}return;}
    if(s.cost>p.mana)return;
    if(s.type==='trap'){
      if(p.traps.length>=MAX_TRAPS||p.traps.some(function(x){return x.id===s.id;}))return;
      var v=s.id==='spiegel'?(enemyAtk>=4?2.6:1.3):s.id==='grube'?2.1:(e.board.length?1.9:1.4);
      opts.push({sc:v,cost:s.cost,trap:true,run:function(){return setTrap(me,i);}});return;
    }
    var pl=aiSpellPlan(me,s,late);
    if(pl)opts.push({sc:pl.sc,cost:s.cost,run:function(){var j=handIdx(me,c.uid);return j<0?Promise.resolve(false):castSpell(me,j,pl.t);}});
  });
  if(canPower(me)){var pp=aiPowerPlan(me),ptg=targetsFor(me,powerOf(me).tgt);if(pp&&ptg&&!validPick(ptg,pp.t))pp=null;if(pp)opts.push({sc:pp.sc,cost:powerOf(me).cost,run:function(){return usePower(me,pp.t);}});}
  return opts;
}
// beste Kombination für das vorhandene Mana (kleiner Rucksack über alle Optionen), dann die wertvollste davon zuerst ausführen
function aiPick(opts,mana,slots,trapSlots,reserve){
  var n=Math.min(opts.length,12),best=0,bestSet=0;
  for(var mask=1;mask<(1<<n);mask++){var c=0,s=0,sl=0,tr=0;
    for(var i=0;i<n;i++)if(mask&(1<<i)){c+=opts[i].cost;s+=opts[i].sc;if(opts[i].mon)sl++;if(opts[i].trap)tr++;}
    if(c>mana||sl>slots||tr>trapSlots)continue;
    if(reserve&&c>mana-reserve&&s<50)s-=1.5;
    if(s>best){best=s;bestSet=mask;}}
  if(!bestSet)return null;
  var o=null;for(var j=0;j<n;j++)if((bestSet&(1<<j))&&(!o||opts[j].sc>o.sc))o=opts[j];
  return o;
}
function aiBest(list,fn){var best=null,bs=-1e9;list.forEach(function(x){var v=fn(x);if(v>bs){bs=v;best=x;}});return best?{x:best,v:bs}:null;}
function aiSpellPlan(me,s,late){
  var p=G.players[me],e=G.players[1-me];
  switch(s.id){
    case 'feuerball':{
      if(e.hp<=s.v)return {sc:100,t:{hero:1-me}};
      var b=aiBest(e.board.filter(function(m){return wouldKill(m,s.v);}),aiMonValue);
      if(b&&b.v>=3.2)return {sc:b.v,t:{mon:b.x.uid}};
      var b2=aiBest(e.board.filter(function(m){return effDmg(m,s.v)>0;}),function(m){return m.atk;});
      if(b2&&b2.v>=6)return {sc:2.4,t:{mon:b2.x.uid}};
      if(late&&e.hp<=12)return {sc:1.6,t:{hero:1-me}};
      return null;}
    case 'heiltrank':{
      var miss=(p.maxHp||MAX_HP)-p.hp;
      var bm=aiBest(p.board.filter(function(m){return m.maxHp-m.hp>=3||m.poisoned;}),function(m){return aiMonValue(m)*.35+(m.poisoned?1.5:0);});
      var hv=(miss>=4&&p.hp<=20)?1.4+(20-p.hp)*.12:0;
      if(bm&&bm.v>hv&&bm.v>=1.3)return {sc:bm.v,t:{mon:bm.x.uid}};
      if(hv>0)return {sc:hv,t:{hero:me}};
      return null;}
    case 'blitz':{
      var sc=0;e.board.forEach(function(m){if(wouldKill(m,s.v))sc+=aiMonValue(m);else sc+=effDmg(m,s.v)*.3;});
      return sc>=3.5?{sc:sc,t:null}:null;}
    case 'verstaerkung':{
      var b3=aiBest(p.board.filter(function(m){return m.hp>0;}),function(m){return m.atk+m.hp+(m.canAttack?3:0)+(has(m,'guard')?1:0);});
      return b3?{sc:2.3+(b3.x.canAttack?.4:0),t:{mon:b3.x.uid}}:null;}
    case 'wissen':{
      if(p.deck.length<2||p.hand.length>6)return null;
      return {sc:p.hand.length<=2?2.8:p.hand.length<=4?1.9:.8,t:null};}
    case 'frost':{
      var k=aiBest(e.board.filter(function(m){return wouldKill(m,1);}),aiMonValue);
      if(k&&k.v>=2)return {sc:k.v,t:{mon:k.x.uid}};
      var f=aiBest(e.board.filter(function(m){return !m.frozen&&!m.stunned;}),function(m){return m.atk;});
      if(f&&f.v>=4)return {sc:f.v*.5,t:{mon:f.x.uid}};
      return null;}
  }
  return null;
}
function aiPowerPlan(me){
  var p=G.players[me],e=G.players[1-me],pw=powerOf(me);
  switch(p.hero){
    case 'druide':{var b=aiBest(p.board,function(m){return m.atk+m.hp+(m.canAttack?2:0);});return b?{sc:1.9,t:{mon:b.x.uid}}:null;}
    case 'nekromant':return {sc:1.8,t:null};
    case 'magier':{
      if(e.hp<=pw.v)return {sc:100,t:{hero:1-me}};
      var k=aiBest(e.board.filter(function(m){return wouldKill(m,pw.v);}),aiMonValue);
      if(k)return {sc:Math.max(1.6,k.v),t:{mon:k.x.uid}};
      var sh=aiBest(e.board.filter(function(m){return m.shield;}),aiMonValue);
      if(sh&&sh.v>=4)return {sc:1.5,t:{mon:sh.x.uid}};
      return {sc:1.3,t:{hero:1-me}};}
    case 'ritter':{var b2=aiBest(p.board.filter(function(m){return !m.shield&&m.hp>0;}),function(m){return m.atk+m.hp;});return b2?{sc:1.3+b2.v*.12,t:{mon:b2.x.uid}}:null;}
    case 'haendler':return p.hand.length<=4?{sc:1.7,t:null}:null;
  }
  return null;
}
function aiChooseTarget(a,me){
  if(me===undefined)me=1;
  var e=G.players[1-me];var vt=validTargets(me,a);
  var lethal=G.players[me].board.filter(function(m){return m.canAttack&&(vt.hero||has(m,'fly'));}).reduce(function(s,m){var ms=spec(m);return s+m.atk+(ms&&ms.heroBonus?ms.heroBonus:0);},0);
  if(vt.hero&&lethal>=e.hp)return 'hero';
  var best=null,bestScore=-1e9;
  vt.mons.forEach(function(uid){
    var t=e.board.filter(function(m){return m.uid===uid;})[0];
    var ts=spec(t),eff=a.atk;if(ts&&ts.cap)eff=Math.min(eff,ts.cap);if(ts&&ts.armor)eff-=ts.armor;
    var kills=!t.shield&&eff>=t.hp&&!(ts&&ts.revive&&!t.revived);
    var dies=!a.shield&&(t.atk+(ts&&ts.thorns?ts.thorns:0)>=a.hp);
    var s=(kills?t.cost*2+t.atk:0)-(dies?a.cost*2+a.atk:0)+(ts&&(ts.turn||ts.allyDeath)?3:0)+(t.shield?1:0)-(ts&&ts.death&&kills?2:0);
    if(s>bestScore){bestScore=s;best=uid;}
  });
  if(!vt.hero)return best;
  if(best!==null&&bestScore>2)return best;
  return 'hero';
}

/* ---------- Eingabe ---------- */
function cancelModes(){G.fuseMode=false;G.fuseFirst=null;G.aim=null;}
function doAim(t){
  var a=G.aim;G.aim=null;if(!a)return;
  if(!validPick(a.tg,t)){render();return;}
  if(a.kind==='spell'){var idx=handIdx(G.cur,a.uid);if(idx>=0)castSpell(G.cur,idx,t);else render();}
  else usePower(G.cur,t);
}
function onHandClick(idx){
  if(!isHumanTurn()||G.busy)return;
  var pi=G.cur,p=G.players[pi],c=p.hand[idx];if(!c)return;
  var s=SBYID[c.id];
  if(s){
    if(G.aim&&G.aim.kind==='spell'&&G.aim.uid===c.uid){G.aim=null;render();return;}
    cancelModes();G.sel=null;
    if(s.cost>p.mana){toast('Zu wenig 💎 ('+s.cost+')');render();return;}
    if(s.type==='trap'){if(p.traps.length>=MAX_TRAPS){toast('Max. '+MAX_TRAPS+' Fallen');render();return;}setTrap(pi,idx);return;}
    var tg=targetsFor(pi,s.tgt);
    if(!tg){castSpell(pi,idx,null);return;}
    if(!hasTargets(tg)){toast('Kein Ziel');render();return;}
    G.aim={kind:'spell',uid:c.uid,tg:tg,label:s.emoji+' '+s.name+': Ziel wählen'};render();return;
  }
  if(G.aim){G.aim=null;}
  if(!canSummon(pi,idx)){
    if(p.board.length>=MAX_BOARD)toast('Feld voll (max. '+MAX_BOARD+')');
    else toast('Zu wenig 💎 ('+MBYID[c.id].cost+')');
    render();return;
  }
  summon(pi,idx);
}
function onMonClick(owner,uid){
  if(!G)return;
  if(!isHumanTurn()||G.busy)return;
  var pi=G.cur;
  if(G.aim){doAim({mon:uid});return;}
  if(G.fuseMode){
    var exitFuse=function(){G.fuseMode=false;G.fuseFirst=null;};
    if(owner!==pi){exitFuse();render();return;}
    if(G.fuseFirst==null){
      if(fusePartners(pi,uid).length){G.fuseFirst=uid;render();return;}
      exitFuse();/* kein Partner: normal weiter (Angriff auswählen) */
    }else if(G.fuseFirst===uid){G.fuseFirst=null;render();return;}
    else if(fusePartners(pi,G.fuseFirst).indexOf(uid)>=0){doFusion(pi,G.fuseFirst,uid);return;}
    else if(fusePartners(pi,uid).length){G.fuseFirst=uid;render();return;}
    else exitFuse();
  }
  if(owner===pi){
    var m=G.players[pi].board.filter(function(x){return x.uid===uid;})[0];
    if(!m)return;
    if(!m.canAttack){toast(m.stunned?'🧊 Erstarrt':m.fresh?'💤 Schläft noch':'✔️ Hat schon angegriffen');if(G.sel!=null){G.sel=null;render();}return;}
    G.sel=G.sel===uid?null:uid;render();
  }else{
    if(G.sel==null){toast('Erst eigene Pflanze wählen');return;}
    var a=G.players[pi].board.filter(function(x){return x.uid===G.sel;})[0];
    if(!a){G.sel=null;render();return;}
    var vt=validTargets(pi,a);
    if(vt.mons.indexOf(uid)<0){toast('🧱 Erst den Wächter angreifen');return;}
    attack(pi,G.sel,uid);
  }
}
function onHeroClick(owner){
  if(!isHumanTurn()||G.busy)return;
  if(G.aim){doAim({hero:owner});return;}
  if(G.fuseMode){G.fuseMode=false;G.fuseFirst=null;render();return;}
  if(owner===G.cur){if(G.sel!=null){G.sel=null;render();}return;}
  if(G.sel==null){toast('Erst eigene Pflanze wählen');return;}
  var a=G.players[G.cur].board.filter(function(x){return x.uid===G.sel;})[0];
  if(!a)return;
  if(!validTargets(G.cur,a).hero){toast('🧱 Erst den Wächter angreifen');return;}
  attack(G.cur,G.sel,'hero');
}
function onEmptyClick(){if(!G)return;if(G.fuseMode||G.aim){cancelModes();render();return;}if(G.sel!=null){G.sel=null;render();}}
function onDrawButton(){
  if(!isHumanTurn()||G.busy)return;
  var pi=G.cur,p=G.players[pi];
  cancelModes();
  if(!p.deck.length){toast('Deck leer');render();return;}
  if(p.hand.length>=MAX_HAND){toast('Hand voll');render();return;}
  if(p.mana<DRAW_COST){toast('Kostet '+DRAW_COST+' 💎');render();return;}
  drawExtra(pi);
}
function onFuseButton(){
  if(!isHumanTurn()||G.busy)return;
  var pi=G.cur,p=G.players[pi];
  if(G.fuseMode||G.aim){cancelModes();render();return;}
  if(p.fusedThisTurn){toast('Nur 1 Kreuzung pro Zug');return;}
  if(p.mana<FUSE_COST){toast('Kostet '+FUSE_COST+' 💎');return;}
  if(!fusionPairs(pi).length){toast('Kein passendes Paar (📜 Regeln)');return;}
  G.fuseMode=true;G.fuseFirst=null;G.sel=null;render();
}
function onPowerButton(){
  if(!isHumanTurn()||G.busy)return;
  var pi=G.cur,pw=powerOf(pi);if(!pw)return;
  if(G.aim&&G.aim.kind==='power'){G.aim=null;render();return;}
  cancelModes();G.sel=null;
  var why=powerBlock(pi);if(why){toast(why);render();return;}
  var tg=targetsFor(pi,pw.tgt);
  if(!tg){usePower(pi,null);return;}
  G.aim={kind:'power',tg:tg,label:pw.i+' '+pw.n+': Ziel wählen'};render();
}
