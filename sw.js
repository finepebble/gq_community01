self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('aiboard-v1').then(c=>c.addAll([
    './','./index.html','./post.html','./style.css',
    './js/utils.js','./js/storage.js','./js/app-index.js','./js/app-post.js','./js/ai.js'
  ])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
