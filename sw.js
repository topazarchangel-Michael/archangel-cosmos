/* Archangel Cosmos service worker: cache-first offline support (only active when hosted over http/https). */
var CACHE='archangel-cosmos-v2';
var FILES=['./','./index.html','./css/style.css','./js/data.js','./js/art.js','./js/game.js','./manifest.json',
 './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET')return;
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(function(r){return r||fetch(e.request).then(function(res){
  if(res.ok&&new URL(e.request.url).origin===location.origin){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(e.request,cp);});}return res;});}).catch(function(){return caches.match('./index.html');}));});
