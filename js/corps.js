/* Archangel Cosmos - corporations (player + AI rivals, shares, divisions, contracts, stock market) and alliances (with races & empires, alliance missions). */
(function(){
'use strict';
var AC=window.AC,H=AC.H;function api(){return AC.api;}
function pay(G,c){for(var k in c)if((G.res[k]||0)<c[k])return false;for(k in c)G.res[k]-=c[k];return true;}
var DIV=[
 {id:'mining',n:'Galactic Mining',cost:30000,base:600,res:'iron',d:'Profits rise with your iron output.'},
 {id:'ships',n:'Starship Manufacturing',cost:60000,base:1200,res:'goods',d:'Profits rise with Industrial Goods output.',req:function(G){return G.counts.spaceport>0;}},
 {id:'quantum',n:'Quantum Computing',cost:80000,base:1500,res:'research',d:'Profits rise with Research output.',req:function(G){return !!G.tech.quantum;}},
 {id:'terra',n:'Terraforming',cost:120000,base:2500,res:'he3',d:'Profits rise with colonies & Helium-3.',req:function(G){return G.star&&G.star.unlocked;}},
 {id:'trade',n:'Interstellar Trade',cost:50000,base:900,res:'credits',d:'Profits rise with market activity.'},
 {id:'media',n:'Celestial Media & Lore',cost:40000,base:700,res:'light',d:'Profits rise with Celestial Light and happiness.'}
];
var DB={};DIV.forEach(function(d){DB[d.id]=d;});
var AICORPS=[{id:'topaz',n:'Topaz Mining Corp',sector:'mining',val:5e6},{id:'seraphic',n:'Seraphic Starworks',sector:'ships',val:8e6},{id:'aqc',n:'Aethari Quantum Combine',sector:'quantum',val:1.2e7},
 {id:'titanforge',n:'Titan Forge Holdings',sector:'mining',val:6e6},{id:'celmedia',n:'Celestial Media Guild',sector:'media',val:3e6},{id:'genesis',n:'Genesis Terraform Ltd',sector:'terra',val:4e6}];
var SHARES=1e6;
var NAMES1=['Radiant','Seraphic','Gilded','Celestial','Topaz','Dawnstar','Halo','Throne'],NAMES2=['Industries','Holdings','Dynamics','Works','Concern','Collective','Enterprises'];
H.migrate.push(function(G){if(!G.corp)G.corp={founded:false,name:'',divs:{},own:SHARES,cash:0,profit:0,rep:10,contracts:[],offers:[],ai:AICORPS.map(function(c){return {id:c.id,val:c.val,held:0,hist:[c.val]};}),hist:[],dividend:0.3};
 if(!G.alli)G.alli={members:[],missions:[],done:0};});
function corpVal(G){var c=G.corp;if(!c.founded)return 0;var assets=Object.keys(c.divs).reduce(function(a,k){return a+DB[k].cost*c.divs[k];},0);return Math.max(1e5,c.profit*120+assets+c.cash+c.rep*2000);}
function price(G){return corpVal(G)/SHARES;}
function aiPrice(a){return a.val/SHARES;}
function competition(G,sector){return G.corp.ai.filter(function(a){return AICORPS.find(function(c){return c.id===a.id;}).sector===sector;}).reduce(function(s,a){return s+a.val;},0)/2e7;}
var CON=[{res:'iron',q:[300,1200]},{res:'metal',q:[100,400]},{res:'goods',q:[30,150]},{res:'food',q:[3000,12000]},{res:'titanium',q:[40,200]},{res:'crystal',q:[10,60]},{res:'he3',q:[20,100],star:1},{res:'qmatter',q:[5,20],star:1}];
var CLIENTS=['Royal Treasury','Lumarian Concord','Titanborn Holds','Seraphic Starworks','House Ithuriel','Aethari Archive','Celestian Assembly'];
H.tick.push(function(G,add){var c=G.corp,a=G.alli;
 // AI corporations: random walk + growth
 c.ai.forEach(function(x){x.val*=1+(Math.random()-0.47)*0.04;x.val=Math.max(5e5,x.val);if(G.day%5===0){x.hist.push(x.val);if(x.hist.length>30)x.hist.shift();}if(x.held)add('credits',x.val/SHARES*x.held*0.0005);});
 if(c.founded){var p=0;Object.keys(c.divs).forEach(function(k){var d=DB[k],lvl=c.divs[k],out=Math.max(0,(G.net||{})[d.res]||0),f=d.res==='credits'?Math.min(3,out/500):Math.min(3,0.3+out/(d.res==='iron'?40:d.res==='goods'?8:d.res==='research'?6:d.res==='light'?3:5));
   p+=d.base*lvl*(0.5+f)*(1-Math.min(0.4,competition(G,k)))*(0.8+c.rep/250);});
  c.profit=p;var div=p*c.dividend*(c.own/SHARES);add('credits',div);c.cash+=p*(1-c.dividend);if(G.day%5===0){c.hist.push(price(G));if(c.hist.length>30)c.hist.shift();}}
 // contracts
 if(c.founded&&G.day%6===0&&c.offers.length<3){var opts=CON.filter(function(o){return !o.star||(G.star&&G.star.unlocked);}),o=opts[(Math.random()*opts.length)|0],q=Math.round(o.q[0]+Math.random()*(o.q[1]-o.q[0])),mk=(AC.MARKET[o.res]||{base:80}).base;
  c.offers.push({id:G.day+'-'+o.res,res:o.res,q:q,pay:Math.round(q*mk*1.8+2000),rep:3+((Math.random()*5)|0),days:20+((Math.random()*20)|0),client:CLIENTS[(Math.random()*CLIENTS.length)|0]});}
 c.contracts=c.contracts.filter(function(k){if(--k.days<=0){c.rep=Math.max(0,c.rep-k.rep*2);api().toast('Contract failed: '+k.client+' ('+AC.RES[k.res].n+'). Reputation fell.','error');return false;}return true;});
 // alliance missions
 if(a.members.length&&G.day%10===0&&a.missions.length<2)a.missions.push(newMission(G));
 a.missions=a.missions.filter(function(m){if(--m.days<=0){api().toast('Alliance mission expired: '+m.n,'alert');return false;}return true;});
});
function allianceTier(G){var n=G.alli.members.length;return n>=4?'Grand Alliance':n>=2?'Confederation':n>=1?'Guild':'none';}
function partners(G){var p=[];if(G.races)AC.RACES.forEach(function(r){if(G.races[r.id].met)p.push({id:r.id,n:r.n,ok:G.races[r.id].rel>=50,score:G.races[r.id].rel,type:'race'});});
 if(G.gal&&G.gal.unlocked&&AC.galaxy)AC.galaxy.FACTIONS.forEach(function(f){if(f.id==='player'||f.race)return;var s=AC.galaxy.stance(G,f.id);p.push({id:f.id,n:f.n,ok:s>=40,score:s,type:'empire'});});return p;}
var MT=[{n:'Joint Relief Shipment',d:'Send 3,000 Food to allied worlds.',cost:{food:3000},rew:{light:30},rel:10},{n:'Shared Research Initiative',d:'Contribute 60 Research.',cost:{research:60},rew:{credits:15000},rel:8},
 {n:'Alliance Armoury',d:'Provide 100 Refined Metal for allied defences.',cost:{metal:100},rew:{credits:12000},rel:8},{n:'Megaproject: Celestial Beacon',d:'Fund 25,000 Credits towards an alliance megaproject.',cost:{credits:25000},rew:{light:80,research:40},rel:12},
 {n:'Fuel the Fleets',d:'Provide 40 Helium-3.',cost:{he3:40},rew:{credits:20000},rel:10,star:1},{n:'Essence Tithe',d:'Provide 10 Stellar Essence.',cost:{essence:10},rew:{influence:10},rel:12,gal:1}];
function newMission(G){var o=MT.filter(function(m){return (!m.star||(G.star&&G.star.unlocked))&&(!m.gal||(G.gal&&G.gal.unlocked));}),m=o[(Math.random()*o.length)|0];return {n:m.n,d:m.d,cost:m.cost,rew:m.rew,rel:m.rel,days:30,id:G.day+m.n};}
/* actions */
H.act.foundCorp=function(G){var c=G.corp;if(c.founded)return;if(!G.counts.capital)return api().toast('Build the Capital Hall first.');if(!pay(G,{credits:50000}))return api().toast('Founding a corporation costs 50,000 Credits.');
 c.founded=true;c.name=c.name||NAMES1[(Math.random()*NAMES1.length)|0]+' '+NAMES2[(Math.random()*NAMES2.length)|0];c.divs={trade:1};api().toast(c.name+' is founded! You own 100% of 1,000,000 shares.','success');if(AC.chron)AC.chron(G,'corp','The Governor founded '+c.name+'.');};
H.act.renameCorp=function(G){var el=document.getElementById('corpName');if(el&&el.value.trim()){G.corp.name=el.value.trim().slice(0,40);api().toast('Corporation renamed to '+G.corp.name+'.');}};
H.act.div=function(G,id){var c=G.corp,d=DB[id],lvl=c.divs[id]||0;if(d.req&&!d.req(G))return api().toast('Not available yet.');var cost=Math.round(d.cost*Math.pow(1.6,lvl));if(!pay(G,{credits:cost}))return api().toast('Needs '+api().fmt(cost)+' Credits.');c.divs[id]=lvl+1;if(AC.audio)AC.audio.sfx('build');api().toast(d.n+' division '+(lvl?'upgraded to level '+(lvl+1):'opened')+'.');};
H.act.ipo=function(G){var c=G.corp,n=Math.min(100000,c.own-510000);if(n<=0)return api().toast('You must keep a controlling 51% stake.');var cash=n*price(G)*0.95;c.own-=n;G.res.credits+=cash;api().toast('Sold '+api().fmt(n)+' shares for '+api().fmt(cash)+' Credits.');};
H.act.buyback=function(G){var c=G.corp,n=Math.min(100000,SHARES-c.own);if(n<=0)return;var cost=n*price(G)*1.05;if(!pay(G,{credits:cost}))return api().toast('Needs '+api().fmt(cost)+' Credits.');c.own+=n;api().toast('Bought back '+api().fmt(n)+' shares.');};
H.act.dividend=function(G,v){G.corp.dividend=Math.max(0,Math.min(0.9,G.corp.dividend+(+v)));};
H.act.accept=function(G,id){var c=G.corp,o=c.offers.find(function(x){return x.id===id;});if(!o)return;c.offers=c.offers.filter(function(x){return x!==o;});c.contracts.push(o);api().toast('Contract accepted: deliver '+o.q+' '+AC.RES[o.res].n+' to '+o.client+' within '+o.days+' days.');};
H.act.deliver=function(G,id){var c=G.corp,k=c.contracts.find(function(x){return x.id===id;});if(!k)return;var need={};need[k.res]=k.q;if(!pay(G,need))return api().toast('Not enough '+AC.RES[k.res].n+'.');G.res.credits+=k.pay;c.rep=Math.min(100,c.rep+k.rep);c.done=(c.done||0)+1;c.contracts=c.contracts.filter(function(x){return x!==k;});api().toast('Contract fulfilled! +'+api().fmt(k.pay)+' Credits, +'+k.rep+' reputation.','success');};
H.act.stock=function(G,arg){var p=arg.split(':'),a=G.corp.ai.find(function(x){return x.id===p[0];}),n=+p[1],pr=aiPrice(a);if(n>0){if(!pay(G,{credits:pr*n*1.01}))return api().toast('Not enough Credits.');a.held+=n;}else{n=Math.min(a.held,-n);a.held-=n;G.res.credits+=pr*n*0.99;}api().toast((+p[1]>0?'Bought ':'Sold ')+Math.abs(+p[1])+' shares of '+AICORPS.find(function(c){return c.id===a.id;}).n+'.');};
H.act.ally=function(G,id){var a=G.alli,p=partners(G).find(function(x){return x.id===id;});if(!p)return;if(a.members.indexOf(id)>=0){a.members=a.members.filter(function(x){return x!==id;});return api().toast('Left alliance with the '+p.n+'.');}
 if(!p.ok)return api().toast('Relations must be at least '+(p.type==='race'?50:40)+' to form an alliance.');a.members.push(id);if(!a.missions.length)a.missions.push(newMission(G));api().toast('The '+p.n+' join your '+allianceTier(G)+'!','success');if(AC.chron)AC.chron(G,'alliance','An alliance was sworn with the '+p.n+'.');};
H.act.amission=function(G,id){var a=G.alli,m=a.missions.find(function(x){return x.id===id;});if(!m)return;if(!pay(G,m.cost))return api().toast('Not enough resources.');for(var k in m.rew)G.res[k]=(G.res[k]||0)+m.rew[k];
 a.members.forEach(function(x){if(G.races&&G.races[x])G.races[x].rel+=m.rel;else if(G.gal)G.gal.stance[x]=(G.gal.stance[x]||0)+m.rel;});a.done++;a.missions=a.missions.filter(function(x){return x!==m;});api().toast('Alliance mission complete: '+m.n+'!','success');};
/* missions */
[{id:'C01',n:'Founder',d:'Found your corporation.',check:function(G){return G.corp.founded;},reward:{credits:10000}},
 {id:'C02',n:'Diversified',d:'Run 3 corporate divisions.',check:function(G){return Object.keys(G.corp.divs).length>=3;},reward:{credits:25000}},
 {id:'C03',n:'Trusted Supplier',d:'Fulfil 3 contracts.',check:function(G){return (G.corp.done||0)>=3;},reward:{light:40}},
 {id:'C04',n:'Megacorp',d:'Reach a corporate valuation of 10,000,000.',check:function(G){return corpVal(G)>=1e7;},reward:{credits:100000}},
 {id:'A01',n:'Sworn Allies',d:'Form an alliance.',check:function(G){return G.alli.members.length>0;},reward:{light:30}},
 {id:'A02',n:'Confederation',d:'Grow your alliance to 2 members.',check:function(G){return G.alli.members.length>=2;},reward:{credits:30000}},
 {id:'A03',n:'Alliance Hero',d:'Complete 3 alliance missions.',check:function(G){return G.alli.done>=3;},reward:{research:100}}].forEach(function(m){m.phase='corp';AC.MISSIONS.push(m);});
/* panel */
function spark(h){if(!h||h.length<2)return '';var mn=Math.min.apply(0,h),mx=Math.max.apply(0,h),pts=h.map(function(v,i){return (i/(h.length-1)*80).toFixed(1)+','+(18-(v-mn)/(mx-mn||1)*16).toFixed(1);}).join(' ');
 return '<svg width="80" height="20" class="spark"><polyline fill="none" stroke="'+(h[h.length-1]>=h[0]?'#7f7':'#f88')+'" stroke-width="1.5" points="'+pts+'"/></svg>';}
H.panel.corps=function(G){var c=G.corp,fmt=api().fmt,cs=api().costStr,h='<h3>Corporation</h3>';
 if(!c.founded)h+='<p>Found a corporation to earn profits, shares and reputation. Rival corporations compete in each sector.</p><button data-act="foundCorp">Found corporation (50,000 ₵)</button>';
 else{h+='<div class="row"><input id="corpName" value="'+c.name.replace(/"/g,'')+'" maxlength="40"><button data-act="renameCorp">Rename</button></div>'+
  '<div class="row"><span>Valuation <b>'+fmt(corpVal(G))+'</b> · share '+price(G).toFixed(2)+' ₵ '+spark(c.hist)+'</span></div><div class="row"><span>Profit/day <b>'+fmt(c.profit)+'</b> · reputation '+Math.round(c.rep)+'</span><span>You own <b>'+(c.own/SHARES*100).toFixed(1)+'%</b></span></div>'+
  '<div class="row"><span>Dividend payout '+Math.round(c.dividend*100)+'%</span><span><button data-act="dividend" data-arg="-0.1">-</button><button data-act="dividend" data-arg="0.1">+</button></span></div>'+
  '<div class="row"><span>Shares</span><span><button data-act="ipo">Sell 100K shares</button><button data-act="buyback">Buy back 100K</button></span></div>';
  h+='<h3>Divisions</h3>';DIV.forEach(function(d){var l=c.divs[d.id]||0,av=!d.req||d.req(G);h+='<div class="card'+(av?'':' locked')+'"><span class="t">'+d.n+'</span> '+(l?'<small>Lv '+l+'</small>':'')+'<br><span class="e">'+d.d+' Competition: '+Math.round(Math.min(0.4,competition(G,d.id))*100)+'%</span><br><button data-act="div" data-arg="'+d.id+'">'+(l?'Upgrade':'Open')+' ('+fmt(Math.round(d.cost*Math.pow(1.6,l)))+' ₵)</button></div>';});
  h+='<h3>Contracts</h3>';c.contracts.forEach(function(k){h+='<div class="card sel">'+k.client+': deliver '+cs((function(){var o={};o[k.res]=k.q;return o;})())+' · pays '+fmt(k.pay)+' ₵ · '+k.days+' days left<br><button data-act="deliver" data-arg="'+k.id+'">Deliver</button></div>';});
  c.offers.forEach(function(k){h+='<div class="card">Offer from '+k.client+': '+cs((function(){var o={};o[k.res]=k.q;return o;})())+' for '+fmt(k.pay)+' ₵ (+'+k.rep+' rep), '+k.days+' days<br><button data-act="accept" data-arg="'+k.id+'">Accept</button></div>';});
  if(!c.contracts.length&&!c.offers.length)h+='<p class="small">New contract offers arrive every few days.</p>';}
 h+='<h3>Galactic stock exchange</h3>';c.ai.forEach(function(a){var d=AICORPS.find(function(x){return x.id===a.id;});h+='<div class="row"><span>'+d.n+'<br><small>'+aiPrice(a).toFixed(2)+' ₵/share · held '+fmt(a.held)+'</small> '+spark(a.hist)+'</span><span><button data-act="stock" data-arg="'+a.id+':1000">Buy 1K</button><button data-act="stock" data-arg="'+a.id+':-1000">Sell 1K</button></span></div>';});
 var A=G.alli;h+='<h3>Alliances <small>· '+allianceTier(G)+'</small></h3><p class="small">Guild (1 member) → Confederation (2) → Grand Alliance (4+). Allies share missions; completing them improves relations.</p>';
 var ps=partners(G);if(!ps.length)h+='<p class="small">Meet other races (Host tab) to form alliances.</p>';
 ps.forEach(function(p){var m=A.members.indexOf(p.id)>=0;h+='<div class="row"><span>'+p.n+' <small>('+p.type+', '+Math.round(p.score)+')</small></span><button data-act="ally" data-arg="'+p.id+'">'+(m?'Leave':'Ally')+'</button></div>';});
 A.missions.forEach(function(m){h+='<div class="card event"><span class="t">'+m.n+'</span> <small>'+m.days+' days</small><br>'+m.d+'<br>Reward '+cs(m.rew)+'<br><button data-act="amission" data-arg="'+m.id+'">Complete '+cs(m.cost)+'</button></div>';});
 return h;};
AC.corps={value:corpVal,price:price,partners:partners,tier:allianceTier};
})();
