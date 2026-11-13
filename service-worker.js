"use strict";
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
// Network-only: no account, cart, order, or customer data is cached.
self.addEventListener("fetch",e=>{if(e.request.method==="GET")e.respondWith(fetch(e.request))});
