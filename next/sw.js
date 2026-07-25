/* Oligo MW Calculator — offline shell service worker (FREE feature).
   Cache-first for the app shell so the calculator opens with no network.
   Supabase (/rest/v1/, /auth/v1/) and any cross-origin request is passthrough
   (network-only) so auth + the Pro catalog are never served stale.
   A new build WAITS until the user accepts the update (no skipWaiting on install);
   the page reloads once, only on a genuine update (not the first install). */
var CACHE = 'oligo-next-v19';
var CACHE_PREFIX = 'oligo-next-';
var SHELL = ['./', './index.html'];                       // required — install fails if the shell can't be cached
var ICONS = ['./icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', function(e){
  // NOTE: no self.skipWaiting() here — the new build waits so the user isn't reloaded mid-task.
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // Shell entries are REQUIRED: addAll rejects (→ install fails) if any is missing,
      // so we never ship a service worker that can't actually serve the app offline.
      return c.addAll(SHELL).then(function(){
        // Icons are best-effort — a missing icon shouldn't fail the install.
        return Promise.all(ICONS.map(function(u){ return c.add(u).catch(function(){}); }));
      });
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        // Only clean up OUR own older caches — never delete another app sharing this origin.
        return (k !== CACHE && k.indexOf(CACHE_PREFIX) === 0) ? caches.delete(k) : null;
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// The page's "Update available" control posts this once the user accepts -> activate the waiting SW
// -> controllerchange -> the page reloads once (guarded on the client).
self.addEventListener('message', function(e){ if(e.data === 'skipWaiting'){ self.skipWaiting(); } });

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;                        // never touch writes

  var url;
  try{ url = new URL(req.url); }catch(_){ return; }

  if(url.origin !== self.location.origin) return;         // cross-origin (incl. Supabase) -> browser default
  if(url.pathname.indexOf('/rest/v1/') >= 0) return;      // Supabase REST -> network
  if(url.pathname.indexOf('/auth/v1/') >= 0) return;      // Supabase auth -> network

  // Navigations (including ?tab=… deep links): try the network, fall back to the cached shell when offline
  // so a bookmarked deep link still opens the app with no connection.
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.ok && res.type === 'basic'){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy); }).catch(function(){});
        }
        return res;
      }).catch(function(){
        return caches.match('./index.html').then(function(hit){ return hit || caches.match('./'); });
      })
    );
    return;
  }

  // Other same-origin GETs: cache-first, refresh in the background.
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
