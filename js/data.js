/* Archangel Cosmos - game data. Add new phases/buildings/missions here. */
var AC = window.AC || {};
window.AC = AC;
AC.H = AC.H || {prod:[],tax:[],sell:[],happy:[],growth:[],tick:[],migrate:[],panel:{},act:{},advise:[],init:[]};

AC.PHASES = [
  {id:'genesis', n:1, name:'Archangel: Genesis', status:'live', title:'Planet Governor',
   desc:'Govern Planet Elysia: city building, resource economy, Archangel AI advisor, missions, first spaceport and moon colony.'},
  {id:'starborn', n:2, name:'Archangel: Starborn', status:'live', title:'System Governor',
   desc:'Solar systems, interplanetary trade, corporations, research and diplomacy with the Lumarians and Aethari.'},
  {id:'empires', n:3, name:'Galactic Empires', status:'soon', title:'Galactic Emperor',
   desc:'Thousands of star systems, alliances, the Grand Royal Council parliament, Titanborn and Celestian politics.'},
  {id:'architect', n:4, name:'Universe Architect', status:'soon', title:'Universe Creator',
   desc:'Universe, race, story and event editors. Design your own galaxies and histories.'},
  {id:'cosmos', n:5, name:'Archangel Cosmos', status:'soon', title:'Archangel Prime',
   desc:'Shared online cosmos, creator marketplace, AI-generated content and inter-universe travel. (TAC appears only as a fictional in-game currency.)'}
];

AC.RES = {
  credits:{n:'Credits',icon:'₵'}, food:{n:'Food',icon:'🌾'}, water:{n:'Water',icon:'💧'},
  energy:{n:'Energy',icon:'⚡'}, iron:{n:'Iron',icon:'⛏'}, metal:{n:'Refined Metal',icon:'▣'},
  goods:{n:'Industrial Goods',icon:'⚙'}, titanium:{n:'Titanium',icon:'◆'}, crystal:{n:'Crystal',icon:'✧'},
  research:{n:'Research',icon:'🔬'}, light:{n:'Celestial Light',icon:'✦'},
  he3:{n:'Helium-3',icon:'He'}, gas:{n:'Stellar Gas',icon:'G'}, qmatter:{n:'Quantum Matter',icon:'Q'}, topazium:{n:'Topazium',icon:'T'}, darke:{n:'Dark Energy',icon:'D'}
};
// Market: base price and "normal" market stock (NPC supply). Price follows supply/demand.
AC.MARKET = {
  food:{base:2,stock:20000}, water:{base:1.5,stock:20000}, iron:{base:12,stock:3000},
  metal:{base:35,stock:1500}, goods:{base:110,stock:600}, titanium:{base:60,stock:500}, crystal:{base:150,stock:300}
};

AC.TERRAIN = {
  ocean:{n:'Ocean',c:'#1b3f8a'}, shallow:{n:'Shallows',c:'#2f6fb8'}, plains:{n:'Temperate Plains',c:'#6fae4f'},
  forest:{n:'Forest',c:'#2f7a3a'}, desert:{n:'Desert',c:'#d8c27a'}, mountain:{n:'Mountains',c:'#8a8178'},
  arctic:{n:'Arctic',c:'#e8f1f7'}, volcanic:{n:'Volcanic',c:'#5a2a2a'}, crystal:{n:'Crystal Plains',c:'#9c7be0'}
};
var LAND = ['plains','forest','desert','arctic','volcanic','crystal'];
var FLAT = ['plains','forest','desert'];

/* Building: cost (one-off), prod/cons per day, housing, happy, light. on = allowed terrain. req = research id */
AC.BUILDINGS = [
 {id:'capital',n:'Capital Hall',cat:'Government',code:'CH',col:'#ffd76a',unique:true,on:FLAT,cost:{credits:3000},
  prod:{light:2},housing:10000,happy:5,tax:1.0,d:'Seat of government. Required for most structures. Collects taxes.'},
 {id:'admin',n:'Admin Centre',cat:'Government',code:'AD',col:'#f3c34a',on:FLAT,cost:{credits:6000,metal:40},cons:{energy:6},tax:0.25,d:'+25% tax income each.',req:'governance'},
 {id:'embassy',n:'Embassy',cat:'Government',code:'EM',col:'#e7b8ff',unique:true,on:FLAT,cost:{credits:8000,goods:20},prod:{credits:150,light:2},cons:{energy:5},d:'Trade envoys to future alien races. +150 Credits/day.',req:'governance'},
 {id:'home',n:'Homes',cat:'Residential',code:'HM',col:'#f0e0c0',on:LAND,cost:{credits:600,iron:10},housing:5000,d:'Housing for 5,000 Angelic Humans.'},
 {id:'apart',n:'Apartments',cat:'Residential',code:'AP',col:'#e0c8a0',on:LAND,cost:{credits:2500,metal:30},cons:{energy:3},housing:20000,d:'Dense housing for 20,000.',req:'urban'},
 {id:'arcology',n:'Arcology Tower',cat:'Residential',code:'AR',col:'#fff',on:LAND,cost:{credits:15000,titanium:120,crystal:30},cons:{energy:12},housing:100000,happy:2,d:'Self-contained city tower for 100,000.',req:'arcology'},
 {id:'farm',n:'Farm',cat:'Production',code:'FA',col:'#c8e66a',on:['plains','forest'],cost:{credits:500},prod:{food:300},d:'+300 Food/day. Plains or forest.'},
 {id:'water',n:'Water Purifier',cat:'Production',code:'WP',col:'#7fd0ff',on:LAND,near:'water',cost:{credits:500},prod:{water:350},cons:{energy:2},d:'+350 Water/day. Must be next to water.'},
 {id:'power',n:'Power Plant',cat:'Energy',code:'PP',col:'#ffb347',on:LAND,cost:{credits:1200,iron:20},prod:{energy:40},d:'+40 Energy/day.'},
 {id:'solar',n:'Solar Array',cat:'Energy',code:'SA',col:'#ffe066',on:['desert','plains'],cost:{credits:1800,metal:20},prod:{energy:70},d:'+70 Energy/day (x1.5 on desert).',req:'energy'},
 {id:'geo',n:'Geothermal Vent',cat:'Energy',code:'GV',col:'#ff6040',on:['volcanic'],cost:{credits:2500,metal:30},prod:{energy:160},d:'+160 Energy/day. Volcanic only.',req:'energy'},
 {id:'mine',n:'Iron Mine',cat:'Industry',code:'MI',col:'#b0a090',on:['mountain'],cost:{credits:1500},prod:{iron:25},cons:{energy:5},d:'+25 Iron/day (x3 on an iron deposit). Mountains.'},
 {id:'timine',n:'Titanium Mine',cat:'Industry',code:'TI',col:'#9ad',on:['mountain','arctic'],cost:{credits:4000,metal:40},prod:{titanium:6},cons:{energy:10},d:'+6 Titanium/day.',req:'industry'},
 {id:'crystal',n:'Crystal Extractor',cat:'Industry',code:'CX',col:'#c9a0ff',on:['crystal'],cost:{credits:5000,metal:50},prod:{crystal:4},cons:{energy:10},d:'+4 Crystal/day. Crystal Plains only.',req:'quantum'},
 {id:'refinery',n:'Refinery',cat:'Industry',code:'RF',col:'#d08050',on:LAND,cost:{credits:2500,iron:40},prod:{metal:10},cons:{iron:20,energy:8},d:'20 Iron -> 10 Refined Metal per day.'},
 {id:'factory',n:'Factory',cat:'Industry',code:'FC',col:'#a07050',on:LAND,cost:{credits:4000,metal:40},prod:{goods:5},cons:{metal:10,energy:12},d:'10 Metal -> 5 Industrial Goods per day.'},
 {id:'market',n:'Trade Market',cat:'Commerce',code:'TM',col:'#ffcf9f',on:FLAT,cost:{credits:3000},prod:{credits:120},d:'+120 Credits/day and +10% sell prices (max 3).'},
 {id:'lab',n:'Research Centre',cat:'Science',code:'RC',col:'#80ffd0',on:LAND,cost:{credits:2000},prod:{research:3},cons:{energy:6},d:'+3 Research/day.'},
 {id:'academy',n:'Seraphim Academy',cat:'Science',code:'SE',col:'#a0ffe0',on:FLAT,cost:{credits:3500,metal:10},prod:{research:2,light:1},cons:{energy:4},happy:2,d:'Education. +2 Research, +1 Light, +happiness.'},
 {id:'qlab',n:'Quantum Lab',cat:'Science',code:'QL',col:'#40e0ff',on:LAND,cost:{credits:9000,titanium:30},prod:{research:12},cons:{energy:15,crystal:1},d:'+12 Research/day (uses Crystal).',req:'quantum'},
 {id:'park',n:'Park',cat:'Civic',code:'PK',col:'#5fe36a',on:LAND,cost:{credits:300},prod:{light:0.5},happy:3,d:'+Happiness, +Light.'},
 {id:'hospital',n:'Healing Sanctuary',cat:'Civic',code:'HS',col:'#ff9fb0',on:FLAT,cost:{credits:3000,goods:5},cons:{energy:5},happy:4,growth:0.002,d:'+Happiness and population growth.'},
 {id:'cathedral',n:'Cathedral of Light',cat:'Civic',code:'CL',col:'#fff3b0',on:LAND,cost:{credits:5000,crystal:5},prod:{light:5},happy:5,d:'+5 Celestial Light/day, big happiness.'},
 {id:'road',n:'Road',cat:'Infrastructure',code:'',col:'#555',on:LAND,cost:{credits:50},d:'Buildings touching a road produce +10%.'},
 {id:'spaceport',n:'Spaceport',cat:'Infrastructure',code:'SP',col:'#c0c8ff',unique:true,on:FLAT,cost:{credits:25000,metal:150,goods:60,titanium:40},cons:{energy:20},d:'Gateway to the stars. Unlocks satellite, probe and moon colony launches.',req:'spaceflight'},
 {id:'outpost',n:'Explorer Outpost',cat:'Infrastructure',code:'EO',col:'#e0a060',on:LAND,cost:{credits:800},d:'Build on ancient ruins to excavate them (one-off reward).'}
];

AC.RESEARCH = [
 {id:'agriculture',n:'Agriculture',cost:40,d:'Farms +50% food.'},
 {id:'industry',n:'Industry',cost:60,d:'Unlock Titanium Mine. Refineries/Factories +25%.'},
 {id:'energy',n:'Energy',cost:50,d:'Unlock Solar Array & Geothermal Vent.'},
 {id:'transport',n:'Transportation',cost:50,d:'Road bonus +10% -> +25%.'},
 {id:'urban',n:'Urban Planning',cost:40,d:'Unlock Apartments.'},
 {id:'governance',n:'Royal Governance',cost:80,d:'Unlock Admin Centre & Embassy.'},
 {id:'quantum',n:'Quantum Science',cost:150,req:'industry',d:'Unlock Crystal Extractor & Quantum Lab.'},
 {id:'arcology',n:'Arcology Engineering',cost:200,req:'urban',d:'Unlock Arcology Tower.'},
 {id:'spaceflight',n:'Spaceflight',cost:250,req:'industry',d:'Unlock the Spaceport.'}
];

/* Missions: check(G) returns true when done. reward: resources and/or text */
function cnt(G,id){return G.counts[id]||0;}
AC.MISSIONS = [
 {id:'M01',n:'Founding: Capital Hall',d:'Place the Capital Hall on flat land.',check:function(G){return cnt(G,'capital')>0},reward:{credits:2000}},
 {id:'M02',n:'Feed the People',d:'Build 2 Farms.',check:function(G){return cnt(G,'farm')>=2},reward:{credits:1000,food:2000}},
 {id:'M03',n:'Pure Waters',d:'Build 2 Water Purifiers next to water.',check:function(G){return cnt(G,'water')>=2},reward:{credits:1000}},
 {id:'M04',n:'Let There Be Power',d:'Build a Power Plant.',check:function(G){return cnt(G,'power')>=1},reward:{credits:1000,iron:40}},
 {id:'M05',n:'Build 10 Homes',d:'Build 10 Homes for your growing people.',check:function(G){return cnt(G,'home')>=10},reward:{credits:5000}},
 {id:'M06',n:'First Knowledge',d:'Build a Research Centre.',check:function(G){return cnt(G,'lab')>=1},reward:{research:15}},
 {id:'M07',n:'Industrial Foundation',d:'Build an Iron Mine and a Refinery.',check:function(G){return cnt(G,'mine')>=1&&cnt(G,'refinery')>=1},reward:{credits:3000,research:10}},
 {id:'M08',n:'Ore to Wealth',d:'Stockpile 200 Iron (lifetime production).',check:function(G){return (G.made.iron||0)>=200},reward:{credits:2000}},
 {id:'M09',n:'Open for Trade',d:'Build a Trade Market and sell any resource.',check:function(G){return cnt(G,'market')>=1&&G.sold>0},reward:{credits:3000}},
 {id:'M10',n:'Pop 150,000',d:'Grow population to 150,000.',check:function(G){return G.pop>=150000},reward:{credits:5000,light:20}},
 {id:'M11',n:'Choose a Path',d:'Complete any research (Agriculture, Industry, Energy or Transportation).',check:function(G){return Object.keys(G.tech).length>=1},reward:{research:20}},
 {id:'M12',n:'Factory Floor',d:'Build a Factory and produce 20 Industrial Goods.',check:function(G){return (G.made.goods||0)>=20},reward:{credits:6000}},
 {id:'M13',n:'Light of the Host',d:'Accumulate 100 Celestial Light.',check:function(G){return G.res.light>=100},reward:{credits:4000}},
 {id:'M14',n:'Echoes of the Ancients',d:'Excavate ancient ruins with an Explorer Outpost.',check:function(G){return G.ruinsFound>=1},reward:{research:30}},
 {id:'M15',n:'Pop 250,000',d:'Reach 250,000 Angelic Humans.',check:function(G){return G.pop>=250000},reward:{research:50,credits:5000}},
 {id:'M16',n:'Spaceflight',d:'Research Spaceflight.',check:function(G){return !!G.tech.spaceflight},reward:{credits:10000}},
 {id:'M17',n:'The First Frontier',d:'Build the Spaceport.',check:function(G){return cnt(G,'spaceport')>=1},reward:{light:50}},
 {id:'M18',n:'Eyes in Orbit',d:'Launch a satellite and scan the Moon (Spaceport menu).',check:function(G){return G.space.probe},reward:{credits:10000}},
 {id:'M19',n:'Moon Colony',d:'Found the first colony on Elysia\'s Moon, Seraph.',check:function(G){return G.space.colony},reward:{light:200}}
];
