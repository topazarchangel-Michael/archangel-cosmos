/* Archangel Cosmos - robust save system.
   Primary storage: IndexedDB (large, persistent). Mirror: localStorage (synchronous, survives sudden tab kills on pagehide).
   Saves are LZ-compressed (vendored lz-string, MIT). Each slot keeps 3 rotating backups. Export/import as a file.
   Save keys never change between game versions; service-worker updates only touch the file cache, never saves. */
(function(){
'use strict';
var AC=window.AC,LZ=window.LZString,DB='archangel-cosmos',ST='saves',LEG='archangelCosmos.save.v1',PFX='archangelCosmos.v2.';
var cache={},db=null,ready=false,waiters=[],persistAsked=false,lastErr=null;
function k(slot,b){return 'slot'+slot+(b!=null?'.bak'+b:'');}
function openDB(){return new Promise(function(res){try{if(!window.indexedDB)return res(null);var r=indexedDB.open(DB,1);r.onupgradeneeded=function(){r.result.createObjectStore(ST);};r.onsuccess=function(){res(r.result);};r.onerror=function(){res(null);};r.onblocked=function(){res(null);};setTimeout(function(){res(null);},4000);}catch(e){res(null);}});}
function idbAll(){return new Promise(function(res){if(!db)return res({});try{var out={},tx=db.transaction(ST,'readonly'),s=tx.objectStore(ST),c=s.openCursor();c.onsuccess=function(){var cur=c.result;if(cur){out[cur.key]=cur.value;cur.continue();}else res(out);};c.onerror=function(){res(out);};}catch(e){res({});}});}
function idbPut(key,val){return new Promise(function(res,rej){if(!db)return res(false);try{var tx=db.transaction(ST,'readwrite');tx.objectStore(ST).put(val,key);tx.oncomplete=function(){res(true);};tx.onerror=tx.onabort=function(){rej(tx.error||new Error('IndexedDB write failed'));};}catch(e){rej(e);}});}
function idbDel(key){if(!db)return;try{db.transaction(ST,'readwrite').objectStore(ST).delete(key);}catch(e){}}
function lsGet(key){try{return localStorage.getItem(PFX+key);}catch(e){return null;}}
function lsSet(key,val){try{localStorage.setItem(PFX+key,val);return true;}catch(e){lastErr=e;return false;}}
function lsDel(key){try{localStorage.removeItem(PFX+key);}catch(e){}}
function pack(json,meta){return JSON.stringify({v:2,t:Date.now(),day:meta.day,pop:meta.pop,z:LZ?LZ.compressToUTF16(json):null,raw:LZ?null:json});}
function unpack(rec){if(!rec)return null;try{var o=typeof rec==='string'?JSON.parse(rec):rec;if(o.v===2){var j=o.z!=null?LZ.decompressFromUTF16(o.z):o.raw;if(!j)return null;JSON.parse(j);return {json:j,t:o.t,day:o.day,pop:o.pop};}}catch(e){}
 try{var g=JSON.parse(rec);if(g&&g.tiles)return {json:rec,t:g.saved||0,day:g.day,pop:g.pop};}catch(e){}return null;}
function newest(a,b){if(!a)return b;if(!b)return a;var ua=unpack(a),ub=unpack(b);if(!ua)return b;if(!ub)return a;return (ub.t||0)>(ua.t||0)?b:a;}
function init(){openDB().then(function(d){db=d;return idbAll();}).then(function(all){
  // gather: IndexedDB + localStorage mirror + legacy v1 keys; keep the newest valid copy of each key
  var keys={};Object.keys(all).forEach(function(x){keys[x]=1;});try{for(var i=0;i<localStorage.length;i++){var lk=localStorage.key(i);if(lk.indexOf(PFX)===0)keys[lk.slice(PFX.length)]=1;}}catch(e){}
  Object.keys(keys).forEach(function(x){var best=newest(all[x],lsGet(x));if(unpack(best))cache[x]=best;});
  try{[[LEG,1],[LEG+'.slot2',2],[LEG+'.slot3',3],[LEG+'.slot4',4]].forEach(function(p){var v=localStorage.getItem(p[0]);if(v&&unpack(v)){var key=k(p[1]);var u=unpack(v);if(!cache[key]||(unpack(cache[key]).t||0)<(u.t||0)){var rec=pack(u.json,{day:u.day,pop:u.pop});cache[key]=rec;idbPut(key,rec).catch(function(){});lsSet(key,rec);}}});}catch(e){}
  ready=true;waiters.splice(0).forEach(function(f){f();});});}
function whenReady(f){if(ready)f();else waiters.push(f);}
function has(slot){return !!cache[k(slot)];}
function info(slot,b){var u=unpack(cache[k(slot,b)]);return u?{t:u.t,day:u.day,pop:u.pop}:null;}
function get(slot){var u=unpack(cache[k(slot)]);if(u)return {json:u.json,from:'main'};for(var b=0;b<3;b++){u=unpack(cache[k(slot,b)]);if(u)return {json:u.json,from:'backup '+(b+1)};}return null;}
function getBackup(slot,b){var u=unpack(cache[k(slot,b)]);return u?u.json:null;}
var lastBak={};
/* write a save; returns {ok, where, err}. Sync localStorage mirror first (survives tab kill), then IndexedDB async. */
function put(slot,G,reason){var json;try{json=JSON.stringify(G);}catch(e){return {ok:false,err:'could not serialise game ('+e.message+')'};}
 var rec=pack(json,{day:G.day,pop:Math.round(G.pop)}),key=k(slot),prev=cache[key],now=Date.now();
 if(prev&&(!lastBak[slot]||now-lastBak[slot]>4*60000||reason==='manual')){lastBak[slot]=now;var b2=cache[k(slot,1)],b1=cache[k(slot,0)];if(b2){cache[k(slot,2)]=b2;idbPut(k(slot,2),b2).catch(function(){});}if(b1){cache[k(slot,1)]=b1;idbPut(k(slot,1),b1).catch(function(){});}cache[k(slot,0)]=prev;idbPut(k(slot,0),prev).catch(function(){});
  if(!lsSet(k(slot,0),prev)){lsDel(k(slot,2));lsDel(k(slot,1));}else{if(b1)lsSet(k(slot,1),b1);}}
 cache[key]=rec;var lsOk=lsSet(key,rec),err=lsOk?null:lastErr;
 if(!lsOk){/* free space: drop older mirrors and legacy uncompressed saves, retry */try{Object.keys(localStorage).forEach(function(x){if(x.indexOf(LEG)===0||/\.bak[12]$/.test(x))localStorage.removeItem(x);});}catch(e){}lsOk=lsSet(key,rec);}
 var p=idbPut(key,rec);if(!persistAsked&&navigator.storage&&navigator.storage.persist){persistAsked=true;navigator.storage.persist().catch(function(){});}
 return {ok:lsOk||!!db,ls:lsOk,idb:!!db,promise:p,size:rec.length,err:(!lsOk&&!db)?(err&&err.name==='QuotaExceededError'?'storage is full':err?err.message:'storage unavailable (private browsing?)'):null};}
function remove(slot){[k(slot),k(slot,0),k(slot,1),k(slot,2)].forEach(function(x){delete cache[x];idbDel(x);lsDel(x);});try{localStorage.removeItem(slot===1?LEG:LEG+'.slot'+slot);}catch(e){}}
function exportFile(G){var json=JSON.stringify({format:'archangel-cosmos-save',version:2,exported:new Date().toISOString(),game:G}),a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.download='archangel-cosmos-day'+G.day+'-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},100);}
function parseImport(text){var o=JSON.parse(text);var g=o&&o.format==='archangel-cosmos-save'?o.game:o;if(!g||!Array.isArray(g.tiles)||typeof g.day!=='number')throw new Error('This file is not an Archangel Cosmos save.');return g;}
function estimate(){return navigator.storage&&navigator.storage.estimate?navigator.storage.estimate():Promise.resolve(null);}
function persisted(){return navigator.storage&&navigator.storage.persisted?navigator.storage.persisted():Promise.resolve(false);}
AC.saves={init:init,whenReady:whenReady,has:has,info:info,get:get,getBackup:getBackup,put:put,remove:remove,exportFile:exportFile,parseImport:parseImport,estimate:estimate,persisted:persisted,usingIDB:function(){return !!db;},_cache:cache};
init();
})();
