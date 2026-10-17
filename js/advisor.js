/* Archangel Cosmos - Archangel AI Ultra Intelligence (offline, rule-based): economy analysis, shortage forecasts,
   build planner, typed Q&A from a built-in knowledge base, and procedural chronicle "books" of your empire. No API, no network. */
(function(){
'use strict';
var AC=window.AC,H=AC.H;function api(){return AC.api;}
var fmt=function(n){return api().fmt(n);};
/* ---------- chronicle ---------- */
H.migrate.push(function(G){if(!G.chronicle)G.chronicle=[{day:G.day||0,type:'era',text:'The Angelic Humans descended upon Elysia, one hundred thousand strong.'}];if(!G.qa)G.qa=[];if(!G.seen)G.seen={m:0,met:'',dec:'',col:0};});
AC.chron=function(G,type,text){G.chronicle.push({day:G.day,type:type,text:text});if(G.chronicle.length>400)G.chronicle.shift();};
H.tick.push(function(G){var s=G.seen;
 var mdone=AC.MISSIONS.filter(function(m){return G.missions[m.id];});if(mdone.length>s.m){mdone.slice(s.m).forEach(function(m){AC.chron(G,'mission','The task "'+m.n+'" was accomplished.');});s.m=mdone.length;}
 if(G.races){var met=Object.keys(G.races).filter(function(k){return G.races[k].met;}).join(',');if(met!==s.met){met.split(',').filter(function(k){return k&&s.met.split(',').indexOf(k)<0;}).forEach(function(k){var r=AC.RACES.find(function(x){return x.id===k;});AC.chron(G,'contact','First contact was made with the '+r.n+'.');});s.met=met;}}
 if(G.council){var dec=G.council.decrees.join(',');if(dec!==s.dec){G.council.decrees.filter(function(d){return s.dec.split(',').indexOf(d)<0;}).forEach(function(d){var D=AC.DECREES.find(function(x){return x.id===d;});AC.chron(G,'decree','The Royal Heavenly Host proclaimed the '+D.n+'.');});s.dec=dec;}}
 if(G.star){var nc=Object.keys(G.star.col).length;if(nc>s.col){Object.keys(G.star.col).slice(s.col).forEach(function(b){var B=AC.space.BODIES.find(function(x){return x.id===b;});AC.chron(G,'colony','A colony was raised upon '+(B?B.n:b)+'.');});s.col=nc;}}
 if(G.day%100===0)AC.chron(G,'census','In the year '+Math.floor(G.day/100)+' census, '+fmt(G.pop)+' souls dwelt upon Elysia.');});

/* ---------- analysis ---------- */
var CORE=['food','water','energy','iron','metal','goods','credits','research','light'];
function analyse(G){var n=G.net||{},R=G.res,o={forecast:[],warnings:[],strengths:[]};
 CORE.forEach(function(k){var d=n[k]||0;if(d<0){var days=Math.floor((R[k]||0)/-d);o.forecast.push({k:k,days:days,d:d});if(days<20)o.warnings.push(AC.RES[k].n+' runs out in '+days+' days ('+fmt(d)+'/day).');}else if(d>0)o.strengths.push(AC.RES[k].n+' +'+fmt(d)+'/day');});
 var cap=api().housing();o.housing=G.pop/cap;if(o.housing>0.96)o.warnings.push('Housing is '+Math.round(o.housing*100)+'% full; growth is capped.');
 var idle={};G.tiles.forEach(function(c){if(c.b&&c.idle){var b=api().BY[c.b];var miss=Object.keys(b.cons||{}).filter(function(k){return (R[k]||0)<b.cons[k];});miss.forEach(function(m){idle[m]=(idle[m]||0)+1;});}});
 Object.keys(idle).forEach(function(k){o.warnings.push(idle[k]+' building(s) idle for lack of '+AC.RES[k].n+'.');});
 if(G.happy<50)o.warnings.push('Morale '+Math.round(G.happy)+'%: lower taxes or add Parks/Cathedral.');
 o.forecast.sort(function(a,b){return a.days-b.days;});return o;}
/* ---------- build planner ---------- */
function plan(G){var n=G.net||{},R=G.res,BY=api().BY,need={},out=[];
 function want(k,w){need[k]=(need[k]||0)+w;}
 CORE.forEach(function(k){var d=n[k]||0,days=d<0?(R[k]||0)/-d:999;if(days<40)want(k,3*(40-days)/40+1);});
 if(G.pop>api().housing()*0.9)want('housing',3);if(G.happy<55)want('happy',2);if(!G.counts.lab)want('research',1.5);if((R.credits||0)<5000)want('credits',1.5);want('light',0.3);want('metal',0.4);want('goods',0.3);
 AC.BUILDINGS.forEach(function(b){if(b.id==='road'||b.id==='outpost')return;if(b.req&&!G.tech[b.req])return;if(b.unique&&G.counts[b.id])return;if(b.id!=='capital'&&!G.counts.capital)return;if(b.id==='capital'&&G.counts.capital)return;
  var site=G.tiles.some(function(c){return !c.b&&b.on.indexOf(c.t)>=0;});if(!site)return;var sc=0,why=[];
  for(var k in b.prod||{}){if(need[k]){sc+=need[k]*Math.min(3,b.prod[k]/((k==='food'||k==='water')?150:k==='energy'?30:k==='credits'?100:5));why.push('+'+b.prod[k]+' '+AC.RES[k].n);}}
  for(k in b.cons||{}){var surplus=(n[k]||0)-b.cons[k];if(surplus<0&&(R[k]||0)<b.cons[k]*30)sc-=1.5;}
  if(b.housing&&need.housing){sc+=need.housing*b.housing/10000;why.push('+'+fmt(b.housing)+' housing');}
  if(b.happy&&need.happy){sc+=need.happy*b.happy/3;why.push('+happiness');}
  var cost=Object.keys(b.cost).reduce(function(a,k){return a+b.cost[k]*(k==='credits'?1:20);},0),aff=api().canAfford(b.cost);sc=sc/(1+cost/8000)*(aff?1.3:0.7);
  if(b.id==='capital')sc=99,why=['founds your government'];if(sc>0.05)out.push({id:b.id,n:b.n,score:sc,why:why.join(', '),afford:aff});});
 out.sort(function(a,b){return b.score-a.score;});return out.slice(0,4);}
/* ---------- knowledge base Q&A ---------- */
var KB=[
 {k:['tac','topaz','coin','crypto','blockchain'],a:'TAC (TopazArchangelCoin) is only a planned fictional in-game currency. There is no real cryptocurrency or blockchain in Archangel Cosmos.'},
 {k:['save','load','slot'],a:'The game autosaves every 30 days. Use Menu → Save/Load. Saves live in this browser only. Founder supporters get extra save slots.'},
 {k:['happy','happiness','morale'],a:'Happiness rises with Parks, Healing Sanctuaries, the Cathedral of Light, the Seraphim Academy and the Sanctuary Accord decree. High taxes and shortages lower it. Happy citizens grow faster and pay more tax.'},
 {k:['tax','taxes','income','money','credits','rich'],a:'Credits come from taxes (needs the Capital Hall), Trade Markets, selling goods at the Market, the Embassy, colonies, corporations and galactic trade routes. Refined Metal and Industrial Goods sell for far more than raw ore.'},
 {k:['council','decree','host','vote','favour','favor'],a:'The Royal Heavenly Host (Host tab) votes on decrees you propose for 25 Favour, or you can enact one by royal decree for 60. Favour grows over time and with Celestial Light. Appoint Royal Houses to sectors for +15% output.'},
 {k:['race','races','alien','aliens','lumarian','lumarians','aethari','titanborn','celestian','celestians','diplomacy'],a:'Four peoples share the cosmos: the Lumarians (light beings), the Aethari (ancient wormhole engineers), the Titanborn (planetary giants) and the Celestians (interdimensional diplomats). Meet them by progressing, then use gifts, envoys and trade deals. At 60 relations they become allies with unique bonuses.'},
 {k:['starborn','space','moon','colony','colonies','ship','ships','phase 2'],a:'Phase 2 Starborn opens after the Moon colony (mission M19). Press 🪐 for the Helion system: build an Orbital Shipyard at Seraph, Scouts to survey, Colony Arks to settle, and Freighters for trade routes.'},
 {k:['galaxy','galactic','empire','empires','ftl','phase 3','fleet','fleets','war'],a:'Phase 3 Galactic Empires unlocks with colonies on 3 worlds, mission S05 and your first Dark Energy. Press 🌌 for the galaxy map: build frigates to explore, Colony Fleets to claim systems, convoys to trade, and Starbases to defend against the Void Sovereignty and Iron Syndicate.'},
 {k:['corporation','corp','company','shares','stock','dividend','contract'],a:'Found a corporation in the Corps tab (50,000 ₵). Open divisions whose profits track your economy, accept delivery contracts, set dividends, and trade shares of rival AI corporations on the stock exchange.'},
 {k:['alliance','alliances','ally','allies','guild','confederation'],a:'In the Corps tab, ally with races (relations 50+) or galactic empires (stance 40+). Guild → Confederation → Grand Alliance. Alliance missions reward resources and improve relations.'},
 {k:['3d','graphics','quality','view','camera','zoom'],a:'Drag to rotate the 3D camera, right-drag or two fingers to pan, scroll or pinch to zoom. Menu → Settings lets you switch 3D on/off and choose quality. Weak devices automatically use the 2.5D view.'},
 {k:['research','tech','science'],a:'Research Centres, the Seraphim Academy and Quantum Labs generate Research. Pick a project in the Research tab; Spaceflight leads to the Spaceport and the Moon.'},
 {k:['energy','power','electricity'],a:'Power Plants (+40), Solar Arrays (+70, more on desert) and Geothermal Vents (+160, volcanic) make energy. Buildings without energy go idle (red outline).'},
 {k:['housing','homes','population','grow','growth'],a:'Population grows when there is food, water, energy and free housing. Build Homes, then Apartments (Urban Planning) and Arcology Towers.'},
 {k:['store','buy','purchase','price','pay','payment','founder'],a:'The Store is coming soon. No payments are taken yet and everything is unlocked for testing. Genesis is free; expansions and cosmetics have placeholder AUD prices.'},
 {k:['lore','story','history','book','chronicle'],a:'Open the AI tab and press "Write the Chronicle" to have me compose a book of your empire\'s history from everything that has happened.'}];
function tokens(s){return (s.toLowerCase().match(/[a-z0-9]+/g)||[]);}
function answer(G,q){var t=tokens(q),ql=q.toLowerCase(),BY=api().BY;if(!t.length)return 'Ask me anything about your empire, e.g. "what should I build?" or "how much food do I have?"';
 if(/what.*build|next.*build|recommend|suggest|should i/.test(ql)){var p=plan(G);return p.length?'My recommendation: '+p.map(function(x,i){return (i+1)+') '+x.n+(x.why?' ('+x.why+')':'')+(x.afford?'':' [save up first]');}).join('; ')+'.':'Your economy is balanced. Expand housing or pursue research.';}
 if(/status|how.*doing|report|analy|economy|summary/.test(ql)){var a=analyse(G);return 'Day '+G.day+': '+fmt(G.pop)+' citizens, morale '+Math.round(G.happy)+'%. '+(a.warnings.length?'Concerns: '+a.warnings.slice(0,3).join(' '):'No urgent concerns.')+(a.strengths.length?' Strengths: '+a.strengths.slice(0,4).join(', ')+'.':'');}
 for(var k in AC.RES){var rn=AC.RES[k].n.toLowerCase();if(ql.indexOf(rn)>=0||t.indexOf(k)>=0){var d=(G.net||{})[k]||0,days=d<0?' At this rate it runs out in '+Math.floor((G.res[k]||0)/-d)+' days.':'';
   var makers=AC.BUILDINGS.filter(function(b){return b.prod&&b.prod[k];}).map(function(b){return b.n;});
   if(/how.*(get|make|produce)|where/.test(ql))return AC.RES[k].n+' is produced by: '+(makers.join(', ')||'trade, colonies or events')+'.';
   return 'You have '+fmt(G.res[k]||0)+' '+AC.RES[k].n+' ('+(d>=0?'+':'')+fmt(d)+'/day).'+days+(makers.length?' Made by: '+makers.join(', ')+'.':'');}}
 var b=AC.BUILDINGS.find(function(b){return ql.indexOf(b.n.toLowerCase())>=0||t.indexOf(b.id)>=0;});if(b)return b.n+': '+b.d+' Cost: '+Object.keys(b.cost).map(function(k){return b.cost[k]+' '+AC.RES[k].n;}).join(', ')+'.'+(b.req?' Requires research: '+b.req+'.':'')+' You have '+(G.counts[b.id]||0)+'.';
 if(/mission|goal|quest|objective|next/.test(ql)){var m=AC.MISSIONS.find(function(m){return !G.missions[m.id]&&(m.phase!=='starborn'||G.star&&G.star.unlocked)&&(m.phase!=='empires'||G.gal&&G.gal.unlocked);});return m?'Next mission: '+m.id+' '+m.n+' — '+m.d:'All current missions are complete!';}
 var best=null,bs=0;KB.forEach(function(e){var s=e.k.filter(function(w){return t.indexOf(w)>=0||(w.indexOf(' ')>0&&ql.indexOf(w)>=0);}).length;if(s>bs){bs=s;best=e;}});if(best)return best.a;
 return 'I do not have an answer for that yet. Try asking about resources (e.g. "food"), a building (e.g. "refinery"), "what should I build", "status", races, the council, Starborn, the galaxy or corporations.';}
/* ---------- procedural chronicle book ---------- */
var ADJ=['radiant','golden','solemn','storied','luminous','fateful','hallowed','tumultuous','serene','glorious'],OPEN=['In those days','It is written that','The archives recall that','Songs still tell how','So it came to pass that'];
function rnd(seed){var s=seed;return function(){s=(s*9301+49297)%233280;return s/233280;};}
function book(G){var r=rnd((G.seed||7)%233280),pick=function(a){return a[(r()*a.length)|0];},ch=G.chronicle,eras=[],cur=null,title=(G.corp&&G.corp.founded?'':'')+'The '+pick(['Radiant','Golden','Hallowed','Luminous'])+' Chronicle of Elysia';
 ch.forEach(function(e){if(!cur||e.type==='era'||cur.items.length>=8){cur={start:e.day,items:[]};eras.push(cur);}cur.items.push(e);});
 var names=['The Descent','The Founding Years','The Age of Industry','The Light Ascendant','The Opening of the Skies','The Starborn Era','The Wormhole Age','The Imperial Dawn','The Grand Alliance','The Age of Wonders'];
 var txt=title+'\n'+'='.repeat(title.length)+'\nAs set down by the Archangel AI Ultra Intelligence, Keeper of Records, on day '+G.day+'.\n\n';
 eras.forEach(function(e,i){txt+='Chapter '+(i+1)+': '+(names[i]||'Year '+Math.floor(e.start/100))+'\n\n';var p=pick(OPEN)+' a '+pick(ADJ)+' season began on day '+e.start+'. ';
  e.items.forEach(function(it,j){var s=it.text.replace(/\.$/,'');p+=(j?pick(['Then ','Soon after, ','Before long, ','And ','In time, ']):'')+s.charAt(0).toLowerCase()+s.slice(1)+(it.type==='war'?', and the stars trembled':'')+(it.type==='contact'?', and the Host gave thanks':'')+'. ';});
  txt+=p.replace(/\s+/g,' ').trim()+'\n\n';});
 txt+='Epilogue\n\nNow '+fmt(G.pop)+' Angelic Humans dwell upon Elysia'+(G.star&&G.star.unlocked?', with '+Object.keys(G.star.col).length+' colonies among the Helion worlds':'')+(G.gal&&G.gal.unlocked?', and the Dominion holds '+AC.galaxy.mine(G).length+' star systems':'')+'. The tale is not yet ended.\n';return {title:title,text:txt};}
/* ---------- actions & panel ---------- */
H.act.ask=function(G){var el=document.getElementById('aiQ');if(!el||!el.value.trim())return;var q=el.value.trim(),a=answer(G,q);G.qa.push({q:q,a:a});if(G.qa.length>20)G.qa.shift();el.value='';api().say(a);};
H.act.askPreset=function(G,q){var a=answer(G,q);G.qa.push({q:q,a:a});if(G.qa.length>20)G.qa.shift();api().say(a);};
H.act.chronicle=function(G){var b=book(G);G.lastBook=b.text;var w=document.createElement('div');w.className='adslot';w.innerHTML='<div class="panel-box book"><h2>'+b.title+'</h2><pre>'+b.text.replace(/[<&]/g,function(c){return c==='<'?'&lt;':'&amp;';})+'</pre><button class="dl">Download .txt</button><button class="cl">Close</button></div>';document.body.appendChild(w);
 w.querySelector('.cl').onclick=function(){w.remove();};w.querySelector('.dl').onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([b.text],{type:'text/plain'}));a.download='archangel-chronicle-day'+G.day+'.txt';a.click();};};
H.panel.ai=function(G){var a=analyse(G),p=plan(G),h='<h3>Archangel AI Ultra Intelligence</h3><p class="small">Runs entirely on your device. Ask a question:</p>';
 h+='<div class="row"><input id="aiQ" placeholder="e.g. what should I build? / how do I get titanium?" style="flex:1"><button data-act="ask">Ask</button></div>';
 h+='<div>'+['What should I build?','Status report','How do I get titanium?','Who are the Lumarians?','Next mission'].map(function(q){return '<button class="mini" data-act="askPreset" data-arg="'+q+'">'+q+'</button>';}).join('')+'</div>';
 G.qa.slice(-4).reverse().forEach(function(x){h+='<div class="card small"><b>You:</b> '+x.q.replace(/</g,'&lt;')+'<br><b>Archangel:</b> '+x.a+'</div>';});
 h+='<h3>Forecast</h3>'+(a.forecast.length?a.forecast.slice(0,5).map(function(f){return '<div class="row"><span>'+AC.RES[f.k].n+'</span><span style="color:'+(f.days<15?'#f88':'#ffd')+'">'+(f.days>999?'—':f.days+' days left')+'</span></div>';}).join(''):'<p class="small">No resource is declining.</p>');
 if(a.warnings.length)h+='<div class="card event">'+a.warnings.join('<br>')+'</div>';
 h+='<h3>Recommended builds</h3>'+p.map(function(x){return '<div class="card" data-b="'+x.id+'"><span class="t">'+x.n+'</span>'+(x.afford?'':' <small>(save up)</small>')+'<br><span class="e">'+(x.why||'balances your economy')+'</span></div>';}).join('');
 h+='<h3>Chronicle</h3><p class="small">'+G.chronicle.length+' events recorded.</p><button data-act="chronicle">📖 Write the Chronicle</button>';
 G.chronicle.slice(-5).reverse().forEach(function(e){h+='<div class="small">Day '+e.day+': '+e.text+'</div>';});return h;};
// richer bottom-panel tips
H.advise.unshift(function(G){var a=analyse(G);if(a.warnings.length)return a.warnings[0]+' '+(plan(G)[0]?'Suggestion: build a '+plan(G)[0].n+'.':'');return null;});
AC.advisor={KB:KB,analyse:analyse,plan:plan,answer:answer,book:book};
})();
