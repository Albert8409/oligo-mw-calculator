/* Oligo MW Calculator — offline shell service worker (FREE feature).
   THE ROOT WORKER. Derived from build/sw.js by tools/ship/make_root_sw.py.
   Do not hand-edit: re-run the generator.

   Cache-first for the app shell so the calculator opens with no network.
   Supabase (/rest/v1/, /auth/v1/) and any cross-origin request is passthrough
   (network-only) so auth + the Pro catalog are never served stale.

   ⭐⭐ THE CACHE NAME CARRIES THE SHIPPED index.html's md5, and that is the
   whole reason this file is generated per release. Before REFRESH1 the name
   was the literal 'oligo-root-v1': the shipped index.html changed in 47 commits
   and this worker changed once, so release after release the browser saw a
   byte-identical sw.js, never fired updatefound, never parked a worker in
   `waiting`, and the page's update chip -- which was built and correct -- could
   not appear.

   ⭐ install SKIPS WAITING ONLY FOR A STRANDED CLASSIC VISITOR. Normally a new
   build waits so nobody is reloaded mid-task, and the wait is what produces the
   prompt. The exception is a browser that still holds classic's 'oligo-mw-v12':
   that worker is cache-first for everything, so waiting behind it means being
   served a retired build whose page has no chip to escape with. The test is on
   the cache actually being present, and it retires itself -- the first activate
   below deletes it.

   ⚠ activate deletes EVERY cache that is not this one, not just its own prefix.
   'oligo-mw-v12' does not begin 'oligo-root-', and a prefixed cleanup is
   exactly why it would have survived. It also evicts the previous release's
   root cache, whose name differs from this one. Restore a prefix guard if this
   origin ever serves a second application. */
var CACHE = 'oligo-root-ee62a1c8e540';
var LEGACY_CACHE = 'oligo-mw-v12';
var SHELL = ['./', './index.html'];                       // required — install fails if the shell can't be cached
var ICONS = ['./icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', function(e){
  // ⭐⭐ NO UNCONDITIONAL skipWaiting(). The new build waits, and the wait is
  // what puts a worker in `waiting` for the page to offer as "Update now".
  // The ONE exception is a browser still holding classic's cache-first worker:
  // waiting behind that one means being served a retired build for ever, so it
  // is rescued exactly as before. Self-retiring -- activate deletes the cache.
  e.waitUntil(
    caches.has(LEGACY_CACHE).then(function(stranded){ if(stranded) self.skipWaiting(); })
      .catch(function(){})                                // no CacheStorage -> just wait
      .then(function(){ return caches.open(CACHE); }).then(function(c){
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
        // EVERY cache that is not this one goes: classic's 'oligo-mw-v12', the
        // retired /next/ build's 'oligo-next-v20', and the PREVIOUS RELEASE's
        // root cache, which no longer shares this one's name. The prefix guard
        // that used to be here is exactly why 'oligo-mw-v12' survived.
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
  //
  // ⚠ R71 step 2d: ONLY THE APP SHELL MAY BE WRITTEN TO './index.html'.
  // Until R71 there was one navigable document at this origin, so "any
  // same-origin navigation" and "the app" were the same set and this branch was
  // right by accident. The language landing pages (/ja/, /zh-Hant/, /zh-Hans/)
  // are DIFFERENT documents under the same root scope. Without this test a user
  // who opens /ja/ overwrites their cached app shell with a 3.9 KB doorway and
  // the PWA opens to the doorway next time they are offline.
  //
  // The test is on pathname only: `?tab=…`, `?share=…` and `?lang=…` live in
  // the search string and must all keep resolving to the shell.
  if(req.mode === 'navigate'){
    var isShell = (url.pathname === '/' || url.pathname === '/index.html');
    e.respondWith(
      fetch(req).then(function(res){
        if(isShell && res && res.ok && res.type === 'basic'){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy); }).catch(function(){});
        }
        return res;
      }).catch(function(){
        // Offline. The shell falls back to the shell; anything else falls back
        // to ITSELF if we happen to hold it, and otherwise fails honestly.
        // ⚠ Serving the whole app from /ja/ would be worse than a network error:
        // it puts the calculator at an address that is supposed to be a doorway.
        if(!isShell){
          return caches.match(req).then(function(hit){ return hit || Response.error(); });
        }
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
