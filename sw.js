/* Oligo MW Calculator — offline shell service worker (FREE feature).
   THE ROOT WORKER. Derived from build/sw.js by tools/round59/make_root_sw.py.
   Do not hand-edit: re-run the generator.

   Cache-first for the app shell so the calculator opens with no network.
   Supabase (/rest/v1/, /auth/v1/) and any cross-origin request is passthrough
   (network-only) so auth + the Pro catalog are never served stale.

   ⚠ TWO ONE-RELEASE DIFFERENCES FROM build/sw.js, both for the classic retirement.
   Revert BOTH in the next release.

   (a) install calls skipWaiting(). Normally a new build waits so nobody is
       reloaded mid-task. Here the worker it would be waiting behind is classic's
       'oligo-mw-v12' — cache-first, holding the retired app — so waiting means
       returning visitors keep being served the build we just deleted.

   (b) activate deletes EVERY cache that is not this one, not just its own prefix.
       'oligo-mw-v12' does not begin 'oligo-root-', and a prefixed cleanup is
       exactly why it would have survived. Restore the prefix guard if this origin
       ever serves a second application. */
var CACHE = 'oligo-root-v1';
var SHELL = ['./', './index.html'];                       // required — install fails if the shell can't be cached
var ICONS = ['./icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', function(e){
  // ONE-RELEASE MEASURE — see (a) at the top of this file. Take over immediately
  // instead of queueing behind classic's cache-first worker.
  self.skipWaiting();
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
        // ONE-RELEASE MEASURE — see (b) at the top of this file. EVERY cache that
        // is not this one goes, so classic's 'oligo-mw-v12' and the retired
        // /next/ build's 'oligo-next-v20' are both evicted rather than left to
        // serve a deleted build.
        return (k !== CACHE) ? caches.delete(k) : null;
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
