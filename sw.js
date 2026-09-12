const VERSION = 'development';
const FILES = ['./', 'index.html', 'style.css', 'level.js', 'effects.js', 'game.js', 'manifest.webmanifest', 'assets/jetlev-flyer-logo.jpg'];
const PREFIX = `jetlev:${self.registration.scope}:`;
const CACHE = PREFIX + VERSION;
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(FILES.map(file=>new Request(new URL(file,self.registration.scope),{cache:'reload'})));
    // Assets have content hashes; existing runs keep their loaded JS untouched.
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='VERSION')event.ports[0]?.postMessage({version:VERSION});
  if(event.data?.type==='ACTIVATE')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||!request.url.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),url=new URL(request.url);
    const home=[self.registration.scope,new URL('index.html',self.registration.scope).href].includes(url.origin+url.pathname);
    if(request.mode==='navigate'&&home){
      const saved=await cache.match(new URL('index.html',self.registration.scope).href);
      // Startup found a worker newer than this document: return the matching release.
      if(url.searchParams.get('_release')===VERSION&&saved)return saved;
      try{const response=await fetch(request,{cache:'no-store'});if(response.ok)return response;}catch{}
      if(saved)return saved;
    }
    const match=await cache.match(request);
    return match||fetch(request);
  })());
});
