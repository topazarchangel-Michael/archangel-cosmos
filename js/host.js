/* Archangel Cosmos - alien races (diplomacy, trade, events, alliances) and the Royal Heavenly Host council. */
(function(){
'use strict';
var AC=window.AC,H=AC.H;H.init=H.init||[];
function api(){return AC.api;}
function pay(G,c){for(var k in c)if((G.res[k]||0)<c[k])return false;for(k in c)G.res[k]-=c[k];return true;}
function cs(c){return api().costStr(c);}

/* ---------- races ---------- */
AC.RACES=[
 {id:'lum',n:'Lumarians',d:'Energy beings of living light. Masters of light manipulation and teleportation.',col:'#fff3a8',
  hint:'Gather 120 Celestial Light or build a Cathedral of Light.',meet:function(G){return G.res.light>=120||G.counts.cathedral>0;},
  gift:{light:20},trade:{give:{energy:50},take:{light:1}},ally:'Allied: all Energy production +25%.'},
 {id:'aeth',n:'Aethari',d:'Ancient star travellers. Wormhole engineers and quantum thinkers.',col:'#9fe0ff',
  hint:'Excavate ruins and research Industry, or launch a satellite.',meet:function(G){return (G.ruinsFound>=1&&G.tech.industry)||G.space.sat;},
  gift:{goods:15},trade:{give:{research:5},take:{goods:1}},ally:'Allied: Research +25%, Starborn ship costs -15%.'},
 {id:'titan',n:'Titanborn',d:'Planetary giants. Unmatched at resource extraction and planetary construction.',col:'#ffb37a',
  hint:'Run 2 Iron Mines or reach 200,000 population.',meet:function(G){return (G.counts.mine||0)>=2||G.pop>=200000;},
  gift:{food:2000},trade:{give:{iron:40,titanium:3},take:{food:300}},ally:'Allied: Mines +30% output.'},
 {id:'cel',n:'Celestians',d:'Interdimensional diplomats of culture, politics and galactic governance.',col:'#e0b8ff',
  hint:'Build an Embassy, enact the Xenodiplomatic Edict, or reach 300,000 population.',meet:function(G){return G.counts.embassy>0||G.council.decrees.indexOf('xeno')>=0||G.pop>=300000;},
  gift:{credits:4000},trade:{give:{credits:300,light:1},take:{water:300}},ally:'Allied: Taxes +15%, +1 vote in the Council.'}
];
var RB={};AC.RACES.forEach(function(r){RB[r.id]=r;});
function ally(G,id){var r=G.races[id];return r&&r.ally;}

var EVENTS=[
 {race:'lum',t:'Light Storm',d:'A Lumarian choir is scattered by a solar storm and asks to shelter in your Celestial Light.',
  a:[{t:'Shelter them',cost:{light:30},eff:{rel:15}},{t:'Refuse',eff:{rel:-10}}]},
 {race:'lum',t:'Gift of Radiance',d:'Lumarians weave a lattice of light over your capital.',
  a:[{t:'Accept for the grid',eff:{res:{energy:150}}},{t:'Share it with the people',eff:{res:{light:25},rel:5}}]},
 {race:'aeth',t:'Wormhole Echo',d:'Aethari navigators offer ancient star charts in exchange for Industrial Goods.',
  a:[{t:'Trade 40 Goods',cost:{goods:40},eff:{res:{research:60},rel:10}},{t:'Decline',eff:{rel:-5}}]},
 {race:'aeth',t:'Relic Exchange',d:'An Aethari archivist wants Crystal for Titanium alloy.',
  a:[{t:'Give 10 Crystal',cost:{crystal:10},eff:{res:{titanium:50},rel:6}},{t:'Not today',eff:{}}]},
 {race:'titan',t:'Mountain Accord',d:'Titanborn elders ask permission to carve a sacred peak. They will share the ore.',
  a:[{t:'Allow the carving',eff:{res:{iron:250},rel:10,happy:-1}},{t:'Protect the peak',eff:{rel:-12,res:{light:5}}}]},
 {race:'titan',t:'Highland Famine',d:'A Titanborn clan is starving after a harsh winter.',
  a:[{t:'Send 3,000 Food',cost:{food:3000},eff:{rel:20}},{t:'We cannot spare it',eff:{rel:-10}}]},
 {race:'cel',t:'Grand Summit',d:'The Celestians invite your envoy to an interdimensional summit.',
  a:[{t:'Send envoy (5,000 ₵)',cost:{credits:5000},eff:{rel:15,favor:10}},{t:'Ignore',eff:{rel:-8}}]},
 {race:null,t:'Border Misunderstanding',d:'A survey team strayed into sacred alien space. Tempers flare.',
  a:[{t:'Pay reparations (3,000 ₵)',cost:{credits:3000},eff:{rel:2}},{t:'Stand firm',eff:{rel:-15}}]}
];

/* ---------- council ---------- */
AC.DECREES=[
 {id:'harvest',n:'Grand Harvest Act',tag:'agri',d:'Farms & Water +25%. Taxes -5%.'},
 {id:'tithe',n:'Tithe of Light',tag:'faith',d:'+3 Celestial Light/day. Happiness -3.'},
 {id:'trade',n:'Open Skies Charter',tag:'trade',d:'Market sell prices +15%. Alien trade deals deliver +25%.'},
 {id:'edu',n:'Seraphim Education Mandate',tag:'science',d:'Research +25%. Costs 150 Credits/day.'},
 {id:'industry',n:'Industrial Covenant',tag:'industry',d:'Mines, Refineries & Factories +20%. Happiness -4.'},
 {id:'sanctuary',n:'Sanctuary Accord',tag:'people',d:'Population growth +0.1%/day, Happiness +4. Costs 200 Food/day.'},
 {id:'xeno',n:'Xenodiplomatic Edict',tag:'diplomacy',d:'All alien relations +0.3/day. Opens contact with the Celestians.'},
 {id:'starward',n:'Starward Initiative',tag:'space',d:'Starborn ships, colonies & launches -20% cost. Energy -20/day.'}
];
var DB={};AC.DECREES.forEach(function(d){DB[d.id]=d;});
AC.COUNCIL=[
 {n:'High King Aurelion',likes:['faith','industry'],dis:['people']},
 {n:'Queen Seraphine',likes:['people','faith'],dis:['industry']},
 {n:'Prince Ithuriel',likes:['space','science'],dis:['agri']},
 {n:'Princess Lumina',likes:['diplomacy','people'],dis:['space']},
 {n:'Archangel Governor Raziel',likes:['industry','space'],dis:['diplomacy']},
 {n:'Economic Minister Haniel',likes:['trade','agri'],dis:['faith']},
 {n:'Sector Overseer Zadkiel',likes:['agri','industry'],dis:['science']}
];
AC.SECTORS=[{id:'nw',n:'Northern Reach'},{id:'ne',n:'Dawn Coast'},{id:'sw',n:'Southern Vale'},{id:'se',n:'Twilight Marches'}];
AC.HOUSES=[{id:'aurelion',n:'House Aurelion',f:'Industry',res:['iron','metal','goods','titanium']},{id:'seraphine',n:'House Seraphine',f:'Harvest',res:['food','water']},
 {id:'ithuriel',n:'House Ithuriel',f:'Science',res:['research']},{id:'lumina',n:'House Lumina',f:'Faith & Wealth',res:['light','credits']}];
function sectorOf(i){var W=AC.api.W,H=AC.api.H,x=i%W,y=(i/W)|0;return (y<H/2?'n':'s')+(x<W/2?'w':'e');}
function has(G,d){return G.council.decrees.indexOf(d)>=0;}

/* ---------- migration / state ---------- */
H.migrate.push(function(G){
 if(!G.races){G.races={};AC.RACES.forEach(function(r){G.races[r.id]={met:false,rel:10,trade:false,ally:false};});}
 if(!G.council)G.council={favor:20,decrees:[],sectors:{},log:[]};
 if(G.event===undefined)G.event=null;if(!G.nextEvent)G.nextEvent=(G.day||0)+30;});

/* ---------- modifiers ---------- */
H.prod.push(function(G,b,c,i,k){var m=1;if(!G.council)return 1;
 if(has(G,'harvest')&&(k==='food'||k==='water'))m*=1.25;
 if(has(G,'edu')&&k==='research')m*=1.25;
 if(has(G,'industry')&&/mine|timine|refinery|factory/.test(b.id))m*=1.2;
 if(ally(G,'lum')&&k==='energy')m*=1.25;if(ally(G,'aeth')&&k==='research')m*=1.25;if(ally(G,'titan')&&(b.id==='mine'||b.id==='timine'))m*=1.3;
 var h=G.council.sectors[sectorOf(i)];if(h){var hh=AC.HOUSES.find(function(x){return x.id===h;});if(hh&&hh.res.indexOf(k)>=0)m*=1.15;}
 return m;});
H.tax.push(function(G){return (G.council&&has(G,'harvest')?0.95:1)*(ally(G,'cel')?1.15:1);});
H.sell.push(function(G){return G.council&&has(G,'trade')?1.15:1;});
H.happy.push(function(G){if(!G.council)return 0;return (has(G,'tithe')?-3:0)+(has(G,'industry')?-4:0)+(has(G,'sanctuary')?4:0)+(G.eventHappy||0);});
H.growth.push(function(G){return G.council&&has(G,'sanctuary')?0.001:0;});

H.tick.push(function(G,add){var A=api();
 // council upkeep and favour
 if(has(G,'tithe'))add('light',3);
 if(has(G,'edu'))add('credits',-150);
 if(has(G,'sanctuary'))add('food',-200);
 if(has(G,'starward'))add('energy',-20);
 G.council.favor=Math.min(100,G.council.favor+0.15+Math.max(0,(G.net.light||0))*0.05+(G.counts.capital?0.1:0));
 if(G.eventHappy)G.eventHappy*=0.9;
 // races
 AC.RACES.forEach(function(r){var s=G.races[r.id];
  if(!s.met){if(r.meet(G)){s.met=true;A.toast('First contact: the '+r.n+' have arrived! Open the Host tab to meet them.','alert');A.say('Governor, the '+r.n+' have made contact. '+r.d+' Offer a gift or a trade deal to build relations.');}return;}
  if(s.trade){var ok=true,k;for(k in r.trade.take)if((G.res[k]||0)<r.trade.take[k])ok=false;
   if(ok){for(k in r.trade.take)add(k,-r.trade.take[k]);for(k in r.trade.give)add(k,r.trade.give[k]*(has(G,'trade')?1.25:1));s.rel+=0.15;}
   else{s.trade=false;s.rel-=5;A.toast('Trade with the '+r.n+' collapsed: not enough '+Object.keys(r.trade.take).join('/')+'.','alert');}}
  if(has(G,'xeno'))s.rel+=0.3;
  s.rel+=(10-s.rel)*0.004;s.rel=Math.max(-100,Math.min(100,s.rel));
  if(!s.ally&&s.rel>=60){s.ally=true;A.toast('Alliance formed with the '+r.n+'! '+r.ally,'success');}
  if(s.ally&&s.rel<40){s.ally=false;A.toast('The '+r.n+' alliance has dissolved.','alert');}});
 // events
 if(!G.event&&G.day>=G.nextEvent){var met=AC.RACES.filter(function(r){return G.races[r.id].met;}).map(function(r){return r.id;});
  var pool=EVENTS.map(function(e,i){return i;}).filter(function(i){var e=EVENTS[i];return e.race?met.indexOf(e.race)>=0:met.length>0;});
  if(pool.length){var ei=pool[Math.floor(Math.random()*pool.length)],e=EVENTS[ei],tr=e.race||met[Math.floor(Math.random()*met.length)];G.event={i:ei,race:tr};A.toast('Diplomatic event: '+e.t,'alert');}
  G.nextEvent=G.day+20+Math.floor(Math.random()*15);}
});

/* ---------- actions ---------- */
H.act.gift=function(G,id){var r=RB[id];if(!pay(G,r.gift))return api().toast('Not enough resources for the gift.');G.races[id].rel+=12;api().toast('The '+r.n+' accept your gift (+12 relations).');};
H.act.envoy=function(G,id){if(G.council.favor<15)return api().toast('Not enough Council Favour (15 needed).');G.council.favor-=15;G.races[id].rel+=8;api().toast('Royal envoy sent to the '+RB[id].n+'.');};
H.act.tradeDeal=function(G,id){var s=G.races[id];if(s.trade){s.trade=false;return api().toast('Trade deal cancelled.');}if(s.rel<20)return api().toast('Relations must be at least 20 for a trade deal.');s.trade=true;api().toast('Trade deal signed with the '+RB[id].n+'.');};
H.act.event=function(G,ch){if(!G.event)return;var e=EVENTS[G.event.i],c=e.a[+ch],r=G.races[G.event.race];
 if(c.cost&&!pay(G,c.cost))return api().toast('Not enough resources for that choice.');var f=c.eff||{};
 if(f.rel)r.rel+=f.rel;if(f.res)for(var k in f.res)G.res[k]=(G.res[k]||0)+f.res[k];if(f.favor)G.council.favor=Math.min(100,G.council.favor+f.favor);if(f.happy)G.eventHappy=(G.eventHappy||0)+f.happy*5;
 G.event=null;api().toast(e.t+': '+c.t+'.');};
H.act.propose=function(G,id){var C=G.council;if(has(G,id))return;if(C.decrees.length>=3)return api().toast('Only 3 decrees may be active. Repeal one first.');if(C.favor<25)return api().toast('Not enough Council Favour (25 needed).');
 C.favor-=25;var d=DB[id],yes=0,votes=AC.COUNCIL.map(function(m){var p=0.5+(m.likes.indexOf(d.tag)>=0?0.3:0)-(m.dis.indexOf(d.tag)>=0?0.35:0)+(G.happy-55)/200;var v=Math.random()<p;if(v)yes++;return {n:m.n,v:v};});
 if(ally(G,'cel')){yes++;votes.push({n:'Celestian Delegate',v:true});}
 var pass=yes>votes.length/2;C.lastVote={d:d.n,votes:votes,pass:pass};if(pass)C.decrees.push(id);
 if(AC.audio)AC.audio.sfx(pass?'vote':'error');api().toast('Council vote on '+d.n+': '+yes+'/'+votes.length+' in favour. '+(pass?'Decree enacted!':'Decree rejected.'),pass?'success':'error');};
H.act.enact=function(G,id){var C=G.council;if(has(G,id))return;if(C.decrees.length>=3)return api().toast('Only 3 decrees may be active.');if(C.favor<60)return api().toast('Royal prerogative needs 60 Favour.');C.favor-=60;C.decrees.push(id);api().toast('By royal prerogative: '+DB[id].n+' enacted.','success');};
H.act.repeal=function(G,id){var C=G.council;C.decrees=C.decrees.filter(function(x){return x!==id;});api().toast(DB[id].n+' repealed.');};
H.act.sector=function(G,arg){var p=arg.split(':'),C=G.council;if(!G.counts.capital)return api().toast('Build the Capital Hall first.');if(C.sectors[p[0]]===p[1])return;if(C.sectors[p[0]]&&C.favor<10)return api().toast('Reassigning a governor needs 10 Favour.');if(C.sectors[p[0]])C.favor-=10;C.sectors[p[0]]=p[1];api().toast(AC.HOUSES.find(function(h){return h.id===p[1];}).n+' now governs the '+AC.SECTORS.find(function(s){return s.id===p[0];}).n+'.');};

/* ---------- panel ---------- */
function bar(v,col){var w=Math.max(0,Math.min(100,(v+100)/2));return '<div class="bar"><i style="width:'+w+'%;background:'+col+'"></i></div>';}
H.panel.host=function(G){var C=G.council,h='';
 if(G.event){var e=EVENTS[G.event.i];h+='<div class="card event"><span class="t">⚠ '+e.t+'</span> <small>('+RB[G.event.race].n+')</small><br>'+e.d+'<br>'+e.a.map(function(a,i){return '<button data-act="event" data-arg="'+i+'">'+a.t+(a.cost?' '+cs(a.cost):'')+'</button>';}).join('')+'</div>';}
 h+='<h3>Royal Heavenly Host</h3><div class="row"><span>Council Favour <b>'+Math.floor(C.favor)+'</b>/100</span><span class="small">Earned over time and from Celestial Light</span></div>';
 h+='<p class="small">Propose a decree (25 Favour) and the Grand Royal Council votes, or enact by royal prerogative (60 Favour). Max 3 active.</p>';
 if(C.lastVote)h+='<div class="card small">Last vote: <b>'+C.lastVote.d+'</b> '+(C.lastVote.pass?'✔ passed':'✘ rejected')+'<br>'+C.lastVote.votes.map(function(v){return (v.v?'👍 ':'👎 ')+v.n;}).join(' · ')+'</div>';
 AC.DECREES.forEach(function(d){var on=has(G,d.id);h+='<div class="card'+(on?' sel':'')+'"><span class="t">'+d.n+'</span> <small>['+d.tag+']</small><br><span class="e">'+d.d+'</span><br>'+
  (on?'<button data-act="repeal" data-arg="'+d.id+'">Repeal</button>':'<button data-act="propose" data-arg="'+d.id+'">Propose vote</button><button data-act="enact" data-arg="'+d.id+'">Royal decree</button>')+'</div>';});
 h+='<h3>Sector Governance</h3><p class="small">Appoint a Royal House to govern each quarter of Elysia (+15% to its focus resources there). First appointment free; reassigning costs 10 Favour.</p>';
 AC.SECTORS.forEach(function(s){h+='<div class="row"><span>'+s.n+'</span><select data-sector="'+s.id+'"><option value="">— none —</option>'+AC.HOUSES.map(function(x){return '<option value="'+x.id+'"'+(C.sectors[s.id]===x.id?' selected':'')+'>'+x.n+' ('+x.f+')</option>';}).join('')+'</select></div>';});
 h+='<p class="small">Council: '+AC.COUNCIL.map(function(m){return m.n;}).join(', ')+'.</p>';
 h+='<h3>Peoples of the Cosmos</h3>';
 AC.RACES.forEach(function(r){var s=G.races[r.id];
  if(!s.met){h+='<div class="card locked"><span class="t">??? Unknown race</span><br><small>Hint: '+r.hint+'</small></div>';return;}
  h+='<div class="card race" style="border-left:4px solid '+r.col+'"><span class="t">'+r.n+'</span> '+(s.ally?'<span class="live">ALLY</span>':'')+'<br><small>'+r.d+'</small>'+
   '<div class="row"><span>Relations '+Math.round(s.rel)+'</span>'+bar(s.rel,r.col)+'</div>'+
   '<small>Trade deal: they give '+cs(r.trade.give)+' for '+cs(r.trade.take)+' per day (needs 20+).</small><br><small class="e">'+r.ally+' (at 60+)</small><br>'+
   '<button data-act="gift" data-arg="'+r.id+'">Gift '+cs(r.gift)+'</button><button data-act="envoy" data-arg="'+r.id+'">Envoy (15 Favour)</button><button data-act="tradeDeal" data-arg="'+r.id+'">'+(s.trade?'Cancel trade':'Trade deal')+'</button></div>';});
 return h;};
H.init.push(function(){var side=document.getElementById('side');if(side._hostBound)return;side._hostBound=1;
 side.addEventListener('change',function(e){var s=e.target.closest('[data-sector]');if(!s||!s.value)return;var G=api().state();H.act.sector(G,s.dataset.sector+':'+s.value);api().render();});});
// advisor hints
H.advise.push(function(G){if(G.event)return 'A diplomatic matter awaits your judgement in the Host tab.';
 if(G.council.favor>=25&&!G.council.decrees.length&&G.counts.capital)return 'The Royal Heavenly Host awaits your proposals. Try a decree in the Host tab.';
 if(G.counts.capital&&!Object.keys(G.council.sectors).length)return 'Appoint Royal Houses to govern Elysia\'s four sectors (Host tab) for free production bonuses.';
 var r=AC.RACES.find(function(r){var s=G.races[r.id];return s.met&&!s.trade&&s.rel>=20;});if(r)return 'Relations with the '+r.n+' are warm enough for a trade deal.';return null;});
AC.host={sectorOf:sectorOf,has:has,EVENTS:EVENTS};
})();
