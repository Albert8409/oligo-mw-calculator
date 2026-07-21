/* Oligo MW Calculator — minimal offline shell service worker (FREE feature).
   Cache-first for the app shell so the calculator opens with no network.
   Supabase (/rest/v1/, /auth/v1/) and any cross-origin request is passthrough
   (network-only) so auth + the Pro catalog are never served stale.
   Bump CACHE on each deploy so updated builds land. */
var CACHE = 'oligo-mw-v8';
var PRECACHE = [
  './',
  './index.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  // add each entry independently: addAll() rejects the whole batch on a single 404
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(PRECACHE.map(function(u){
      return c.add(u).catch(function(){});
    }));
  }).catch(function(){}));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;                       // never touch writes

  var url;
  try{ url = new URL(req.url); }catch(_){ return; }

  if(url.origin !== self.location.origin) return;        // cross-origin (incl. Supabase) -> browser default
  if(url.pathname.indexOf('/rest/v1/') >= 0) return;     // Supabase REST -> network
  if(url.pathname.indexOf('/auth/v1/') >= 0) return;     // Supabase auth -> network

  // App shell: cache-first, refresh in the background.
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.ok && res.type === 'basic'){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});
